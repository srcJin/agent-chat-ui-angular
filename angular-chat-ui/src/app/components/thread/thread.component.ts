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
    // Initial setup or load existing thread if needed
  }

  ngOnDestroy() {
    this.streamService.stop();
  }

  async onSubmit() {
    const inputText = this.input();
    if (!inputText.trim() || this.streamService.isLoading()) return;

    this.firstTokenReceived.set(false);

    const newHumanMessage: Message = {
      id: uuidv4(),
      type: 'human',
      content: inputText,
    };

    const context = Object.keys(this.streamService.context()).length > 0 
      ? this.streamService.context() 
      : undefined;

    await this.streamService.submit(
      { 
        messages: [...this.streamService.messages(), newHumanMessage],
        context 
      },
      {
        streamMode: ['values'],
        optimisticValues: (prev) => ({
          ...prev,
          context,
          messages: [...(prev.messages || []), newHumanMessage],
        }),
      }
    );

    this.input.set('');
  }

  async onRegenerate(parentCheckpoint: Checkpoint | null | undefined) {
    this.firstTokenReceived.set(false);
    await this.streamService.submit(undefined, {
      checkpoint: parentCheckpoint,
      streamMode: ['values'],
    });
  }

  onStop() {
    this.streamService.stop();
  }

  onNewThread() {
    this.streamService.setThreadId(null);
    this.streamService.reset();
  }

  get chatStarted(): boolean {
    return !!this.streamService.threadId() || this.streamService.messages().length > 0;
  }

  trackMessage(index: number, message: Message): string {
    // Use a combination of index and id to ensure uniqueness
    // Also consider content hash for better tracking
    return `${index}-${message.id}-${message.type}-${typeof message.content === 'string' ? message.content.slice(0, 50) : 'complex'}`;
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey && !event.metaKey) {
      event.preventDefault();
      this.onSubmit();
    }
  }
}
