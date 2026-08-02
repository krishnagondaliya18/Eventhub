import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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

  categories = ['Music','Sports','Art','Business','Technology','Food','Films','Parties','Science','Other'];

  form: any = {
    title:'', description:'', category:'Music', date:'', location:'',
    price:0, isFree:false, totalTickets:100, availableTickets:100,
    image:'', isOnline:false, status:'active'
  };

  ngOnInit() {
    this.loadEvents();
    // Auto-refresh every 10 seconds — picks up completed status instantly
    this.refreshInterval = setInterval(() => this.loadEvents(), 10000);
  }

  ngOnDestroy() {
    if (this.refreshInterval) clearInterval(this.refreshInterval);
  }

  loadEvents() {
    this.eventService.getEvents({ limit: 50 }).subscribe({
      next: (res: any) => { this.events = res.events || []; this.loading = false; },
      error: () => { this.loading = false; }
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
      next: () => { this.saving = false; this.showModal = false; this.loadEvents(); },
      error: (err) => { this.message = err.error?.message || 'Error saving.'; this.messageType = 'error'; this.saving = false; }
    });
  }

  delete(id: string) {
    if (!confirm('Delete this event?')) return;
    this.eventService.deleteEvent(id).subscribe({ next: () => this.loadEvents() });
  }
}