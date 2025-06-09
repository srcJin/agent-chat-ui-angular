import { Component, Input, Output, EventEmitter, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HumanInterrupt, prettifyText } from '../../../models/interrupt.types';
import { InterruptService } from '../../../services/interrupt.service';
import { InboxItemInputComponent } from '../inbox-item-input/inbox-item-input.component';

@Component({
  selector: 'app-thread-actions',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    InboxItemInputComponent
  ],
  template: `
    <div class="flex min-h-full w-full flex-col gap-9">
      <!-- Header -->
      <div class="flex w-full flex-wrap items-center justify-between gap-3">
        <div class="flex items-center justify-start gap-3">
          <p class="text-2xl tracking-tighter text-pretty">{{ threadTitle() }}</p>
          @if (threadId()) {
            <div class="thread-id-badge">
              <span class="font-mono text-xs">{{ threadId() }}</span>
            </div>
          }
        </div>
        <div class="flex flex-row items-center justify-start gap-2">
          <button
            type="button"
            class="btn btn-outline btn-sm flex items-center gap-1 bg-white"
            (click)="handleOpenInStudio()"
            [disabled]="!hasApiUrl()"
          >
            Studio
          </button>
          <div class="button-group">
            <button
              type="button"
              class="btn btn-group-left"
              [class.active]="showState"
              (click)="emitShowSidePanel(true, false)"
            >
              State
            </button>
            <button
              type="button"
              class="btn btn-group-right"
              [class.active]="showDescription"
              (click)="emitShowSidePanel(false, true)"
            >
              Description
            </button>
          </div>
        </div>
      </div>

      <!-- Action buttons -->
      <div class="flex w-full flex-row items-center justify-start gap-2">
        <button
          type="button"
          class="btn btn-outline bg-white font-normal text-gray-800"
          (click)="handleResolve()"
          [disabled]="actionsDisabled()"
        >
          Mark as Resolved
        </button>
        @if (ignoreAllowed()) {
          <button
            type="button"
            class="btn btn-outline bg-white font-normal text-gray-800"
            (click)="handleIgnore()"
            [disabled]="actionsDisabled()"
          >
            Ignore
          </button>
        }
      </div>

      <!-- Input section -->
      <app-inbox-item-input
        [interrupt]="interrupt"
      />
    </div>
  `,
  styles: [`
    .thread-id-badge {
      border-radius: 0.375rem;
      background-color: rgb(243 244 246);
      padding: 0.125rem 0.25rem;
      font-family: 'Courier New', monospace;
      font-size: 0.75rem;
      line-height: 0.75rem;
      letter-spacing: -0.025em;
    }

    .btn {
      padding: 0.75rem 1rem;
      border-radius: 0.5rem;
      border: 1px solid;
      transition: background-color 0.2s;
      cursor: pointer;
      background: none;
      
      &.btn-outline {
        border-color: rgb(107 114 128);
        color: rgb(31 41 55);
        
        &:hover {
          background-color: rgb(249 250 251);
        }
        
        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }
      
      &.btn-sm {
        padding: 0.25rem 0.5rem;
        font-size: 0.875rem;
      }
    }

    .button-group {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: center;
      gap: 0;
      
      .btn-group-left {
        border-radius: 0.375rem 0 0 0.375rem;
        border-right: 0;
        border: 1px solid rgb(209 213 219);
        background-color: white;
        padding: 0.25rem 0.5rem;
        font-size: 0.875rem;
        
        &.active {
          color: black;
        }
      }
      
      .btn-group-right {
        border-radius: 0 0.375rem 0.375rem 0;
        border-left: 0;
        border: 1px solid rgb(209 213 219);
        background-color: white;
        padding: 0.25rem 0.5rem;
        font-size: 0.875rem;
        
        &.active {
          color: black;
        }
      }
    }
  `]
})
export class ThreadActionsComponent {
  @Input() interrupt!: HumanInterrupt;
  @Input() showState = false;
  @Input() showDescription = false;
  
  @Output() showSidePanelChange = new EventEmitter<{showState: boolean, showDescription: boolean}>();

  // Mock data - in a real app these would come from services
  private apiUrl = signal('http://localhost:2024');
  private threadIdValue = signal('thread-123');

  readonly threadTitle = computed(() => 
    this.interrupt?.action_request?.action 
      ? prettifyText(this.interrupt.action_request.action)
      : 'Unknown'
  );
  
  readonly threadId = computed(() => this.threadIdValue());
  readonly hasApiUrl = computed(() => !!this.apiUrl());
  readonly ignoreAllowed = computed(() => this.interrupt?.config?.allow_ignore ?? false);
  
  readonly actionsDisabled = computed(() => 
    this.interruptService.loading() || this.interruptService.streaming()
  );

  constructor(private interruptService: InterruptService) {}

  emitShowSidePanel(showState: boolean, showDescription: boolean): void {
    this.showSidePanelChange.emit({ showState, showDescription });
  }

  handleOpenInStudio(): void {
    if (!this.hasApiUrl()) {
      console.error('Please set the LangGraph deployment URL in settings.');
      return;
    }

    const studioUrl = this.constructOpenInStudioURL(this.apiUrl(), this.threadId());
    window.open(studioUrl, '_blank');
  }

  async handleResolve(): Promise<void> {
    try {
      await this.interruptService.handleResolve();
      console.log('Successfully marked thread as resolved');
    } catch (error) {
      console.error('Failed to mark thread as resolved:', error);
    }
  }

  async handleIgnore(): Promise<void> {
    try {
      await this.interruptService.handleIgnore();
      console.log('Successfully ignored thread');
    } catch (error) {
      console.error('Failed to ignore thread:', error);
    }
  }

  private constructOpenInStudioURL(deploymentUrl: string, threadId?: string): string {
    const smithStudioURL = new URL('https://smith.langchain.com/studio/thread');
    const trimmedDeploymentUrl = deploymentUrl.replace(/\/$/, '');

    if (threadId) {
      smithStudioURL.pathname += `/${threadId}`;
    }

    smithStudioURL.searchParams.append('baseUrl', trimmedDeploymentUrl);
    return smithStudioURL.toString();
  }
} 