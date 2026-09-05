import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
  time: string;
}

@Component({
  selector: 'app-ai-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-chatbot.component.html',
  styleUrls: ['./ai-chatbot.component.css']
})
export class AiChatbotComponent {
  private http = inject(HttpClient);
  private router = inject(Router);
  auth = inject(AuthService);

  isOpen = false;
  isMinimized = false;
  isLoading = false;
  inputMessage = '';

  messages: ChatMessage[] = [
    {
      sender: 'ai',
      text: 'Hello! 👋 I am **EventHub AI Assistant**.\n\nI can help you discover live events, assist with ticket bookings, explain refund policies, or guide you on hosting your own event as an organizer.\n\nHow can I help you today? You can ask in **English** or **ગુજરાતી**!',
      time: this.formatTime()
    }
  ];

  quickPrompts = [
    { label: '🎉 Suggest Popular Events', prompt: 'Suggest upcoming popular events happening this week' },
    { label: '🎟️ How to Book Tickets?', prompt: 'How do I book tickets and get my QR pass?' },
    { label: '💸 Refund & Cancellation', prompt: 'What is the refund and cancellation policy?' },
    { label: '🎪 Host an Event', prompt: 'How can I create and host an event as an organizer?' },
    { label: '📞 Contact Support', prompt: 'How do I contact customer support?' }
  ];

  toggleChat() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.isMinimized = false;
      this.scrollBottom();
    }
  }

  minimizeChat(event: Event) {
    event.stopPropagation();
    this.isMinimized = !this.isMinimized;
  }

  clearChat() {
    this.messages = [
      {
        sender: 'ai',
        text: 'Chat history cleared. How else can I assist you with EventHub today?',
        time: this.formatTime()
      }
    ];
  }

  sendQuickPrompt(promptText: string) {
    this.inputMessage = promptText;
    this.sendMessage();
  }

  sendMessage() {
    const text = this.inputMessage.trim();
    if (!text || this.isLoading) return;

    this.messages.push({
      sender: 'user',
      text: text,
      time: this.formatTime()
    });

    this.inputMessage = '';
    this.isLoading = true;
    this.scrollBottom();

    const role = this.auth.currentUser()?.role || 'user';

    this.http.post<any>('/api/ai/chat', {
      message: text,
      role: role
    }).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.messages.push({
          sender: 'ai',
          text: res.reply || 'Here is what I found for you.',
          time: this.formatTime()
        });
        this.scrollBottom();
      },
      error: () => {
        this.isLoading = false;
        this.messages.push({
          sender: 'ai',
          text: 'I am having trouble reaching the network right now. Please explore our [Events Catalog](/events) or reach out via [Contact Us](/contact).',
          time: this.formatTime()
        });
        this.scrollBottom();
      }
    });
  }

  handleMessageClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (target.tagName === 'A') {
      const href = target.getAttribute('href');
      if (href && href.startsWith('/')) {
        event.preventDefault();
        this.router.navigateByUrl(href);
        if (window.innerWidth < 768) {
          this.isOpen = false;
        }
      }
    }
  }

  renderMarkdown(text: string): string {
    if (!text) return '';
    let parsed = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Headings
    parsed = parsed.replace(/^### (.*$)/gim, '<h4 class="ai-md-h4">$1</h4>');
    parsed = parsed.replace(/^## (.*$)/gim, '<h3 class="ai-md-h3">$1</h3>');

    // Bold & italic
    parsed = parsed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    parsed = parsed.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Markdown links [label](url)
    parsed = parsed.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="ai-link">$1</a>');

    // Lists (- or *)
    parsed = parsed.replace(/^\s*[\-\*]\s+(.*$)/gim, '<li class="ai-li">$1</li>');

    // Line breaks
    parsed = parsed.replace(/\n/g, '<br>');

    return parsed;
  }

  private formatTime(): string {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  private scrollBottom() {
    setTimeout(() => {
      const container = document.getElementById('ai-chat-body');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, 100);
  }
}
