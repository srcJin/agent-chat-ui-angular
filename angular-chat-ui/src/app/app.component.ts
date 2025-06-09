import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SetupFormComponent, type SetupConfig } from './components/setup-form/setup-form.component';
import { ThreadComponent } from './components/thread/thread.component';
import { ThreadHistoryComponent } from './components/thread/history/thread-history.component';
import { SettingsModalComponent } from './components/settings-modal/settings-modal.component';
import { StreamService } from './services/stream.service';
import { ThreadService } from './services/thread.service';
import { LanggraphClientService } from './services/langgraph-client.service';

@Component({
  selector: 'app-root',
  imports: [CommonModule, SetupFormComponent, ThreadComponent, ThreadHistoryComponent, SettingsModalComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'angular-chat-ui';
  isConfigured = signal(false);
  isConnecting = signal(false);
  connectionError = signal<string | null>(null);
  showSettings = signal(false);
  currentConfig = signal<SetupConfig>({
    apiUrl: '',
    assistantId: '',
    apiKey: ''
  });

  constructor(
    private streamService: StreamService,
    private threadService: ThreadService,
    private clientService: LanggraphClientService
  ) {}

  ngOnInit() {
    // Check for existing configuration in localStorage
    const apiUrl = localStorage.getItem('lg:chat:apiUrl');
    const assistantId = localStorage.getItem('lg:chat:assistantId');
    const apiKey = localStorage.getItem('lg:chat:apiKey');

    if (apiUrl && assistantId) {
      // Auto-configure with stored values
      this.onConfigSubmit({
        apiUrl,
        assistantId,
        apiKey: apiKey || undefined
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

      // Update current config
      this.currentConfig.set(config);

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
        await this.threadService.getThreads(config.assistantId);
      } catch (error) {
        console.warn('Could not load threads:', error);
      }

      this.isConfigured.set(true);
      this.showSettings.set(false); // Close settings if open
    } catch (error) {
      console.error('Configuration error:', error);
      this.connectionError.set('An error occurred while connecting. Please try again.');
    } finally {
      this.isConnecting.set(false);
    }
  }

  onSettingsRequested() {
    this.showSettings.set(true);
  }

  onSettingsClose() {
    this.showSettings.set(false);
  }

  async onSettingsSave(config: SetupConfig) {
    await this.onConfigSubmit(config);
  }

  resetConfiguration() {
    localStorage.removeItem('lg:chat:apiUrl');
    localStorage.removeItem('lg:chat:assistantId');
    localStorage.removeItem('lg:chat:apiKey');
    this.isConfigured.set(false);
    this.showSettings.set(false);
    this.streamService.reset();
    this.threadService.setThreads([]);
    this.currentConfig.set({
      apiUrl: '',
      assistantId: '',
      apiKey: ''
    });
  }
}
