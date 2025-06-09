import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToolCall } from '../../services/langgraph-client.service';

@Component({
  selector: 'app-tool-call-table',
  imports: [CommonModule],
  templateUrl: './tool-call-table.component.html',
  styleUrl: './tool-call-table.component.scss'
})
export class ToolCallTableComponent {
  @Input() toolCall!: ToolCall;

  getArgEntries(): [string, any][] {
    return Object.entries(this.toolCall.args || {});
  }

  formatValue(value: any): string {
    if (typeof value === 'string' || typeof value === 'number') {
      return value.toString();
    }

    // Check if it's a date
    if (this.isDate(value)) {
      return this.formatDate(value);
    }

    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return '';
    }
  }

  private isDate(value: any): boolean {
    try {
      const date = new Date(value);
      return date instanceof Date && !isNaN(date.getTime());
    } catch {
      return false;
    }
  }

  private formatDate(value: any): string {
    try {
      const date = new Date(value);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    } catch {
      return String(value);
    }
  }
} 