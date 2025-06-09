import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-generic-interrupt',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="generic-interrupt-container">
      <div class="interrupt-header">
        <h3 class="title">⚠️ Human Intervention Required</h3>
        <p class="description">This thread requires manual intervention.</p>
      </div>
      
      <div class="interrupt-content">
        <div class="code-block">
          <pre><code>{{ formattedInterrupt() }}</code></pre>
        </div>
      </div>
      
      <div class="interrupt-actions">
        <button 
          type="button" 
          class="action-btn resolve-btn"
          (click)="handleResolve()"
        >
          Mark as Resolved
        </button>
        <button 
          type="button" 
          class="action-btn copy-btn"
          (click)="copyToClipboard()"
        >
          Copy
        </button>
      </div>
    </div>
  `,
  styles: [`
    .generic-interrupt-container {
      display: flex;
      width: 100%;
      flex-direction: column;
      gap: 1.5rem;
      border-radius: 0.75rem;
      border: 1px solid rgb(254 215 170);
      background-color: rgb(255 247 237);
      padding: 1.5rem;
    }

    .interrupt-header {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .title {
      font-size: 1.125rem;
      font-weight: 600;
      color: rgb(154 52 18);
    }

    .description {
      font-size: 0.875rem;
      color: rgb(194 65 12);
    }

    .interrupt-content {
      width: 100%;
    }

    .code-block {
      border-radius: 0.5rem;
      background-color: white;
      border: 1px solid rgb(254 215 170);
      padding: 1rem;
      overflow-x: auto;
      
      pre {
        margin: 0;
        font-size: 0.875rem;
        
        code {
          font-family: 'Courier New', monospace;
          color: rgb(31 41 55);
        }
      }
    }

    .interrupt-actions {
      display: flex;
      gap: 0.75rem;
    }

    .action-btn {
      padding: 0.5rem 1rem;
      border-radius: 0.375rem;
      border: 1px solid;
      transition: background-color 0.2s, border-color 0.2s;
      cursor: pointer;
      font-weight: 500;
      
      &.resolve-btn {
        background-color: rgb(234 88 12);
        color: white;
        border-color: rgb(234 88 12);
        
        &:hover {
          background-color: rgb(194 65 12);
          border-color: rgb(194 65 12);
        }
      }
      
      &.copy-btn {
        background-color: white;
        color: rgb(194 65 12);
        border-color: rgb(253 186 116);
        
        &:hover {
          background-color: rgb(255 237 213);
        }
      }
    }
  `]
})
export class GenericInterruptComponent {
  @Input() interrupt: unknown;

  formattedInterrupt(): string {
    if (this.interrupt === null || this.interrupt === undefined) {
      return 'null';
    }
    
    if (typeof this.interrupt === 'string') {
      return this.interrupt;
    }
    
    if (typeof this.interrupt === 'object') {
      try {
        return JSON.stringify(this.interrupt, null, 2);
      } catch {
        return String(this.interrupt);
      }
    }
    
    return String(this.interrupt);
  }

  handleResolve(): void {
    console.log('Resolving generic interrupt:', this.interrupt);
    // In a real app, this would call the interrupt service to resolve
  }

  async copyToClipboard(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.formattedInterrupt());
      console.log('Copied to clipboard');
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      // Fallback for older browsers
      this.fallbackCopyToClipboard(this.formattedInterrupt());
    }
  }

  private fallbackCopyToClipboard(text: string): void {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
      console.log('Copied to clipboard (fallback)');
    } catch (err) {
      console.error('Fallback copy failed:', err);
    }
    
    document.body.removeChild(textArea);
  }
} 