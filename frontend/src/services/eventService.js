import api from './api';

export const eventService = {
  async getEvents(filters = {}) {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      const val = filters[key];
      if (val !== null && val !== undefined && val !== '') {
        params.append(key, val);
      }
    });
    const res = await api.get(`/events?${params.toString()}`);
    return res.data;
  },

  async getEvent(id) {
    const res = await api.get(`/events/${id}`);
    return res.data;
  },

  async getSuggestions(q) {
    const res = await api.get(`/events/suggestions?q=${encodeURIComponent(q)}`);
    return res.data;
  },

  async createEvent(data) {
    const res = await api.post('/events', data);
    return res.data;
  },

  async updateEvent(id, data) {
    const res = await api.put(`/events/${id}`, data);
    return res.data;
  },

  async deleteEvent(id) {
    const res = await api.delete(`/events/${id}`);
    return res.data;
  },

  async registerForEvent(id) {
    const res = await api.post(`/events/${id}/register`, {});
    return res.data;
  },

  // Comments
  async getComments(eventId) {
    const res = await api.get(`/events/${eventId}/comments`);
    return res.data;
  },

  async addComment(eventId, text) {
    const res = await api.post(`/events/${eventId}/comments`, { text });
    return res.data;
  },

  async updateComment(eventId, commentId, text) {
    const res = await api.put(`/events/${eventId}/comments/${commentId}`, { text });
    return res.data;
  },

  async deleteComment(eventId, commentId) {
    const res = await api.delete(`/events/${eventId}/comments/${commentId}`);
    return res.data;
  }
};

export default eventService;
