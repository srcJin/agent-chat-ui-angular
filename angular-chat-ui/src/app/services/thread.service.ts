import { Injectable, signal, computed } from '@angular/core';
import { LanggraphClientService, type Thread } from './langgraph-client.service';

@Injectable({
  providedIn: 'root'
})
export class ThreadService {
  private _threads = signal<Thread[]>([]);
  
  threads = computed(() => this._threads());

  constructor(private clientService: LanggraphClientService) {}

  async getThreads(assistantId?: string): Promise<Thread[]> {
    try {
      const threads = await this.clientService.getThreads(assistantId);
      this._threads.set(threads);
      return threads;
    } catch (error) {
      console.error('Error fetching threads:', error);
      return [];
    }
  }

  async createThread(assistantId?: string): Promise<string> {
    try {
      const threadId = await this.clientService.createThread(assistantId);
      await this.getThreads(assistantId); // Refresh threads list with same assistant filter
      return threadId;
    } catch (error) {
      console.error('Error creating thread:', error);
      throw error;
    }
  }

  setThreads(threads: Thread[]) {
    this._threads.set(threads);
  }
}
