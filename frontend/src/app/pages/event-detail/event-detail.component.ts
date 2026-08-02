import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { EventService } from '../../services/event.service';

@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './event-detail.component.html',
  styleUrls: ['./event-detail.component.css']
})
export class EventDetailComponent implements OnInit {
  event: any    = null;
  alreadyBooked = false;
  showModal     = false;
  upiId         = '';
  quantity      = 1;
  processing    = false;

  // Comments
  comments:    any[]  = [];
  commentText  = '';
  editingId:   string | null = null;
  editingText  = '';
  userId       = '';

  constructor(
    private route:        ActivatedRoute,
    private router:       Router,
    private eventService: EventService,
    private sanitizer:    DomSanitizer,
    private http:         HttpClient
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.eventService.getEvent(id).subscribe({
        next: (data: any) => {
          this.event = data.event || data;
          this.loadComments(id);
        },
        error: () => this.router.navigate(['/events'])
      });
    }
    const u = localStorage.getItem('user');
    if (u) { try { this.userId = JSON.parse(u)._id || ''; } catch {} }
  }

  get soldPercent(): number {
    if (!this.event) return 0;
    const total = this.event.totalTickets || 100;
    const avail = this.event.availableTickets ?? 0;
    return Math.min(100, Math.round(((total - avail) / total) * 100));
  }

  get totalPrice(): number { return (this.event?.price || 0) * this.quantity; }

  mapUrl(location: string): SafeResourceUrl {
    const url = `https://maps.google.com/maps?q=${encodeURIComponent(location || '')}&output=embed`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  openModal(): void { this.showModal = true; this.upiId = ''; this.quantity = 1; this.processing = false; }

  closeOutside(e: MouseEvent): void {
    if ((e.target as HTMLElement).classList.contains('modal-overlay')) this.showModal = false;
  }

  decQty(): void { if (this.quantity > 1) this.quantity--; }
  incQty(): void {
    const max = Math.min(this.event?.availableTickets || 10, 10);
    if (this.quantity < max) this.quantity++;
  }

  payWithApp(app: string): void {
    const params = `pa=eventhub@upi&pn=EventHub&am=${this.totalPrice}&cu=INR&tn=${encodeURIComponent(this.event?.title || '')}`;
    const links: Record<string,string> = { gpay: `tez://upi/pay?${params}`, phonepe: `phonepe://pay?${params}`, paytm: `paytmmp://pay?${params}` };
    window.location.href = links[app];
    setTimeout(() => alert('App did not open? Enter UPI ID manually.'), 2500);
  }

  bookFree(): void {
    this.processing = true;
    this.http.post<any>('/api/bookings', { eventId: this.event._id, quantity: 1, upiId: '' }).subscribe({
      next: (res: any) => {
        this.processing = false; this.alreadyBooked = true;
        alert(`Registration confirmed! Booking ID: ${res.booking?.bookingId}`);
        this.router.navigate(['/bookings']);
      },
      error: (err: any) => { this.processing = false; alert('Error: ' + (err?.error?.message || 'Try again.')); }
    });
  }

  confirmPayment(): void {
    if (!this.upiId.trim()) { alert('Please enter UPI ID!'); return; }
    if (!/^[\w.\-]{3,}@[a-zA-Z]{3,}$/.test(this.upiId.trim())) { alert('Valid UPI ID: 9876543210@paytm'); return; }
    this.processing = true;
    this.http.post<any>('/api/bookings', { eventId: this.event._id, quantity: this.quantity, upiId: this.upiId.trim() }).subscribe({
      next: (res: any) => {
        this.processing = false; this.showModal = false; this.alreadyBooked = true;
        alert(`Booking confirmed! Booking ID: ${res.booking?.bookingId}`);
        this.router.navigate(['/bookings']);
      },
      error: (err: any) => { this.processing = false; alert('Error: ' + (err?.error?.message || 'Try again.')); }
    });
  }

  // ── Comments ──
  loadComments(eventId: string): void {
    this.http.get<any>(`/api/comments/${eventId}`).subscribe({
      next: (res) => this.comments = res.comments || [],
      error: () => {}
    });
  }

  addComment(): void {
    if (!this.commentText.trim()) return;
    this.http.post<any>(`/api/comments/${this.event._id}`, { text: this.commentText }).subscribe({
      next: (res) => { this.comments.unshift(res.comment); this.commentText = ''; },
      error: (err: any) => alert(err?.error?.message || 'Login to comment')
    });
  }

  startEdit(c: any): void { this.editingId = c._id; this.editingText = c.text; }
  cancelEdit(): void { this.editingId = null; this.editingText = ''; }

  saveEdit(c: any): void {
    this.http.put<any>(`/api/comments/${c._id}`, { text: this.editingText }).subscribe({
      next: (res) => {
        const idx = this.comments.findIndex(x => x._id === c._id);
        if (idx !== -1) this.comments[idx] = res.comment;
        this.editingId = null;
      },
      error: (err: any) => alert(err?.error?.message || 'Error')
    });
  }

  deleteComment(id: string): void {
    if (!confirm('Delete this comment?')) return;
    this.http.delete<any>(`/api/comments/${id}`).subscribe({
      next: () => this.comments = this.comments.filter(c => c._id !== id),
      error: (err: any) => alert(err?.error?.message || 'Error')
    });
  }

  isOwner(c: any): boolean { return c.user?._id === this.userId || c.user === this.userId; }
}
