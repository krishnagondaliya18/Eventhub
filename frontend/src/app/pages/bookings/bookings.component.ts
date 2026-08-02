import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { NavbarComponent } from '../../shared/navbar/navbar.component';

@Component({
  selector: 'app-bookings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NavbarComponent],
  templateUrl: './bookings.component.html',
  styleUrls: ['./bookings.component.css']
})
export class BookingsComponent implements OnInit {
  bookings:    any[]  = [];
  loading      = true;
  message      = '';
  msgType:     'success' | 'error' = 'success';
  activeFilter:'all' | 'confirmed' | 'cancelled' = 'all';

  // Edit modal
  editingBooking: any   = null;
  editQty         = 1;
  updating         = false;

  constructor(private http: HttpClient) {}
  ngOnInit(): void { this.load(); }

  load(): void {
    this.http.get<any>('/api/bookings/my').subscribe({
      next: (res) => { this.bookings = res.bookings || []; this.loading = false; },
      error: ()   => { this.loading = false; }
    });
  }

  get filtered(): any[] {
    return this.activeFilter === 'all'
      ? this.bookings
      : this.bookings.filter(b => b.status === this.activeFilter);
  }

  // ── Edit Tickets ──
  openEdit(b: any): void {
    this.editingBooking = b;
    this.editQty        = b.quantity;
    this.updating       = false;
  }

  closeEdit(): void { this.editingBooking = null; }

  closeEditOutside(e: MouseEvent): void {
    if ((e.target as HTMLElement).classList.contains('modal-overlay')) this.closeEdit();
  }

  decEditQty(): void { if (this.editQty > 1) this.editQty--; }
  incEditQty(): void { if (this.editQty < 10) this.editQty++; }

  get editDiff(): number {
    return Math.abs((this.editingBooking?.event?.price || 0) * (this.editQty - (this.editingBooking?.quantity || 0)));
  }

  get editTotal(): number {
    return (this.editingBooking?.event?.price || 0) * this.editQty;
  }

  saveEdit(): void {
    if (this.editQty === this.editingBooking.quantity) { this.closeEdit(); return; }
    this.updating = true;
    this.http.put<any>(`/api/bookings/${this.editingBooking._id}`, { quantity: this.editQty }).subscribe({
      next: (res: any) => {
        const idx = this.bookings.findIndex(b => b._id === this.editingBooking._id);
        if (idx !== -1) this.bookings[idx] = res.booking;
        this.updating = false;
        this.closeEdit();
        this.show('Booking updated successfully!', 'success');
      },
      error: (err: any) => {
        this.updating = false;
        this.show(err?.error?.message || 'Could not update booking.', 'error');
      }
    });
  }

  // ── Cancel ──
  cancel(id: string): void {
    if (!confirm('Cancel this booking?')) return;
    this.http.put<any>(`/api/bookings/${id}/cancel`, {}).subscribe({
      next: () => {
        const b = this.bookings.find(x => x._id === id);
        if (b) { b.status = 'cancelled'; b.cancelledAt = new Date(); }
        this.show('Booking cancelled successfully.', 'success');
      },
      error: (err: any) => this.show(err?.error?.message || 'Could not cancel.', 'error')
    });
  }

  show(msg: string, type: 'success' | 'error'): void {
    this.message = msg; this.msgType = type;
    setTimeout(() => this.message = '', 4000);
  }

