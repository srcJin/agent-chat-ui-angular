# Human Interrupt Functionality Demo

This Angular implementation includes comprehensive human interrupt functionality that mirrors the official LangGraph React implementation. Human interrupts allow for real-time intervention in AI agent workflows.

## 🚀 Quick Start

1. **Start the development server:**
   ```bash
   ng serve
   ```

2. **Open the application** in your browser at `http://localhost:4200`

3. **Start a conversation** by typing any message to create an AI conversation context

4. **Trigger sample interrupts** using the demo buttons in the controls bar

## 🎯 Features Implemented

### Core Interrupt Components

- **InterruptComponent** - Main orchestrator for human interrupts
- **ThreadActionsComponent** - Action buttons and thread management
- **StateViewComponent** - Displays thread state and descriptions
- **InboxItemInputComponent** - Handles user input for interrupt responses
- **GenericInterruptComponent** - Fallback for non-human interrupts

### Interrupt Types

#### 1. **Full Interrupt** (Edit + Response + Accept)
- Allows editing of action parameters
- Supports custom response input
- Provides accept option for unchanged actions
- Can ignore the interrupt

#### 2. **Edit-Only Interrupt**
- Only allows parameter editing
- No response input
- Can ignore but not accept unchanged

#### 3. **Response-Only Interrupt**
- No parameter editing
- Only custom response input
- Focuses on human guidance

### Service Architecture

- **InterruptService** - State management using Angular signals
- **StreamService** integration for real-time updates
- Type-safe interrupt handling with comprehensive TypeScript interfaces

## 🎮 Demo Controls

### Available Demo Buttons

1. **Demo Full Interrupt** - Loads a web search interrupt with all options
2. **Demo Edit Interrupt** - Loads an email sending interrupt (edit-only)
3. **Demo Response Interrupt** - Loads a decision-making interrupt (response-only)
4. **Clear Interrupt** - Removes current interrupt display

### Using the Demo

1. **Create conversation context:**
   - Send any message to start a chat
   - This creates the necessary AI message context

2. **Load sample interrupt:**
   - Click any "Demo" button to load interrupt
   - Interrupt appears on the last AI message

3. **Interact with interrupt:**
   - **Edit fields** - Modify action parameters
   - **Response area** - Provide custom guidance
   - **Accept** - Use unchanged parameters (if available)
   - **Submit** - Send your modifications
   - **Reset** - Restore original values

## 📋 Interrupt Interface Examples

### Full Interrupt Example
```typescript
{
  action_request: {
    action: 'search_web',
    args: {
      query: 'latest AI developments 2024',
      max_results: 5
    }
  },
  config: {
    allow_edit: true,     // Can modify parameters
    allow_respond: true,  // Can add custom response
    allow_accept: true,   // Can accept unchanged
    allow_ignore: false   // Cannot ignore
  },
  description: 'The assistant wants to search the web...'
}
```

### Edit-Only Interrupt Example
```typescript
{
  action_request: {
    action: 'send_email',
    args: {
      to: 'user@example.com',
      subject: 'Project Update',
      body: 'Hello, here is the latest update...'
    }
  },
  config: {
    allow_edit: true,     // Can modify email content
    allow_respond: false, // No response input
    allow_accept: false,  // Must edit to proceed
    allow_ignore: true    // Can ignore
  }
}
```

## 🏗️ Architecture Overview

### Signal-Based State Management
```typescript
// InterruptService signals
readonly humanResponse = computed(() => this._humanResponse());
readonly loading = computed(() => this._loading());
readonly streaming = computed(() => this._streaming());
readonly supportsMultipleMethods = computed(() => /* logic */);
```

### React to Angular Migration Patterns

| React Pattern | Angular Equivalent |
|---------------|-------------------|
| `useState()` | `signal()` |
| `useEffect()` | `effect()` |
| `useContext()` | Injectable services |
| Component props | `@Input()` properties |
| Event handlers | `@Output()` emitters |

### Component Communication
```typescript
// Parent to child
[interruptValue]="currentInterrupt()"
[isLastMessage]="true"

// Child to parent
(showSidePanelChange)="handleShowSidePanel($event)"
```

## 🎨 UI Features

### Visual Design
- **Color-coded interrupts** - Orange theme for attention
- **Responsive layout** - Works on mobile and desktop
- **State indicators** - Loading, streaming, success states
- **Interactive elements** - Expand/collapse, reset buttons

### Accessibility
- **Keyboard navigation** - Ctrl/Cmd+Enter to submit
- **Screen reader support** - Proper ARIA labels
- **Focus management** - Logical tab order
- **Error handling** - Clear error messages

## 🔧 Technical Implementation

### Key Files Structure
```
src/app/
├── components/
│   ├── interrupt/
│   │   ├── interrupt.component.ts
│   │   ├── thread-actions/
│   │   ├── state-view/
│   │   ├── inbox-item-input/
│   │   └── generic-interrupt/
│   ├── message/message.component.ts
│   └── thread/thread.component.ts
├── models/
│   └── interrupt.types.ts
└── services/
    └── interrupt.service.ts
```

### TypeScript Interfaces
- **HumanInterrupt** - Core interrupt structure
- **HumanInterruptConfig** - Capabilities configuration
- **ActionRequest** - Action and parameters
- **HumanResponse** - User input types
- **SubmitType** - Response type enumeration

## 🚀 Advanced Usage

### Custom Interrupt Integration
```typescript
// Create custom interrupt
const customInterrupt: HumanInterrupt = {
  action_request: {
    action: 'custom_action',
    args: { /* custom args */ }
  },
  config: {
    allow_edit: true,
    allow_respond: true,
    allow_accept: false,
    allow_ignore: true
  }
};

// Load in component
this.threadComponent.currentInterrupt.set(customInterrupt);
```

### Real API Integration
Replace the simulation methods in `InterruptService`:
```typescript
// Replace simulateSubmit with real API calls
private async submitInterruptResponse(
  type: SubmitType, 
  args: any, 
  interrupt: HumanInterrupt
): Promise<void> {
  const response = await this.httpClient.post('/api/interrupt/respond', {
    type,
    args,
    threadId: this.streamService.threadId()
  }).toPromise();
  
  // Handle response and resume workflow
}
```

## 🔄 State Flow

1. **Interrupt Detection** - Message component checks for interrupt value
2. **Component Rendering** - InterruptComponent displays appropriate UI
3. **User Interaction** - User modifies parameters or adds response
4. **State Management** - InterruptService tracks all changes
5. **Submission** - Service determines submission type and sends response
6. **Workflow Resume** - LangGraph continues with human input

## 🎯 Benefits

### For Developers
- **Type safety** - Full TypeScript integration
- **Reusable components** - Modular interrupt system
- **Signal reactivity** - Efficient state updates
- **Testing ready** - Sample data and mock responses

### for Users
- **Real-time feedback** - Immediate UI updates
- **Flexible interaction** - Multiple response methods
- **Error recovery** - Reset and retry options
- **Visual clarity** - Clear action indicators

## 📝 Notes

- **Demo Mode**: Current implementation uses sample data for demonstration
- **Production Ready**: Architecture supports real LangGraph API integration
- **Extensible**: Easy to add new interrupt types and behaviors
- **Performance**: Optimized with Angular signals and OnPush change detection

## 🔗 Related Documentation

- [Tool Call Demo](./TOOL_CALL_DEMO.md) - Tool execution display
- [Main README](../README.md) - Project overview and setup
- [LangGraph Documentation](https://langchain-ai.github.io/langgraph/) - Official LangGraph docs 