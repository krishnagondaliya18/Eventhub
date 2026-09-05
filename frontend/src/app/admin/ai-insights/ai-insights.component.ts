import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-ai-insights',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-insights.component.html',
  styleUrls: ['./ai-insights.component.css']
})
export class AiInsightsComponent implements OnInit {
  private http = inject(HttpClient);

  loading = true;
  customPromptLoading = false;
  customQuestion = '';
  lastGeneratedTime: Date | null = null;

  stats: any = {
    totalRevenue: 0,
    totalTicketsSold: 0,
    totalBookings: 0,
    totalEvents: 0,
    popularEvents: [],
    categoryBreakdown: []
  };

  aiReportMarkdown = '';

  suggestedQuestions = [
    'Analyze category demand & recommend where to add new events',
    'What is the optimal pricing strategy for our music and sports events?',
    'How can organizers improve ticket sales velocity before weekends?',
    'Provide a 30-day revenue forecast and growth recommendations'
  ];

  ngOnInit() {
    this.generateInsights();
  }

  generateInsights(promptOverride?: string) {
    if (promptOverride) {
      this.customQuestion = promptOverride;
      this.customPromptLoading = true;
    } else {
      this.loading = true;
    }

    this.http.post<any>('/api/ai/admin-insights', {
      customPrompt: promptOverride || this.customQuestion || ''
    }).subscribe({
      next: (res) => {
        this.loading = false;
        this.customPromptLoading = false;
        if (res.stats) {
          this.stats = res.stats;
        }
        this.aiReportMarkdown = res.insights || 'No insights generated.';
        this.lastGeneratedTime = new Date();
      },
      error: () => {
        this.loading = false;
        this.customPromptLoading = false;
        this.aiReportMarkdown = '### ⚠️ Unable to fetch live AI insights\nPlease ensure backend server is running and try again.';
      }
    });
  }

  renderMarkdown(text: string): string {
    if (!text) return '';
    let parsed = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Headings
    parsed = parsed.replace(/^### (.*$)/gim, '<h3 class="insight-h3">$1</h3>');
    parsed = parsed.replace(/^## (.*$)/gim, '<h2 class="insight-h2">$1</h2>');

    // Bold & italic
    parsed = parsed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    parsed = parsed.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Numbered lists (1. , 2. )
    parsed = parsed.replace(/^(\d+)\.\s+(.*$)/gim, '<div class="insight-num-item"><span class="num-bullet">$1</span><div>$2</div></div>');

    // Bullet lists (- or *)
    parsed = parsed.replace(/^\s*[\-\*]\s+(.*$)/gim, '<li class="insight-li">$1</li>');

    // Line breaks
    parsed = parsed.replace(/\n/g, '<br>');

    return parsed;
  }
}
