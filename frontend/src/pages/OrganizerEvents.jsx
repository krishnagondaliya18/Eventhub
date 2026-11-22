import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import eventService from '../services/eventService';
import './OrganizerEvents.css';

export const OrganizerEvents = () => {
  const { user } = useAuth();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const initialForm = {
    title: '',
    category: 'Music',
    description: '',
    date: '',
    location: '',
    price: 0,
    isFree: false,
    totalTickets: 100,
    tags: '',
    isOnline: false,
    image: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=800&q=80'
  };

  const [form, setForm] = useState(initialForm);

  const categories = [
    'Music', 'Sports', 'Technology', 'Food', 'Films', 'Art', 'Business', 'Parties', 'Science'
  ];

  const loadMyEvents = () => {
    setLoading(true);
    eventService.getEvents({ organizer: user?._id || 'me', limit: 100 })
      .then((res) => {
        setEvents(res.events || []);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadMyEvents();
  }, [user]);

  const showNotification = (msg, type = 'success') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 4000);
  };

  const getActiveCount = () => events.filter(e => e.status === 'active').length;
  const getPendingCount = () => events.filter(e => e.status === 'pending').length;
  const getCancelledCount = () => events.filter(e => e.status === 'cancelled' || e.status === 'withdrawn').length;
  const getTotalRevenue = () => events.reduce((sum, e) => sum + (e.revenue || 0), 0).toLocaleString();

  const openCreateModal = () => {
    setEditMode(false);
    setEditingId(null);
    setForm(initialForm);
    setShowModal(true);
  };

  const openEditModal = (ev) => {
    setEditMode(true);
    setEditingId(ev._id);
    setForm({
      title: ev.title,
      category: ev.category || 'Music',
      description: ev.description || '',
      date: ev.date ? new Date(ev.date).toISOString().slice(0, 16) : '',
      location: ev.location || '',
      price: ev.price || 0,
      isFree: ev.isFree || false,
      totalTickets: ev.totalTickets || 100,
      tags: (ev.tags || []).join(', '),
      isOnline: ev.isOnline || false,
      image: ev.image || initialForm.image
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.date || !form.location) {
      alert('Please fill all required fields (Title, Description, Date, Location).');
      return;
    }

    setSaving(true);
    const payload = {
      ...form,
      price: form.isFree ? 0 : Number(form.price),
      totalTickets: Number(form.totalTickets),
      tags: typeof form.tags === 'string' ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : form.tags
    };

    try {
      if (editMode) {
        await eventService.updateEvent(editingId, payload);
        showNotification('Event updated successfully!', 'success');
      } else {
        await eventService.createEvent(payload);
        showNotification('Event submitted for Admin review!', 'success');
      }
      setShowModal(false);
      loadMyEvents();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not save event.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    try {
      await eventService.deleteEvent(id);
      showNotification('Event deleted successfully.', 'success');
      setEvents(events.filter(e => e._id !== id));
    } catch (err) {
      showNotification(err.response?.data?.message || 'Could not delete event.', 'error');
    }
  };

  return (
    <div className="organizer-events-root">
      <Navbar />

      <div className="organizer-page-wrapper">
        <div className="organizer-container">
          {/* TOP HEADER */}
          <div className="organizer-header-row">
            <div>
              <span className="organizer-pill">ORGANIZER PORTAL</span>
              <h1>My Hosted Events</h1>
              <p className="subtitle">
                Create and manage your events, track ticket sales, and view Admin approval status.
              </p>
            </div>
            <button className="btn-create-event" onClick={openCreateModal}>
              <span className="material-icons">add_circle</span> Host New Event
            </button>
          </div>

          {/* ADMIN APPROVAL NOTICE BANNER */}
          <div className="approval-notice-banner">
            <div className="banner-icon">
              <span className="material-icons">admin_panel_settings</span>
            </div>
            <div className="banner-text">
              <h4>Admin Approval Workflow</h4>
              <p>
                For community safety and quality standards, all new events submitted by organizers are reviewed by the <strong>Admin Team</strong> before going live. Once approved, your event will immediately appear on the Explore Events page for ticket booking!
              </p>
            </div>
          </div>

          {/* STATS OVERVIEW */}
          <div className="stats-overview-grid">
            <div className="stat-card">
              <span className="stat-label">Total Events</span>
              <strong className="stat-value">{events.length}</strong>
            </div>
            <div className="stat-card stat-card-active">
              <span className="stat-label">Active / Live</span>
              <strong className="stat-value text-success">{getActiveCount()}</strong>
            </div>
            <div className="stat-card stat-card-pending">
              <span className="stat-label">Pending Approval</span>
              <strong className="stat-value text-warning">{getPendingCount()}</strong>
            </div>
            <div className="stat-card">
              <span className="stat-label">Cancelled / Withdrawn</span>
              <strong className="stat-value text-muted">{getCancelledCount()}</strong>
            </div>
            <div className="stat-card">
              <span className="stat-label">Total Revenue</span>
              <strong className="stat-value text-primary">₹{getTotalRevenue()}</strong>
            </div>
          </div>

          {/* ALERT BOX */}
          {message && (
            <div className={`alert-box ${messageType === 'success' ? 'alert-success' : 'alert-error'}`}>
              <span className="material-icons">
                {messageType === 'success' ? 'check_circle' : 'error_outline'}
              </span>
              <span>{message}</span>
            </div>
          )}

          {/* EVENTS TABLE CARD */}
          <div className="events-table-card">
            <div className="table-card-header">
              <h3>Events Inventory</h3>
              <button className="btn-refresh" onClick={loadMyEvents}>
                <span className="material-icons">refresh</span> Refresh
              </button>
            </div>

            {loading ? (
              <div className="loading-state">
                <div className="chk-spin"></div>
                <p>Loading your events...</p>
              </div>
            ) : events.length === 0 ? (
              <div className="empty-events-state">
                <span className="empty-icon">🎪</span>
                <h3>No Events Created Yet</h3>
                <p>Host your first concert, sports meet, tech workshop, or party today!</p>
                <button className="btn-create-event-sm" onClick={openCreateModal}>
                  + Create Event
                </button>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="org-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Event Title</th>
                      <th>Category</th>
                      <th>Date &amp; Time</th>
                      <th>Venue / Location</th>
                      <th>Tickets</th>
                      <th>Price</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((ev, i) => (
                      <tr key={ev._id}>
                        <td>{i + 1}</td>
                        <td>
                          <div className="event-title-cell">
                            <img src={ev.image || '/assets/default-event.jpg'} alt="" className="org-ev-thumb" />
                            <strong>{ev.title}</strong>
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-info">{ev.category}</span>
                        </td>
                        <td>
                          {new Date(ev.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </td>
                        <td>{ev.location}</td>
                        <td>{ev.availableTickets} / {ev.totalTickets}</td>
                        <td>
                          <span className={ev.isFree ? 'text-success' : 'text-primary'}>
                            {ev.isFree ? 'Free' : `₹${ev.price}`}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              ev.status === 'active'
                                ? 'badge-success'
                                : ev.status === 'pending'
                                ? 'badge-warning'
                                : 'badge-danger'
                            }`}
                          >
                            {ev.status === 'pending' ? 'Pending Approval' : ev.status}
                          </span>
                        </td>
                        <td>
                          <div className="action-btns">
                            <button
                              className="btn btn-sm btn-edit-act"
                              onClick={() => openEditModal(ev)}
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-sm btn-del-act"
                              onClick={() => handleDelete(ev._id)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CREATE / EDIT EVENT MODAL */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editMode ? 'Edit Hosted Event' : 'Host New Event'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <span className="material-icons">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>Event Title *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Surat Live Musical Night"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Category *</label>
                    <select
                      className="form-control"
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                    >
                      {categories.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Description *</label>
                  <textarea
                    rows="3"
                    className="form-control"
                    placeholder="Describe your event, performers, guidelines..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    required
                  ></textarea>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Date &amp; Time *</label>
                    <input
                      type="datetime-local"
                      className="form-control"
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Venue / Location *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Surat Indoor Stadium, Gujarat"
                      value={form.location}
                      onChange={(e) => setForm({ ...form, location: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Ticket Price (₹)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                      disabled={form.isFree}
                    />
                  </div>
                  <div className="form-group">
                    <label>Total Available Tickets</label>
                    <input
                      type="number"
                      className="form-control"
                      value={form.totalTickets}
                      onChange={(e) => setForm({ ...form, totalTickets: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Tags (comma separated)</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Concert, Live, Music, Weekend"
                      value={form.tags}
                      onChange={(e) => setForm({ ...form, tags: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Cover Banner Image URL</label>
                    <input
                      type="url"
                      className="form-control"
                      value={form.image}
                      onChange={(e) => setForm({ ...form, image: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row" style={{ marginTop: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={form.isFree}
                      onChange={(e) => setForm({ ...form, isFree: e.target.checked })}
                    />
                    <span>Free Admission Event (₹0)</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={form.isOnline}
                      onChange={(e) => setForm({ ...form, isOnline: e.target.checked })}
                    />
                    <span>Virtual / Online Event</span>
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Submitting...' : editMode ? 'Save Changes' : 'Submit for Admin Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default OrganizerEvents;
