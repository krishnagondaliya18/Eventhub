import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../services/api';
import './Bookings.css';

export const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [message, setMessage] = useState('');
  const [msgType, setMsgType] = useState('success');

  // Edit modal
  const [editingBooking, setEditingBooking] = useState(null);
  const [editQty, setEditQty] = useState(1);
  const [updating, setUpdating] = useState(false);

  const loadBookings = () => {
    setLoading(true);
    api.get('/bookings/my')
      .then((res) => {
        setBookings(res.data.bookings || []);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const showNotification = (msg, type = 'success') => {
    setMessage(msg);
    setMsgType(type);
    setTimeout(() => setMessage(''), 4000);
  };

  const filteredBookings = bookings.filter((b) => {
    if (activeFilter === 'all') return true;
    return b.status === activeFilter;
  });

  // Edit ticket handlers
  const openEdit = (b) => {
    setEditingBooking(b);
    setEditQty(b.quantity);
    setUpdating(false);
  };

  const closeEdit = () => {
    setEditingBooking(null);
  };

  const decEditQty = () => {
    if (editQty > 1) setEditQty(editQty - 1);
  };

  const incEditQty = () => {
    if (editQty < 10) setEditQty(editQty + 1);
  };

  const editDiff = Math.abs(
    (editingBooking?.event?.price || 0) * (editQty - (editingBooking?.quantity || 0))
  );

  const editTotal = (editingBooking?.event?.price || 0) * editQty;

  const saveEdit = async () => {
    if (editQty === editingBooking.quantity) {
      closeEdit();
      return;
    }

    setUpdating(true);
    try {
      const res = await api.put(`/bookings/${editingBooking._id}`, { quantity: editQty });
      setBookings((prev) =>
        prev.map((b) => (b._id === editingBooking._id ? res.data.booking : b))
      );
      setUpdating(false);
      closeEdit();
      showNotification('Booking updated successfully!', 'success');
    } catch (err) {
      setUpdating(false);
      showNotification(err.response?.data?.message || 'Could not update booking.', 'error');
    }
  };

  // Cancel handler
  const cancelBooking = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await api.put(`/bookings/${id}/cancel`, {});
      setBookings((prev) =>
        prev.map((b) => (b._id === id ? { ...b, status: 'cancelled', cancelledAt: new Date() } : b))
      );
      showNotification('Booking cancelled successfully.', 'success');
    } catch (err) {
      showNotification(err.response?.data?.message || 'Could not cancel booking.', 'error');
    }
  };

  // Download PDF ticket pass
  const downloadTicket = async (b) => {
    if (!b?._id) return;
    try {
      const res = await api.get(`/bookings/${b._id}/ticket-pdf`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `EventHub-Ticket-${b.bookingId || b._id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      openPrintTicketWindow(b);
    }
  };

  const openPrintTicketWindow = (b) => {
    const ev = b.event;
    const evDate = new Date(ev?.date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
    const bkDate = new Date(b.createdAt).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
    const amount = (b.totalAmount || 0).toLocaleString('en-IN');
    const perTkt = (ev?.price || 0).toLocaleString('en-IN');
    const sBg = b.status === 'confirmed' ? '#e8f5e9' : '#ffebee';
    const sClr = b.status === 'confirmed' ? '#2e7d32' : '#c62828';

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
    <div><div class="brand">&#127914; EVENTHUB</div><h1>${ev?.title || 'Event Ticket'}</h1><div class="cat">${ev?.category || ''}</div></div>
    <div style="text-align:right"><div class="lbl">BOOKING DATE</div><div style="font-size:0.9rem;font-weight:700">${bkDate}</div></div>
  </div>
</div>
<div class="bid-band"><div><span class="bid-label">BOOKING ID</span><div class="bid-value">${b.bookingId}</div></div></div>
<div class="body">
  <div class="grid2">
    <div><div class="lbl">Event Date</div><div class="val">${evDate}</div></div>
    <div><div class="lbl">Location</div><div class="val">${ev?.location || '—'}</div></div>
    <div><div class="lbl">Tickets</div><div class="val">${b.quantity} ticket(s)</div></div>
    <div><div class="lbl">Status</div><div class="val"><span class="status-chip">${(b.status || '').toUpperCase()}</span></div></div>
    <div><div class="lbl">Payment Method</div><div class="val">${b.paymentMethod ? b.paymentMethod : (b.totalAmount === 0 ? 'Free Registration' : 'Razorpay Secure')}</div></div>
    <div><div class="lbl">Category</div><div class="val">${ev?.category || '—'}</div></div>
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
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  };

  return (
    <div className="bookings-page-root">
      <Navbar />

      <div className="page">
        <div className="container">
          <div className="page-header">
            <div>
              <h1>📄 My Bookings</h1>
              <p className="sub">Your complete ticket booking history</p>
            </div>
            <Link to="/events" className="btn-primary">
              + Book New Event
            </Link>
          </div>

          {/* FILTER TABS */}
          <div className="tabs">
            <button
              className={activeFilter === 'all' ? 'active' : ''}
              onClick={() => setActiveFilter('all')}
            >
              All ({bookings.length})
            </button>
            <button
              className={activeFilter === 'confirmed' ? 'active' : ''}
              onClick={() => setActiveFilter('confirmed')}
            >
              Confirmed
            </button>
            <button
              className={activeFilter === 'cancelled' ? 'active' : ''}
              onClick={() => setActiveFilter('cancelled')}
            >
              Cancelled
            </button>
          </div>

          {message && (
            <div className={`alert ${msgType === 'success' ? 'alert-success' : 'alert-error'}`}>
              {message}
            </div>
          )}

          {loading && (
            <div className="center-pad">
              <div className="spinner"></div>
            </div>
          )}

          {!loading && filteredBookings.length === 0 && (
            <div className="empty-state">
              <div style={{ fontSize: '48px' }}>🎟️</div>
              <h3>No bookings found</h3>
              <Link to="/events" className="btn-primary" style={{ marginTop: '16px', display: 'inline-block' }}>
                Browse Events
              </Link>
            </div>
          )}

          {!loading && (
            <div className="booking-list">
              {filteredBookings.map((b) => (
                <div
                  key={b._id}
                  className={`booking-card ${b.status === 'cancelled' ? 'is-cancelled' : ''}`}
                >
                  <div className="card-img">
                    <img
                      src={b.event?.image || '/assets/default-event.jpg'}
                      alt={b.event?.title || 'Event'}
                    />
                    <span
                      className={`status-pill ${
                        b.status === 'confirmed' ? 'pill-confirmed' : 'pill-cancelled'
                      }`}
                    >
                      {b.status ? b.status.charAt(0).toUpperCase() + b.status.slice(1) : ''}
                    </span>
                  </div>

                  <div className="card-body">
                    <h3>{b.event?.title}</h3>
                    <div className="meta">
                      <span>
                        <span className="material-icons meta-icon">calendar_today</span>{' '}
                        {new Date(b.event?.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                      <span>
                        <span className="material-icons meta-icon">location_on</span>{' '}
                        {b.event?.location}
                      </span>
                    </div>

                    <div className="chips">
                      <div className="chip">
                        <span className="chip-lbl">Booking ID</span>
                        <span className="chip-val">{b.bookingId}</span>
                      </div>
                      <div className="chip">
                        <span className="chip-lbl">Tickets</span>
                        <span className="chip-val">{b.quantity}</span>
                      </div>
                      <div className="chip">
                        <span className="chip-lbl">Total Paid</span>
                        <span className="chip-val red">
                          {b.totalAmount === 0 ? 'Free' : `₹${b.totalAmount}`}
                        </span>
                      </div>
                    </div>

                    <p className="booked-on">
                      Booked on{' '}
                      {new Date(b.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}{' '}
                      {new Date(b.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {b.cancelledAt && (
                      <p className="cancelled-on">
                        Cancelled on{' '}
                        {new Date(b.cancelledAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                    )}
                  </div>

                  <div className="card-actions">
                    <button className="btn-download" onClick={() => downloadTicket(b)}>
                      <span className="material-icons" style={{ fontSize: '1rem', verticalAlign: 'middle' }}>
                        picture_as_pdf
                      </span>{' '}
                      Download Ticket
                    </button>
                    {b.status === 'confirmed' && (
                      <>
                        <button className="btn-edit-qty" onClick={() => openEdit(b)}>
                          <span className="material-icons" style={{ fontSize: '1rem', verticalAlign: 'middle' }}>
                            edit
                          </span>{' '}
                          Edit Tickets
                        </button>
                        <button className="btn-cancel-bk" onClick={() => cancelBooking(b._id)}>
                          <span className="material-icons" style={{ fontSize: '1rem', verticalAlign: 'middle' }}>
                            cancel
                          </span>{' '}
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* EDIT TICKETS MODAL */}
      {editingBooking && (
        <div className="modal-overlay" onClick={closeEdit}>
          <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h2>✎ Edit Tickets</h2>
              <button className="close-btn" onClick={closeEdit}>
                &#10005;
              </button>
            </div>

            <p className="modal-event-name">{editingBooking?.event?.title}</p>

            {/* Current vs New */}
            <div className="current-info">
              <div className="curr-item">
                <span className="curr-label">Current Tickets</span>
                <span className="curr-val">{editingBooking?.quantity}</span>
              </div>
              <div className="curr-arrow">&#8594;</div>
              <div className="curr-item">
                <span className="curr-label">New Tickets</span>
                <span className="curr-val new">{editQty}</span>
              </div>
            </div>

            {/* Quantity Control */}
            <div className="qty-section">
              <button className="qty-btn dec" onClick={decEditQty} disabled={editQty <= 1}>
                &#8722;
              </button>
              <div className="qty-display">
                <span className="qty-num">{editQty}</span>
                <span className="qty-label">tickets</span>
              </div>
              <button className="qty-btn inc" onClick={incEditQty} disabled={editQty >= 10}>
                &#43;
              </button>
            </div>

            {/* Price Summary */}
            <div className="price-summary">
              <div className="summary-row">
                <span>Price per ticket</span>
                <span>₹{editingBooking?.event?.price}</span>
              </div>
              <div className="summary-row">
                <span>Quantity</span>
                <span>&#215; {editQty}</span>
              </div>
              <div className="summary-row total">
                <span>New Total</span>
                <span>₹{editTotal}</span>
              </div>
              {editQty !== editingBooking?.quantity && (
                <div className="summary-row diff">
                  <span>
                    {editQty > editingBooking?.quantity ? 'Additional charge' : 'Refund amount'}
                  </span>
                  <span className={editQty > editingBooking?.quantity ? 'red' : 'green'}>
                    {editQty > editingBooking?.quantity ? '+' : '-'} ₹{editDiff}
                  </span>
                </div>
              )}
            </div>

            <button
              className="btn-save"
              onClick={saveEdit}
              disabled={updating || editQty === editingBooking?.quantity}
            >
              {!updating ? '✓ Update Booking' : '⌛ Updating...'}
            </button>
            <button className="btn-modal-cancel" onClick={closeEdit}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default Bookings;
