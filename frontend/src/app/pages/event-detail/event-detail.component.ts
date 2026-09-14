import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { EventService } from '../../services/event.service';

declare var Razorpay: any;

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
  quantity      = 1;
  processing    = false;
  processingMsg = 'Processing Payment...';
  user: any     = null;

  // Checkout Steps: 'payment' | 'gateway' | 'confirmation'
  checkoutStep: 'payment' | 'gateway' | 'confirmation' = 'payment';
  confirmedBooking: any = null;

  // Direct Razorpay Account Transfer (Krishna Kamleshbhai Gondaliya)
  directPaymentUrl = 'https://razorpay.me/@krishnakamleshbhaigondaliya';
  merchantName = 'Krishna Gondaliya';
  upiVpa = 'gondaliyakishan839@okaxis';
  lockedUpiUri = '';
  sanitizedUpiUri: SafeResourceUrl | null = null;
  copiedUpi = false;
  downloadingTicket = false;
  paymentRefId = '';
  showEmbedFrame = false;
  sanitizedPaymentUrl: SafeResourceUrl | null = null;
  qrCodeUrl = '';

  // Attendee Information
  firstName = 'Alex';
  lastName  = 'Rivera';
  email     = 'alex.rivera@example.com';

  // Payment Options
  selectedMethod: 'upi' | 'card' | 'netbanking' | 'wallet' = 'upi';

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
    if (u) {
      try {
        this.user = JSON.parse(u);
        this.userId = this.user._id || '';
        if (this.user.name) {
          const parts = this.user.name.split(' ');
          this.firstName = parts[0] || 'Alex';
          this.lastName  = parts.slice(1).join(' ') || 'Rivera';
        }
        if (this.user.email) this.email = this.user.email;
      } catch {}
    }

    // Load dynamic Razorpay payment configuration if configured
    this.http.get<any>('/api/bookings/payment-config').subscribe({
      next: (cfg) => {
        if (cfg?.directPaymentUrl) this.directPaymentUrl = cfg.directPaymentUrl;
        if (cfg?.merchantName) this.merchantName = cfg.merchantName;
        if (cfg?.upiVpa) this.upiVpa = cfg.upiVpa;
      },
      error: () => {}
    });
  }

  get soldPercent(): number {
    if (!this.event) return 0;
    const total = this.event.totalTickets || 100;
    const avail = this.event.availableTickets ?? 0;
    return Math.min(100, Math.round(((total - avail) / total) * 100));
  }

  get ticketSubtotal(): number {
    return (this.event?.price || 0) * this.quantity;
  }

  get processingFee(): number {
    if (this.event?.isFree || this.ticketSubtotal === 0) return 0;
    return Math.max(50, Math.round(this.ticketSubtotal * 0.025));
  }

  get taxes(): number {
    if (this.event?.isFree || this.ticketSubtotal === 0) return 0;
    return Math.round(this.ticketSubtotal * 0.085);
  }

  get finalTotal(): number {
    if (this.event?.isFree) return 0;
    return this.ticketSubtotal + this.processingFee + this.taxes;
  }

  get totalPrice(): number { return this.finalTotal; }

  mapUrl(location: string): SafeResourceUrl {
    const url = `https://maps.google.com/maps?q=${encodeURIComponent(location || '')}&output=embed`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  openModal(): void {
    const token = localStorage.getItem('token');
    if (!token || token === 'null' || token === 'undefined') {
      alert('Please login to book tickets.');
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }
    this.showModal = true;
    this.checkoutStep = 'payment';
    this.quantity = 1;
    this.processing = false;
    this.selectedMethod = 'upi';
  }

  closeOutside(e: MouseEvent): void {
    if ((e.target as HTMLElement).classList.contains('modal-overlay') && !this.processing) {
      this.showModal = false;
    }
  }

  decQty(): void { if (this.quantity > 1) this.quantity--; }
  incQty(): void {
    const max = Math.min(this.event?.availableTickets || 10, 10);
    if (this.quantity < max) this.quantity++;
  }

  getMethodTitle(m: string): string {
    switch (m) {
      case 'upi':        return 'UPI (GPay, PhonePe, Paytm)';
      case 'card':       return 'Cards (Visa, Mastercard, RuPay)';
      case 'netbanking': return 'Netbanking (All Indian Banks)';
      case 'wallet':     return 'Wallets (Mobikwik, Freecharge)';
      default:           return 'Online Payment';
    }
  }

  processSelectedPayment(): void {
    if (!this.event) return;
    this.payWithRazorpay();
  }

  bookFree(): void {
    this.processing = true;
    this.http.post<any>('/api/bookings', {
      eventId:       this.event._id,
      quantity:      1,
      paymentMethod: 'Free Registration'
    }).subscribe({
      next: (res: any) => {
        this.processing = false;
        this.alreadyBooked = true;
        this.confirmedBooking = res.booking;
        this.checkoutStep = 'confirmation';
      },
      error: (err: any) => {
        this.processing = false;
        alert('Error: ' + (err?.error?.message || 'Try again.'));
      }
    });
  }

  getSelectedMethodName(): string {
    switch (this.selectedMethod) {
      case 'upi': return 'UPI';
      case 'card': return 'Card';
      case 'netbanking': return 'Netbanking';
      case 'wallet': return 'Wallet';
      default: return 'Online';
    }
  }

  proceedToGateway(): void {
    if (!this.event) return;
    if (!this.firstName?.trim() || !this.email?.trim()) {
      alert('Please fill in your name and email address.');
      return;
    }
    this.sanitizedPaymentUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.directPaymentUrl);

    // NPCI UPI Pull-type specification with fixed locked amount
    const lockedAmount = this.finalTotal.toFixed(2);
    const note = encodeURIComponent(`EventHub Ticket: ${this.event.title || 'Event Pass'}`);
    const payee = encodeURIComponent(this.merchantName);
    this.lockedUpiUri = `upi://pay?pa=${this.upiVpa}&pn=${payee}&am=${lockedAmount}&cu=INR&tn=${note}`;
    this.sanitizedUpiUri = this.sanitizer.bypassSecurityTrustUrl(this.lockedUpiUri);

    // Dynamic QR code for camera / UPI scanning with fixed non-editable amount
    this.qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&margin=8&data=${encodeURIComponent(this.lockedUpiUri)}`;
    this.checkoutStep = 'gateway';
  }

  copyUpiId(): void {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(this.upiVpa).then(() => {
        this.copiedUpi = true;
        setTimeout(() => this.copiedUpi = false, 2500);
      }).catch(() => {
        this.copiedUpi = true;
        setTimeout(() => this.copiedUpi = false, 2500);
      });
    } else {
      this.copiedUpi = true;
      setTimeout(() => this.copiedUpi = false, 2500);
    }
  }

  openDirectPaymentWindow(): void {
    window.open(this.directPaymentUrl, '_blank', 'noopener,noreferrer');
  }

  toggleEmbedFrame(): void {
    this.showEmbedFrame = !this.showEmbedFrame;
  }

  confirmDirectBooking(): void {
    if (!this.event) return;
    this.processing = true;
    this.processingMsg = 'Confirming Booking & QR Ticket...';

    const pMethod = `Razorpay Direct (${this.getSelectedMethodName()})`;
    const refId = this.paymentRefId.trim() || ('RZP-' + Math.random().toString(36).substring(2, 9).toUpperCase());

    this.http.post<any>('/api/bookings', {
      eventId:       this.event._id,
      quantity:      this.quantity,
      paymentMethod: pMethod,
      razorpayPaymentId: refId,
      totalAmount:   this.finalTotal,
      paymentDetails: {
        merchant: this.merchantName,
        paymentMethod: this.getSelectedMethodName(),
        attendee: `${this.firstName} ${this.lastName}`.trim(),
        email: this.email,
        directTransfer: true
      }
    }).subscribe({
      next: (res: any) => {
        this.processing = false;
        this.confirmedBooking = res.booking || {
          bookingId:   'EH-' + Date.now().toString().slice(-6),
          event:       this.event,
          quantity:    this.quantity,
          totalAmount: this.finalTotal,
          createdAt:   new Date()
        };
        this.checkoutStep = 'confirmation';
        this.alreadyBooked = true;
      },
      error: (err: any) => {
        this.processing = false;
        if (err?.status === 401 || err?.error?.message === 'Token invalid' || err?.error?.message === 'Not authorized, no token') {
          alert('Login Session Expired. Please login again.');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          this.showModal = false;
          this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
          return;
        }
        alert('Booking Error: ' + (err?.error?.message || 'Could not verify booking. Please try again.'));
      }
    });
  }

  payWithRazorpay(): void {
    this.proceedToGateway();
  }

  processFallbackDirectPayment(): void {
    this.processingMsg = 'Finalizing Booking...';
    this.http.post<any>('/api/bookings', {
      eventId:       this.event._id,
      quantity:      this.quantity,
      paymentMethod: this.getMethodTitle(this.selectedMethod),
      totalAmount:   this.finalTotal
    }).subscribe({
      next: (res: any) => {
        this.processing = false;
        this.confirmedBooking = res.booking || {
          bookingId:   'TRX-' + Math.floor(1000 + Math.random() * 9000),
          event:       this.event,
          quantity:    this.quantity,
          totalAmount: this.finalTotal,
          createdAt:   new Date()
        };
        this.checkoutStep = 'confirmation';
        this.alreadyBooked = true;
      },
      error: (err: any) => {
        this.processing = false;
        if (err?.status === 401 || err?.error?.message === 'Token invalid' || err?.error?.message === 'Not authorized, no token') {
          alert('Login Session Expired');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          this.showModal = false;
          this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
          return;
        }
        alert('Booking Error: ' + (err?.error?.message || 'Please check your connection and try again.'));
      }
    });
  }

  downloadConfirmedTicket(): void {
    const b = this.confirmedBooking;
    if (b && b._id) {
      this.downloadingTicket = true;
      const token = localStorage.getItem('token');
      this.http.get(`/api/bookings/${b._id}/ticket-pdf`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        responseType: 'blob'
      }).subscribe({
        next: (blob: Blob) => {
          this.downloadingTicket = false;
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `EventHub-Ticket-${b.bookingId || b._id}.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        },
        error: (err: any) => {
          this.downloadingTicket = false;
          console.warn('Backend PDF endpoint error, using printable window:', err);
          this.openPrintableTicketWindow();
        }
      });
    } else {
      this.openPrintableTicketWindow();
    }
  }

  openPrintableTicketWindow(): void {
    const b  = this.confirmedBooking || {};
    const ev = b.event || this.event;
    const evDate = ev?.date
      ? new Date(ev.date).toLocaleDateString('en-US', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        })
      : '—';
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html><html>
      <head><title>Ticket - ${ev?.title || 'Event'}</title>
      <style>
        body{font-family:sans-serif;background:#0f172a;color:white;padding:40px;display:flex;justify-content:center}
        .ticket{background:#1e293b;border-radius:16px;width:440px;overflow:hidden;border:1px solid #334155}
        .head{background:#e53935;padding:20px;text-align:center}
        .head h2{margin:0;font-size:1.4rem}
        .body{padding:24px}
        .row{display:flex;justify-content:space-between;margin-bottom:12px;font-size:.9rem;color:#cbd5e1}
        .total{border-top:1px dashed #475569;padding-top:14px;font-size:1.2rem;font-weight:bold;color:#f87171}
        .code{text-align:center;margin-top:20px;padding:10px;background:#0f172a;border-radius:8px;font-family:monospace;letter-spacing:2px}
      </style></head>
      <body><div class="ticket">
        <div class="head"><h2>🎟️ EVENT PASS</h2><p>${ev?.title}</p></div>
        <div class="body">
          <div class="row"><span>Attendee:</span><strong>${this.firstName} ${this.lastName}</strong></div>
          <div class="row"><span>Date:</span><strong>${evDate}</strong></div>
          <div class="row"><span>Location:</span><strong>${ev?.location || '—'}</strong></div>
          <div class="row"><span>Tickets:</span><strong>${this.quantity}</strong></div>
          <div class="row total"><span>Total Paid:</span><strong>₹${this.finalTotal}</strong></div>
          <div class="code">BOOKING ID: ${b.bookingId || ('TRX-' + Math.floor(1000 + Math.random() * 9000))}</div>
        </div>
      </div>
      <script>window.print();</script></body></html>
    `);
    win.document.close();
  }

  goToEvents(): void { this.showModal = false; this.router.navigate(['/events']); }

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