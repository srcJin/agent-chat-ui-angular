import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { type Message, type Checkpoint } from '../../services/langgraph-client.service';

@Component({
  selector: 'app-message',
  imports: [CommonModule],
  templateUrl: './message.component.html',
  styleUrl: './message.component.scss'
})
export class MessageComponent {
  @Input() message!: Message;
  @Input() isLoading = false;
  @Output() regenerate = new EventEmitter<Checkpoint | null | undefined>();

  get isHuman(): boolean {
    return this.message.type === 'human';
  }

  get isAI(): boolean {
    return this.message.type === 'ai';
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

  onRegenerate() {
    // For now, emit null checkpoint. In a full implementation,
    // this would include proper checkpoint handling
    this.regenerate.emit(null);
  }
}
