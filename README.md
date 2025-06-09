# Agent Chat UI - React & Angular Implementation

This repository contains both React and Angular implementations of a LangGraph chatbot UI, allowing for direct comparison and reuse of core functionality between the two frameworks.

## Repository Structure

```
agent-chat-ui-react/
├── react-reference/          # Official React implementation (submodule)
├── angular-chat-ui/          # Angular implementation
├── LICENSE
├── package-lock.json
└── README.md
```

## React Reference Implementation

The `react-reference/` directory contains the official LangGraph Agent Chat UI implementation cloned as a git submodule from:
- **Repository**: https://github.com/srcJin/agent-chat-ui-angular-react-widget.git
- **Framework**: Next.js 15 with React 19
- **Features**: 
  - Real-time streaming chat interface
  - LangGraph SDK integration
  - Tailwind CSS styling
  - File upload support
  - Artifact rendering
  - Thread management

## Angular Implementation

The `angular-chat-ui/` directory contains a fully functional Angular port of the React implementation:

### Key Features
- **Framework**: Angular 19 with Signal-based architecture
- **Styling**: SCSS with modern CSS custom properties
- **Type Safety**: Full TypeScript support
- **Reactive State**: Angular signals for reactive state management
- **Core Functionality**: 
  - Setup form for LangGraph server configuration
  - Real-time chat interface
  - Message rendering (human/AI/tool)
  - Thread management
  - Error handling and loading states
  - **Tool Call Display**: Rich UI for LangGraph tool interactions
    - Formatted tool call arguments with JSON support
    - Expandable tool result display
    - Table view for structured data
    - Hide/show tool calls toggle

### Architecture Comparison

| Feature | React Implementation | Angular Implementation |
|---------|----------------------|------------------------|
| State Management | React Context + hooks | Injectable services + signals |
| Component Communication | Props + callbacks | @Input/@Output + services |
| Reactive Updates | useState + useEffect | signal() + computed() |
| HTTP Client | fetch + LangGraph SDK | Custom fetch wrapper |
| Styling | Tailwind CSS | SCSS with CSS variables |
| Build Tool | Next.js | Angular CLI |

### Core Services

1. **LanggraphClientService**: Handles API communication with LangGraph servers
2. **StreamService**: Manages real-time streaming connections using signals
3. **ThreadService**: Manages chat threads and conversation history

### Core Components

1. **SetupFormComponent**: Configuration form for API credentials
2. **ThreadComponent**: Main chat interface with message history
3. **MessageComponent**: Individual message rendering
4. **ToolCallsComponent**: Display tool calls with formatted arguments
5. **ToolResultComponent**: Show tool results with JSON parsing and expand/collapse
6. **ToolCallTableComponent**: Compact table view for tool call arguments

## Getting Started

### React Implementation
```bash
cd react-reference
pnpm install
pnpm dev
```

### Angular Implementation
```bash
cd angular-chat-ui
npm install
npm start
```

## Configuration

Both implementations support the same configuration options:

- **Deployment URL**: Your LangGraph server URL (e.g., `http://localhost:2024`)
- **Assistant/Graph ID**: The ID of your graph or assistant (e.g., `agent`)
- **LangSmith API Key**: Required for production deployments (optional for local)

## Migration Benefits

This repository demonstrates how to migrate a React application to Angular while:

1. **Preserving Core Functionality**: All essential features are maintained
2. **Following Framework Best Practices**: Each implementation uses framework-specific patterns
3. **Maintaining Type Safety**: Full TypeScript support in both versions
4. **Enabling Code Reuse**: Similar component structure for easy comparison

## Development

### React Reference
- **Build**: `pnpm build`
- **Lint**: `pnpm lint`
- **Format**: `pnpm format`

### Angular Implementation  
- **Build**: `npm run build`
- **Test**: `npm test`
- **Lint**: `npm run lint`

## Contributing

Feel free to contribute improvements to either implementation. The dual implementation approach makes it easy to:
- Compare framework-specific approaches
- Test new features in both environments
- Learn migration patterns between React and Angular

## License

This project is licensed under the MIT License - see the LICENSE file for details.
