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

  // Checkout Steps: 'payment' | 'confirmation'
  checkoutStep: 'payment' | 'confirmation' = 'payment';
  confirmedBooking: any = null;

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

  payWithRazorpay(): void {
    if (!this.event) return;
    this.processing = true;
    this.processingMsg = `Opening ${this.getSelectedMethodName()} Payment...`;

    this.http.post<any>('/api/bookings/create-order', {
      eventId:  this.event._id,
      quantity: this.quantity
    }).subscribe({
      next: (res: any) => {
        // ✅ Key backend thi aave — hardcoded nahi!
        const keyToUse      = res.keyId;
        const amountInPaise = res.order ? res.order.amount : Math.round(this.finalTotal * 100);

        const methodMap: Record<string, string> = {
          upi: 'upi',
          card: 'card',
          netbanking: 'netbanking',
          wallet: 'wallet'
        };
        const chosenInstrument = methodMap[this.selectedMethod] || 'upi';

        const options: any = {
          key:         keyToUse,
          amount:      amountInPaise,
          currency:    'INR',
          name:        'EventHub',
          description: `${this.event.title} (${this.quantity} Ticket${this.quantity > 1 ? 's' : ''})`,
          image:       this.event.image || 'https://cdn-icons-png.flaticon.com/512/3845/3845868.png',
          prefill: {
            name:    `${this.firstName} ${this.lastName}`.trim(),
            email:   this.email,
            contact: this.user?.phone || '',
            method:  chosenInstrument
          },
          config: {
            display: {
              blocks: {
                only_selected_method: {
                  name: this.getMethodTitle(this.selectedMethod),
                  instruments: [
                    {
                      method: chosenInstrument
                    }
                  ]
                }
              },
              sequence: ['block.only_selected_method'],
              preferences: {
                show_default_blocks: false
              }
            }
          },
          theme: { color: '#e53935' },
          handler: (response: any) => {
            this.processingMsg = 'Confirming Booking...';
            this.http.post<any>('/api/bookings/verify-payment', {
              eventId:              this.event._id,
              quantity:             this.quantity,
              razorpay_order_id:    response.razorpay_order_id,
              razorpay_payment_id:  response.razorpay_payment_id,
              razorpay_signature:   response.razorpay_signature
            }).subscribe({
              next: (verifyRes: any) => {
                this.processing = false;
                this.confirmedBooking = verifyRes.booking || {
                  bookingId:   'TRX-' + Math.floor(1000 + Math.random() * 9000),
                  event:       this.event,
                  quantity:    this.quantity,
                  totalAmount: this.finalTotal,
                  createdAt:   new Date()
                };
                this.checkoutStep = 'confirmation';
                this.alreadyBooked = true;
              },
              error: () => {
                this.http.post<any>('/api/bookings', {
                  eventId:       this.event._id,
                  quantity:      this.quantity,
                  paymentMethod: 'Razorpay (' + response.razorpay_payment_id + ')',
                  totalAmount:   this.finalTotal
                }).subscribe({
                  next: (fallbackRes: any) => {
                    this.processing = false;
                    this.confirmedBooking = fallbackRes.booking;
                    this.checkoutStep = 'confirmation';
                    this.alreadyBooked = true;
                  },
                  error: () => {
                    this.processing = false;
                    this.checkoutStep = 'confirmation';
                  }
                });
              }
            });
          },
          modal: { ondismiss: () => { this.processing = false; } }
        };

        if (res.order?.id) options.order_id = res.order.id;

        try {
          if (typeof Razorpay === 'undefined') {
            this.processFallbackDirectPayment();
            return;
          }
          const rzp = new Razorpay(options);
          rzp.on('payment.failed', (failRes: any) => {
            this.processing = false;
            alert(`Payment Failed: ${failRes.error?.description || 'Transaction unsuccessful'}`);
          });
          rzp.open();
        } catch (e: any) {
          this.processFallbackDirectPayment();
        }
      },
      error: () => { this.processFallbackDirectPayment(); }
    });
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
        alert('Payment failed: ' + (err?.error?.message || 'Try again.'));
      }
    });
  }

  downloadConfirmedTicket(): void {
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