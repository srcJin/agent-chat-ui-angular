import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Message } from '../../services/langgraph-client.service';

@Component({
  selector: 'app-tool-result',
  imports: [CommonModule],
  templateUrl: './tool-result.component.html',
  styleUrl: './tool-result.component.scss'
})
export class ToolResultComponent {
  @Input() message!: Message;
  
  isExpanded = signal(false);

  get parsedContent(): any {
    try {
      if (typeof this.message.content === 'string') {
        return JSON.parse(this.message.content);
      }
    } catch {
      // Content is not JSON, use as is
    }
    return this.message.content;
  }

  get isJsonContent(): boolean {
    return this.isComplexValue(this.parsedContent);
  }

  get contentStr(): string {
    return this.isJsonContent
      ? JSON.stringify(this.parsedContent, null, 2)
      : String(this.message.content);
  }

  get contentLines(): string[] {
    return this.contentStr.split('\n');
  }

  get shouldTruncate(): boolean {
    return this.contentLines.length > 4 || this.contentStr.length > 500;
  }

  get displayedContent(): string {
    if (this.shouldTruncate && !this.isExpanded()) {
      return this.contentStr.length > 500
        ? this.contentStr.slice(0, 500) + '...'
        : this.contentLines.slice(0, 4).join('\n') + '\n...';
    }
    return this.contentStr;
  }

  get shouldShowExpandButton(): boolean {
    return (this.shouldTruncate && !this.isJsonContent) ||
           (this.isJsonContent && Array.isArray(this.parsedContent) && this.parsedContent.length > 5);
  }

  get displayedParsedContent(): any[] {
    if (Array.isArray(this.parsedContent)) {
      return this.isExpanded() ? this.parsedContent : this.parsedContent.slice(0, 5);
    }
    return Object.entries(this.parsedContent);
  }

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

  toggleExpanded(): void {
    this.isExpanded.update(expanded => !expanded);
  }

  getEntryKey(item: any, index: number): string | number {
    return Array.isArray(this.parsedContent) ? index : item[0];
  }

  getEntryValue(item: any, index: number): any {
    return Array.isArray(this.parsedContent) ? item : item[1];
  }
} 