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
      text: 'Hello! 👋 Welcome to **EventHub Help & Support**.\n\nI can answer all your questions about:\n- 🎟️ **Event Booking & Pricing:** Booking steps, locked fixed price, tickets limits (1–10)\n- 💳 **Payments & UPI:** GPay, PhonePe, Paytm, BHIM to gondaliyakishan839@okaxis, auto-scan pull QR, Razorpay\n- 📄 **Official PDF Tickets:** Instant digital admission pass with gate entry QR code\n- ⏰ **24-Hour Event Reminders:** Automated reminder emails 1 day before the event\n- 💸 **Refund & Cancellation Policy:** 100% refund (>48h), 50% refund (24-48h), organizer cancellation rules\n- 🎪 **Hosting Events as an Organizer:** Creating events, approval process, participant rosters\n- 📜 **Platform Rules, Terms & Privacy:** Gate security rules, terms of service, customer support\n\nHow can I help you today?',
      time: this.formatTime()
    }
  ];

  quickPrompts = [
    { label: '🎟️ How to Book Tickets?', prompt: 'How do I book tickets and get my PDF pass?' },
    { label: '💳 Payment & UPI Options', prompt: 'What payment methods, UPI apps, and auto-scan QR options are available?' },
    { label: '💸 Refund & Cancellation', prompt: 'What is the full refund and cancellation policy?' },
    { label: '⏰ 24h Event Reminder System', prompt: 'How does the 24-hour event reminder system work?' },
    { label: '🎪 How to Host an Event?', prompt: 'What are the rules and process to host an event as an organizer?' },
    { label: '📜 Platform Rules & Terms', prompt: 'What are the platform rules, gate entry rules, and terms of service?' },
    { label: '📞 Contact Support Team', prompt: 'How do I contact customer support directly?' }
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
        text: 'Chat history cleared. Welcome to EventHub Help & Support! What can I help you with?',
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
