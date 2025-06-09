import { Injectable, computed, signal } from '@angular/core';
import { LanggraphClientService, type Message, type Checkpoint } from './langgraph-client.service';
import { v4 as uuidv4 } from 'uuid';

// Define UI message types locally to avoid React dependencies
export interface UIMessage {
  type: 'ui';
  id: string;
  content: any;
}

export interface RemoveUIMessage {
  type: 'remove-ui';
  id: string;
}

function isUIMessage(msg: any): msg is UIMessage {
  return msg && msg.type === 'ui';
}

function isRemoveUIMessage(msg: any): msg is RemoveUIMessage {
  return msg && msg.type === 'remove-ui';
}

function uiMessageReducer(current: UIMessage[], action: UIMessage | RemoveUIMessage): UIMessage[] {
  if (isRemoveUIMessage(action)) {
    return current.filter(msg => msg.id !== action.id);
  }
  if (isUIMessage(action)) {
    const existing = current.findIndex(msg => msg.id === action.id);
    if (existing >= 0) {
      const newCurrent = [...current];
      newCurrent[existing] = action;
      return newCurrent;
    }
    return [...current, action];
  }
  return current;
}

export interface StateType {
  messages: Message[];
  ui?: UIMessage[];
  context?: Record<string, unknown>;
}

export interface StreamUpdateType {
  messages?: Message[] | Message | string;
  ui?: (UIMessage | RemoveUIMessage)[] | UIMessage | RemoveUIMessage;
  context?: Record<string, unknown>;
}

@Injectable({
  providedIn: 'root'
})
export class StreamService {
  // Signals for reactive state
  private _messages = signal<Message[]>([]);
  private _uiMessages = signal<UIMessage[]>([]);
  private _isLoading = signal<boolean>(false);
  private _error = signal<Error | null>(null);
  private _threadId = signal<string | null>(null);
  private _interrupt = signal<any>(null);
  private _context = signal<Record<string, unknown>>({});

  // Computed properties for readonly access
  messages = computed(() => this._messages());
  uiMessages = computed(() => this._uiMessages());
  isLoading = computed(() => this._isLoading());
  error = computed(() => this._error());
  threadId = computed(() => this._threadId());
  interrupt = computed(() => this._interrupt());
  context = computed(() => this._context());

  private apiUrl?: string;
  private apiKey?: string;
  private assistantId?: string;
  private abortController?: AbortController;

  constructor(private clientService: LanggraphClientService) {}

  configure(apiUrl: string, assistantId: string, apiKey?: string) {
    this.apiUrl = apiUrl;
    this.assistantId = assistantId;
    this.apiKey = apiKey;
    this.clientService.configure(apiUrl, apiKey);
  }

  getAssistantId(): string | undefined {
    return this.assistantId;
  }

  setThreadId(threadId: string | null) {
    this._threadId.set(threadId);
  }

  setMessages(messages: Message[]) {
    this._messages.set(messages);
  }

  private handleUpdate(update: StreamUpdateType) {
    // Log the full update for debugging
    console.log('Stream update received:', JSON.stringify(update, null, 2));
    
    if (update.messages) {
      const messages = Array.isArray(update.messages) 
        ? update.messages 
        : [update.messages];
      
      // Filter out string messages and ensure we have proper Message objects
      const properMessages = messages.filter(m => typeof m !== 'string') as Message[];
      
      // Ensure each message has a unique ID, generate one if missing
      const messagesWithIds = properMessages.map((msg, index) => ({
        ...msg,
        id: msg.id || `${msg.type}-${uuidv4()}`
      }));
      
      // Log individual messages
      messagesWithIds.forEach(msg => {
        console.log('Processing message:', JSON.stringify(msg, null, 2));
      });
      
      // Replace messages instead of appending to avoid duplicates
      // The stream sends the complete state, not just new messages
      this._messages.set(messagesWithIds);
    }

    if (update.ui) {
      const uiUpdates = Array.isArray(update.ui) ? update.ui : [update.ui];
      this._uiMessages.update(current => {
        let newUi = current;
        for (const uiUpdate of uiUpdates) {
          newUi = uiMessageReducer(newUi, uiUpdate);
        }
        return newUi;
      });
    }

    if (update.context) {
      this._context.set(update.context);
    }
  }

  async submit(
    input?: { messages: Message[]; context?: Record<string, unknown> },
    options?: {
      checkpoint?: Checkpoint | null;
      streamMode?: string[];
      optimisticValues?: (prev: StateType) => StateType;
    }
  ): Promise<void> {
    if (!this.apiUrl || !this.assistantId) {
      throw new Error('Stream service not configured');
    }

    // Handle optimistic updates
    if (options?.optimisticValues && input) {
      const currentState: StateType = {
        messages: this._messages(),
        ui: this._uiMessages(),
        context: this._context()
      };
      const optimisticState = options.optimisticValues(currentState);
      this._messages.set(optimisticState.messages);
      if (optimisticState.ui) {
        this._uiMessages.set(optimisticState.ui);
      }
      if (optimisticState.context) {
        this._context.set(optimisticState.context);
      }
    }

    this._isLoading.set(true);
    this._error.set(null);
    this.abortController = new AbortController();

    try {
      let threadId = this._threadId();
      if (!threadId) {
        // Create a new thread on the server with proper assistant metadata
        threadId = await this.clientService.createThread(this.assistantId!);
        this._threadId.set(threadId);
      }

      const stream = await this.clientService.streamRun(
        threadId,
        this.assistantId!,
        input || {},
        {
          checkpoint: options?.checkpoint,
          streamMode: options?.streamMode || ['values']
        }
      );

      for await (const chunk of stream) {
        if (this.abortController?.signal.aborted) {
          break;
        }
        
        if (chunk.event === 'values' && chunk.data) {
          this.handleUpdate(chunk.data as StreamUpdateType);
        }
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        this._error.set(error);
      }
    } finally {
      this._isLoading.set(false);
      this.abortController = undefined;
    }
  }

  stop() {
    if (this.abortController) {
      this.abortController.abort();
      this._isLoading.set(false);
    }
  }

  reset() {
    this._messages.set([]);
    this._uiMessages.set([]);
    this._isLoading.set(false);
    this._error.set(null);
    this._threadId.set(null);
    this._interrupt.set(null);
    this._context.set({});
  }
}
