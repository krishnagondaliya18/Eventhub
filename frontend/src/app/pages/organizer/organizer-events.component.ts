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
    if (!this.form.title?.trim() || !this.form.description?.trim() || !this.form.date || !this.form.location?.trim()) {
      this.showMessage('Please provide Event Title, Category, Date & Time, Venue Location, and Description.', 'error');
      return;
    }

    this.saving = true;
    const payload = {
      title: this.form.title.trim(),
      description: this.form.description.trim(),
      category: this.form.category || 'Music',
      date: this.form.date,
      location: this.form.location.trim(),
      address: this.form.address?.trim() || '',
      price: this.form.isFree ? 0 : (Number(this.form.price) || 0),
      isFree: this.form.isFree === true,
      isOnline: this.form.isOnline === true,
      totalTickets: Number(this.form.totalTickets) || 100,
      availableTickets: Number(this.form.totalTickets) || 100,
      image: this.form.image?.trim() || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800'
    };

    this.http.post<any>('/api/events', payload).subscribe({
      next: (res) => {
        this.saving = false;
        this.showModal = false;
        
        // Update local user role if upgraded
        if (res.userRole) {
          const current = this.auth.getUser();
          if (current) {
            current.role = res.userRole;
            localStorage.setItem('user', JSON.stringify(current));
            this.auth.currentUser.set(current);
          }
        }

        this.showMessage('Event submitted successfully! It is now in "Pending Approval" status and has been sent to the Admin team for review.', 'success');
        this.loadMyEvents();
      },
      error: (err) => {
        this.saving = false;
        this.showMessage(err?.error?.message || 'Failed to submit event. Please check required fields.', 'error');
      }
    });
  }

  showMessage(msg: string, type: 'success' | 'error'): void {
    this.message = msg;
    this.messageType = type;
    setTimeout(() => this.message = '', 8000);
  }

  getPendingCount(): number {
    return this.events.filter(e => e.status === 'pending').length;
  }

  getActiveCount(): number {
    return this.events.filter(e => e.status === 'active').length;
  }

  getCancelledCount(): number {
    return this.events.filter(e => e.status === 'cancelled' || e.status === 'withdrawn').length;
  }

  getTotalRevenue(): number {
    return this.events.reduce((acc, e) => acc + (e.revenue || 0), 0);
  }

  withdrawEvent(ev: Event): void {
    if (!confirm(`Are you sure you want to withdraw the submission for "${ev.title}"? It will be removed from Admin review.`)) return;
    this.http.put<any>(`/api/events/${ev._id}/status`, { status: 'withdrawn' }).subscribe({
      next: () => {
        this.showMessage(`Submission for "${ev.title}" has been withdrawn.`, 'success');
        this.loadMyEvents();
      },
      error: (err) => {
        this.showMessage(err?.error?.message || 'Failed to withdraw event.', 'error');
      }
    });
  }

  cancelEvent(ev: Event): void {
    if (!confirm(`Are you sure you want to cancel "${ev.title}"? Ticket bookings will stop and attendees will see it as Cancelled.`)) return;
    this.http.put<any>(`/api/events/${ev._id}/status`, { status: 'cancelled' }).subscribe({
      next: () => {
        this.showMessage(`Event "${ev.title}" has been marked as Cancelled.`, 'success');
        this.loadMyEvents();
      },
      error: (err) => {
        this.showMessage(err?.error?.message || 'Failed to cancel event.', 'error');
      }
    });
  }

  deleteEvent(ev: Event): void {
    if (!confirm(`Are you sure you want to permanently delete "${ev.title}"? This action cannot be undone.`)) return;
    this.http.delete<any>(`/api/events/${ev._id}`).subscribe({
      next: () => {
        this.showMessage(`Event "${ev.title}" deleted successfully.`, 'success');
        this.loadMyEvents();
      },
      error: (err) => {
        this.showMessage(err?.error?.message || 'Failed to delete event.', 'error');
      }
    });
  }
}

