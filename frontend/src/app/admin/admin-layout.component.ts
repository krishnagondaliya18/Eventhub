import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.css']
})
export class AdminLayoutComponent {
  auth = inject(AuthService);
  sidebarCollapsed = false;

  navItems = [
    { path: '/admin/dashboard', icon: 'dashboard', label: 'Dashboard' },
    { path: '/admin/users', icon: 'people', label: 'Users' },
    { path: '/admin/event-list', icon: 'event', label: 'Event List' },
    { path: '/admin/participants', icon: 'group', label: 'Participants' },
    { path: '/admin/feedback', icon: 'star', label: 'Feedback' },
    { path: '/admin/queries', icon: 'help', label: 'Queries' }
  ];
}
