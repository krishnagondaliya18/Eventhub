import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { FooterComponent } from '../../shared/footer/footer.component';
import { EventService } from '../../services/event.service';
import { Event } from '../../models/models';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, NavbarComponent, FooterComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  private router = inject(Router);
  eventService = inject(EventService);

  newEvents: Event[] = [];
  upcomingEvents: Event[] = [];
  highlightEvent: Event | null = null;
  moreEvents: Event[] = [];
  loading = true;

  // Search & Filter state
  searchQuery = '';
  selectedLocation = '';
  selectedCategory = '';
  selectedBudget = '';

  // Google-like recommendations dropdown state
  suggestions: Event[] = [];
  showDropdown = false;
  loadingSuggestions = false;
  private searchTimeout: any;

  trendingSearches: string[] = [
    'IPL Fan Park',
    'Sunburn EDM',
    'AI Summit',
    'Surat Garba',
    'Comedy Night',
    'Food Truck Fiesta'
  ];

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

  filterCategories = [
    'Music', 'Sports', 'Technology', 'Food', 'Films', 'Art', 'Business', 'Parties', 'Science'
  ];

  budgetOptions = [
    { label: 'Any Budget', value: '' },
    { label: 'Free (₹0)', value: 'free' },
    { label: 'Under ₹500', value: 'under500' },
    { label: '₹500 - ₹1,000', value: '500-1000' },
    { label: '₹1,000 - ₹2,000', value: '1000-2000' },
    { label: 'Above ₹2,000', value: 'above2000' }
  ];

  categories = [
    { icon: '🎵', name: 'Music' },
    { icon: '⚽', name: 'Sports' },
    { icon: '💡', name: 'Technology' },
    { icon: '🍔', name: 'Food' },
    { icon: '🎬', name: 'Films' },
    { icon: '🎨', name: 'Art' },
    { icon: '💼', name: 'Business' },
    { icon: '🎉', name: 'Parties' }
  ];

  ngOnInit() {
    this.eventService.getEvents({ status: 'active', limit: 12 }).subscribe({
      next: (res: any) => {
        const events: Event[] = res.events || [];
        this.newEvents = events.slice(0, 3);
        this.upcomingEvents = events.slice(3, 5);
        this.highlightEvent = events[5] || null;
        this.moreEvents = events.slice(6, 12);
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  onSearchInput(): void {
    if (this.searchTimeout) clearTimeout(this.searchTimeout);

    const q = this.searchQuery.trim();
    if (!q) {
      this.suggestions = [];
      this.showDropdown = true;
      return;
    }

    this.loadingSuggestions = true;
    this.showDropdown = true;
    this.searchTimeout = setTimeout(() => {
      this.eventService.getSuggestions(q).subscribe({
        next: (res: any) => {
          this.suggestions = res.suggestions || [];
          this.loadingSuggestions = false;
        },
        error: () => {
          this.loadingSuggestions = false;
        }
      });
    }, 200);
  }

  onSearchFocus(): void {
    this.showDropdown = true;
    if (this.searchQuery.trim() && this.suggestions.length === 0) {
      this.onSearchInput();
    }
  }

  closeDropdownWithDelay(): void {
    setTimeout(() => {
      this.showDropdown = false;
    }, 250);
  }

  selectTrending(term: string): void {
    this.searchQuery = term;
    this.executeSearch();
  }

  selectEvent(event: Event): void {
    this.showDropdown = false;
    this.router.navigate(['/events', event._id]);
  }

  executeSearch(): void {
    this.showDropdown = false;
    const queryParams: any = {};
    if (this.searchQuery.trim()) queryParams.search = this.searchQuery.trim();
    if (this.selectedLocation) queryParams.location = this.selectedLocation;
    if (this.selectedCategory) queryParams.category = this.selectedCategory;
    if (this.selectedBudget) queryParams.budget = this.selectedBudget;

    this.router.navigate(['/events'], { queryParams });
  }

  getPrice(event: Event): string {
    return event.isFree ? 'Free' : `₹${event.price}`;
  }
}
