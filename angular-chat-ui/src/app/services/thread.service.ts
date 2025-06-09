import { Injectable, signal, computed } from '@angular/core';
import { LanggraphClientService, type Thread } from './langgraph-client.service';
import { StreamService } from './stream.service';

export interface ThreadHistoryItem {
  thread_id: string;
  created_at: string;
  values?: {
    messages?: any[];
  };
  metadata?: Record<string, any>;
}

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

  // Thread history state
  private threadsSignal = signal<ThreadHistoryItem[]>([]);
  private threadsLoadingSignal = signal(false);
  private chatHistoryOpenSignal = signal(false);
  private hideToolCallsSignal = signal(false);
  
  // Advanced features signals
  readonly threadsHistory = this.threadsSignal.asReadonly();
  readonly threadsLoadingHistory = this.threadsLoadingSignal.asReadonly();
  readonly chatHistoryOpen = this.chatHistoryOpenSignal.asReadonly();
  readonly hideToolCalls = this.hideToolCallsSignal.asReadonly();

  // Computed values
  readonly chatStarted = computed(() => {
    const currentThreadId = this.streamService.threadId();
    const messages = this.streamService.messages();
    return !!currentThreadId || messages.length > 0;
  });

  constructor(
    private clientService: LanggraphClientService,
    private streamService: StreamService
  ) {
    // Load threads automatically when the service is initialized
    this.initializeThreads();
  }

  private async initializeThreads() {
    // Wait a bit for any configuration to be set up
    setTimeout(async () => {
      const assistantId = this.streamService.getAssistantId();
      if (assistantId) {
        await this.getThreads(assistantId);
      }
    }, 100);
  }

  // Call this when configuration is updated (e.g., from settings)
  async onConfigurationUpdated() {
    const assistantId = this.streamService.getAssistantId();
    if (assistantId) {
      await this.getThreads(assistantId);
    }
  }

  // Delete a thread
  async deleteThread(threadId: string): Promise<void> {
    try {
      // Delete the thread from the server
      await this.clientService.deleteThread(threadId);
      
      // Remove the thread from the local list
      const currentThreads = this._threads();
      const updatedThreads = currentThreads.filter(thread => thread.thread_id !== threadId);
      this._threads.set(updatedThreads);
      
      // If we deleted the current thread, reset the current thread ID
      if (this._currentThreadId() === threadId) {
        this.setCurrentThreadId(null);
        // Reset messages since current thread is deleted
        this.streamService.reset();
      }
    } catch (error) {
      console.error('Error deleting thread:', error);
      throw error;
    }
  }

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
    
    // Set the new thread ID in the stream service first
    this.streamService.setThreadId(threadId);
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
    this.closeChatHistory();
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
          // Clear any existing messages first
          this.streamService.reset();
          // Set the messages from the thread state
          this.streamService.setMessages(messages);
        }
      } else {
        // If no messages exist for this thread, just clear the current state
        this.streamService.reset();
      }
    } catch (error) {
      console.error('Error loading thread messages:', error);
      // On error, still reset to ensure clean state
      this.streamService.reset();
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

  // Thread history management (uses existing getThreads)
  async loadThreadHistory(): Promise<void> {
    const assistantId = this.streamService.getAssistantId();
    if (assistantId) {
      await this.getThreads(assistantId); // Use existing method with assistant ID
    }
  }

  // Refresh threads after a new message/thread is created
  async refreshThreads(): Promise<void> {
    const assistantId = this.streamService.getAssistantId();
    if (assistantId) {
      // Refresh the threads list to show any new threads
      await this.getThreads(assistantId);
    }
  }

  selectThread(threadId: string): void {
    this.switchToThread(threadId); // Use existing method
    this.closeChatHistory();
  }

  // Chat history sidebar management
  toggleChatHistory(): void {
    this.chatHistoryOpenSignal.update(open => !open);
  }

  openChatHistory(): void {
    this.chatHistoryOpenSignal.set(true);
  }

  closeChatHistory(): void {
    this.chatHistoryOpenSignal.set(false);
  }

  // Tool calls visibility
  toggleHideToolCalls(): void {
    this.hideToolCallsSignal.update(hidden => !hidden);
  }

  setHideToolCalls(hidden: boolean): void {
    this.hideToolCallsSignal.set(hidden);
  }

  // Thread regeneration
  async regenerateFromCheckpoint(parentCheckpoint: string | null): Promise<void> {
    const currentThreadId = this.streamService.threadId();
    if (!currentThreadId) {
      console.error('No thread ID available for regeneration');
      return;
    }

    try {
      // In a real implementation, you might want to:
      // 1. Create a new branch from the checkpoint
      // 2. Continue the conversation from that point
      // For now, we'll just reset and restart the current thread
      this.streamService.reset();
      this.streamService.setThreadId(currentThreadId);
    } catch (error) {
      console.error('Failed to regenerate from checkpoint:', error);
    }
  }

  // Helper method to get thread title from messages
  getThreadTitle(thread: ThreadHistoryItem): string {
    if (thread.values?.messages && thread.values.messages.length > 0) {
      const firstMessage = thread.values.messages[0];
      if (firstMessage?.content) {
        if (typeof firstMessage.content === 'string') {
          return firstMessage.content.slice(0, 50) + (firstMessage.content.length > 50 ? '...' : '');
        } else if (Array.isArray(firstMessage.content)) {
          const textContent = firstMessage.content.find((c: any) => c.type === 'text');
          if (textContent?.text) {
            return textContent.text.slice(0, 50) + (textContent.text.length > 50 ? '...' : '');
          }
        }
      }
    }
    return thread.thread_id.slice(0, 8) + '...';
  }
}
