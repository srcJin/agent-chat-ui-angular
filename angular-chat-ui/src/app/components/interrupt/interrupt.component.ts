import { Component, Input, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HumanInterrupt, isHumanInterrupt } from '../../models/interrupt.types';
import { InterruptService } from '../../services/interrupt.service';
import { StreamService } from '../../services/stream.service';
import { ThreadActionsComponent } from './thread-actions/thread-actions.component';
import { StateViewComponent } from './state-view/state-view.component';
import { GenericInterruptComponent } from './generic-interrupt/generic-interrupt.component';

@Component({
  selector: 'app-interrupt',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ThreadActionsComponent,
    StateViewComponent,
    GenericInterruptComponent
  ],
  template: `
    <div class="interrupt-container">
      @if (validInterrupt(); as interrupt) {
        @if (showSidePanel()) {
          <app-state-view
            [values]="threadValues()"
            [description]="interrupt.description"
            [view]="currentView()"
            (showSidePanelChange)="handleShowSidePanel($event.showState, $event.showDescription)"
          />
        } @else {
          <app-thread-actions
            [interrupt]="interrupt"
            [showState]="showState()"
            [showDescription]="showDescription()"
            (showSidePanelChange)="handleShowSidePanel($event.showState, $event.showDescription)"
          />
        }
      } @else if (interruptValue && !isValidInterrupt) {
        <app-generic-interrupt [interrupt]="interruptValue" />
      }
    </div>
  `,
  styles: [`
    .interrupt-container {
      display: flex;
      height: 100%;
      width: 100%;
      flex-direction: column;
      overflow-y: auto;
      border-radius: 1rem;
      background-color: rgb(249 250 251 / 0.5);
      padding: 2rem;
    }
    
    @media (min-width: 1024px) {
      .interrupt-container {
        flex-direction: row;
      }
    }
    
    /* Custom scrollbar */
    .interrupt-container::-webkit-scrollbar {
      width: 0.375rem;
    }
    
    .interrupt-container::-webkit-scrollbar-thumb {
      border-radius: 9999px;
      background-color: rgb(209 213 219);
    }
    
    .interrupt-container::-webkit-scrollbar-track {
      background-color: transparent;
    }
  `]
})
export class InterruptComponent implements OnInit {
  @Input() interruptValue: unknown;
  @Input() isLastMessage = false;
  @Input() hasNoAIOrToolMessages = false;

  readonly showDescription = signal(false);
  readonly showState = signal(false);

  // Computed properties
  readonly showSidePanel = computed(() => this.showDescription() || this.showState());
  readonly currentView = computed(() => this.showState() ? 'state' : 'description');
  readonly threadValues = computed(() => this.streamService.context());

  readonly validInterrupt = computed(() => {
    if (!this.shouldShowInterrupt()) return null;
    const interrupt = Array.isArray(this.interruptValue) ? this.interruptValue[0] : this.interruptValue;
    return isHumanInterrupt(interrupt) ? interrupt as HumanInterrupt : null;
  });

  readonly isValidInterrupt = computed(() => {
    return isHumanInterrupt(this.interruptValue);
  });

  constructor(
    private interruptService: InterruptService,
    private streamService: StreamService
  ) {}

  ngOnInit(): void {
    const interrupt = this.validInterrupt();
    if (interrupt) {
      this.interruptService.initializeWithInterrupt(interrupt);
    }
  }

  handleShowSidePanel(showState: boolean, showDescription: boolean): void {
    if (showState && showDescription) {
      console.error('Cannot show both state and description');
      return;
    }

    if (showState) {
      this.showDescription.set(false);
      this.showState.set(true);
    } else if (showDescription) {
      this.showState.set(false);
      this.showDescription.set(true);
    } else {
      this.showState.set(false);
      this.showDescription.set(false);
    }
  }

  private shouldShowInterrupt(): boolean {
    return isHumanInterrupt(this.interruptValue) && 
           (this.isLastMessage || this.hasNoAIOrToolMessages);
  }
} 