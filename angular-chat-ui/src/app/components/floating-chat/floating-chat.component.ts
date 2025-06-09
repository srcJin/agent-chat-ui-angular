import { Component, OnInit, signal, computed, effect, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageComponent } from '../message/message.component';
import { StreamService } from '../../services/stream.service';
import { ThreadService } from '../../services/thread.service';
import { LanggraphClientService, type Message, type Checkpoint } from '../../services/langgraph-client.service';
import { v4 as uuidv4 } from 'uuid';

@Component({
  selector: 'app-floating-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, MessageComponent],
  templateUrl: './floating-chat.component.html',
  styleUrl: './floating-chat.component.scss'
})
export class FloatingChatComponent implements OnInit {
  input = signal('');
  firstTokenReceived = signal(false);
  isVisible = signal(true);

  @Output() settingsRequested = new EventEmitter<void>();

  chatStarted = computed(() => this.streamService.messages().length > 0);

  constructor(
    public streamService: StreamService,
    public threadService: ThreadService,
    private clientService: LanggraphClientService
  ) {
    // Use effects to track state changes instead of subscribe
    effect(() => {
      if (this.streamService.isLoading()) {
        this.firstTokenReceived.set(false);
      }
    });

    effect(() => {
      if (this.streamService.messages().length > 0 && this.streamService.isLoading()) {
        this.firstTokenReceived.set(true);
      }
    });
  }

  ngOnInit() {
    // Component initialization if needed
  }

  async onSubmit() {
    const content = this.input().trim();
    if (!content || this.streamService.isLoading()) return;

    this.firstTokenReceived.set(false);
    this.input.set('');

    const userMessage: Message = {
      id: uuidv4(),
      type: 'human',
      content
    };

    try {
      await this.streamService.submit(
        { messages: [userMessage] },
        {
          optimisticValues: (prev) => ({
            ...prev,
            messages: [...prev.messages, userMessage]
          })
        }
      );
      
      this.firstTokenReceived.set(true);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.onSubmit();
    }
  }

  onStop() {
    this.streamService.stop();
  }

  trackMessage(index: number, message: any): any {
    return message.id || index;
  }

  onRegenerate(checkpoint: Checkpoint | null | undefined) {
    // Implementation for regenerating messages
    console.log('Regenerate from checkpoint:', checkpoint);
  }

  onEditMessage(data: { originalMessage: Message; newContent: string }) {
    // Implementation for editing messages
    console.log('Edit message:', data);
  }

  onSettings() {
    this.settingsRequested.emit();
  }

  toggleVisibility() {
    this.isVisible.set(!this.isVisible());
  }

  onNewChat() {
    this.streamService.reset();
  }
} 