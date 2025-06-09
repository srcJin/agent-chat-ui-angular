import { Component, OnInit, signal, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThreadService } from '../../../services/thread.service';
import { StreamService } from '../../../services/stream.service';
import { type Thread } from '../../../services/langgraph-client.service';

@Component({
  selector: 'app-thread-history',
  imports: [CommonModule],
  template: `
    <!-- Desktop Sidebar -->
    <div class="thread-history-sidebar" [class.collapsed]="sidebarCollapsed()">
      <div class="sidebar-header">
        <button 
          (click)="toggleSidebar()" 
          class="sidebar-toggle"
          [attr.aria-label]="sidebarCollapsed() ? 'Expand sidebar' : 'Collapse sidebar'"
        >
          @if (sidebarCollapsed()) {
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          } @else {
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          }
        </button>
        
        @if (!sidebarCollapsed()) {
          <h1 class="sidebar-title">Thread History</h1>
        }
      </div>

      @if (!sidebarCollapsed()) {
        <div class="sidebar-content">
          @if (threadService.threadsLoading()) {
            <!-- Loading Skeleton -->
            <div class="thread-loading">
              @for (_ of loadingItems; track $index) {
                <div class="thread-skeleton"></div>
              }
            </div>
          } @else {
            <!-- Thread List -->
            <div class="thread-list">
              @for (thread of threadService.threads(); track thread.thread_id) {
                <div class="thread-item-wrapper">
                  <button
                    (click)="onThreadClick(thread.thread_id)"
                    class="thread-item"
                    [class.active]="thread.thread_id === threadService.currentThreadId()"
                    [title]="threadService.getThreadDisplayText(thread)"
                  >
                    <p class="thread-text">{{ threadService.getThreadDisplayText(thread) }}</p>
                  </button>
                </div>
              }
            </div>
          }
        </div>
      }
    </div>

    <!-- Mobile Overlay (for mobile responsive support) -->
    @if (isSmallScreen() && mobileMenuOpen()) {
      <div class="mobile-overlay" (click)="closeMobileMenu()">
        <div class="mobile-sidebar" (click)="$event.stopPropagation()">
          <div class="mobile-header">
            <h2 class="mobile-title">Thread History</h2>
            <button (click)="closeMobileMenu()" class="mobile-close">
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          
          <div class="mobile-content">
            @if (threadService.threadsLoading()) {
              <div class="thread-loading">
                @for (_ of loadingItems; track $index) {
                  <div class="thread-skeleton"></div>
                }
              </div>
            } @else {
              <div class="thread-list">
                @for (thread of threadService.threads(); track thread.thread_id) {
                  <div class="thread-item-wrapper">
                    <button
                      (click)="onThreadClick(thread.thread_id); closeMobileMenu()"
                      class="thread-item"
                      [class.active]="thread.thread_id === threadService.currentThreadId()"
                    >
                      <p class="thread-text">{{ threadService.getThreadDisplayText(thread) }}</p>
                    </button>
                  </div>
                }
              </div>
            }
          </div>
        </div>
      </div>
    }
  `,
  styleUrl: './thread-history.component.scss'
})
export class ThreadHistoryComponent implements OnInit {
  sidebarCollapsed = signal(false);
  mobileMenuOpen = signal(false);
  isSmallScreen = signal(false);
  
  // Create array for loading skeleton
  loadingItems = Array.from({ length: 8 });

  constructor(
    public threadService: ThreadService,
    private streamService: StreamService
  ) {}

  ngOnInit() {
    this.checkScreenSize();
    this.loadThreads();
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.checkScreenSize();
  }

  private checkScreenSize() {
    this.isSmallScreen.set(window.innerWidth < 1024);
    
    // Auto-collapse sidebar on small screens
    if (this.isSmallScreen()) {
      this.sidebarCollapsed.set(true);
    }
  }

  private async loadThreads() {
    try {
      const assistantId = this.streamService.getAssistantId();
      if (assistantId) {
        await this.threadService.getThreads(assistantId);
      }
    } catch (error) {
      console.error('Error loading threads:', error);
    }
  }

  toggleSidebar() {
    if (this.isSmallScreen()) {
      this.mobileMenuOpen.set(!this.mobileMenuOpen());
    } else {
      this.sidebarCollapsed.set(!this.sidebarCollapsed());
    }
  }

  closeMobileMenu() {
    this.mobileMenuOpen.set(false);
  }

  onThreadClick(threadId: string) {
    this.threadService.switchToThread(threadId);
  }
} 