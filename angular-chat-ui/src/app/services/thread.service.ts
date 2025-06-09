import { Injectable, signal, computed } from '@angular/core';
import { LanggraphClientService, type Thread } from './langgraph-client.service';
import { StreamService } from './stream.service';

@Injectable({
  providedIn: 'root'
})
export class ThreadService {
  private _threads = signal<Thread[]>([]);
  private _threadsLoading = signal(false);
  private _currentThreadId = signal<string | null>(null);
  
  threads = computed(() => this._threads());
  threadsLoading = computed(() => this._threadsLoading());
  currentThreadId = computed(() => this._currentThreadId());

  constructor(
    private clientService: LanggraphClientService,
    private streamService: StreamService
  ) {}

  async getThreads(assistantId?: string): Promise<Thread[]> {
    try {
      this._threadsLoading.set(true);
      const threads = await this.clientService.getThreads(assistantId);
      this._threads.set(threads);
      return threads;
    } catch (error) {
      console.error('Error fetching threads:', error);
      return [];
    } finally {
      this._threadsLoading.set(false);
    }
  }

  async createThread(assistantId?: string): Promise<string> {
    try {
      const threadId = await this.clientService.createThread(assistantId);
      await this.getThreads(assistantId); // Refresh threads list
      return threadId;
    } catch (error) {
      console.error('Error creating thread:', error);
      throw error;
    }
  }

  setThreads(threads: Thread[]) {
    this._threads.set(threads);
  }

  setThreadsLoading(loading: boolean) {
    this._threadsLoading.set(loading);
  }

  setCurrentThreadId(threadId: string | null) {
    this._currentThreadId.set(threadId);
    this.streamService.setThreadId(threadId);
  }

  async switchToThread(threadId: string) {
    if (threadId === this._currentThreadId()) return;
    
    // Stop any current stream
    this.streamService.stop();
    
    // Reset the stream state and set new thread
    this.streamService.reset();
    this.setCurrentThreadId(threadId);
    
    // Load messages for the selected thread
    await this.loadThreadMessages(threadId);
  }

  createNewThread() {
    // Stop any current stream
    this.streamService.stop();
    
    // Reset state
    this.streamService.reset();
    this.setCurrentThreadId(null);
  }

  /**
   * Load messages for a specific thread from its state
   */
  private async loadThreadMessages(threadId: string) {
    try {
      const thread = this._threads().find(t => t.thread_id === threadId);
      if (thread && thread.values && 'messages' in thread.values) {
        const messages = thread.values['messages'];
        if (Array.isArray(messages)) {
          // Set the messages from the thread state
          this.streamService.setMessages(messages);
        }
      }
    } catch (error) {
      console.error('Error loading thread messages:', error);
    }
  }

  /**
   * Get the display text for a thread based on its first message
   */
  getThreadDisplayText(thread: Thread): string {
    if (
      typeof thread.values === 'object' &&
      thread.values &&
      'messages' in thread.values &&
      Array.isArray(thread.values['messages']) &&
      thread.values['messages'].length > 0
    ) {
      const firstMessage = thread.values['messages'][0];
      return this.getContentString(firstMessage.content);
    }
    return thread.thread_id;
  }

  /**
   * Extract content string from message content (supports multimodal)
   */
  private getContentString(content: any): string {
    if (typeof content === 'string') return content;
    
    if (Array.isArray(content)) {
      const texts = content
        .filter((c: any) => c.type === 'text')
        .map((c: any) => c.text);
      return texts.join(' ') || 'Multimodal message';
    }
    
    return 'Message';
  }
}
