import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToolCall } from '../../services/langgraph-client.service';

@Component({
  selector: 'app-tool-calls',
  imports: [CommonModule],
  templateUrl: './tool-calls.component.html',
  styleUrl: './tool-calls.component.scss'
})
export class ToolCallsComponent {
  @Input() toolCalls: ToolCall[] = [];

  isComplexValue(value: any): boolean {
    return Array.isArray(value) || (typeof value === 'object' && value !== null);
  }

  formatValue(value: any): string {
    if (this.isComplexValue(value)) {
      try {
        return JSON.stringify(value, null, 2);
      } catch {
        return String(value);
      }
    }
    return String(value);
  }

  hasArgs(args: Record<string, any>): boolean {
    return Object.keys(args).length > 0;
  }

  getArgEntries(args: Record<string, any>): [string, any][] {
    return Object.entries(args);
  }
} 