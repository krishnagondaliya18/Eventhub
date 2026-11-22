import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import eventService from '../services/eventService';
import './Home.css';

export const Home = () => {
  const navigate = useNavigate();

  const [newEvents, setNewEvents] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [highlightEvent, setHighlightEvent] = useState(null);
  const [moreEvents, setMoreEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBudget, setSelectedBudget] = useState('');

  // Auto-complete dropdown state
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const searchTimeoutRef = useRef(null);

  const trendingSearches = [
    'IPL Fan Park',
    'Sunburn EDM',
    'AI Summit',
    'Surat Garba',
    'Comedy Night',
    'Food Truck Fiesta'
  ];

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

  const filterCategories = [
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

  const categories = [
    { icon: '🎵', name: 'Music' },
    { icon: '⚽', name: 'Sports' },
    { icon: '💡', name: 'Technology' },
    { icon: '🍔', name: 'Food' },
    { icon: '🎬', name: 'Films' },
    { icon: '🎨', name: 'Art' },
    { icon: '💼', name: 'Business' },
    { icon: '🎉', name: 'Parties' }
  ];

  useEffect(() => {
    let isMounted = true;
    eventService.getEvents({ status: 'active', limit: 40 })
      .then((res) => {
        if (!isMounted) return;
        const allEvents = (res.events || []).sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        const now = Date.now();
        const oneDayMs = 24 * 60 * 60 * 1000;
        const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

        // 1. Upcoming in 24 Hours
        const next24h = allEvents.filter(e => {
          const diff = new Date(e.date).getTime() - now;
          return diff > 0 && diff <= oneDayMs;
        });

        let upcoming = [];
        if (next24h.length >= 2) {
          upcoming = next24h.slice(0, 2);
        } else {
          upcoming = allEvents.filter(e => new Date(e.date).getTime() > now).slice(0, 2);
        }
        setUpcomingEvents(upcoming);

        const upcomingIds = new Set(upcoming.map(e => e._id));

        // 2. Highlights This Week
        const thisWeek = allEvents.filter(e => {
          const diff = new Date(e.date).getTime() - now;
          return diff > 0 && diff <= sevenDaysMs && !upcomingIds.has(e._id);
        });

        let highlight = null;
        if (thisWeek.length > 0) {
          highlight = thisWeek[0];
        } else {
          highlight = allEvents.find(e => !upcomingIds.has(e._id) && new Date(e.date).getTime() > now) || allEvents[0] || null;
        }
        setHighlightEvent(highlight);

        // 3. Featured & More Events
        const usedIds = new Set([...upcomingIds, highlight?._id].filter(Boolean));
        const remaining = allEvents.filter(e => !usedIds.has(e._id));

        setNewEvents(remaining.slice(0, 3));
        setMoreEvents(remaining.slice(3, 9));
        setLoading(false);
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, []);

  const getTimeBadge = (dateStr) => {
    const now = Date.now();
    const eventTime = new Date(dateStr).getTime();
    const diffMs = eventTime - now;

    if (diffMs <= 0) {
      return { text: '⚡ Live / Happening Now', isUrgent: true };
    }

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      return { text: `⚡ Starts in ${diffMinutes}m!`, isUrgent: true };
    } else if (diffHours < 24) {
      return { text: `🔥 Starts in ${diffHours}h ${diffMinutes}m`, isUrgent: true };
    } else if (diffDays === 1) {
      return { text: `⏰ Tomorrow (${diffHours}h left)`, isUrgent: true };
    } else if (diffDays <= 7) {
      return { text: `📅 In ${diffDays} days (This Week)`, isUrgent: false };
    } else {
      return { text: `📅 In ${diffDays} days`, isUrgent: false };
    }
  };

  const onSearchInput = (val) => {
    setSearchQuery(val);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    const q = val.trim();
    if (!q) {
      setSuggestions([]);
      setShowDropdown(true);
      return;
    }

    setLoadingSuggestions(true);
    setShowDropdown(true);
    searchTimeoutRef.current = setTimeout(() => {
      eventService.getSuggestions(q)
        .then((res) => {
          setSuggestions(res.suggestions || []);
          setLoadingSuggestions(false);
        })
        .catch(() => {
          setLoadingSuggestions(false);
        });
    }, 200);
  };

  const closeDropdownWithDelay = () => {
    setTimeout(() => {
      setShowDropdown(false);
    }, 250);
  };

  const executeSearch = (overrideQuery) => {
    setShowDropdown(false);
    const params = new URLSearchParams();
    const q = overrideQuery !== undefined ? overrideQuery : searchQuery;
    if (q.trim()) params.set('search', q.trim());
    if (selectedLocation) params.set('location', selectedLocation);
    if (selectedCategory) params.set('category', selectedCategory);
    if (selectedBudget) params.set('budget', selectedBudget);

    navigate(`/events?${params.toString()}`);
  };

  const getPrice = (event) => (event.isFree ? 'Free' : `₹${event.price}`);

  return (
    <div className="home-page-root">
      <Navbar />

      {/* HERO SECTION */}
      <section className="hero">
        <div className="hero-bg"></div>
        <div className="hero-content">
          <h1>Pick up your<br /><span className="hero-accent">wonderful plans</span></h1>
          <p className="hero-sub">Discover thousands of events happening around you</p>
          <div className="hero-search-wrapper">
            <div className="hero-search">
              {/* SEARCH KEYWORD FIELD */}
              <div className="search-field search-keyword">
                <span className="material-icons field-icon">search</span>
                <div className="field-content">
                  <label className="field-label">Search</label>
                  <input
                    type="text"
                    placeholder="Events, artists, concerts, venues..."
                    value={searchQuery}
                    onChange={(e) => onSearchInput(e.target.value)}
                    onFocus={() => {
                      setShowDropdown(true);
                      if (searchQuery.trim() && suggestions.length === 0) onSearchInput(searchQuery);
                    }}
                    onBlur={closeDropdownWithDelay}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') executeSearch();
                    }}
                    autoComplete="off"
                  />
                </div>
                {searchQuery && (
                  <button
                    type="button"
                    className="btn-clear-q"
                    onClick={() => onSearchInput('')}
                  >
                    <span className="material-icons">close</span>
                  </button>
                )}

                {/* AUTOCOMPLETE DROPDOWN */}
                {showDropdown && (
                  <div className="search-suggestions-dropdown" onMouseDown={(e) => e.preventDefault()}>
                    {suggestions.length > 0 && (
                      <>
                        <div className="dropdown-header">
                          <span>🎪 Top Matches ({suggestions.length})</span>
                          <span className="dropdown-hint">Press Enter to view all</span>
                        </div>
                        <div className="suggestions-list">
                          {suggestions.map((item) => (
                            <div
                              key={item._id}
                              className="suggestion-item"
                              onClick={() => {
                                setShowDropdown(false);
                                navigate(`/events/${item._id}`);
                              }}
                            >
                              <img src={item.image} alt="" className="sugg-thumb" />
                              <div className="sugg-details">
                                <strong className="sugg-title">{item.title}</strong>
                                <div className="sugg-meta">
                                  <span className="sugg-cat">{item.category}</span>
                                  <span className="sugg-dot">&bull;</span>
                                  <span className="sugg-loc">
                                    <span className="material-icons">location_on</span>
                                    {item.location}
                                  </span>
                                  <span className="sugg-dot">&bull;</span>
                                  <span className="sugg-date">
                                    {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                  </span>
                                </div>
                              </div>
                              <div className={`sugg-price ${item.isFree ? 'free' : ''}`}>
                                {item.isFree ? 'FREE' : `₹${item.price}`}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="dropdown-footer" onClick={() => executeSearch()}>
                          <span>Explore all results for "<strong>{searchQuery}</strong>" &rarr;</span>
                        </div>
                      </>
                    )}

                    {suggestions.length === 0 && searchQuery.trim() && !loadingSuggestions && (
                      <div className="no-matches-box">
                        <span className="material-icons">search_off</span>
                        <p>No exact events found matching "<strong>{searchQuery}</strong>"</p>
                        <button type="button" className="btn-search-anyway" onClick={() => executeSearch()}>
                          Search all events &rarr;
                        </button>
                      </div>
                    )}

                    {!searchQuery.trim() && (
                      <div className="trending-box">
                        <div className="trending-title">
                          <span className="material-icons">local_fire_department</span>
                          <span>Trending Searches</span>
                        </div>
                        <div className="trending-chips">
                          {trendingSearches.map((t) => (
                            <button
                              key={t}
                              type="button"
                              className="trend-chip"
                              onMouseDown={() => {
                                setSearchQuery(t);
                                executeSearch(t);
                              }}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* LOCATION SELECTOR */}
              <div className="search-field search-location">
                <span className="material-icons field-icon">location_on</span>
                <div className="field-content">
                  <label className="field-label">Location</label>
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                  >
                    {locations.map((loc) => (
                      <option key={loc.value} value={loc.value}>
                        {loc.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* CATEGORY SELECTOR */}
              <div className="search-field search-category">
                <span className="material-icons field-icon">category</span>
                <div className="field-content">
                  <label className="field-label">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    <option value="">All Categories</option>
                    {filterCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* BUDGET SELECTOR */}
              <div className="search-field search-budget">
                <span className="material-icons field-icon">payments</span>
                <div className="field-content">
                  <label className="field-label">Budget</label>
                  <select
                    value={selectedBudget}
                    onChange={(e) => setSelectedBudget(e.target.value)}
                  >
                    {budgetOptions.map((b) => (
                      <option key={b.value} value={b.value}>
                        {b.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* SEARCH BUTTON */}
              <button type="button" className="btn-hero-search" onClick={() => executeSearch()}>
                <span className="material-icons">search</span>
                <span>Find Events</span>
              </button>
            </div>

            {/* POPULAR QUICK PILLS */}
            <div className="quick-tags-row">
              <span className="quick-tags-label">Popular:</span>
              <button
                type="button"
                className="quick-tag"
                onClick={() => {
                  setSelectedLocation('Surat');
                  navigate('/events?location=Surat');
                }}
              >
                📍 Surat
              </button>
              <button
                type="button"
                className="quick-tag"
                onClick={() => {
                  setSelectedLocation('Mumbai');
                  navigate('/events?location=Mumbai');
                }}
              >
                📍 Mumbai
              </button>
              <button
                type="button"
                className="quick-tag"
                onClick={() => {
                  setSelectedCategory('Music');
                  navigate('/events?category=Music');
                }}
              >
                🎵 Music
              </button>
              <button
                type="button"
                className="quick-tag"
                onClick={() => {
                  setSelectedCategory('Sports');
                  navigate('/events?category=Sports');
                }}
              >
                🏏 Cricket &amp; Sports
              </button>
              <button
                type="button"
                className="quick-tag"
                onClick={() => {
                  setSelectedBudget('free');
                  navigate('/events?budget=free');
                }}
              >
                🎁 Free Events
              </button>
              <button
                type="button"
                className="quick-tag"
                onClick={() => {
                  setSelectedBudget('under500');
                  navigate('/events?budget=under500');
                }}
              >
                💰 Under ₹500
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* TRENDING & FEATURED EVENTS */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2>Trending &amp; <span className="text-primary">Featured Events</span></h2>
            <Link to="/events" className="btn btn-outline btn-sm">View more</Link>
          </div>
          {loading ? (
            <div className="spinner"></div>
          ) : (
            <div className="events-grid-3">
              {newEvents.map((event) => (
                <Link to={`/events/${event._id}`} key={event._id} className="event-card">
                  <div className="event-img-wrap">
                    <img src={event.image} alt={event.title} loading="lazy" />
                    <div className="event-overlay">
                      <span className="event-title-overlay">{event.title}</span>
                    </div>
                    <span className={`event-price-tag ${event.isFree ? 'free' : ''}`}>
                      {getPrice(event)}
                    </span>
                  </div>
                  <div className="event-info">
                    <h3>{event.title}</h3>
                    <div className="event-meta">
                      <span>
                        <span className="material-icons">schedule</span>
                        {new Date(event.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric'
                        })}{' '}
                        | {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="event-meta">
                      <span>
                        <span className="material-icons">location_on</span>
                        {event.location}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="section section-grey">
        <div className="container">
          <h2 className="section-title">Explore by <span className="text-primary">categories</span></h2>
          <div className="categories-grid">
            {categories.map((cat) => (
              <Link to={`/events?category=${encodeURIComponent(cat.name)}`} key={cat.name} className="cat-card">
                <span className="cat-icon">{cat.icon}</span>
                <span className="cat-name">{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* UPCOMING 24H */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2>Upcoming <span className="text-primary">in 24h</span></h2>
              <p className="text-muted text-sm" style={{ margin: '4px 0 0' }}>
                Events starting today and tomorrow &bull; Live time check
              </p>
            </div>
            <Link to="/events" className="btn btn-outline btn-sm">View more</Link>
          </div>
          <div className="events-grid-2">
            {upcomingEvents.map((event) => {
              const badge = getTimeBadge(event.date);
              return (
                <Link to={`/events/${event._id}`} key={event._id} className="event-card-wide">
                  <div className="event-img-wrap-wide">
                    <img src={event.image} alt={event.title} loading="lazy" />
                    <span className={`live-countdown-badge ${badge.isUrgent ? 'urgent' : ''}`}>
                      {badge.text}
                    </span>
                    <div className="event-overlay-wide">
                      <h3>{event.title}</h3>
                    </div>
                  </div>
                  <div className="event-info-sm">
                    <p>{event.title}</p>
                    <span className="text-primary text-sm">from ₹{event.price}</span>
                    <div className="event-meta">
                      <span>
                        <span className="material-icons">schedule</span>
                        {new Date(event.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric'
                        })}{' '}
                        | {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="event-meta">
                      <span>
                        <span className="material-icons">location_on</span>
                        {event.location}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* HIGHLIGHT THIS WEEK */}
      {highlightEvent && (
        <section className="section section-grey">
          <div className="container">
            <div className="section-header">
              <div>
                <h2>Highlights <span className="text-primary">this week</span></h2>
                <p className="text-muted text-sm" style={{ margin: '4px 0 0' }}>
                  Don't miss the biggest event happening in the next 7 days
                </p>
              </div>
              <Link to="/events" className="btn btn-outline btn-sm">View more</Link>
            </div>
            <Link to={`/events/${highlightEvent._id}`} className="highlight-card">
              <div className="highlight-info">
                <div className="highlight-badge-row">
                  <span className="highlight-pill">THIS WEEK'S TOP PICK</span>
                  <span className={`live-countdown-badge ${getTimeBadge(highlightEvent.date).isUrgent ? 'urgent' : ''}`}>
                    {getTimeBadge(highlightEvent.date).text}
                  </span>
                </div>
                <span className="text-primary text-sm">from ₹{highlightEvent.price}</span>
                <h3>{highlightEvent.title}</h3>
                <div className="event-meta">
                  <span>
                    <span className="material-icons">schedule</span>
                    {new Date(highlightEvent.date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric'
                    })}{' '}
                    | {new Date(highlightEvent.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="event-meta">
                  <span>
                    <span className="material-icons">location_on</span>
                    {highlightEvent.location}
                  </span>
                </div>
                <button className="btn btn-primary mt-4">Purchase ticket</button>
              </div>
              <div className="highlight-img">
                <img src={highlightEvent.image} alt={highlightEvent.title} />
                <div className="highlight-title-overlay">
                  <h2>{highlightEvent.title}</h2>
                </div>
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* MORE EVENTS */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2>More events</h2>
            <Link to="/events" className="btn btn-outline btn-sm">View more</Link>
          </div>
          <div className="events-grid-3">
            {moreEvents.map((event) => (
              <Link to={`/events/${event._id}`} key={event._id} className="event-card">
                <div className="event-img-wrap">
                  <img src={event.image} alt={event.title} loading="lazy" />
                  <div className="event-overlay">
                    <span className="event-title-overlay">{event.title}</span>
                  </div>
                  <span className={`event-price-tag ${event.isFree ? 'free' : ''}`}>
                    {getPrice(event)}
                  </span>
                </div>
                <div className="event-info">
                  <h3>{event.title}</h3>
                  <div className="event-meta">
                    <span className="text-primary text-sm">
                      {event.isFree ? 'Free' : `from ₹${event.price}`}
                    </span>
                  </div>
                  <div className="event-meta">
                    <span>
                      <span className="material-icons">schedule</span>
                      {new Date(event.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                      })}{' '}
                      | {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="event-meta">
                    <span>
                      <span className="material-icons">location_on</span>
                      {event.location}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
