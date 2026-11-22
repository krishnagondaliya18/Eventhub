import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Providers & Components
import { ProtectedRoute, AdminRoute, OrganizerRoute } from './components/ProtectedRoute';
import AiChatbot from './components/AiChatbot';

// Main Pages
import Home from './pages/Home';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';
import Bookings from './pages/Bookings';
import Profile from './pages/Profile';
import Feedback from './pages/Feedback';
import Queries from './pages/Queries';
import OrganizerEvents from './pages/OrganizerEvents';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Legal & Policy Pages
import Contact from './pages/policies/Contact';
import Privacy from './pages/policies/Privacy';
import Terms from './pages/policies/Terms';
import RefundPolicy from './pages/policies/RefundPolicy';

// Admin Pages
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminEventList from './pages/admin/AdminEventList';
import AdminUsers from './pages/admin/AdminUsers';
import AdminParticipants from './pages/admin/AdminParticipants';
import AdminFeedback from './pages/admin/AdminFeedback';
import AdminQueries from './pages/admin/AdminQueries';
import AdminAiInsights from './pages/admin/AdminAiInsights';

export const App = () => {
  return (
    <>
      <Routes>
        {/* PUBLIC & GENERAL ROUTES */}
        <Route path="/" element={<Home />} />
        <Route path="/events" element={<Events />} />
        <Route path="/events/:id" element={<EventDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* PROTECTED USER ROUTES */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bookings"
          element={
            <ProtectedRoute>
              <Bookings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/feedback"
          element={
            <ProtectedRoute>
              <Feedback />
            </ProtectedRoute>
          }
        />
        <Route
          path="/queries"
          element={
            <ProtectedRoute>
              <Queries />
            </ProtectedRoute>
          }
        />

        {/* ORGANIZER ROUTES */}
        <Route
          path="/organizer/events"
          element={
            <OrganizerRoute>
              <OrganizerEvents />
            </OrganizerRoute>
          }
        />

        {/* POLICIES & LEGAL */}
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/refund-policy" element={<RefundPolicy />} />
        <Route path="/cancellation-refund" element={<Navigate to="/refund-policy" replace />} />
        <Route path="/contact" element={<Contact />} />

        {/* ADMIN ROUTES */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="event-list" element={<AdminEventList />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="participants" element={<AdminParticipants />} />
          <Route path="feedback" element={<AdminFeedback />} />
          <Route path="queries" element={<AdminQueries />} />
          <Route path="ai-insights" element={<AdminAiInsights />} />
        </Route>

        {/* 404 CATCH-ALL */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* 24/7 AI HELP & SUPPORT FLOATING WIDGET */}
      <AiChatbot />
    </>
  );
};

export default App;