  // ── PDF Ticket ──
  downloadTicket(b: any): void {
    const ev      = b.event;
    const evDate  = new Date(ev?.date).toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' });
    const bkDate  = new Date(b.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' });
    const amount  = (b.totalAmount || 0).toLocaleString('en-IN');
    const perTkt  = (ev?.price || 0).toLocaleString('en-IN');
    const sBg     = b.status === 'confirmed' ? '#e8f5e9' : '#ffebee';
    const sClr    = b.status === 'confirmed' ? '#2e7d32' : '#c62828';

    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<title>Ticket - ${b.bookingId}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',Arial,sans-serif;background:#f0f2f5}
.page{padding:30px}
.ticket{width:680px;margin:0 auto;background:white;border-radius:20px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.18)}
.hdr{background:linear-gradient(135deg,#e53935,#b71c1c);color:white;padding:32px 36px}
.hdr-top{display:flex;justify-content:space-between;align-items:flex-start}
.brand{font-size:1.1rem;font-weight:900;opacity:.9;letter-spacing:1px}
.hdr h1{font-size:1.6rem;font-weight:800;margin:12px 0 6px;line-height:1.2}
.cat{font-size:0.85rem;opacity:.8}
.bid-band{background:#fff3e0;padding:18px 36px;display:flex;align-items:center;justify-content:center;border-bottom:2px dashed #ffe0b2}
.bid-label{font-size:0.72rem;color:#e65100;font-weight:700;letter-spacing:2px;display:block;margin-bottom:4px}
.bid-value{font-size:1.8rem;font-weight:900;color:#e53935;letter-spacing:4px}
.body{padding:28px 36px}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px}
.lbl{font-size:0.7rem;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px}
.val{font-size:0.95rem;color:#222;font-weight:600}
.status-chip{display:inline-block;padding:4px 14px;border-radius:20px;font-size:0.78rem;font-weight:800;background:${sBg};color:${sClr}}
.dashed{border:none;border-top:2px dashed #e0e0e0;margin:20px 0}
.price-block{background:#f9f9f9;border-radius:12px;padding:20px 24px}
.price-row{display:flex;justify-content:space-between;font-size:0.9rem;color:#666;margin-bottom:8px}
.price-row.total{font-size:1.2rem;font-weight:900;color:#e53935;border-top:1px solid #e0e0e0;padding-top:12px;margin-top:4px}
.footer{background:#f5f5f5;padding:16px 36px;text-align:center;font-size:0.78rem;color:#999;line-height:1.6}
@media print{body{background:white}.ticket{box-shadow:none}.page{padding:0}}
</style></head><body>
<div class="page"><div class="ticket">
<div class="hdr">
  <div class="hdr-top">
    <div><div class="brand">&#127914; EVENTHUB</div><h1>${ev?.title||'Event Ticket'}</h1><div class="cat">${ev?.category||''}</div></div>
    <div style="text-align:right"><div class="lbl">BOOKING DATE</div><div style="font-size:0.9rem;font-weight:700">${bkDate}</div></div>
  </div>
</div>
<div class="bid-band"><div><span class="bid-label">BOOKING ID</span><div class="bid-value">${b.bookingId}</div></div></div>
<div class="body">
  <div class="grid2">
    <div><div class="lbl">Event Date</div><div class="val">${evDate}</div></div>
    <div><div class="lbl">Location</div><div class="val">${ev?.location||'—'}</div></div>
    <div><div class="lbl">Tickets</div><div class="val">${b.quantity} ticket(s)</div></div>
    <div><div class="lbl">Status</div><div class="val"><span class="status-chip">${(b.status||'').toUpperCase()}</span></div></div>
    <div><div class="lbl">Payment</div><div class="val">${b.upiId?'UPI — '+b.upiId:(b.totalAmount===0?'Free Registration':'UPI Payment')}</div></div>
    <div><div class="lbl">Category</div><div class="val">${ev?.category||'—'}</div></div>
  </div>
  <hr class="dashed">
  <div class="price-block">
    <div class="price-row"><span>Price per ticket</span><span>&#8377;${perTkt}</span></div>
    <div class="price-row"><span>Number of tickets</span><span>&#215; ${b.quantity}</span></div>
    <div class="price-row total"><span>Total Amount Paid</span><span>&#8377;${amount}</span></div>
  </div>
  <p style="text-align:center;font-size:0.75rem;color:#bbb;margin-top:20px">Show this ticket at the venue entry</p>
</div>
<div class="footer"><strong>EventHub</strong> &bull; Official Ticket &bull; Booking ID: <strong>${b.bookingId}</strong><br>
Thank you for booking! Support: support@eventhub.com</div>
</div></div>
<script>window.onload=()=>window.print()</script>
</body></html>`;

    const win = window.open('', '_blank');
    if (win) { win.document.write(html); win.document.close(); }
  }
}