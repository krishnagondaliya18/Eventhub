import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import './AdminAiInsights.css';

export const AdminAiInsights = () => {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalTicketsSold: 0,
    totalBookings: 0,
    totalEvents: 0,
    categoryBreakdown: []
  });

  const [aiReport, setAiReport] = useState('');
  const [loading, setLoading] = useState(true);
  const [customPrompt, setCustomPrompt] = useState('');
  const [customPromptLoading, setCustomPromptLoading] = useState(false);
  const [lastGeneratedTime, setLastGeneratedTime] = useState(null);

  const loadData = () => {
    setLoading(true);
    adminService.getAiInsights()
      .then((res) => {
        setStats(res.stats || {
          totalRevenue: 0,
          totalTicketsSold: 0,
          totalBookings: 0,
          totalEvents: 0,
          categoryBreakdown: []
        });
        setAiReport(res.insights || res.analysis || '');
        setLastGeneratedTime(new Date());
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCustomPrompt = async (e) => {
    e.preventDefault();
    if (!customPrompt.trim()) return;

    setCustomPromptLoading(true);
    try {
      const res = await adminService.generateAiInsights(customPrompt.trim());
      setAiReport(res.insights || res.analysis || 'Analysis generated successfully.');
      setLastGeneratedTime(new Date());
      setCustomPrompt('');
    } catch {
      alert('Could not run AI analysis.');
    } finally {
      setCustomPromptLoading(false);
    }
  };

  return (
    <div className="page-enter">
      {/* TOP HEADER */}
      <div className="ai-header-bar">
        <div>
          <div className="ai-badge-top">
            <span className="material-icons sparkle-icon">auto_awesome</span>
            <span>POWERED BY GOOGLE GEMINI</span>
          </div>
          <h1 className="ai-main-title">Admin AI Intelligence &amp; Revenue Insights</h1>
          <p className="ai-sub-desc">
            Real-time revenue breakdown, event popularity trends, and smart growth suggestions for platform organizers.
          </p>
        </div>

        <div className="ai-header-actions">
          <button
            className="btn-refresh-ai"
            onClick={loadData}
            disabled={loading || customPromptLoading}
          >
            <span className={`material-icons ${loading ? 'spin-anim' : ''}`}>sync</span>
            <span>{loading ? 'Analyzing Data...' : 'Re-run AI Analysis'}</span>
          </button>
        </div>
      </div>

      {/* METRICS CARDS */}
      <div className="stats-ai-grid">
        <div className="stat-ai-card revenue-card">
          <div className="stat-icon-wrap rev-icon">
            <span className="material-icons">payments</span>
          </div>
          <div className="stat-details">
            <span className="stat-lbl">Gross Platform Revenue</span>
            <h2 className="stat-val">₹{(stats.totalRevenue || 0).toLocaleString()}</h2>
            <span className="stat-sub-badge">
              <span className="material-icons">trending_up</span> Razorpay Verified
            </span>
          </div>
        </div>

        <div className="stat-ai-card tickets-card">
          <div className="stat-icon-wrap tkt-icon">
            <span className="material-icons">confirmation_number</span>
          </div>
          <div className="stat-details">
            <span className="stat-lbl">Total Tickets Sold</span>
            <h2 className="stat-val">{stats.totalTicketsSold || 0}</h2>
            <span className="stat-sub-badge">{stats.totalBookings || 0} Confirmed Bookings</span>
          </div>
        </div>

        <div className="stat-ai-card events-card">
          <div className="stat-icon-wrap evt-icon">
            <span className="material-icons">event</span>
          </div>
          <div className="stat-details">
            <span className="stat-lbl">Live Catalog Events</span>
            <h2 className="stat-val">{stats.totalEvents || 0}</h2>
            <span className="stat-sub-badge">
              {(stats.categoryBreakdown || []).length} Distinct Categories
            </span>
          </div>
        </div>

        <div className="stat-ai-card ai-status-card">
          <div className="stat-icon-wrap spark-icon">
            <span className="material-icons">psychology</span>
          </div>
          <div className="stat-details">
            <span className="stat-lbl">AI Reasoning Status</span>
            <h2 className="stat-val live-val">Active</h2>
            {lastGeneratedTime && (
              <span className="stat-sub-badge">
                Updated {lastGeneratedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* AI ANALYSIS REPORT CARD */}
      <div className="card p-6" style={{ marginTop: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <span className="material-icons" style={{ color: '#8b5cf6', fontSize: '28px' }}>
            auto_awesome
          </span>
          <h2 style={{ margin: 0, fontSize: '1.4rem' }}>Executive AI Intelligence Report</h2>
        </div>

        {loading ? (
          <div className="center-pad">
            <div className="spinner"></div>
            <p className="text-muted" style={{ marginTop: '12px' }}>
              Gemini AI is analyzing real-time sales transactions, category traffic, and attendee retention...
            </p>
          </div>
        ) : (
          <div
            className="ai-report-content"
            style={{
              padding: '20px',
              background: 'var(--surface2, #f8f9fa)',
              borderRadius: '12px',
              lineHeight: 1.7,
              whiteSpace: 'pre-line'
            }}
          >
            {aiReport || 'No AI insights generated yet. Click "Re-run AI Analysis" above.'}
          </div>
        )}
      </div>

      {/* CUSTOM PROMPT / INQUIRY BOX */}
      <div className="card p-6" style={{ marginTop: '24px' }}>
        <h3>Ask Gemini AI Custom Growth Questions</h3>
        <p className="text-muted" style={{ fontSize: '14px', marginBottom: '16px' }}>
          Prompt the AI model for custom ticket pricing recommendations, marketing strategy, or organizer performance.
        </p>
        <form onSubmit={handleCustomPrompt} style={{ display: 'flex', gap: '12px' }}>
          <input
            type="text"
            className="form-control"
            placeholder="e.g. Which categories generated the highest revenue this month and how can we optimize ticket pricing?"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            disabled={customPromptLoading}
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={customPromptLoading || !customPrompt.trim()}
            style={{ whiteSpace: 'nowrap' }}
          >
            {customPromptLoading ? 'Analyzing...' : 'Ask AI'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminAiInsights;
