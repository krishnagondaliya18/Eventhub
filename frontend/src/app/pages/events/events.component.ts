import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { EventService } from '../../services/event.service';
import { Event } from '../../models/models';

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, NavbarComponent],
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.css']
})
export class EventsComponent implements OnInit {
  eventService = inject(EventService);
  route = inject(ActivatedRoute);

  events: Event[] = [];
  loading = true;
  total = 0;
  page = 1;
  limit = 9;

  filters = { category: '', status: 'active', search: '', isFree: '', isOnline: '' };

  categories = ['Music', 'Sports', 'Art', 'Business', 'Technology', 'Food', 'Films', 'Parties', 'Science', 'Other'];

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['category']) this.filters.category = params['category'];
      this.loadEvents();
    });
  }

  loadEvents() {
    this.loading = true;
    this.eventService.getEvents({ ...this.filters, page: this.page, limit: this.limit }).subscribe({
      next: (res: any) => {
        this.events = res.events || [];
        this.total = res.total || 0;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  applyFilters() { this.page = 1; this.loadEvents(); }
  clearFilters() { this.filters = { category: '', status: 'active', search: '', isFree: '', isOnline: '' }; this.page = 1; this.loadEvents(); }
  nextPage() { if (this.page * this.limit < this.total) { this.page++; this.loadEvents(); } }
  prevPage() { if (this.page > 1) { this.page--; this.loadEvents(); } }

  getPrice(event: Event): string {
    return event.isFree ? 'Free' : `₹${event.price}`;
  }

  get totalPages() { return Math.ceil(this.total / this.limit); }
}
