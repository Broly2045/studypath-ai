const aiService = require('../services/ai.service');

// @desc    Chat with AI Counselor
// @route   POST /api/ai/chat
const chat = async (req, res) => {
  try {
    const { message, conversationId } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Message is required.',
      });
    }

    const result = await aiService.chat(req.user.id, message, conversationId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('AI Chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing your message. Please try again.',
    });
  }
};

// @desc    Get all conversations
// @route   GET /api/ai/conversations
const getConversations = async (req, res) => {
  try {
    const conversations = await aiService.getConversations(req.user.id);

    res.json({
      success: true,
      data: { conversations },
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching conversations.',
    });
  }
};

// @desc    Get single conversation
// @route   GET /api/ai/conversations/:id
const getConversation = async (req, res) => {
  try {
    const conversation = await aiService.getConversation(req.params.id, req.user.id);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found.',
      });
    }

    res.json({
      success: true,
      data: { conversation },
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching conversation.',
    });
  }
};

// @desc    AI-led onboarding chat
// @route   POST /api/ai/onboarding
const onboardingChat = async (req, res) => {
  try {
    const { message, section } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Message is required.',
      });
    }

    const result = await aiService.onboardingChat(
      req.user.id,
      message,
      section || 'academic'
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Onboarding chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing your message.',
    });
  }
};

module.exports = {
  chat,
  getConversations,
  getConversation,
  onboardingChat,
};
