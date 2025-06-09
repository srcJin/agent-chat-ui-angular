# Angular Chat UI

An Angular implementation of the LangGraph Agent Chat UI, providing the same functionality as the React version but built with Angular 19, signals, and Tailwind CSS.

## Features

- 🚀 Built with Angular 19 and the latest Signal-based architecture
- 🎨 Styled with Tailwind CSS for modern, responsive design
- 🔗 Direct integration with LangGraph SDK
- 📱 Responsive design that works on desktop and mobile
- ⚡ Real-time streaming chat interface
- 🔧 Easy configuration with environment variables or setup form

## Core Components

- **StreamService**: Angular service that manages LangGraph streaming connections using signals
- **ThreadService**: Manages chat threads and conversation history
- **LanggraphClientService**: Handles LangGraph SDK client initialization
- **SetupFormComponent**: Configuration form for API URL, Assistant ID, and API key
- **ThreadComponent**: Main chat interface with message history and input
- **MessageComponent**: Individual message display with support for human and AI messages

## Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm start
   ```

3. **Configure LangGraph Connection**
   - Open the application in your browser (usually http://localhost:4200)
   - Fill in the setup form with:
     - **Deployment URL**: Your LangGraph server URL (e.g., http://localhost:2024)
     - **Assistant/Graph ID**: The ID of your graph or assistant (e.g., "agent")
     - **LangSmith API Key**: (Optional) Required only for production LangGraph deployments

## Environment Variables

You can skip the setup form by setting these environment variables:

```bash
# In your environment or .env file
NG_APP_API_URL=http://localhost:2024
NG_APP_ASSISTANT_ID=agent
NG_APP_API_KEY=your-langsmith-api-key  # Optional
```

## Architecture

This Angular implementation mirrors the React version's functionality:

- **Reactive State Management**: Uses Angular signals for reactive state management
- **Service-Based Architecture**: Core functionality separated into injectable services
- **Component Composition**: Modular components that can be easily extended
- **TypeScript**: Fully typed for better development experience

## Migration from React

The Angular implementation provides equivalent functionality to the React version:

| React Concept | Angular Equivalent |
|---------------|-------------------|
| `useStream` hook | `StreamService` with signals |
| `useThreads` hook | `ThreadService` |
| React Context | Injectable services |
| `useState` | `signal()` |
| `useEffect` | `ngOnInit`, `ngOnDestroy` |
| Props | `@Input()` properties |
| Event handlers | `@Output()` events |

## Development

- **Build**: `npm run build`
- **Test**: `npm test`
- **Lint**: `npm run lint`

## Contributing

This implementation follows Angular best practices and is designed to be easily extensible. Feel free to contribute improvements or additional features.