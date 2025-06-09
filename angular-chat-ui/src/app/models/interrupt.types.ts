// Human Interrupt Types - Angular version of React reference types

export interface BaseMessage {
  id?: string;
  type: string;
  content: string | any;
  additional_kwargs?: Record<string, any>;
  tool_calls?: ToolCall[];
}

export interface ToolCall {
  id?: string;
  name: string;
  args: Record<string, any>;
}

export interface ActionRequest {
  action: string;
  args: Record<string, any>;
}

export interface HumanInterruptConfig {
  allow_edit: boolean;
  allow_respond: boolean;
  allow_accept: boolean;
  allow_ignore: boolean;
}

export interface HumanInterrupt {
  action_request: ActionRequest;
  config: HumanInterruptConfig;
  description?: string;
}

export type SubmitType = 'edit' | 'response' | 'accept' | 'ignore';

export interface HumanResponse {
  type: SubmitType;
  args: any;
}

export interface HumanResponseWithEdits extends HumanResponse {
  editsMade?: boolean;
  acceptAllowed?: boolean;
}

// Utility types and functions
export type HumanInterruptValue = HumanInterrupt | HumanInterrupt[] | unknown;

// Type guards
export function isHumanInterrupt(value: unknown): value is HumanInterrupt {
  if (!value || typeof value !== 'object') return false;
  
  const obj = value as any;
  return (
    obj.action_request &&
    typeof obj.action_request === 'object' &&
    typeof obj.action_request.action === 'string' &&
    obj.config &&
    typeof obj.config === 'object' &&
    typeof obj.config.allow_edit === 'boolean' &&
    typeof obj.config.allow_respond === 'boolean' &&
    typeof obj.config.allow_accept === 'boolean' &&
    typeof obj.config.allow_ignore === 'boolean'
  );
}

export function isArrayOfMessages(value: unknown[]): value is BaseMessage[] {
  return value.every((item): item is BaseMessage => 
    typeof item === 'object' && 
    item !== null && 
    'type' in item && 
    'content' in item
  );
}

// Utility functions
export function prettifyText(text: string): string {
  if (!text) return text;
  
  return text
    .split(/[_-]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2');
}

export function unknownToPrettyDate(value: unknown): string | undefined {
  if (typeof value === 'string') {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    }
  }
  
  if (value instanceof Date) {
    return value.toLocaleDateString() + ' ' + value.toLocaleTimeString();
  }
  
  if (typeof value === 'number') {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    }
  }
  
  return undefined;
}

// Sample data for testing
export const SAMPLE_HUMAN_INTERRUPT: HumanInterrupt = {
  action_request: {
    action: 'search_web',
    args: {
      query: 'latest AI developments 2024',
      max_results: 5
    }
  },
  config: {
    allow_edit: true,
    allow_respond: true,
    allow_accept: true,
    allow_ignore: false
  },
  description: 'The assistant wants to search the web for the latest AI developments. You can edit the search parameters, respond with additional context, or accept the request as-is.'
};

export const SAMPLE_EDIT_ONLY_INTERRUPT: HumanInterrupt = {
  action_request: {
    action: 'send_email',
    args: {
      to: 'user@example.com',
      subject: 'Project Update',
      body: 'Hello, here is the latest update on our project...'
    }
  },
  config: {
    allow_edit: true,
    allow_respond: false,
    allow_accept: false,
    allow_ignore: true
  },
  description: 'The assistant wants to send an email. Please review and edit the email content before sending.'
};

export const SAMPLE_RESPONSE_ONLY_INTERRUPT: HumanInterrupt = {
  action_request: {
    action: 'make_decision',
    args: {
      options: ['Option A', 'Option B', 'Option C'],
      context: 'We need to choose the best approach for the project.'
    }
  },
  config: {
    allow_edit: false,
    allow_respond: true,
    allow_accept: false,
    allow_ignore: false
  },
  description: 'The assistant needs your input to make a decision. Please provide your preference and reasoning.'
};

export type ThreadStatusWithAll = 'interrupted' | 'idle' | 'busy' | 'error' | 'all';

export interface ThreadData<T extends Record<string, any> = Record<string, any>> {
  thread: {
    thread_id: string;
    values?: T;
  };
  status: 'interrupted' | 'idle' | 'busy' | 'error';
  interrupts?: HumanInterrupt[];
} 