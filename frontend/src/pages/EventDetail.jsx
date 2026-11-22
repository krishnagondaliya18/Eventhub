import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import eventService from '../services/eventService';
import api from '../services/api';
import './EventDetail.css';

export const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [processing, setProcessing] = useState(false);
  const [processingMsg, setProcessingMsg] = useState('');
  const [alreadyBooked, setAlreadyBooked] = useState(false);

  // Comments state
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState('');

  // Confirmation modal
  const [showModal, setShowModal] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState('');
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [downloadingTicket, setDownloadingTicket] = useState(false);

  const loadEvent = () => {
    eventService.getEvent(id)
      .then((res) => {
        setEvent(res.event);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  };

  const loadComments = () => {
    eventService.getComments(id)
      .then((res) => {
        setComments(res.comments || []);
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadEvent();
    loadComments();
  }, [id]);

  const soldPercent = event && event.totalTickets > 0
    ? Math.round(((event.totalTickets - event.availableTickets) / event.totalTickets) * 100)
    : 0;

  const ticketsTotal = event ? (event.isFree ? 0 : event.price * quantity) : 0;
  const processingFee = event && !event.isFree ? Math.max(50, Math.round(ticketsTotal * 0.025)) : 0;
  const gst = event && !event.isFree ? Math.round(ticketsTotal * 0.085) : 0;
  const finalTotal = ticketsTotal + processingFee + gst;

  const incQty = () => {
    if (event && quantity < Math.min(event.availableTickets, 10)) {
      setQuantity(quantity + 1);
    }
  };

  const decQty = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const mapUrl = (loc) => {
    return `https://maps.google.com/maps?q=${encodeURIComponent(loc || 'Surat, Gujarat')}&t=&z=13&ie=UTF8&iwloc=&output=embed`;
  };

  // --- COMMENTS HANDLERS ---
  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    if (!isLoggedIn) {
      alert('Please log in to post a comment.');
      navigate(`/login?returnUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    try {
      const res = await eventService.addComment(id, commentText.trim());
      setComments((prev) => [res.comment, ...prev]);
      setCommentText('');
    } catch (err) {
      alert(err.response?.data?.message || 'Could not post comment.');
    }
  };

  const handleSaveEditComment = async (c) => {
    if (!editingText.trim()) return;
    try {
      const res = await eventService.updateComment(id, c._id, editingText.trim());
      setComments((prev) => prev.map((item) => (item._id === c._id ? res.comment : item)));
      setEditingId(null);
      setEditingText('');
    } catch (err) {
      alert(err.response?.data?.message || 'Could not update comment.');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await eventService.deleteComment(id, commentId);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
    } catch (err) {
      alert(err.response?.data?.message || 'Could not delete comment.');
    }
  };

  const isOwner = (c) => {
    if (!user) return false;
    return c.user?._id === user._id || c.user === user._id || user.role === 'admin';
  };

  // --- FREE REGISTRATION ---
  const bookFree = async () => {
    if (!isLoggedIn) {
      alert('Please log in to register for this event.');
      navigate(`/login?returnUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    setProcessing(true);
    setProcessingMsg('Registering Free Ticket...');

    try {
      const res = await api.post('/bookings', {
        eventId: event._id,
        quantity: 1,
        paymentMethod: 'Free Registration'
      });

      setProcessing(false);
      setAlreadyBooked(true);
      setConfirmedBooking(res.data.booking);
      setCheckoutStep('confirmation');
      setShowModal(true);
    } catch (err) {
      setProcessing(false);
      alert('Registration Error: ' + (err.response?.data?.message || 'Could not complete free registration.'));
    }
  };

  // --- OFFICIAL RAZORPAY STANDARD IN-BUILT POPUP CHECKOUT ---
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (typeof window.Razorpay !== 'undefined') {
        resolve(true);
        return;
      }
      const existing = document.querySelector('script[src*="checkout.razorpay.com"]');
      if (existing) {
        existing.addEventListener('load', () => resolve(true));
        existing.addEventListener('error', () => resolve(false));
        setTimeout(() => resolve(typeof window.Razorpay !== 'undefined'), 500);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const payWithRazorpay = async () => {
    if (!event) return;

    if (!isLoggedIn) {
      alert('Please log in to book tickets.');
      navigate(`/login?returnUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    setProcessing(true);
    setProcessingMsg('Opening Razorpay...');

    const isReady = await loadRazorpayScript();
    if (!isReady || typeof window.Razorpay === 'undefined') {
      setProcessing(false);
      alert('Unable to load Razorpay payment gateway. Please disable ad-blockers and refresh the page.');
      return;
    }

    try {
      const orderRes = await api.post('/bookings/create-order', {
        eventId: event._id,
        quantity
      });

      const { order, keyId } = orderRes.data;
      const userName = user?.name || 'Attendee';
      const userEmail = user?.email || 'user@example.com';
      const userContact = user?.phone || '9999999999';

      const rzpOptions = {
        key: keyId || 'rzp_test_TSk0Vle1oG7U1A',
        amount: order.amount,
        currency: order.currency || 'INR',
        name: 'EventHub',
        description: `${quantity} Ticket(s) for ${event.title}`,
        image: 'https://cdn.razorpay.com/static/assets/logo/payment.svg',
        order_id: order.id,
        handler: (response) => {
          verifyPaymentOnBackend(response);
        },
        prefill: {
          name: userName,
          email: userEmail,
          contact: userContact
        },
        notes: {
          eventId: event._id,
          eventTitle: event.title,
          quantity: quantity.toString()
        },
        theme: {
          color: '#1b64da'
        },
        modal: {
          ondismiss: () => {
            setProcessing(false);
          }
        }
      };

      const rzp = new window.Razorpay(rzpOptions);
      rzp.open();
    } catch (err) {
      setProcessing(false);
      if (err.response?.status === 401) {
        alert('Your session has expired. Please log in again to book tickets.');
        navigate(`/login?returnUrl=${encodeURIComponent(window.location.pathname)}`);
        return;
      }
      alert('Order Initiation Error: ' + (err.response?.data?.message || 'Could not initiate payment.'));
    }
  };

  const verifyPaymentOnBackend = async (rzpPayload) => {
    setProcessing(true);
    setProcessingMsg('Verifying Payment & Issuing Pass...');

    try {
      const verifyRes = await api.post('/bookings/verify-payment', {
        razorpay_order_id: rzpPayload.razorpay_order_id,
        razorpay_payment_id: rzpPayload.razorpay_payment_id,
        razorpay_signature: rzpPayload.razorpay_signature,
        eventId: event._id,
        quantity
      });

      setProcessing(false);
      setAlreadyBooked(true);
      setConfirmedBooking(verifyRes.data.booking);
      setCheckoutStep('confirmation');
      setShowModal(true);
    } catch (err) {
      setProcessing(false);
      alert('Payment Verification Failed: ' + (err.response?.data?.message || 'Could not verify payment.'));
    }
  };

  // --- DOWNLOAD PDF TICKET PASS ---
  const downloadConfirmedTicket = async () => {
    const booking = confirmedBooking;
    if (!booking) return;

    setDownloadingTicket(true);
    try {
      const res = await api.get(`/bookings/${booking._id}/ticket-pdf`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `EventHub-Pass-${booking.bookingId || booking._id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      alert('PDF generation in progress. Your ticket has also been emailed to your registered address.');
    } finally {
      setDownloadingTicket(false);
    }
  };

  if (loading) {
    return (
      <div className="event-detail-root">
        <Navbar />
        <div className="container" style={{ padding: '80px 24px', textAlign: 'center' }}>
          <div className="spinner"></div>
          <p className="text-muted">Loading event details...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="event-detail-root">
        <Navbar />
        <div className="container" style={{ padding: '80px 24px', textAlign: 'center' }}>
          <h2>Event Not Found</h2>
          <p className="text-muted">The event you are looking for does not exist or has been removed.</p>
          <Link to="/events" className="btn btn-primary mt-4">← Back to Events</Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="event-detail-root">
      <Navbar />

      <div className="event-detail-container">
        {/* HERO BANNER */}
        <div
          className="event-hero"
          style={{ backgroundImage: `url(${event.image || '/assets/default-event.jpg'})` }}
        >
          <div className="hero-overlay">
            <h1>{event.title}</h1>
          </div>
        </div>

        <div className="event-body">
          {/* LEFT CONTENT */}
          <div className="event-info">
            <div className="info-card">
              <h2>About this event</h2>
              <p style={{ whiteSpace: 'pre-line' }}>{event.description}</p>
            </div>

            {event.tags && event.tags.length > 0 && (
              <div className="info-card">
                <h3>Tags</h3>
                {event.tags.map((tag) => (
                  <span key={tag} className="tag">{tag}</span>
                ))}
              </div>
            )}

            <div className="info-card">
              <h3>Organizer</h3>
              <div className="org-row">
                <div className="avatar">
                  {(event.organizer?.name || 'A').charAt(0).toUpperCase()}
                </div>
                <div>
                  <strong>{event.organizer?.name || 'Platform Organizer'}</strong>
                  <p>Event Organizer</p>
                </div>
              </div>
            </div>

            {/* COMMENTS SECTION */}
            <div className="info-card comments-section">
              <h3>💬 Comments</h3>
              <div className="comment-input-row">
                <input
                  type="text"
                  placeholder="Write a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddComment();
                  }}
                />
                <button className="btn-comment-post" onClick={handleAddComment}>Post</button>
              </div>

              <div className="comment-list">
                {comments.map((c) => (
                  <div key={c._id} className="comment-item">
                    <div className="comment-avatar">
                      {(c.user?.name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="comment-body">
                      <div className="comment-meta">
                        <strong>{c.user?.name || 'User'}</strong>
                        <span className="comment-time">
                          {new Date(c.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })}{' '}
                          {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {c.edited && <span className="edited-tag">(edited)</span>}
                      </div>

                      {editingId !== c._id ? (
                        <>
                          <p className="comment-text">{c.text}</p>
                          {isOwner(c) && (
                            <div className="comment-actions">
                              <button
                                onClick={() => {
                                  setEditingId(c._id);
                                  setEditingText(c.text);
                                }}
                              >
                                <span className="material-icons" style={{ fontSize: '0.9rem', verticalAlign: 'middle' }}>
                                  edit
                                </span>{' '}
                                Edit
                              </button>
                              <button onClick={() => handleDeleteComment(c._id)}>
                                <span className="material-icons" style={{ fontSize: '0.9rem', verticalAlign: 'middle' }}>
                                  delete
                                </span>{' '}
                                Delete
                              </button>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="edit-box">
                          <input
                            type="text"
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                          />
                          <button className="btn-save-edit" onClick={() => handleSaveEditComment(c)}>Save</button>
                          <button
                            className="btn-cancel-edit"
                            onClick={() => {
                              setEditingId(null);
                              setEditingText('');
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {comments.length === 0 && (
                  <p className="no-comments">No comments yet. Be the first!</p>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="event-sidebar">
            <div className="price-card">
              <p className="price-label">PRICE</p>
              <div className="price-amount">
                {event.isFree ? (
                  <span className="free-badge">Free</span>
                ) : (
                  <span>₹{event.price}</span>
                )}
              </div>

              <div className="info-row">
                <span className="material-icons icon-red">calendar_today</span>
                <div>
                  <strong>Date &amp; Time</strong>
                  <p>
                    {new Date(event.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: '2-digit',
                      year: 'numeric'
                    })}
                    {event.time && <span> &bull; {event.time}</span>}
                  </p>
                </div>
              </div>

              <div className="info-row">
                <span className="material-icons icon-red">location_on</span>
                <div>
                  <strong>Location</strong>
                  <p>{event.location}</p>
                </div>
              </div>

              {event.location && (
                <div className="map-wrap">
                  <iframe
                    src={mapUrl(event.location)}
                    width="100%"
                    height="180"
                    style={{ border: 0, borderRadius: '10px' }}
                    allowFullScreen
                    loading="lazy"
                    title="Event Location Map"
                  ></iframe>
                </div>
              )}

              {event.totalTickets > 0 && (
                <>
                  <div className="info-row">
                    <span className="material-icons icon-red">confirmation_number</span>
                    <div>
                      <strong>Availability</strong>
                      <p>{event.availableTickets} / {event.totalTickets} tickets remaining</p>
                    </div>
                  </div>

                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${soldPercent}%` }}></div>
                  </div>
                  <p className="sold-text">{soldPercent}% sold</p>
                </>
              )}

              {event.status === 'cancelled' && (
                <div className="event-cancelled-alert">
                  <span className="material-icons">cancel</span>
                  <div>
                    <strong>Event Cancelled</strong>
                    <p>This event has been cancelled. Ticket booking is closed.</p>
                  </div>
                </div>
              )}

              {event.status === 'withdrawn' && (
                <div className="event-cancelled-alert">
                  <span className="material-icons">info</span>
                  <div>
                    <strong>Event Withdrawn</strong>
                    <p>This event has been withdrawn from public listings.</p>
                  </div>
                </div>
              )}

              {alreadyBooked && (
                <div className="booked-badge">✓ Booking Confirmed</div>
              )}

              {!event.isFree &&
                !alreadyBooked &&
                event.status !== 'cancelled' &&
                event.status !== 'withdrawn' &&
                (event.availableTickets || 0) > 0 && (
                  <div className="sidebar-qty-box">
                    <div className="sidebar-qty-row">
                      <span>Quantity:</span>
                      <div className="chk-qty-selector">
                        <button
                          type="button"
                          onClick={decQty}
                          disabled={quantity <= 1 || processing}
                        >
                          &#8722;
                        </button>
                        <span>{quantity}</span>
                        <button
                          type="button"
                          onClick={incQty}
                          disabled={processing || quantity >= (event.availableTickets || 10)}
                        >
                          &#43;
                        </button>
                      </div>
                    </div>
                    <div className="sidebar-breakdown">
                      <div className="breakdown-row">
                        <span>Tickets ({quantity}x)</span>
                        <span>₹{ticketsTotal.toLocaleString()}</span>
                      </div>
                      <div className="breakdown-row">
                        <span>Processing Fee</span>
                        <span>₹{processingFee.toLocaleString()}</span>
                      </div>
                      <div className="breakdown-row">
                        <span>GST (8.5%)</span>
                        <span>₹{gst.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="sidebar-total-row">
                      <span>Total Amount:</span>
                      <strong>₹{finalTotal.toLocaleString()}</strong>
                    </div>
                  </div>
                )}

              {!alreadyBooked && (event.status === 'cancelled' || event.status === 'withdrawn') && (
                <button className="btn-book btn-book-disabled" disabled>
                  {event.status === 'cancelled' ? 'Event Cancelled' : 'Event Withdrawn'}
                </button>
              )}

              {!alreadyBooked && event.status !== 'cancelled' && event.status !== 'withdrawn' && (
                <>
                  <button
                    className="btn-book"
                    disabled={processing || (!event.isFree && (event.availableTickets || 0) <= 0)}
                    onClick={event.isFree ? bookFree : payWithRazorpay}
                  >
                    {!processing ? (
                      <span>
                        <span
                          className="material-icons"
                          style={{ fontSize: '1.15rem', verticalAlign: 'middle', marginRight: '4px' }}
                        >
                          {event.isFree ? 'confirmation_number' : 'bolt'}
                        </span>
                        {event.isFree ? 'Register Free' : `Book Tickets • ₹${finalTotal.toLocaleString()}`}
                      </span>
                    ) : (
                      <span className="chk-loading-text">
                        <span className="chk-spin"></span> {processingMsg}
                      </span>
                    )}
                  </button>
                  {!event.isFree && (
                    <p className="sidebar-rzp-badge">
                      <span className="material-icons">verified_user</span>
                      <span>Razorpay In-Built Checkout &bull; 100% Secure</span>
                    </p>
                  )}
                </>
              )}

              <Link className="btn-outline-link" to="/events">← Back to Events</Link>
              <Link className="btn-history-link" to="/bookings">
                <span className="material-icons" style={{ fontSize: '1rem', verticalAlign: 'middle' }}>
                  confirmation_number
                </span>{' '}
                My Bookings
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* CONFIRMATION MODAL (POPUP ONCE RAZORPAY PAYMENT IS SUCCESSFUL) */}
      {showModal && checkoutStep === 'confirmation' && (
        <div
          className="modal-overlay dark-checkout-overlay"
          onClick={() => setShowModal(false)}
        >
          <div
            className="checkout-container-shell"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '540px' }}
          >
            {/* TOP BAR */}
            <div className="chk-top-bar">
              <div className="chk-brand">
                <span className="chk-brand-icon">🎪</span>
                <span className="chk-brand-name">EventHub</span>
              </div>
              <div className="chk-top-right">
                <button className="chk-close-btn" onClick={() => setShowModal(false)}>
                  &#10005;
                </button>
              </div>
            </div>

            {/* CONFIRMATION SCREEN */}
            <div className="confirmation-screen">
              <div className="confirmation-card" style={{ padding: '24px 20px' }}>
                <div className="conf-success-icon-wrap">
                  <div className="conf-circle">
                    <span className="material-icons">check</span>
                  </div>
                </div>

                <h2 className="conf-title">Booking Confirmed! 🎉</h2>
                <p className="conf-subtitle">
                  Your ticket has been booked and confirmed via Razorpay.
                </p>

                <div className="conf-details-card">
                  <div className="conf-row">
                    <span>Event</span>
                    <strong>{event.title}</strong>
                  </div>
                  <div className="conf-row">
                    <span>Tickets</span>
                    <strong>{quantity} Ticket{quantity > 1 ? 's' : ''}</strong>
                  </div>
                  <div className="conf-row">
                    <span>Total Paid</span>
                    <strong className="conf-paid-amt">₹{finalTotal.toLocaleString()}</strong>
                  </div>
                  <div className="conf-row">
                    <span>Booking ID</span>
                    <strong className="conf-booking-id">
                      #{confirmedBooking?.bookingId || `EH-${event._id}`}
                    </strong>
                  </div>
                </div>

                <p className="conf-email-info">
                  <span className="material-icons">mail</span>
                  PDF Ticket pass delivered to <strong>{user?.email || 'your email'}</strong>
                </p>

                <div className="conf-actions">
                  <button
                    className="conf-btn-download"
                    onClick={downloadConfirmedTicket}
                    disabled={downloadingTicket}
                  >
                    <span className="material-icons">
                      {downloadingTicket ? 'hourglass_top' : 'download'}
                    </span>
                    <span>{downloadingTicket ? 'Generating PDF...' : 'Download PDF Ticket'}</span>
                  </button>
                  <button className="conf-btn-back" onClick={() => navigate('/events')}>
                    Back to Events
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default EventDetail;
