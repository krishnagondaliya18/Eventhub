import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { EventService } from '../../services/event.service';
import { Event } from '../../models/models';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  eventService = inject(EventService);
  newEvents: Event[] = [];
  upcomingEvents: Event[] = [];
  highlightEvent: Event | null = null;
  moreEvents: Event[] = [];
  loading = true;

  categories = [
    { icon: '🎵', name: 'Music' }, { icon: '⚽', name: 'Sports' },
    { icon: '🎨', name: 'Art' }, { icon: '💼', name: 'Business' },
    { icon: '📸', name: 'Photography' }, { icon: '💡', name: 'Technology' }
  ];

  ngOnInit() {
    this.eventService.getEvents({ status: 'active', limit: 10 }).subscribe({
      next: (res: any) => {
        const events: Event[] = res.events || [];
        this.newEvents = events.slice(0, 3);
        this.upcomingEvents = events.slice(3, 5);
        this.highlightEvent = events[5] || null;
        this.moreEvents = events.slice(6, 9);
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  getPrice(event: Event): string {
    return event.isFree ? 'Free' : `₹${event.price}`;
  }
}
