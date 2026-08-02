import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../services/admin.service';
import { Feedback } from '../../models/models';

@Component({
  selector: 'app-queries',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './queries.component.html',
  styleUrls: ['./queries.component.css']
})
export class QueriesComponent implements OnInit {
  adminService = inject(AdminService);
  queries: Feedback[] = [];
  loading = true;

  ngOnInit() {
    this.adminService.getFeedback('query').subscribe({
      next: (res: any) => { this.queries = res.items || []; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  markResolved(id: string) {
    this.adminService.updateFeedback(id, { status: 'resolved' }).subscribe({
      next: () => { const q = this.queries.find(q => q._id === id); if (q) q.status = 'resolved'; }
    });
  }

  get pending() { return this.queries.filter(q => q.status === 'pending').length; }
}