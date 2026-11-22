import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import eventService from '../services/eventService';
import './Events.css';

export const Events = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [events, setEvents] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    location: searchParams.get('location') || '',
    budget: searchParams.get('budget') || '',
    status: searchParams.get('status') || 'active',
    isFree: searchParams.get('isFree') || '',
    isOnline: searchParams.get('isOnline') || ''
  });

  const searchTimeoutRef = useRef(null);

  const locations = [
    { label: 'All Cities', value: '' },
    { label: 'Surat', value: 'Surat' },
    { label: 'Mumbai', value: 'Mumbai' },
    { label: 'Ahmedabad', value: 'Ahmedabad' },
    { label: 'Bengaluru', value: 'Bengaluru' },
    { label: 'New Delhi', value: 'New Delhi' },
    { label: 'Goa', value: 'Goa' },
    { label: 'Online Events', value: 'Online' }
  ];

  const categories = [
    'Music', 'Sports', 'Technology', 'Food', 'Films', 'Art', 'Business', 'Parties', 'Science'
  ];

  const budgetOptions = [
    { label: 'Any Budget', value: '' },
    { label: 'Free (₹0)', value: 'free' },
    { label: 'Under ₹500', value: 'under500' },
    { label: '₹500 - ₹1,000', value: '500-1000' },
    { label: '₹1,000 - ₹2,000', value: '1000-2000' },
    { label: 'Above ₹2,000', value: 'above2000' }
  ];

  const loadEvents = (currentFilters = filters, currentPage = page) => {
    setLoading(true);
    const query = {
      page: currentPage,
      limit: 12,
      ...currentFilters
    };

    eventService.getEvents(query)
      .then((res) => {
        setEvents(res.events || []);
        setTotal(res.total || 0);
        setTotalPages(res.totalPages || 1);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    const updated = {
      search: searchParams.get('search') || '',
      category: searchParams.get('category') || '',
      location: searchParams.get('location') || '',
      budget: searchParams.get('budget') || '',
      status: searchParams.get('status') || 'active',
      isFree: searchParams.get('isFree') || '',
      isOnline: searchParams.get('isOnline') || ''
    };
    setFilters(updated);
    loadEvents(updated, 1);
    setPage(1);
  }, [searchParams]);

  const updateFiltersAndUrl = (newFilters) => {
    setFilters(newFilters);
    const params = new URLSearchParams();
    Object.keys(newFilters).forEach(k => {
      if (newFilters[k] !== '' && newFilters[k] !== null && newFilters[k] !== undefined) {
        params.set(k, newFilters[k]);
      }
    });
    setSearchParams(params);
  };

  const onSearchChange = (val) => {
    const newFilters = { ...filters, search: val };
    setFilters(newFilters);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      updateFiltersAndUrl(newFilters);
    }, 350);
  };

  const clearFilters = () => {
    const cleared = {
      search: '',
      category: '',
      location: '',
      budget: '',
      status: 'active',
      isFree: '',
      isOnline: ''
    };
    setPage(1);
    updateFiltersAndUrl(cleared);
  };

  const getPrice = (event) => (event.isFree ? 'Free' : `₹${event.price}`);

  return (
    <div className="events-page-root">
      <Navbar />

      <div className="events-page">
        <div className="events-header">
          <div className="container">
            <div className="header-row">
              <div>
                <h1>Events</h1>
                <p className="text-muted">{total} events found</p>
              </div>
              <div className="header-filters">
                <button
                  className={`filter-btn ${filters.status === 'active' && !filters.isFree && !filters.isOnline ? 'active' : ''}`}
                  onClick={() => updateFiltersAndUrl({ ...filters, status: 'active', isFree: '', isOnline: '' })}
                >
                  ALL
                </button>
                <button
                  className={`filter-btn ${filters.isFree === 'false' ? 'active' : ''}`}
                  onClick={() => updateFiltersAndUrl({ ...filters, isFree: 'false', isOnline: '' })}
                >
                  PAID
                </button>
                <button
                  className={`filter-btn ${filters.isFree === 'true' ? 'active' : ''}`}
                  onClick={() => updateFiltersAndUrl({ ...filters, isFree: 'true', isOnline: '' })}
                >
                  FREE
                </button>
                <button
                  className={`filter-btn ${filters.isOnline === 'true' ? 'active' : ''}`}
                  onClick={() => updateFiltersAndUrl({ ...filters, isOnline: 'true', isFree: '' })}
                >
                  ONLINE
                </button>
                <button
                  className={`filter-btn ${filters.isOnline === 'false' ? 'active' : ''}`}
                  onClick={() => updateFiltersAndUrl({ ...filters, isOnline: 'false', isFree: '' })}
                >
                  OFFLINE
                </button>
              </div>
            </div>

            {/* Mobile Search & Filter Action Bar */}
            <div className="mobile-filter-bar">
              <div className="mobile-search-box">
                <span className="material-icons search-ico">search</span>
                <input
                  type="text"
                  placeholder="Search events, venue..."
                  value={filters.search}
                  onChange={(e) => onSearchChange(e.target.value)}
                />
                {filters.search && (
                  <button className="btn-clear-search-mini" onClick={() => onSearchChange('')}>
                    ✕
                  </button>
                )}
              </div>
              <button
                className={`btn-toggle-filters ${showMobileFilters ? 'active' : ''}`}
                onClick={() => setShowMobileFilters(!showMobileFilters)}
              >
                <span className="material-icons">tune</span>
                <span>Filters</span>
                {(filters.category || filters.location || filters.budget) && (
                  <span className="filter-active-dot"></span>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="container events-body">
          {/* SIDEBAR FILTERS */}
          <div className={`sidebar ${showMobileFilters ? 'mobile-open' : ''}`}>
            <div className="mobile-filter-header">
              <h4>Filters &amp; Preferences</h4>
              <button className="btn-close-filter" onClick={() => setShowMobileFilters(false)}>
                ✕
              </button>
            </div>

            {/* Search Input */}
            <div className="filter-card">
              <h3>Search</h3>
              <div className="search-input-wrap">
                <input
                  className="form-control"
                  type="text"
                  placeholder="Keywords, artist, venue..."
                  value={filters.search}
                  onChange={(e) => onSearchChange(e.target.value)}
                />
                {filters.search && (
                  <button className="btn-clear-search" onClick={() => onSearchChange('')}>
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Location Filter */}
            <div className="filter-card">
              <h3>📍 City / Location</h3>
              <select
                className="form-control form-select-filter"
                value={filters.location}
                onChange={(e) => updateFiltersAndUrl({ ...filters, location: e.target.value })}
              >
                {locations.map((loc) => (
                  <option key={loc.value} value={loc.value}>
                    {loc.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Ticket Budget Filter */}
            <div className="filter-card">
              <h3>💰 Ticket Budget</h3>
              <div className="cat-list">
                {budgetOptions.map((b) => (
                  <button
                    key={b.value}
                    className={`cat-item ${filters.budget === b.value ? 'active' : ''}`}
                    onClick={() => updateFiltersAndUrl({ ...filters, budget: b.value })}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            <div className="filter-card">
              <h3>🏷️ Category</h3>
              <div className="cat-list">
                <button
                  className={`cat-item ${filters.category === '' ? 'active' : ''}`}
                  onClick={() => updateFiltersAndUrl({ ...filters, category: '' })}
                >
                  All Categories
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    className={`cat-item ${filters.category === cat ? 'active' : ''}`}
                    onClick={() => updateFiltersAndUrl({ ...filters, category: cat })}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <button className="btn btn-outline w-full" onClick={clearFilters}>
              Clear All Filters
            </button>
          </div>

          {/* MAIN EVENTS GRID */}
          <div className="events-main">
            {loading ? (
              <div className="spinner"></div>
            ) : events.length === 0 ? (
              <div className="empty-state">
                <span style={{ fontSize: '48px' }}>🎪</span>
                <h3>No events found</h3>
                <p className="text-muted">Try adjusting your filters</p>
                <button className="btn btn-primary mt-4" onClick={clearFilters}>
                  Clear Filters
                </button>
              </div>
            ) : (
              <>
                <div className="events-grid">
                  {events.map((event) => (
                    <Link to={`/events/${event._id}`} key={event._id} className="event-card">
                      <div className="event-img-wrap">
                        <img src={event.image} alt={event.title} loading="lazy" />
                        <div className="event-overlay"></div>
                        <span className={`event-price-tag ${event.isFree ? 'free' : ''}`}>
                          {getPrice(event)}
                        </span>
                        <span className="event-cat-tag">{event.category}</span>
                        {event.isOnline && <span className="event-online-tag">Online</span>}
                      </div>
                      <div className="event-info">
                        <h3>{event.title}</h3>
                        <p className="event-desc">
                          {event.description?.slice(0, 80)}...
                        </p>
                        <div className="event-meta">
                          <span className="material-icons">schedule</span>
                          {new Date(event.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </div>
                        <div className="event-meta">
                          <span className="material-icons">location_on</span>
                          {event.location}
                        </div>
                        <div className="event-footer">
                          <span className="event-tickets">
                            {event.availableTickets} tickets left
                          </span>
                          <span className={`event-price ${event.isFree ? 'free' : ''}`}>
                            {getPrice(event)}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* PAGINATION */}
                {totalPages > 1 && (
                  <div className="pagination">
                    <button
                      className="btn btn-outline btn-sm"
                      disabled={page === 1}
                      onClick={() => {
                        const newP = page - 1;
                        setPage(newP);
                        loadEvents(filters, newP);
                      }}
                    >
                      ← Prev
                    </button>
                    <span className="page-info">
                      Page {page} of {totalPages}
                    </span>
                    <button
                      className="btn btn-outline btn-sm"
                      disabled={page === totalPages}
                      onClick={() => {
                        const newP = page + 1;
                        setPage(newP);
                        loadEvents(filters, newP);
                      }}
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Events;
