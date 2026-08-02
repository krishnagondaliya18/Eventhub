import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { NavbarComponent } from '../../shared/navbar/navbar.component';

@Component({
  selector: 'app-feedback',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NavbarComponent],
  templateUrl: './feedback.component.html',
  styleUrls: ['./feedback.component.css']
})
export class FeedbackComponent implements OnInit {
  feedbacks:  any[]  = [];
  loading     = true;
  submitting  = false;
  message     = '';
  msgType:    'success' | 'error' = 'success';
  showForm    = false;
  editingId:  string | null = null;

  form   = { subject: '', message: '', rating: 5 };
  rating = 5;

  constructor(private http: HttpClient) {}
  ngOnInit(): void { this.load(); }

  load(): void {
    this.http.get<any>('/api/feedback/my').subscribe({
      next: (res) => { this.feedbacks = res.feedbacks || []; this.loading = false; },
      error: ()   => { this.loading = false; }
    });
  }

  toggleForm(): void {
    if (this.showForm) {
      this.cancelForm();
    } else {
      this.showForm  = true;
      this.editingId = null;
      this.form      = { subject: '', message: '', rating: 5 };
      this.rating    = 5;
    }
  }

  setRating(r: number): void { this.rating = r; this.form.rating = r; }

  submit(): void {
    if (!this.form.subject || !this.form.message) {
      this.show('Subject and message are required!', 'error');
      return;
    }
    this.submitting = true;
    const obs = this.editingId
      ? this.http.put<any>(`/api/feedback/${this.editingId}`, this.form)
      : this.http.post<any>('/api/feedback', { ...this.form, rating: this.rating });

    obs.subscribe({
      next: () => {
        this.submitting = false;
        this.cancelForm();
        this.show(this.editingId ? 'Feedback updated!' : 'Feedback submitted!', 'success');
        this.load();
      },
      error: (err: any) => {
        this.submitting = false;
        this.show(err?.error?.message || 'Error occurred', 'error');
      }
    });
  }

  edit(f: any): void {
    this.editingId = f._id;
    this.form      = { subject: f.subject, message: f.message, rating: f.rating };
    this.rating    = f.rating;
    this.showForm  = true;
  }

  delete(id: string): void {
    if (!confirm('Delete this feedback?')) return;
    this.http.delete<any>(`/api/feedback/${id}`).subscribe({
      next: () => {
        this.feedbacks = this.feedbacks.filter(f => f._id !== id);
        this.show('Feedback deleted!', 'success');
      },
      error: (err: any) => this.show(err?.error?.message || 'Error', 'error')
    });
  }

  cancelForm(): void {
    this.showForm  = false;
    this.editingId = null;
    this.form      = { subject: '', message: '', rating: 5 };
    this.rating    = 5;
  }

  show(msg: string, type: 'success' | 'error'): void {
    this.message = msg; this.msgType = type;
    setTimeout(() => this.message = '', 4000);
  }

  getStars(n: number): number[]      { return Array(n).fill(0); }
  getEmptyStars(n: number): number[] { return Array(5 - n).fill(0); }
}