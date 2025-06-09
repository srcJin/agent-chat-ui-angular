import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SetupFormComponent, type SetupConfig } from './components/setup-form/setup-form.component';
import { ThreadComponent } from './components/thread/thread.component';
import { StreamService } from './services/stream.service';
import { ThreadService } from './services/thread.service';
import { LanggraphClientService } from './services/langgraph-client.service';

@Component({
  selector: 'app-root',
  imports: [CommonModule, SetupFormComponent, ThreadComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'angular-chat-ui';
  isConfigured = signal(false);
  isConnecting = signal(false);
  connectionError = signal<string | null>(null);

  constructor(
    private streamService: StreamService,
    private threadService: ThreadService,
    private clientService: LanggraphClientService
  ) {}

  ngOnInit() {
    // Check for saved configuration in localStorage
    this.loadSavedConfig();
  }

  private loadSavedConfig() {
    const savedApiUrl = localStorage.getItem('lg:chat:apiUrl');
    const savedAssistantId = localStorage.getItem('lg:chat:assistantId');
    const savedApiKey = localStorage.getItem('lg:chat:apiKey');

    if (savedApiUrl && savedAssistantId) {
      this.onConfigSubmit({
        apiUrl: savedApiUrl,
        assistantId: savedAssistantId,
        apiKey: savedApiKey || undefined
      });
    }
  }

  async onConfigSubmit(config: SetupConfig) {
    this.isConnecting.set(true);
    this.connectionError.set(null);

    try {
      // Save configuration to localStorage
      localStorage.setItem('lg:chat:apiUrl', config.apiUrl);
      localStorage.setItem('lg:chat:assistantId', config.assistantId);
      if (config.apiKey) {
        localStorage.setItem('lg:chat:apiKey', config.apiKey);
      } else {
        localStorage.removeItem('lg:chat:apiKey');
      }

      // Check connection to the graph
      const isConnected = await this.clientService.checkGraphStatus(config.apiUrl, config.apiKey);
      
      if (!isConnected) {
        this.connectionError.set(
          `Failed to connect to LangGraph server at ${config.apiUrl}. Please check the URL and API key.`
        );
        return;
      }

      // Configure services
      this.streamService.configure(config.apiUrl, config.assistantId, config.apiKey);
      
      // Load threads if possible
      try {
        await this.threadService.getThreads();
      } catch (error) {
        console.warn('Could not load threads:', error);
      }

      this.isConfigured.set(true);
    } catch (error) {
      console.error('Configuration error:', error);
      this.connectionError.set('An error occurred while connecting. Please try again.');
    } finally {
      this.isConnecting.set(false);
    }
  }

  resetConfiguration() {
    localStorage.removeItem('lg:chat:apiUrl');
    localStorage.removeItem('lg:chat:assistantId');
    localStorage.removeItem('lg:chat:apiKey');
    this.isConfigured.set(false);
    this.connectionError.set(null);
    this.streamService.reset();
  }
}
