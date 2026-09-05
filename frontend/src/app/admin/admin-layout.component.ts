import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.css']
})
export class AdminLayoutComponent implements OnInit {
  auth = inject(AuthService);
  private http = inject(HttpClient);
  sidebarCollapsed = false;
  pendingEventsCount = 0;
  pendingQueriesCount = 0;

  navItems = [
    { path: '/admin/dashboard', icon: 'dashboard', label: 'Dashboard', badgeKey: '' },
    { path: '/admin/users', icon: 'people', label: 'Users & Hosts', badgeKey: '' },
    { path: '/admin/event-list', icon: 'event', label: 'Events', badgeKey: 'events' },
    { path: '/admin/participants', icon: 'group', label: 'Participants', badgeKey: '' },
    { path: '/admin/feedback', icon: 'star', label: 'Feedback', badgeKey: '' },
    { path: '/admin/queries', icon: 'help', label: 'Queries', badgeKey: 'queries' },
    { path: '/admin/ai-insights', icon: 'auto_awesome', label: 'AI Insights', badgeKey: '' }
  ];

  ngOnInit() {
    this.checkPendingEvents();
    this.checkPendingQueries();
  }

  checkPendingEvents() {
    this.http.get<any>('/api/events?status=pending').subscribe({
      next: (res) => {
        this.pendingEventsCount = res.total || (res.events ? res.events.length : 0);
      },
      error: () => {}
    });
  }

  checkPendingQueries() {
    this.http.get<any>('/api/admin/feedback?type=query').subscribe({
      next: (res) => {
        const items = res.items || [];
        this.pendingQueriesCount = items.filter((q: any) => q.status === 'pending').length;
      },
      error: () => {}
    });
  }
}
