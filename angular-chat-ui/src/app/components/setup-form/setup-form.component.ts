import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface SetupConfig {
  apiUrl: string;
  assistantId: string;
  apiKey?: string;
}

@Component({
  selector: 'app-setup-form',
  imports: [CommonModule, FormsModule],
  templateUrl: './setup-form.component.html',
  styleUrl: './setup-form.component.scss'
})
export class SetupFormComponent {
  @Output() configSubmit = new EventEmitter<SetupConfig>();

  config: SetupConfig = {
    apiUrl: 'http://localhost:2024',
    assistantId: 'agent',
    apiKey: ''
  };

  onSubmit() {
    this.configSubmit.emit({
      ...this.config,
      apiKey: this.config.apiKey || undefined
    });
  }
}
