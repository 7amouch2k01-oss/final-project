const aiService = require('../services/aiService');
const { success } = require('../utils/apiResponse');

/**
 * POST /api/ai/chat
 * Query the AI Assistant
 */
const chat = async (req, res, next) => {
  try {
    const { message, history } = req.body;
    const userRole = req.user?.role || 'guest';
    const userName = req.user?.name || '';

    const result = await aiService.processQuery({
      message,
      userRole,
      userName,
      history,
    });

    success(res, result);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/ai/suggestions
 * Get contextual starter suggestions based on user role
 */
const getSuggestions = async (req, res, next) => {
  try {
    const role = req.user?.role || 'guest';
    let suggestions = [];

    if (role === 'student') {
      suggestions = [
        '🎓 How do I apply to universities?',
        '💼 Show me available PFE internships (Stages)',
        '📄 How does automatic CV attachment work?',
        '🎓 How do I graduate my account to Citizen?',
      ];
    } else if (role === 'citizen') {
      suggestions = [
        '📢 How do I publish a daily "Hire-Me" gig?',
        '💼 Find latest developer & engineering jobs',
        '📬 Where do I see client inquiries & work offers?',
        '🏢 How do I request Recruiter posting rights?',
      ];
    } else {
      suggestions = [
        '🇹🇳 What is TuniStudy & TuniJob?',
        '🎓 Explore top universities in Tunisia',
        '💼 Find internship and job opportunities',
        '🏛️ How can my company or university register?',
      ];
    }

    success(res, { suggestions });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  chat,
  getSuggestions,
};
