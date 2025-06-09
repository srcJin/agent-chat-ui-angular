import { Component, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { type Message, type Checkpoint, type ToolCall } from '../../services/langgraph-client.service';
import { ToolCallsComponent } from '../tool-calls/tool-calls.component';
import { ToolResultComponent } from '../tool-result/tool-result.component';
import { InterruptComponent } from '../interrupt/interrupt.component';
import { isHumanInterrupt } from '../../models/interrupt.types';

@Component({
  selector: 'app-message',
  imports: [CommonModule, FormsModule, ToolCallsComponent, ToolResultComponent, InterruptComponent],
  templateUrl: './message.component.html',
  styleUrl: './message.component.scss'
})
export class MessageComponent {
  @Input() message!: Message;
  @Input() isLoading = false;
  @Input() isLastMessage = false;
  @Input() hideToolCalls = false;
  @Input() interruptValue: unknown;
  @Input() hasNoAIOrToolMessages = false;
  @Output() regenerate = new EventEmitter<Checkpoint | null | undefined>();
  @Output() editMessage = new EventEmitter<{originalMessage: Message, newContent: string}>();

  isEditing = signal(false);
  editValue = signal('');
  showActions = signal(false);
  copySuccess = signal(false);

  get isHuman(): boolean {
    return this.message.type === 'human';
  }

  get isAI(): boolean {
    return this.message.type === 'ai';
  }

  get isTool(): boolean {
    return this.message.type === 'tool';
  }

  get textContent(): string {
    if (typeof this.message.content === 'string') {
      return this.message.content;
    }
    
    if (Array.isArray(this.message.content)) {
      return this.message.content
        .filter(block => block.type === 'text')
        .map(block => block.text || '')
        .join('\n');
    }
    
    return '';
  }

  get hasToolCalls(): boolean {
    return !!(this.message.tool_calls) && this.message.tool_calls.length > 0;
  }

  get toolCalls(): ToolCall[] {
    return this.message.tool_calls || [];
  }

  // Enhanced content processing for multimodal support
  get contentBlocks(): any[] {
    if (Array.isArray(this.message.content)) {
      return this.message.content.filter(block => 
        block.type === 'image' || 
        block.type === 'file' || 
        (block.type === 'text' && block.text)
      );
    }
    return [];
  }

  get hasNonTextContent(): boolean {
    return this.contentBlocks.some(block => block.type !== 'text');
  }

  get hasInterrupt(): boolean {
    return isHumanInterrupt(this.interruptValue);
  }

  get shouldShowInterrupt(): boolean {
    return this.hasInterrupt && (this.isLastMessage || this.hasNoAIOrToolMessages);
  }

  onMouseEnter() {
    this.showActions.set(true);
  }

  onMouseLeave() {
    if (!this.isEditing()) {
      this.showActions.set(false);
    }
  }

  onRegenerate() {
    // For now, emit null checkpoint. In a full implementation,
    // this would include proper checkpoint handling
    this.regenerate.emit(null);
  }

  onEdit() {
    this.editValue.set(this.textContent);
    this.isEditing.set(true);
    this.showActions.set(true);
  }

  onCancelEdit() {
    this.isEditing.set(false);
    this.editValue.set('');
    this.showActions.set(false);
  }

  onSubmitEdit() {
    const newContent = this.editValue().trim();
    if (newContent && newContent !== this.textContent) {
      this.editMessage.emit({
        originalMessage: this.message,
        newContent
      });
    }
    this.isEditing.set(false);
    this.editValue.set('');
    this.showActions.set(false);
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      this.onSubmitEdit();
    }
    if (event.key === 'Escape') {
      this.onCancelEdit();
    }
  }

  async onCopy() {
    try {
      await navigator.clipboard.writeText(this.textContent);
      this.copySuccess.set(true);
      
      // Reset copy success state after 2 seconds
      setTimeout(() => {
        this.copySuccess.set(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      // Fallback for browsers that don't support clipboard API
      this.fallbackCopyTextToClipboard(this.textContent);
    }
  }

  private fallbackCopyTextToClipboard(text: string) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
      this.copySuccess.set(true);
      setTimeout(() => {
        this.copySuccess.set(false);
      }, 2000);
    } catch (err) {
      console.error('Fallback: Oops, unable to copy', err);
    }
    
    document.body.removeChild(textArea);
  }

  get editButtonDisabled(): boolean {
    return !this.editValue().trim() || this.editValue().trim() === this.textContent;
  }
}
