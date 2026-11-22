import api from './api';

export const adminService = {
  async getStats() {
    const res = await api.get('/admin/stats');
    return res.data;
  },

  // Users
  async getUsers() {
    const res = await api.get('/admin/users');
    return res.data;
  },
  async createUser(data) {
    const res = await api.post('/admin/users', data);
    return res.data;
  },
  async updateUser(id, data) {
    const res = await api.put(`/admin/users/${id}`, data);
    return res.data;
  },
  async deleteUser(id) {
    const res = await api.delete(`/admin/users/${id}`);
    return res.data;
  },

  // Participants
  async getParticipants() {
    const res = await api.get('/admin/participants');
    return res.data;
  },

  // Feedback
  async getFeedback(type) {
    const url = type ? `/admin/feedback?type=${type}` : '/admin/feedback';
    const res = await api.get(url);
    return res.data;
  },
  async updateFeedback(id, data) {
    const res = await api.put(`/admin/feedback/${id}`, data);
    return res.data;
  },
  async deleteFeedback(id) {
    const res = await api.delete(`/admin/feedback/${id}`);
    return res.data;
  },

  // Queries
  async getQueries() {
    const res = await api.get('/queries');
    return res.data;
  },
  async updateQuery(id, data) {
    const res = await api.put(`/queries/${id}`, data);
    return res.data;
  },
  async deleteQuery(id) {
    const res = await api.delete(`/queries/${id}`);
    return res.data;
  },

  // AI Insights
  async getAiInsights() {
    const res = await api.get('/admin/ai-insights');
    return res.data;
  },
  async generateAiInsights(prompt) {
    const res = await api.post('/admin/ai-insights', { prompt });
    return res.data;
  }
};

export default adminService;
