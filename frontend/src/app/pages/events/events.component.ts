import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { FooterComponent } from '../../shared/footer/footer.component';
import { EventService } from '../../services/event.service';
import { Event } from '../../models/models';

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, NavbarComponent, FooterComponent],
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

  filters = {
    category: '',
    status: 'active',
    search: '',
    location: '',
    budget: '',
    isFree: '',
    isOnline: ''
  };

  categories = ['Music', 'Sports', 'Art', 'Business', 'Technology', 'Food', 'Films', 'Parties', 'Science', 'Other'];

  locations = [
    { label: 'All Cities', value: '' },
    { label: 'Surat', value: 'Surat' },
    { label: 'Mumbai', value: 'Mumbai' },
    { label: 'Ahmedabad', value: 'Ahmedabad' },
    { label: 'Bengaluru', value: 'Bengaluru' },
    { label: 'New Delhi', value: 'New Delhi' },
    { label: 'Goa', value: 'Goa' },
    { label: 'Online Events', value: 'Online' }
  ];

  budgetOptions = [
    { label: 'All Budgets', value: '' },
    { label: 'Free Entry (₹0)', value: 'free' },
    { label: 'Under ₹500', value: 'under500' },
    { label: '₹500 - ₹1,000', value: '500-1000' },
    { label: '₹1,000 - ₹2,000', value: '1000-2000' },
    { label: 'Above ₹2,000', value: 'above2000' }
  ];

  private searchDebounce: any;

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['category']) this.filters.category = params['category'];
      if (params['search']) this.filters.search = params['search'];
      if (params['location']) this.filters.location = params['location'];
      if (params['budget']) this.filters.budget = params['budget'];
      if (params['isFree']) this.filters.isFree = params['isFree'];
      if (params['isOnline']) this.filters.isOnline = params['isOnline'];
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

  onSearchInput(): void {
    if (this.searchDebounce) clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => {
      this.applyFilters();
    }, 250);
  }

  applyFilters() { this.page = 1; this.loadEvents(); }
  clearFilters() {
    this.filters = { category: '', status: 'active', search: '', location: '', budget: '', isFree: '', isOnline: '' };
    this.page = 1;
    this.loadEvents();
  }
  nextPage() { if (this.page * this.limit < this.total) { this.page++; this.loadEvents(); } }
  prevPage() { if (this.page > 1) { this.page--; this.loadEvents(); } }

  getPrice(event: Event): string {
    return event.isFree ? 'Free' : `₹${event.price}`;
  }

  get totalPages() { return Math.ceil(this.total / this.limit); }
}
