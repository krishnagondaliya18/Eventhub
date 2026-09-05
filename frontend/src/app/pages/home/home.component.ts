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
    // Fetch all active events sorted by date
    this.eventService.getEvents({ status: 'active', limit: 40 }).subscribe({
      next: (res: any) => {
        const allEvents: Event[] = (res.events || []).sort(
          (a: Event, b: Event) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        const now = Date.now();
        const oneDayMs = 24 * 60 * 60 * 1000;
        const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

        // 1. Upcoming in 24 Hours: strictly events starting within the next 24 hours
        const next24h = allEvents.filter(e => {
          const diff = new Date(e.date).getTime() - now;
          return diff > 0 && diff <= oneDayMs;
        });

        if (next24h.length >= 2) {
          this.upcomingEvents = next24h.slice(0, 2);
        } else {
          // Fallback to earliest upcoming events if fewer than 2 exist
          this.upcomingEvents = allEvents.filter(e => new Date(e.date).getTime() > now).slice(0, 2);
        }

        const upcomingIds = new Set(this.upcomingEvents.map(e => e._id));

        // 2. Highlights This Week: events happening within 7 days
        const thisWeek = allEvents.filter(e => {
          const diff = new Date(e.date).getTime() - now;
          return diff > 0 && diff <= sevenDaysMs && !upcomingIds.has(e._id);
        });

        if (thisWeek.length > 0) {
          this.highlightEvent = thisWeek[0];
        } else {
          this.highlightEvent = allEvents.find(e => !upcomingIds.has(e._id) && new Date(e.date).getTime() > now) || allEvents[0] || null;
        }

        // 3. Featured / New Events (excluding already featured items)
        const usedIds = new Set([...upcomingIds, this.highlightEvent?._id].filter(Boolean));
        const remaining = allEvents.filter(e => !usedIds.has(e._id));

        this.newEvents = remaining.slice(0, 3);
        this.moreEvents = remaining.slice(3, 9);
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  getTimeBadge(dateStr: string | Date): { text: string; isUrgent: boolean } {
    const now = Date.now();
    const eventTime = new Date(dateStr).getTime();
    const diffMs = eventTime - now;

    if (diffMs <= 0) {
      return { text: '⚡ Live / Happening Now', isUrgent: true };
    }

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      return { text: `⚡ Starts in ${diffMinutes}m!`, isUrgent: true };
    } else if (diffHours < 24) {
      return { text: `🔥 Starts in ${diffHours}h ${diffMinutes}m`, isUrgent: true };
    } else if (diffDays === 1) {
      return { text: `⏰ Tomorrow (${diffHours}h left)`, isUrgent: true };
    } else if (diffDays <= 7) {
      return { text: `📅 In ${diffDays} days (This Week)`, isUrgent: false };
    } else {
      return { text: `📅 In ${diffDays} days`, isUrgent: false };
    }
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
