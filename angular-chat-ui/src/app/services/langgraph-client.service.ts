import { Injectable } from '@angular/core';
import { Client } from '@langchain/langgraph-sdk';
import type { Thread as LangGraphThread, ValuesStreamEvent } from '@langchain/langgraph-sdk';

// Re-export for use in other services
export type Thread = LangGraphThread;

// Basic interfaces for compatibility
export interface Message {
  id: string;
  type: 'human' | 'ai' | 'tool' | 'system';
  content: string | Array<{ type: string; text?: string; [key: string]: any }>;
}

export interface Checkpoint {
  thread_id: string;
  checkpoint_id: string;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class LanggraphClientService {
  private client?: Client;

  constructor() {}

  configure(apiUrl: string, apiKey?: string) {
    this.client = new Client({
      apiUrl,
      apiKey
    });
  }

  async checkGraphStatus(apiUrl: string, apiKey?: string): Promise<boolean> {
    try {
      // Create a temporary client to check status
      const tempClient = new Client({ apiUrl, apiKey });
      
      // Try to search for assistants as a health check
      await tempClient.assistants.search({ limit: 1 });
      return true;
    } catch (error) {
      console.error('Error checking graph status:', error);
      return false;
    }
  }

  async streamRun(
    threadId: string,
    assistantId: string,
    input: any
  ): Promise<AsyncIterable<any>> {
    if (!this.client) {
      throw new Error('Client not configured');
    }

    // Use the official LangGraph SDK stream method
    return this.client.runs.stream(
      threadId,
      assistantId,
      {
        input,
        streamMode: ['values']
      }
    );
  }



  async getThreads(assistantId?: string): Promise<any[]> {
    if (!this.client) {
      throw new Error('Client not configured');
    }

    try {
      // Create metadata filter based on assistant ID like the React implementation
      const metadata: Record<string, any> = {};
      if (assistantId) {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(assistantId);
        if (isUuid) {
          metadata['assistant_id'] = assistantId;
        } else {
          metadata['graph_id'] = assistantId;
        }
      }

      // Use the official LangGraph SDK search method with metadata filter
      const threads = await this.client.threads.search({
        metadata,
        limit: 100,
        offset: 0
      });
      return threads;
    } catch (error) {
      console.error('Error fetching threads:', error);
      return [];
    }
  }

  async createThread(assistantId?: string): Promise<string> {
    if (!this.client) {
      throw new Error('Client not configured');
    }

    // Create metadata based on assistant ID like the React implementation
    const metadata: Record<string, any> = {};
    if (assistantId) {
      // Check if assistantId is a UUID (assistant_id) or a graph_id
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(assistantId);
      if (isUuid) {
        metadata['assistant_id'] = assistantId;
      } else {
        metadata['graph_id'] = assistantId;
      }
    }

    // Use the official LangGraph SDK create method
    const thread = await this.client.threads.create({
      metadata
    });
    
    return thread.thread_id;
  }
}
