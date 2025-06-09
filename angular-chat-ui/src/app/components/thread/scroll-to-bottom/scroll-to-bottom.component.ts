import { Component, ElementRef, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-scroll-to-bottom',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button 
      *ngIf="!isAtBottom()"
      class="scroll-to-bottom-btn"
      (click)="scrollToBottom()"
      title="Scroll to bottom">
      <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
              d="M19 14l-7 7m0 0l-7-7m7 7V3"/>
      </svg>
      <span>Scroll to bottom</span>
    </button>
  `,
  styleUrl: './scroll-to-bottom.component.scss'
})
export class ScrollToBottomComponent implements OnInit, OnDestroy {
  private elementRef = inject(ElementRef);
  
  readonly isAtBottom = signal(true);
  private scrollContainer: HTMLElement | null = null;
  private resizeObserver?: ResizeObserver;
  private scrollTimeout?: number;

  ngOnInit(): void {
    // Find the scroll container (chat messages container)
    this.findScrollContainer();
    if (this.scrollContainer) {
      this.setupScrollListener();
      this.setupResizeObserver();
    }
  }

  ngOnDestroy(): void {
    if (this.scrollContainer) {
      this.scrollContainer.removeEventListener('scroll', this.handleScroll);
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }
  }

  private findScrollContainer(): void {
    // Look for the scrollable container in the parent elements
    let element = this.elementRef.nativeElement.parentElement;
    
    while (element) {
      const style = window.getComputedStyle(element);
      if (style.overflowY === 'auto' || style.overflowY === 'scroll' || 
          element.classList.contains('messages-container') ||
          element.classList.contains('thread-messages')) {
        this.scrollContainer = element;
        break;
      }
      element = element.parentElement;
    }

    // Fallback to window if no scrollable container found
    if (!this.scrollContainer) {
      this.scrollContainer = document.documentElement;
    }
  }

  private setupScrollListener(): void {
    if (!this.scrollContainer) return;

    this.scrollContainer.addEventListener('scroll', this.handleScroll, { passive: true });
    // Initial check
    this.checkScrollPosition();
  }

  private setupResizeObserver(): void {
    if (!this.scrollContainer || !window.ResizeObserver) return;

    this.resizeObserver = new ResizeObserver(() => {
      // Debounce the scroll check when content resizes
      if (this.scrollTimeout) {
        clearTimeout(this.scrollTimeout);
      }
      this.scrollTimeout = setTimeout(() => {
        this.checkScrollPosition();
      }, 100) as any;
    });

    this.resizeObserver.observe(this.scrollContainer);
  }

  private handleScroll = (): void => {
    this.checkScrollPosition();
  };

  private checkScrollPosition(): void {
    if (!this.scrollContainer) return;

    const { scrollTop, scrollHeight, clientHeight } = this.scrollContainer;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10; // 10px threshold
    
    this.isAtBottom.set(isAtBottom);
  }

  scrollToBottom(): void {
    if (!this.scrollContainer) return;

    this.scrollContainer.scrollTo({
      top: this.scrollContainer.scrollHeight,
      behavior: 'smooth'
    });
  }
} 