import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import eventService from '../../services/eventService';
import './AdminEventList.css';

export const AdminEventList = () => {
  const [searchParams] = useSearchParams();
  const initialFilter = searchParams.get('filter') || 'all';

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentStatusFilter, setCurrentStatusFilter] = useState(initialFilter);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const categories = [
    'Music', 'Sports', 'Technology', 'Food', 'Films', 'Art', 'Business', 'Parties', 'Science'
  ];

  const initialForm = {
    title: '',
    category: 'Music',
    description: '',
    date: '',
    location: '',
    price: 0,
    isFree: false,
    totalTickets: 100,
    image: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=800&q=80',
    status: 'active'
  };

  const [form, setForm] = useState(initialForm);

  const loadEvents = () => {
    setLoading(true);
    eventService.getEvents({ limit: 100 })
      .then((res) => {
        setEvents(res.events || []);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const showNotification = (msg, type = 'success') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 4000);
  };

  const filteredEvents = events.filter((ev) => {
    if (currentStatusFilter === 'all') return true;
    if (currentStatusFilter === 'cancelled') {
      return ev.status === 'cancelled' || ev.status === 'withdrawn';
    }
    return ev.status === currentStatusFilter;
  });

  const approveEvent = async (id) => {
    try {
      await eventService.updateEvent(id, { status: 'active' });
      showNotification('Event approved and is now live!', 'success');
      loadEvents();
    } catch (err) {
      showNotification(err.response?.data?.message || 'Could not approve event.', 'error');
    }
  };

  const rejectEvent = async (id) => {
    try {
      await eventService.updateEvent(id, { status: 'rejected' });
      showNotification('Event has been rejected.', 'success');
      loadEvents();
    } catch (err) {
      showNotification(err.response?.data?.message || 'Could not reject event.', 'error');
    }
  };

  const withdrawEvent = async (id) => {
    try {
      await eventService.updateEvent(id, { status: 'withdrawn' });
      showNotification('Event has been withdrawn.', 'success');
      loadEvents();
    } catch (err) {
      showNotification(err.response?.data?.message || 'Could not withdraw event.', 'error');
    }
  };

  const cancelEvent = async (id) => {
    if (!window.confirm('Cancel this event and halt all ticket sales?')) return;
    try {
      await eventService.updateEvent(id, { status: 'cancelled' });
      showNotification('Event has been marked cancelled.', 'success');
      loadEvents();
    } catch (err) {
      showNotification(err.response?.data?.message || 'Could not cancel event.', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this event?')) return;
    try {
      await eventService.deleteEvent(id);
      showNotification('Event permanently deleted.', 'success');
      setEvents(events.filter(e => e._id !== id));
    } catch (err) {
      showNotification(err.response?.data?.message || 'Could not delete event.', 'error');
    }
  };

  const openAdd = () => {
    setEditMode(false);
    setEditingId(null);
    setForm(initialForm);
    setShowModal(true);
  };

  const openEdit = (ev) => {
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
      image: ev.image || initialForm.image,
      status: ev.status || 'active'
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.date || !form.location) {
      alert('Please fill all required fields.');
      return;
    }

    setSaving(true);
    const payload = {
      ...form,
      price: form.isFree ? 0 : Number(form.price),
      totalTickets: Number(form.totalTickets)
    };

    try {
      if (editMode) {
        await eventService.updateEvent(editingId, payload);
        showNotification('Event updated successfully!', 'success');
      } else {
        await eventService.createEvent(payload);
        showNotification('New event created successfully!', 'success');
      }
      setShowModal(false);
      loadEvents();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not save event.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-enter">
      <div className="page-top">
        <div>
          <h1>Event Management</h1>
          <p className="text-muted">Review, approve, and manage all public and organizer events</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <span className="material-icons">add</span> Create Event
        </button>
      </div>

      {message && (
        <div className={`alert ${messageType === 'success' ? 'alert-success' : 'alert-error'}`}>
          {message}
        </div>
      )}

      {/* STATUS FILTER TABS */}
      <div className="filter-tabs-row">
        <button
          className={`filter-pill ${currentStatusFilter === 'all' ? 'active' : ''}`}
          onClick={() => setCurrentStatusFilter('all')}
        >
          All Events ({events.length})
        </button>
        <button
          className={`filter-pill pill-pending ${currentStatusFilter === 'pending' ? 'active' : ''}`}
          onClick={() => setCurrentStatusFilter('pending')}
        >
          ⏳ Pending Review
        </button>
        <button
          className={`filter-pill pill-active ${currentStatusFilter === 'active' ? 'active' : ''}`}
          onClick={() => setCurrentStatusFilter('active')}
        >
          ✅ Active / Live
        </button>
        <button
          className={`filter-pill ${currentStatusFilter === 'completed' ? 'active' : ''}`}
          onClick={() => setCurrentStatusFilter('completed')}
        >
          🏁 Completed
        </button>
        <button
          className={`filter-pill ${currentStatusFilter === 'rejected' ? 'active' : ''}`}
          onClick={() => setCurrentStatusFilter('rejected')}
        >
          ❌ Rejected
        </button>
        <button
          className={`filter-pill pill-cancelled ${currentStatusFilter === 'cancelled' ? 'active' : ''}`}
          onClick={() => setCurrentStatusFilter('cancelled')}
        >
          🚫 Cancelled / Withdrawn
        </button>
      </div>

      <div className="card">
        {loading ? (
          <div className="spinner"></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Title</th>
                  <th>Organizer</th>
                  <th>Category</th>
                  <th>Date</th>
                  <th>Venue</th>
                  <th>Tickets</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map((ev, i) => (
                  <tr key={ev._id}>
                    <td>{i + 1}</td>
                    <td>
                      <div className="event-cell">
                        <img src={ev.image || '/assets/default-event.jpg'} className="ev-thumb" alt="" />
                        <strong>{ev.title}</strong>
                      </div>
                    </td>
                    <td>
                      <span className="organizer-tag">
                        {ev.organizer?.name || 'Platform Admin'}
                      </span>
                    </td>
                    <td><span className="badge badge-info">{ev.category}</span></td>
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
                        {ev.status === 'pending' && (
                          <>
                            <button
                              className="btn btn-sm btn-approve"
                              onClick={() => approveEvent(ev._id)}
                              title="Approve and make live"
                            >
                              ✓ Approve
                            </button>
                            <button
                              className="btn btn-sm btn-reject"
                              onClick={() => rejectEvent(ev._id)}
                              title="Reject event"
                            >
                              ✕ Reject
                            </button>
                            <button
                              className="btn btn-sm btn-cancel-act"
                              onClick={() => withdrawEvent(ev._id)}
                              title="Withdraw event"
                            >
                              Withdraw
                            </button>
                          </>
                        )}
                        {ev.status === 'active' && (
                          <button
                            className="btn btn-sm btn-cancel-act"
                            onClick={() => cancelEvent(ev._id)}
                            title="Cancel event and stop bookings"
                          >
                            Cancel Event
                          </button>
                        )}
                        <button className="btn btn-sm btn-edit-act" onClick={() => openEdit(ev)}>
                          Edit
                        </button>
                        <button className="btn btn-sm btn-del-act" onClick={() => handleDelete(ev._id)}>
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

      {/* CREATE / EDIT MODAL */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editMode ? 'Edit Event' : 'Create New Event'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <span className="material-icons">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>Title *</label>
                    <input
                      className="form-control"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      placeholder="Event title"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Category</label>
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
                    className="form-control"
                    rows="3"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Event description..."
                    required
                  ></textarea>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Date &amp; Time *</label>
                    <input
                      className="form-control"
                      type="datetime-local"
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Location *</label>
                    <input
                      className="form-control"
                      value={form.location}
                      onChange={(e) => setForm({ ...form, location: e.target.value })}
                      placeholder="e.g. Surat, Gujarat"
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Price (₹)</label>
                    <input
                      className="form-control"
                      type="number"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                      disabled={form.isFree}
                    />
                  </div>
                  <div className="form-group">
                    <label>Total Tickets</label>
                    <input
                      className="form-control"
                      type="number"
                      value={form.totalTickets}
                      onChange={(e) => setForm({ ...form, totalTickets: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Image URL</label>
                  <input
                    className="form-control"
                    value={form.image}
                    onChange={(e) => setForm({ ...form, image: e.target.value })}
                    placeholder="https://..."
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Status</label>
                    <select
                      className="form-control"
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                    >
                      <option value="active">Active (Approved)</option>
                      <option value="pending">Pending Approval</option>
                      <option value="rejected">Rejected</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ display: 'flex', alignItems: 'center', marginTop: '24px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={form.isFree}
                        onChange={(e) => setForm({ ...form, isFree: e.target.checked })}
                      />
                      <span>Free Event (₹0)</span>
                    </label>
                  </div>
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
                  {saving ? 'Saving...' : editMode ? 'Update Event' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEventList;
