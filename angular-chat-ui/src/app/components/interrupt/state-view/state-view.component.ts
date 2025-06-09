import { Component, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  BaseMessage, 
  isArrayOfMessages, 
  prettifyText, 
  unknownToPrettyDate 
} from '../../../models/interrupt.types';

@Component({
  selector: 'app-state-view',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="state-view-container" [class.with-border]="view === 'state'">
      @if (view === 'description') {
        <div class="description-content">
          <div class="markdown-content">
            {{ description || 'No description provided' }}
          </div>
        </div>
      }
      
      @if (view === 'state') {
        <div class="state-content">
          @for (entry of getStateEntries(); track entry.key) {
            <div class="state-entry">
              <div class="state-key">{{ prettifyText(entry.key) }}:</div>
              <div class="state-value">{{ formatValue(entry.value) }}</div>
            </div>
          }
        </div>
      }

      <div class="action-buttons">
        @if (view === 'state') {
          <button
            type="button"
            class="toggle-btn"
            (click)="toggleExpanded()"
            title="{{ expanded() ? 'Collapse all' : 'Expand all' }}"
          >
            <span class="toggle-icon">{{ expanded() ? '⇈' : '⇊' }}</span>
          </button>
        }

        <button
          type="button"
          class="close-btn"
          (click)="emitClose()"
          title="Close"
        >
          <span class="close-icon">✕</span>
        </button>
      </div>
    </div>

    <!-- Content is rendered inline in the main template -->
  `,
  styles: [`
    .state-view-container {
      display: flex;
      width: 100%;
      flex-direction: row;
      gap: 0;
      
      &.with-border {
        border-top: 1px solid rgb(243 244 246);
        
        @media (min-width: 1024px) {
          border-top: 0;
          border-left: 1px solid rgb(243 244 246);
        }
      }
    }

    .description-content {
      padding-top: 1.5rem;
      padding-bottom: 0.5rem;
    }

    .markdown-content {
      max-width: none;
      font-size: 0.875rem;
      line-height: 1.25rem;
    }

    .state-content {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      justify-content: flex-start;
      gap: 0.5rem;
    }

    .state-entry {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      width: 100%;
      padding: 0.5rem;
      background: rgb(249 250 251);
      border-radius: 0.375rem;
      border: 1px solid rgb(229 231 235);
    }

    .state-key {
      font-weight: 500;
      color: rgb(55 65 81);
      font-size: 0.875rem;
    }

    .state-value {
      font-family: 'Courier New', monospace;
      color: rgb(75 85 99);
      font-size: 0.75rem;
      white-space: pre-wrap;
      background: white;
      padding: 0.5rem;
      border-radius: 0.25rem;
      border: 1px solid rgb(229 231 235);
    }

    .action-buttons {
      display: flex;
      align-items: flex-start;
      justify-content: flex-end;
      gap: 0.5rem;
    }

    .toggle-btn, .close-btn {
      padding: 0.25rem;
      color: rgb(75 85 99);
      border-radius: 0.25rem;
      transition: background-color 0.2s;
      cursor: pointer;
      background: transparent;
      border: none;
      
      &:hover {
        background-color: rgb(243 244 246);
      }
    }

    .toggle-icon, .close-icon {
      font-size: 0.875rem;
    }

    .state-object {
      @apply relative flex flex-row items-start justify-start gap-2 text-sm;
    }

    .object-header {
      @apply flex items-center gap-2 cursor-pointer;
    }

    .expand-icon {
      @apply flex h-5 w-5 items-center justify-center rounded-md text-gray-500 transition-all duration-200 hover:bg-gray-100 hover:text-black;
      
      &.expanded {
        transform: rotate(90deg);
      }
    }

    .object-content {
      @apply flex w-full flex-col items-start justify-start gap-1;
    }

    .object-key {
      @apply font-normal text-black;
    }

    .ellipsis {
      @apply rounded-md p-0.5 font-mono text-xs leading-3 bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-800 cursor-pointer transition-colors inline-block;
      transform: translateY(-1px);
    }

    .object-body {
      @apply relative w-full overflow-hidden;
    }

    .recursive-content {
      @apply w-full;
    }

    .date-value {
      @apply font-light text-gray-600;
    }

    .simple-value {
      @apply whitespace-pre-wrap;
    }

    .boolean-value {
      @apply font-mono;
    }

    .null-value {
      @apply font-light whitespace-pre-wrap text-gray-600;
    }

    .array-container {
      @apply flex w-full flex-row items-start justify-start gap-1;
    }

    .bracket, .comma {
      @apply font-normal text-black;
    }

    .array-item {
      @apply flex w-full flex-row items-start whitespace-pre-wrap;
    }

    .empty-object {
      @apply font-light text-gray-600;
    }

    .object-tree {
      @apply relative ml-6 flex w-full flex-col items-start justify-start gap-1;
    }

    .tree-line {
      @apply absolute top-0 left-[-24px] h-full w-px bg-gray-200;
    }

    .tree-item {
      @apply relative w-full;
    }

    .tree-connector {
      @apply absolute top-2.5 left-[-20px] h-px w-[18px] bg-gray-200;
    }

    .messages-container {
      @apply flex w-full flex-col gap-1;
    }

    .message-item {
      @apply ml-2 flex w-full flex-col gap-0.5;
    }

    .message-type {
      @apply font-medium text-gray-700;
    }

    .message-content {
      @apply prose prose-sm max-w-none;
    }

    .tool-calls {
      @apply flex w-full flex-col items-start gap-1;
    }
  `]
})
export class StateViewComponent {
  @Input() values: Record<string, any> = {};
  @Input() description?: string;
  @Input() view: 'description' | 'state' = 'state';
  
  @Output() showSidePanelChange = new EventEmitter<{showState: boolean, showDescription: boolean}>();

  readonly expanded = signal(false);
  private expandedObjects = signal<Set<string>>(new Set());

  readonly prettifyText = prettifyText;

  constructor() {}

  getStateEntries(): Array<{key: string, value: any}> {
    return Object.entries(this.values || {}).map(([key, value]) => ({ key, value }));
  }

  toggleExpanded(): void {
    this.expanded.update(current => !current);
  }

  emitClose(): void {
    this.showSidePanelChange.emit({ showState: false, showDescription: false });
  }

  toggleObjectExpanded(key: string): void {
    this.expandedObjects.update(current => {
      const newSet = new Set(current);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  }

  isObjectExpanded(key: string): boolean {
    return this.expandedObjects().has(key);
  }

  getFormattedDate(value: unknown): string | undefined {
    return unknownToPrettyDate(value);
  }

  isStringOrNumber(value: unknown): boolean {
    return ['string', 'number'].includes(typeof value);
  }

  isBoolean(value: unknown): boolean {
    return typeof value === 'boolean';
  }

  isArray(value: unknown): boolean {
    return Array.isArray(value);
  }

  isObject(value: unknown): boolean {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  isEmpty(value: unknown): boolean {
    return this.isObject(value) && Object.keys(value as object).length === 0;
  }

  isMessagesArray(value: unknown[]): value is BaseMessage[] {
    return value.length > 0 && isArrayOfMessages(value);
  }

  getBaseMessageObject(item: unknown): string {
    // Simplified version - in a real app this would handle BaseMessage objects properly
    if (typeof item === 'object' && item !== null) {
      if ('type' in item && 'content' in item) {
        const content = typeof (item as any).content === 'string' 
          ? (item as any).content 
          : JSON.stringify((item as any).content);
        return `${(item as any).type}: ${content}`;
      }
      return JSON.stringify(item);
    }
    return String(item);
  }

  getObjectEntries(value: any): Array<{key: string, value: any}> {
    return Object.entries(value).map(([key, val]) => ({ key, value: val }));
  }

  getMessageTypeLabel(message: BaseMessage): string {
    switch (message.type) {
      case 'human': return 'User';
      case 'ai': return 'Assistant';
      case 'tool': return 'Tool';
      case 'system': return 'System';
      default: return message.type || 'Unknown';
    }
  }

  getMessageContent(message: BaseMessage): string {
    return typeof message.content === 'string' 
      ? message.content 
      : JSON.stringify(message.content);
  }

  formatValue(value: any): string {
    if (value === null || value === undefined) {
      return 'null';
    }
    if (typeof value === 'string') {
      return value;
    }
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  }
} 