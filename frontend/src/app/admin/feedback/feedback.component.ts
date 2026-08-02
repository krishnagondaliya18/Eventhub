import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../services/admin.service';
import { Feedback } from '../../models/models';

@Component({
  selector: 'app-feedback',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './feedback.component.html',
  styleUrls: ['./feedback.component.css']
})
export class FeedbackComponent implements OnInit {
  adminService = inject(AdminService);
  items: Feedback[] = [];
  loading = true;

  ngOnInit() {
    this.adminService.getFeedback('feedback').subscribe({
      next: (res: any) => { this.items = res.items || []; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  getStars(rating: number): string[] {
    return Array(5).fill('').map((_, i) => i < rating ? 'filled' : 'empty');
  }

  markResolved(id: string) {
    this.adminService.updateFeedback(id, { status: 'resolved' }).subscribe({
      next: () => { const item = this.items.find(i => i._id === id); if (item) item.status = 'resolved'; }
    });
  }
}
