import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThreadService, ThreadHistoryItem } from '../../../services/thread.service';

@Component({
  selector: 'app-thread-history',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="thread-history-container">
      <!-- Desktop sidebar -->
      <div class="desktop-sidebar" [class.open]="threadService.chatHistoryOpen()">
        <div class="sidebar-header">
          <button 
            class="toggle-button"
            (click)="threadService.toggleChatHistory()"
            title="Toggle thread history">
            <svg 
              class="icon" 
              [class.rotate]="threadService.chatHistoryOpen()"
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
          <h1 class="sidebar-title">Thread History</h1>
        </div>
        
        <div class="thread-list">
          @if (threadService.threadsLoading()) {
            <div class="loading-list">
              @for (item of skeletonItems(); track $index) {
                <div class="skeleton-item"></div>
              }
            </div>
          } @else {
            <div class="thread-items">
              @for (thread of threadService.threads(); track thread.thread_id) {
                <div class="thread-item-wrapper">
                  <button 
                    class="thread-item"
                    [class.active]="thread.thread_id === threadService.currentThreadId()"
                    (click)="selectThread(thread.thread_id)"
                    [title]="getThreadTitle(thread)">
                    <p class="thread-text">{{ getThreadTitle(thread) }}</p>
                  </button>
                  <button 
                    class="delete-button"
                    (click)="onDeleteThread($event, thread.thread_id)"
                    title="Delete thread">
                    <svg class="icon delete-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </button>
                </div>
              }
            </div>
          }
        </div>
      </div>

      <!-- Mobile overlay (for future mobile support) -->
      <div 
        class="mobile-overlay"
        [class.visible]="threadService.chatHistoryOpen()"
        (click)="threadService.closeChatHistory()">
        <div 
          class="mobile-sidebar"
          (click)="$event.stopPropagation()">
          <div class="mobile-header">
            <h2 class="mobile-title">Thread History</h2>
            <button 
              class="close-button"
              (click)="threadService.closeChatHistory()">
              <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
          
          <div class="thread-list">
            @if (threadService.threadsLoading()) {
              <div class="loading-list">
                @for (item of skeletonItems(); track $index) {
                  <div class="skeleton-item"></div>
                }
              </div>
            } @else {
              <div class="thread-items">
                @for (thread of threadService.threads(); track thread.thread_id) {
                  <div class="thread-item-wrapper">
                    <button 
                      class="thread-item"
                      [class.active]="thread.thread_id === threadService.currentThreadId()"
                      (click)="selectThreadMobile(thread.thread_id)"
                      [title]="getThreadTitle(thread)">
                      <p class="thread-text">{{ getThreadTitle(thread) }}</p>
                    </button>
                    <button 
                      class="delete-button"
                      (click)="onDeleteThread($event, thread.thread_id)"
                      title="Delete thread">
                      <svg class="icon delete-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                      </svg>
                    </button>
                  </div>
                }
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrl: './thread-history.component.scss'
})
export class ThreadHistoryComponent implements OnInit {
  readonly threadService = inject(ThreadService);
  
  // Generate skeleton loading items
  readonly skeletonItems = signal(Array.from({ length: 10 }, (_, i) => i));

  ngOnInit(): void {
    // Load threads when component initializes
    this.threadService.loadThreadHistory();
  }

  selectThread(threadId: string): void {
    this.threadService.selectThread(threadId);
  }

  selectThreadMobile(threadId: string): void {
    this.threadService.selectThread(threadId);
    // Close mobile sidebar after selection
    this.threadService.closeChatHistory();
  }

  getThreadTitle(thread: any): string {
    return this.threadService.getThreadDisplayText(thread);
  }

  async onDeleteThread(event: Event, threadId: string) {
    event.stopPropagation(); // Prevent thread selection when clicking delete
    
    const confirmed = confirm('Are you sure you want to delete this thread? This action cannot be undone.');
    if (confirmed) {
      try {
        await this.threadService.deleteThread(threadId);
      } catch (error) {
        alert('Failed to delete thread. Please try again.');
      }
    }
  }
} 