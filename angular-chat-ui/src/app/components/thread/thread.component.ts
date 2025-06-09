import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StreamService } from '../../services/stream.service';
import { ThreadService } from '../../services/thread.service';
import { LanggraphClientService, type Message, type Checkpoint } from '../../services/langgraph-client.service';
import { MessageComponent } from '../message/message.component';
import { v4 as uuidv4 } from 'uuid';

@Component({
  selector: 'app-thread',
  imports: [CommonModule, FormsModule, MessageComponent],
  templateUrl: './thread.component.html',
  styleUrl: './thread.component.scss'
})
export class ThreadComponent implements OnInit, OnDestroy {
  input = signal('');
  firstTokenReceived = signal(false);

  constructor(
    public streamService: StreamService,
    public threadService: ThreadService,
    private clientService: LanggraphClientService
  ) {}

  ngOnInit() {
    // Load existing threads when component initializes
    this.loadThreads();
  }

  ngOnDestroy() {
    this.streamService.stop();
  }

  private async loadThreads() {
    try {
      const assistantId = this.streamService.getAssistantId();
      if (assistantId) {
        await this.threadService.getThreads(assistantId);
      }
    } catch (error) {
      console.error('Error loading threads:', error);
    }
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
        this.onSubmit();
      }
    }
  }

  trackMessage(index: number, message: Message): string {
    return message.id || `message-${index}`;
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
      
      // Refresh threads list after successful submission
      await this.loadThreads();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }

  async onRegenerate(parentCheckpoint: Checkpoint | null | undefined) {
    if (this.streamService.isLoading()) return;

    try {
      await this.streamService.submit(
        undefined,
        {
          checkpoint: parentCheckpoint
        }
      );
      this.firstTokenReceived.set(true);
    } catch (error) {
      console.error('Error regenerating:', error);
    }
  }

  onStop() {
    this.streamService.stop();
  }

  onNewThread() {
    this.threadService.createNewThread();
    this.input.set('');
    this.firstTokenReceived.set(false);
  }

  get chatStarted(): boolean {
    return !!this.streamService.threadId() || this.streamService.messages().length > 0;
  }
}
