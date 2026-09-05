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
  selectedQuery: Feedback | null = null;

  ngOnInit() {
    this.loadQueries();
  }

  loadQueries() {
    this.loading = true;
    this.adminService.getFeedback('query').subscribe({
      next: (res: any) => {
        this.queries = res.items || [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  markResolved(id: string) {
    this.adminService.updateFeedback(id, { status: 'resolved' }).subscribe({
      next: () => {
        const q = this.queries.find(item => item._id === id);
        if (q) q.status = 'resolved';
        if (this.selectedQuery && this.selectedQuery._id === id) {
          this.selectedQuery.status = 'resolved';
        }
      }
    });
  }

  viewDetails(query: Feedback) {
    this.selectedQuery = query;
  }

  closeDetails() {
    this.selectedQuery = null;
  }

  get pending() {
    return this.queries.filter(q => q.status === 'pending').length;
  }
}