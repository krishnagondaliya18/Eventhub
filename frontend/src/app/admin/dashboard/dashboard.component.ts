import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../services/admin.service';
import { Stats } from '../../models/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  adminService = inject(AdminService);
  stats: Stats | null = null;
  eventsByCategory: any[] = [];
  loading = true;

  statCards = [
    { key: 'totalUsers', label: 'Total Users', icon: 'people', color: '#4361ee', bg: '#eef0fd' },
    { key: 'totalParticipants', label: 'Total Participants', icon: 'group', color: '#f77f00', bg: '#fff3e0' },
    { key: 'totalEvents', label: 'Total Events', icon: 'event', color: '#f4a261', bg: '#fff8f0' },
    { key: 'totalAdmins', label: 'Total Admins', icon: 'admin_panel_settings', color: '#e63946', bg: '#fdeaeb' }
  ];

  ngOnInit() {
    this.adminService.getStats().subscribe({
      next: (res: any) => {
        this.stats = res.stats;
        this.eventsByCategory = res.eventsByCategory || [];
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  getStatValue(key: string): number {
    if (!this.stats) return 0;
    return (this.stats as any)[key] || 0;
  }
}
