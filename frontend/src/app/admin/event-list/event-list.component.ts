import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { EventService } from '../../services/event.service';
import { Event } from '../../models/models';

@Component({
  selector: 'app-event-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './event-list.component.html',
  styleUrls: ['./event-list.component.css']
})
export class EventListComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  eventService = inject(EventService);

  events: Event[] = [];
  loading       = true;
  showModal     = false;
  editMode      = false;
  saving        = false;
  editingId     = '';
  message       = '';
  messageType:  'success' | 'error' = 'success';
  refreshInterval: any;
  currentStatusFilter = 'all';

  categories = ['Music','Sports','Art','Business','Technology','Food','Films','Parties','Science','Other'];

  form: any = {
    title:'', description:'', category:'Music', date:'', location:'',
    price:0, isFree:false, totalTickets:100, availableTickets:100,
    image:'', isOnline:false, status:'active'
  };

  ngOnInit() {
    this.loadEvents();
    // Auto-refresh every 15 seconds
    this.refreshInterval = setInterval(() => this.loadEvents(), 15000);
  }

  ngOnDestroy() {
    if (this.refreshInterval) clearInterval(this.refreshInterval);
  }

  loadEvents() {
    const query: any = { limit: 100 };
    query.status = this.currentStatusFilter === 'all' ? 'all' : this.currentStatusFilter;

    this.eventService.getEvents(query).subscribe({
      next: (res: any) => {
        this.events = res.events || [];
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  setFilter(status: string) {
    this.currentStatusFilter = status;
    this.loading = true;
    this.loadEvents();
  }

  getPendingCount(): number {
    return this.events.filter(e => e.status === 'pending').length;
  }

  approveEvent(id: string) {
    this.http.put<any>(`/api/events/${id}/status`, { status: 'active' }).subscribe({
      next: () => {
        this.message = 'Event approved and published live!';
        this.messageType = 'success';
        this.loadEvents();
        setTimeout(() => this.message = '', 4000);
      },
      error: (err) => {
        this.message = err?.error?.message || 'Failed to approve event.';
        this.messageType = 'error';
      }
    });
  }

  rejectEvent(id: string) {
    if (!confirm('Are you sure you want to reject this event?')) return;
    this.http.put<any>(`/api/events/${id}/status`, { status: 'rejected' }).subscribe({
      next: () => {
        this.message = 'Event has been rejected.';
        this.messageType = 'success';
        this.loadEvents();
        setTimeout(() => this.message = '', 4000);
      },
      error: (err) => {
        this.message = err?.error?.message || 'Failed to reject event.';
        this.messageType = 'error';
      }
    });
  }

  openAdd() {
    this.form = {
      title:'', description:'', category:'Music', date:'', location:'',
      price:0, isFree:false, totalTickets:100, availableTickets:100,
      image:'', isOnline:false, status:'active'
    };
    this.editMode = false; this.showModal = true; this.message = '';
  }

  openEdit(ev: Event) {
    this.form = { ...ev, date: ev.date ? new Date(ev.date).toISOString().slice(0,16) : '' };
    this.editingId = ev._id; this.editMode = true; this.showModal = true; this.message = '';
  }

  save() {
    this.saving = true;
    const obs = this.editMode
      ? this.eventService.updateEvent(this.editingId, this.form)
      : this.eventService.createEvent(this.form);
    obs.subscribe({
      next: () => {
        this.saving = false;
        this.showModal = false;
        this.message = this.editMode ? 'Event updated successfully.' : 'Event created successfully.';
        this.messageType = 'success';
        this.loadEvents();
        setTimeout(() => this.message = '', 4000);
      },
      error: (err) => {
        this.message = err.error?.message || 'Error saving event.';
        this.messageType = 'error';
        this.saving = false;
      }
    });
  }

  delete(id: string) {
    if (!confirm('Are you sure you want to delete this event?')) return;
    this.eventService.deleteEvent(id).subscribe({ next: () => this.loadEvents() });
  }
}