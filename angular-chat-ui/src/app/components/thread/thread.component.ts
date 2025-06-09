import { Component, OnInit, OnDestroy, signal, Output, EventEmitter } from '@angular/core';
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
  
  @Output() settingsRequested = new EventEmitter<void>();

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

  onSettings() {
    this.settingsRequested.emit();
  }

  get chatStarted(): boolean {
    return !!this.streamService.threadId() || this.streamService.messages().length > 0;
  }

  async onEditMessage(event: {originalMessage: Message, newContent: string}) {
    if (this.streamService.isLoading()) return;
    
    const { originalMessage, newContent } = event;
    
    // Find the index of the original message
    const messages = this.streamService.messages();
    const messageIndex = messages.findIndex(m => m.id === originalMessage.id);
    
    if (messageIndex !== -1) {
      // Get all messages up to (but not including) the edited message
      const messagesBeforeEdit = messages.slice(0, messageIndex);
      
      // Create the new edited message
      const newMessage: Message = {
        id: `human_${Date.now()}`,
        type: 'human',
        content: newContent
      };
      
      // Create the complete new conversation with the edit
      const newConversation = [...messagesBeforeEdit, newMessage];
      
      // Clear current thread to start fresh
      this.streamService.reset();
      
      // Set the edited conversation state optimistically
      this.streamService.setMessages(newConversation);
      
      // Submit as a new conversation - this ensures clean state
      // The server will create a new thread and generate responses from the edited message
      await this.streamService.submit({
        messages: newConversation
      });
    }
  }
}
