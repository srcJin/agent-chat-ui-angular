import { Component, Input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  HumanInterrupt, 
  HumanResponseWithEdits, 
  ActionRequest,
  prettifyText 
} from '../../../models/interrupt.types';
import { InterruptService } from '../../../services/interrupt.service';

@Component({
  selector: 'app-inbox-item-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="flex w-full flex-col items-start justify-start gap-2">
      <!-- Args outside action cards -->
      @if (showArgsOutsideActionCards()) {
        <div class="args-renderer">
          @for (entry of getArgEntries(interrupt.action_request.args); track entry.key) {
            <div class="arg-entry">
              <p class="arg-label">{{ prettifyText(entry.key) }}:</p>
              <div class="arg-value">{{ entry.value }}</div>
            </div>
          }
        </div>
      }

      <div class="flex w-full flex-col items-start gap-2">
        <!-- Edit/Accept section -->
        @if (editResponse()) {
          <div class="action-card">
            <div class="card-header">
              <p class="text-base font-semibold text-black">
                {{ editResponse()?.acceptAllowed ? 'Edit/Accept' : 'Edit' }}
              </p>
              <button
                type="button" 
                class="reset-btn"
                (click)="handleReset()"
              >
                <span class="reset-icon">↶</span>
                <span>Reset</span>
              </button>
            </div>

            <!-- Edit fields -->
            @for (entry of getEditEntries(); track entry.key) {
              <div class="field-container">
                <label class="field-label">{{ prettifyText(entry.key) }}</label>
                <textarea
                  class="field-textarea"
                  [value]="entry.value"
                  [disabled]="isStreaming()"
                  [rows]="getDefaultRows(entry.value)"
                  (input)="onEditChange($event, entry.key)"
                  (keydown)="handleKeyDown($event)"
                ></textarea>
              </div>
            }

            <div class="card-footer">
              <button
                type="button"
                class="submit-btn"
                [disabled]="isStreaming()"
                (click)="handleSubmit()"
              >
                {{ getButtonText() }}
              </button>
            </div>
          </div>
        }

        <!-- Separator for multiple methods -->
        @if (supportsMultipleMethods()) {
          <div class="separator-container">
            <div class="separator-line"></div>
            <p class="separator-text">Or</p>
            <div class="separator-line"></div>
          </div>
        }

        <!-- Response section -->
        @if (responseResponse()) {
          <div class="action-card">
            <div class="card-header">
              <p class="text-base font-semibold text-black">Respond to assistant</p>
              <button
                type="button"
                class="reset-btn"
                (click)="handleResponseReset()"
              >
                <span class="reset-icon">↶</span>
                <span>Reset</span>
              </button>
            </div>

            @if (showArgsInResponse()) {
              @for (entry of getArgEntries(interrupt.action_request.args); track entry.key) {
                <div class="arg-entry">
                  <p class="arg-label">{{ prettifyText(entry.key) }}:</p>
                  <div class="arg-value">{{ entry.value }}</div>
                </div>
              }
            }

            <div class="field-container">
              <label class="field-label">Response</label>
              <textarea
                class="field-textarea"
                [value]="responseValue()"
                [disabled]="isStreaming()"
                [rows]="4"
                placeholder="Your response here..."
                (input)="onResponseChange($event)"
                (keydown)="handleKeyDown($event)"
              ></textarea>
            </div>

            <div class="card-footer">
              <button
                type="button"
                class="submit-btn"
                [disabled]="isStreaming()"
                (click)="handleSubmit()"
              >
                Send Response
              </button>
            </div>
          </div>
        }

        <!-- Status messages -->
        @if (interruptService.streaming()) {
          <p class="status-message">Running...</p>
        }
        @if (interruptService.streamFinished()) {
          <p class="success-message">Successfully finished Graph invocation.</p>
        }
      </div>
    </div>

    <!-- Args Renderer Template -->
    <ng-template #argsRenderer let-args="args">
      <div class="flex w-full flex-col items-start gap-6">
        @for (entry of getArgEntries(args); track entry.key) {
          <div class="arg-entry">
            <p class="arg-label">{{ prettifyText(entry.key) }}:</p>
            <div class="arg-value">{{ entry.value }}</div>
          </div>
        }
      </div>
    </ng-template>
  `,
  styles: [`
    .args-renderer {
      width: 100%;
      margin-bottom: 1rem;
    }

    .action-card {
      display: flex;
      width: 100%;
      flex-direction: column;
      align-items: flex-start;
      gap: 1rem;
      border-radius: 0.75rem;
      border: 1px solid rgb(209 213 219);
      padding: 1.5rem;
    }

    .card-header {
      display: flex;
      width: 100%;
      align-items: center;
      justify-content: space-between;
    }

    .card-footer {
      display: flex;
      width: 100%;
      align-items: center;
      justify-content: flex-end;
      gap: 0.5rem;
    }

    .reset-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      color: rgb(107 114 128);
      transition: color 0.2s;
      cursor: pointer;
      background: transparent;
      border: none;
      
      &:hover {
        color: rgb(239 68 68);
      }
    }

    .reset-icon {
      font-size: 1rem;
    }

    .field-container {
      display: flex;
      width: 100%;
      flex-direction: column;
      align-items: flex-start;
      gap: 0.375rem;
    }

    .field-label {
      font-size: 0.875rem;
      font-weight: 500;
      min-width: fit-content;
    }

    .field-textarea {
      width: 100%;
      border-radius: 0.375rem;
      border: 1px solid rgb(209 213 219);
      padding: 0.75rem;
      font-size: 0.875rem;
      resize: vertical;
      
      &:focus {
        outline: none;
        box-shadow: 0 0 0 2px rgb(59 130 246);
        border-color: rgb(59 130 246);
      }
      
      &:disabled {
        background-color: rgb(243 244 246);
        color: rgb(107 114 128);
        cursor: not-allowed;
      }
    }

    .submit-btn {
      padding: 0.5rem 1rem;
      background-color: rgb(37 99 235);
      color: white;
      border-radius: 0.375rem;
      border: none;
      cursor: pointer;
      transition: background-color 0.2s;
      
      &:hover {
        background-color: rgb(29 78 216);
      }
      
      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .separator-container {
      margin: 0.75rem auto 0;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      width: 100%;
    }

    .separator-line {
      flex: 1;
      height: 1px;
      background-color: rgb(209 213 219);
    }

    .separator-text {
      font-size: 0.875rem;
      color: rgb(107 114 128);
    }

    .status-message {
      font-size: 0.875rem;
      color: rgb(75 85 99);
    }

    .success-message {
      font-size: 1rem;
      font-weight: 500;
      color: rgb(34 197 94);
    }

    .arg-entry {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 0.25rem;
    }

    .arg-label {
      font-size: 0.875rem;
      line-height: 1.125rem;
      color: rgb(75 85 99);
    }

    .arg-value {
      width: 100%;
      max-width: 100%;
      border-radius: 0.75rem;
      background-color: rgb(244 244 245);
      padding: 0.75rem;
      font-size: 0.75rem;
      line-height: 1.125rem;
      color: black;
      white-space: pre-wrap;
    }
  `]
})
export class InboxItemInputComponent {
  @Input() interrupt!: HumanInterrupt;

  readonly prettifyText = prettifyText;

  // Computed properties
  readonly humanResponse = computed(() => this.interruptService.humanResponse());
  readonly supportsMultipleMethods = computed(() => this.interruptService.supportsMultipleMethods());
  readonly isStreaming = computed(() => this.interruptService.streaming());
  readonly initialValues = computed(() => this.interruptService.initialValues());

  readonly editResponse = computed(() => 
    this.humanResponse().find(r => r.type === 'edit')
  );

  readonly responseResponse = computed(() => 
    this.humanResponse().find(r => r.type === 'response')
  );

  readonly responseValue = computed(() => {
    const response = this.responseResponse();
    return typeof response?.args === 'string' ? response.args : '';
  });

  readonly isEditAllowed = computed(() => this.interrupt?.config?.allow_edit ?? false);
  readonly isResponseAllowed = computed(() => this.interrupt?.config?.allow_respond ?? false);
  readonly acceptAllowed = computed(() => this.interruptService.acceptAllowed());

  readonly hasArgs = computed(() => 
    Object.entries(this.interrupt?.action_request?.args || {}).length > 0
  );

  readonly showArgsInResponse = computed(() => 
    this.hasArgs() && !this.isEditAllowed() && !this.acceptAllowed() && this.isResponseAllowed()
  );

  readonly showArgsOutsideActionCards = computed(() => 
    this.hasArgs() && !this.showArgsInResponse() && !this.isEditAllowed() && !this.acceptAllowed()
  );

  constructor(protected interruptService: InterruptService) {}

  getEditEntries(): Array<{key: string, value: string}> {
    const editResp = this.editResponse();
    if (!editResp || typeof editResp.args !== 'object' || !editResp.args?.args) {
      return [];
    }

    return Object.entries(editResp.args.args).map(([key, value]) => ({
      key,
      value: typeof value === 'string' ? value : JSON.stringify(value, null, 2)
    }));
  }

  getArgEntries(args: Record<string, any>): Array<{key: string, value: string}> {
    return Object.entries(args).map(([key, value]) => ({
      key,
      value: typeof value === 'string' ? value : JSON.stringify(value, null, 2)
    }));
  }

  getDefaultRows(value: string): number {
    if (!value.length) return 3;
    return Math.max(Math.ceil(value.length / 50), 7);
  }

  getButtonText(): string {
    const editResp = this.editResponse();
    if (editResp?.acceptAllowed && !editResp.editsMade) {
      return 'Accept';
    }
    return 'Submit';
  }

  onEditChange(event: Event, key: string): void {
    const target = event.target as HTMLTextAreaElement;
    const value = target.value;
    const editResp = this.editResponse();
    
    if (editResp) {
      this.interruptService.onEditChange(
        value,
        editResp,
        key,
        this.initialValues()
      );
    }
  }

  onResponseChange(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    const value = target.value;
    const responseResp = this.responseResponse();
    
    if (responseResp) {
      this.interruptService.onResponseChange(value, responseResp);
    }
  }

  handleKeyDown(event: KeyboardEvent): void {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault();
      this.handleSubmit();
    }
  }

  async handleSubmit(): Promise<void> {
    try {
      await this.interruptService.handleSubmit(this.interrupt);
      console.log('Successfully submitted response');
    } catch (error) {
      console.error('Failed to submit response:', error);
    }
  }

  handleReset(): void {
    // Reset edit fields to initial values
    const editResp = this.editResponse();
    if (editResp && typeof editResp.args === 'object' && editResp.args?.args) {
      const initialVals = this.initialValues();
      const keysToReset: string[] = [];
      const valuesToReset: string[] = [];

      Object.entries(initialVals).forEach(([k, v]) => {
        if (k in editResp.args.args) {
          keysToReset.push(k);
          valuesToReset.push(v);
        }
      });

      if (keysToReset.length > 0) {
        this.interruptService.onEditChange(
          valuesToReset,
          editResp,
          keysToReset,
          initialVals
        );
      }
    }
  }

  handleResponseReset(): void {
    const responseResp = this.responseResponse();
    if (responseResp) {
      this.interruptService.onResponseChange('', responseResp);
    }
  }
} 