# Angular Chat UI

An Angular 19 implementation of the LangGraph Agent Chat UI, providing a modern interface for chatting with LangGraph agents.

## Features

### Core Functionality
- **Real-time streaming**: Live message streaming from LangGraph agents
- **Multi-modal support**: Support for text, images, and file uploads  
- **Error handling**: Robust error handling with user-friendly messages
- **Responsive design**: Mobile-first responsive design with SCSS styling

### Thread Management
- **Thread History**: Sidebar showing all previous conversation threads
- **Thread Switching**: Easy switching between different conversation threads
- **New Thread Creation**: Start new conversations while preserving thread history
- **Thread Persistence**: Threads are automatically saved and retrieved from the LangGraph server
- **Smart Thread Display**: Thread titles based on first message content with fallback to thread ID

### User Interface
- **Collapsible Sidebar**: Thread history sidebar that can be collapsed on desktop and overlay on mobile
- **Loading States**: Skeleton loading animations for improved user experience
- **Message Components**: Dedicated components for human, AI, and tool messages
- **Artifact Support**: Infrastructure for rendering artifacts (extensible for future use)

## Architecture

### Services
- **StreamService**: Manages real-time streaming and message state
- **ThreadService**: Handles thread creation, retrieval, and management
- **LanggraphClientService**: Low-level client for LangGraph API communication

### Components
- **AppComponent**: Main application container with configuration management
- **SetupFormComponent**: Initial configuration form for API settings
- **ThreadComponent**: Main chat interface with message display and input
- **ThreadHistoryComponent**: Sidebar component for thread navigation
- **MessageComponent**: Individual message display with support for different message types

### State Management
- **Signal-based**: Uses Angular signals for reactive state management
- **Service injection**: Injectable services provide centralized state management
- **Optimistic updates**: UI updates optimistically for better user experience

## Getting Started

### Prerequisites
- Node.js 18+ (v18.19.0 or later)
- npm or yarn package manager
- Access to a LangGraph server deployment

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd angular-chat-ui
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open your browser to `http://localhost:4200`

### Configuration

On first launch, you'll be prompted to configure:

- **API URL**: Your LangGraph server endpoint (e.g., `http://localhost:2024` or production URL)
- **Assistant ID**: The graph ID or assistant ID to use for conversations
- **API Key**: (Optional) LangSmith API key for authenticated requests

Configuration is automatically saved to localStorage and will be restored on subsequent visits.

## Usage

### Starting a Conversation
1. Configure your LangGraph server connection
2. Type a message in the input area
3. Press Enter or click Send to start chatting

### Managing Threads
- **View History**: Use the sidebar to see all previous conversation threads
- **Switch Threads**: Click any thread in the sidebar to switch to that conversation
- **New Thread**: Click the "New Thread" button to start a fresh conversation
- **Collapse Sidebar**: Use the arrow button to collapse/expand the thread history sidebar

### Mobile Support
- The thread history automatically adapts to mobile screens with an overlay interface
- Touch-friendly interface with responsive design
- Sidebar can be accessed via a mobile menu on smaller screens

## Development

### Build
```bash
npm run build
```

### Code Style
- SCSS for styling with CSS custom properties
- TypeScript strict mode enabled
- Angular 19 with standalone components
- Signal-based reactive state management

### Testing
```bash
npm test
```

## Production Deployment

### Build for Production
```bash
npm run build
```

The built application will be in the `dist/` folder and can be served by any static web server.

### Environment Configuration
For production deployments, you can set default configuration via environment variables or by modifying the configuration logic in `app.component.ts`.

## Browser Support

- Chrome/Chromium 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Troubleshooting

### Connection Issues
- Verify your LangGraph server is running and accessible
- Check API URL format (include protocol: `http://` or `https://`)
- Ensure any required API keys are correctly configured

### Thread Loading Issues
- Threads are loaded based on the assistant ID metadata
- Verify your assistant ID matches the server configuration
- Check browser console for detailed error messages

### Performance
- Large numbers of threads may impact loading performance
- Consider implementing pagination for thread history if needed
- Bundle size warnings are normal and don't affect functionality

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make your changes and commit: `git commit -am 'Add new feature'`
4. Push to the branch: `git push origin feature/new-feature`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.