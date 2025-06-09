import { Component, EventEmitter, Output, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { SetupConfig } from '../setup-form/setup-form.component';

@Component({
  selector: 'app-settings-modal',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="settings-overlay" (click)="onClose()">
      <div class="settings-modal" (click)="$event.stopPropagation()">
        <div class="settings-header">
          <h2 class="settings-title">Settings</h2>
          <button (click)="onClose()" class="close-button">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <form (ngSubmit)="onSubmit()" class="settings-form">
          <div class="form-group">
            <label for="apiUrl" class="form-label">
              Deployment URL<span class="required">*</span>
            </label>
            <p class="form-description">
              The URL of your LangGraph deployment.
            </p>
            <input
              id="apiUrl"
              name="apiUrl"
              [(ngModel)]="config.apiUrl"
              class="form-input"
              required
            />
          </div>

          <div class="form-group">
            <label for="assistantId" class="form-label">
              Assistant / Graph ID<span class="required">*</span>
            </label>
            <p class="form-description">
              The ID of the graph or assistant to use.
            </p>
            <input
              id="assistantId"
              name="assistantId"
              [(ngModel)]="config.assistantId"
              class="form-input"
              required
            />
          </div>

          <div class="form-group">
            <label for="apiKey" class="form-label">
              LangSmith API Key
            </label>
            <p class="form-description">
              Optional API key for authenticated requests.
            </p>
            <input
              id="apiKey"
              name="apiKey"
              type="password"
              [(ngModel)]="config.apiKey"
              class="form-input"
              placeholder="lsv2_pt_..."
            />
          </div>

          <div class="form-actions">
            <button type="button" (click)="onClose()" class="btn-secondary">
              Cancel
            </button>
            <button type="submit" class="btn-primary">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styleUrl: './settings-modal.component.scss'
})
export class SettingsModalComponent implements OnInit {
  @Input() currentConfig: SetupConfig = {
    apiUrl: '',
    assistantId: '',
    apiKey: ''
  };
  
  @Output() configSave = new EventEmitter<SetupConfig>();
  @Output() close = new EventEmitter<void>();

  config: SetupConfig = {
    apiUrl: '',
    assistantId: '',
    apiKey: ''
  };

  ngOnInit() {
    // Initialize with current config
    this.config = { ...this.currentConfig };
  }

  onSubmit() {
    this.configSave.emit({
      ...this.config,
      apiKey: this.config.apiKey || undefined
    });
  }

  onClose() {
    this.close.emit();
  }
} 