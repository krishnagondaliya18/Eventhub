const express = require('express');
const router = express.Router();
const { chatWithAI, generateAdminInsights } = require('../services/gemini.service');
const { protect, adminOnly } = require('../middleware/auth');

/**
 * POST /api/ai/chat
 * User & Organizer intelligent chatbot
 * Body: { message: string, history?: Array, role?: string }
 */
router.post('/chat', async (req, res) => {
  try {
    const { message, history, role } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const reply = await chatWithAI({
      message: message.trim(),
      history: history || [],
      role: role || 'user'
    });

    res.json({ success: true, reply });
  } catch (error) {
    console.error('[AI CHAT ERROR]', error);
    res.status(500).json({ success: false, message: 'AI Assistant temporarily unavailable', error: error.message });
  }
});

/**
 * POST /api/ai/admin-insights
 * Executive AI analytics for revenue, popular events, and recommendations
 * Protected for Admin role only
 */
router.post('/admin-insights', protect, adminOnly, async (req, res) => {
  try {
    const { customPrompt } = req.body;
    const data = await generateAdminInsights({ customPrompt });
    res.json(data);
  } catch (error) {
    console.error('[ADMIN AI INSIGHTS ERROR]', error);
    res.status(500).json({ success: false, message: 'Failed to generate AI insights', error: error.message });
  }
});

module.exports = router;
