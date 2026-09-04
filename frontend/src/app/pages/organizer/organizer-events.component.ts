import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { FooterComponent } from '../../shared/footer/footer.component';
import { AuthService } from '../../services/auth.service';
import { Event } from '../../models/models';

@Component({
  selector: 'app-organizer-events',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NavbarComponent, FooterComponent],
  templateUrl: './organizer-events.component.html',
  styleUrls: ['./organizer-events.component.css']
})
export class OrganizerEventsComponent implements OnInit {
  private http = inject(HttpClient);
  auth = inject(AuthService);

  events: Event[] = [];
  loading = true;
  showModal = false;
  saving = false;
  message = '';
  messageType: 'success' | 'error' = 'success';

  categories = ['Music', 'Sports', 'Technology', 'Art', 'Business', 'Food', 'Films', 'Parties', 'Science', 'Other'];

  form: any = {
    title: '',
    category: 'Music',
    description: '',
    date: '',
    location: '',
    address: '',
    price: 0,
    totalTickets: 100,
    image: '',
    isFree: false,
    isOnline: false
  };

  ngOnInit(): void {
    this.loadMyEvents();
  }

  loadMyEvents(): void {
    this.loading = true;
    this.http.get<any>('/api/events/my/created').subscribe({
      next: (res) => {
        this.events = res.events || [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  openCreateModal(): void {
    this.form = {
      title: '',
      category: 'Music',
      description: '',
      date: '',
      location: '',
      address: '',
      price: 0,
      totalTickets: 100,
      image: '',
      isFree: false,
      isOnline: false
    };
    this.showModal = true;
    this.message = '';
  }

  submitEvent(): void {
    if (!this.form.title || !this.form.description || !this.form.date || !this.form.location) {
      this.showMessage('Please fill all required fields.', 'error');
      return;
    }

    this.saving = true;
    const payload = {
      ...this.form,
      price: this.form.isFree ? 0 : Number(this.form.price) || 0,
      totalTickets: Number(this.form.totalTickets) || 100,
      availableTickets: Number(this.form.totalTickets) || 100,
      image: this.form.image || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800'
    };

    this.http.post<any>('/api/events', payload).subscribe({
      next: (res) => {
        this.saving = false;
        this.showModal = false;
        this.showMessage('Event submitted successfully! It is now pending Admin review.', 'success');
        this.loadMyEvents();
      },
      error: (err) => {
        this.saving = false;
        this.showMessage(err?.error?.message || 'Failed to submit event.', 'error');
      }
    });
  }

  showMessage(msg: string, type: 'success' | 'error'): void {
    this.message = msg;
    this.messageType = type;
    setTimeout(() => this.message = '', 6000);
  }

  getPendingCount(): number {
    return this.events.filter(e => e.status === 'pending').length;
  }

  getActiveCount(): number {
    return this.events.filter(e => e.status === 'active').length;
  }

  getTotalRevenue(): number {
    return this.events.reduce((acc, e) => acc + (e.revenue || 0), 0);
  }
}
