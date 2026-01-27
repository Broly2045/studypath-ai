import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap,
  Sparkles,
  Send,
  Plus,
  MessageSquare,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  University,
  ListTodo,
  Clock,
  Zap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { aiAPI } from '../services/api';
import toast from 'react-hot-toast';

const AICounselor = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      const response = await aiAPI.getConversations();
      setConversations(response.data.data.conversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const loadConversation = async (conversationId) => {
    try {
      const response = await aiAPI.getConversation(conversationId);
      setCurrentConversation(response.data.data.conversation);
      setMessages(response.data.data.conversation.messages);
    } catch (error) {
      toast.error('Error loading conversation');
    }
  };

  const startNewConversation = () => {
    setCurrentConversation(null);
    setMessages([]);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    
    // Add user message to UI immediately
    const tempUserMsg = { id: Date.now(), role: 'user', content: userMessage };
    setMessages((prev) => [...prev, tempUserMsg]);
    
    setLoading(true);

    try {
      const response = await aiAPI.chat(userMessage, currentConversation?.id);
      const { conversationId, response: aiResponse, actions } = response.data.data;

      // Update conversation ID if new
      if (!currentConversation) {
        setCurrentConversation({ id: conversationId });
        fetchConversations();
      }

      // Add AI response
      const aiMsg = { 
        id: Date.now() + 1, 
        role: 'assistant', 
        content: aiResponse,
        actions 
      };
      setMessages((prev) => [...prev, aiMsg]);

      // Show action notifications
      if (actions && actions.length > 0) {
        actions.forEach((action) => {
          if (action.success) {
            switch (action.action) {
              case 'SHORTLIST_UNIVERSITY':
                toast.success(`Added ${action.university} to shortlist!`, { icon: '🎓' });
                break;
              case 'ADD_TASK':
                toast.success(`Task added: ${action.task}`, { icon: '✅' });
                break;
              case 'COMPLETE_TASK':
                toast.success(`Task completed: ${action.task}`, { icon: '🎉' });
                break;
              case 'UPDATE_PROFILE':
                toast.success(`Profile updated: ${action.field}`, { icon: '📝' });
                break;
            }
          }
        });
      }
    } catch (error) {
      toast.error('Failed to get response. Please try again.');
      // Remove the temp user message on error
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
    } finally {
      setLoading(false);
    }
  };

  const suggestedQuestions = [
    "What universities should I apply to?",
    "Help me improve my profile strength",
    "What should I do next?",
    "Add a task to prepare for GRE",
    "Shortlist MIT as a dream university",
  ];

  return (
    <div className="min-h-screen flex">
      {/* Sidebar - Conversation History */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-dark-900/95 backdrop-blur-xl border-r border-dark-800 transform transition-transform duration-300 lg:relative lg:translate-x-0 ${showSidebar ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-dark-800">
            <Link to="/dashboard" className="flex items-center gap-2 text-dark-400 hover:text-white mb-4">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back to Dashboard</span>
            </Link>
            <button onClick={startNewConversation} className="w-full btn-primary flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" />
              New Conversation
            </button>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {conversations.length > 0 ? (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => loadConversation(conv.id)}
                  className={`w-full p-3 rounded-xl text-left transition-all ${
                    currentConversation?.id === conv.id
                      ? 'bg-primary-500/10 border border-primary-500/30'
                      : 'hover:bg-dark-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-dark-500" />
                    <span className="truncate text-sm">{conv.title || 'New Conversation'}</span>
                  </div>
                  <div className="text-xs text-dark-500 mt-1">
                    {new Date(conv.updatedAt).toLocaleDateString()}
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center text-dark-500 py-8">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No conversations yet</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Chat Header */}
        <div className="border-b border-dark-800 px-6 py-4">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-semibold">PathFinder AI</h1>
                <p className="text-sm text-dark-500">Your study abroad counselor</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-3 py-1 bg-accent-500/20 text-accent-400 text-xs rounded-full flex items-center gap-1">
                <Zap className="w-3 h-3" />
                Takes Actions
              </div>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-6 py-8">
          <div className="max-w-4xl mx-auto">
            {messages.length === 0 ? (
              /* Welcome Screen */
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-12">
                <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-accent-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-primary-500/30">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Hello, {user?.fullName?.split(' ')[0]}!</h2>
                <p className="text-dark-400 mb-8 max-w-md mx-auto">
                  I'm PathFinder, your AI counselor. I can help you find universities, 
                  manage tasks, and guide your study abroad journey. <strong>I can also take actions</strong> like 
                  adding universities to your shortlist!
                </p>

                {/* Capabilities */}
                <div className="grid md:grid-cols-3 gap-4 mb-8">
                  {[
                    { icon: University, title: 'Find Universities', desc: 'Get personalized recommendations' },
                    { icon: ListTodo, title: 'Manage Tasks', desc: 'Add and complete tasks' },
                    { icon: CheckCircle2, title: 'Take Actions', desc: 'I can do things for you!' },
                  ].map((item) => (
                    <div key={item.title} className="glass-card p-4 text-left">
                      <item.icon className="w-6 h-6 text-primary-400 mb-2" />
                      <div className="font-medium text-sm">{item.title}</div>
                      <div className="text-xs text-dark-500">{item.desc}</div>
                    </div>
                  ))}
                </div>

                {/* Suggested Questions */}
                <div>
                  <p className="text-sm text-dark-500 mb-3">Try asking:</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {suggestedQuestions.map((q) => (
                      <button
                        key={q}
                        onClick={() => setInput(q)}
                        className="px-4 py-2 bg-dark-800 hover:bg-dark-700 rounded-full text-sm transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : (
              /* Chat Messages */
              <div className="space-y-6">
                <AnimatePresence>
                  {messages.map((msg, i) => (
                    <motion.div
                      key={msg.id || i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex gap-3 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        {/* Avatar */}
                        <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center ${
                          msg.role === 'user' 
                            ? 'bg-primary-500' 
                            : 'bg-gradient-to-br from-primary-500 to-accent-500'
                        }`}>
                          {msg.role === 'user' ? (
                            <span className="text-xs font-bold">{user?.fullName?.charAt(0)}</span>
                          ) : (
                            <Sparkles className="w-4 h-4 text-white" />
                          )}
                        </div>

                        {/* Message Content */}
                        <div>
                          <div className={`chat-bubble ${msg.role}`}>
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                          </div>
                          
                          {/* Actions taken */}
                          {msg.actions && msg.actions.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {msg.actions.filter(a => a.success).map((action, j) => (
                                <div key={j} className="flex items-center gap-2 text-xs text-accent-400">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>
                                    {action.action === 'SHORTLIST_UNIVERSITY' && `Added ${action.university} to shortlist`}
                                    {action.action === 'ADD_TASK' && `Created task: ${action.task}`}
                                    {action.action === 'COMPLETE_TASK' && `Completed: ${action.task}`}
                                    {action.action === 'UPDATE_PROFILE' && `Updated ${action.field}`}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Loading indicator */}
                {loading && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                      <div className="chat-bubble assistant flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Thinking...</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t border-dark-800 px-6 py-4">
          <form onSubmit={handleSend} className="max-w-4xl mx-auto">
            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything or give me a command..."
                className="input-field flex-1"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="btn-primary px-6 flex items-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span className="hidden md:inline">Send</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-dark-500 text-center mt-2">
              PathFinder can take actions like adding tasks and shortlisting universities
            </p>
          </form>
        </div>
      </main>
    </div>
  );
};

export default AICounselor;
