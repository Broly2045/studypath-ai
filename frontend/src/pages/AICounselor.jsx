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
  Zap,
  Mic,
  MicOff,
  Volume2,
  VolumeX
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

  // Voice input state
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef(null);

  // Text-to-Speech state
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const speechSynthRef = useRef(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize speech recognition and synthesis
  useEffect(() => {
    // Speech Recognition (Voice Input)
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setSpeechSupported(true);
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join('');
        
        setInput(transcript);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          toast.error('Microphone access denied. Please enable it in your browser settings.');
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    // Speech Synthesis (TTS)
    if ('speechSynthesis' in window) {
      speechSynthRef.current = window.speechSynthesis;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (speechSynthRef.current) {
        speechSynthRef.current.cancel();
      }
    };
  }, []);

  // Function to speak text
  const speakText = (text) => {
    if (!speechSynthRef.current || !ttsEnabled) return;
    
    // Cancel any ongoing speech
    speechSynthRef.current.cancel();
    
    // Clean text for speech (remove emojis and special characters)
    const cleanText = text
      .replace(/[\u{1F600}-\u{1F6FF}]/gu, '')
      .replace(/[\u{2700}-\u{27BF}]/gu, '')
      .replace(/[\u{1F900}-\u{1F9FF}]/gu, '')
      .replace(/[\u{2600}-\u{26FF}]/gu, '');
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    // Try to get a good female English voice
    const voices = speechSynthRef.current.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.lang.includes('en') && (
        voice.name.includes('Samantha') ||  // macOS female
        voice.name.includes('Google UK English Female') ||
        voice.name.includes('Google US English') ||
        voice.name.includes('Microsoft Zira') ||  // Windows female
        voice.name.includes('Microsoft Jenny') || // Windows 11 female
        voice.name.includes('Female') ||
        voice.name.includes('Fiona') ||  // macOS
        voice.name.includes('Karen') ||  // macOS Australian
        voice.name.includes('Moira')     // macOS Irish
      )
    ) || voices.find(voice => 
      voice.lang.includes('en') && voice.name.toLowerCase().includes('female')
    ) || voices.find(voice => voice.lang.includes('en-US'));
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    speechSynthRef.current.speak(utterance);
  };

  // Stop speaking
  const stopSpeaking = () => {
    if (speechSynthRef.current) {
      speechSynthRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  // Toggle voice input
  const toggleListening = () => {
    if (!speechSupported) {
      toast.error('Voice input is not supported in your browser. Try Chrome or Edge.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      // Stop TTS if speaking
      if (isSpeaking) {
        stopSpeaking();
      }
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        toast.error('Could not start voice input. Please try again.');
      }
    }
  };

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
      // Stop any ongoing speech when switching conversations
      stopSpeaking();
      const response = await aiAPI.getConversation(conversationId);
      setCurrentConversation(response.data.data.conversation);
      setMessages(response.data.data.conversation.messages);
    } catch (error) {
      toast.error('Error loading conversation');
    }
  };

  const startNewConversation = () => {
    stopSpeaking();
    setCurrentConversation(null);
    setMessages([]);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    // Stop listening if currently recording
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    // Stop any ongoing speech
    stopSpeaking();

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

      // Speak the AI response
      speakText(aiResponse);

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
              {/* Speaker Toggle */}
              <button
                onClick={() => {
                  if (isSpeaking) stopSpeaking();
                  setTtsEnabled(!ttsEnabled);
                }}
                className={`p-2 rounded-lg transition-all ${
                  ttsEnabled 
                    ? 'hover:bg-dark-800 text-primary-400' 
                    : 'hover:bg-dark-800 text-dark-500'
                } ${isSpeaking ? 'animate-pulse' : ''}`}
                title={ttsEnabled ? "Voice enabled (click to mute)" : "Voice disabled (click to enable)"}
              >
                {ttsEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>
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

                {/* Voice Feature Highlight */}
                {speechSupported && (
                  <div className="mb-8 p-4 bg-primary-500/10 border border-primary-500/30 rounded-xl max-w-md mx-auto">
                    <div className="flex items-center justify-center gap-2 text-primary-400 mb-2">
                      <Mic className="w-5 h-5" />
                      <span className="font-medium">Voice Enabled!</span>
                      <Volume2 className="w-5 h-5" />
                    </div>
                    <p className="text-sm text-dark-400">
                      Click the mic to speak your questions. I'll respond with voice too!
                    </p>
                  </div>
                )}

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
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={isListening ? "Listening..." : "Ask anything or give me a command..."}
                  className="input-field w-full pr-12"
                  disabled={loading}
                />
                {/* Voice Input Button */}
                <button
                  type="button"
                  onClick={toggleListening}
                  disabled={loading}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all ${
                    isListening 
                      ? 'bg-red-500/20 text-red-400 animate-pulse' 
                      : 'hover:bg-dark-700 text-dark-400 hover:text-white'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title={isListening ? "Stop listening" : "Voice input"}
                >
                  {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
              </div>
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
            {/* Voice status hint */}
            <p className="text-xs text-dark-500 text-center mt-2">
              {isListening 
                ? '🎤 Speak now...' 
                : isSpeaking 
                  ? '🔊 PathFinder is speaking...' 
                  : speechSupported 
                    ? `🎤 Click mic to speak • 🔊 Voice is ${ttsEnabled ? 'on' : 'off'} • PathFinder can take actions!`
                    : 'PathFinder can take actions like adding tasks and shortlisting universities'
              }
            </p>
          </form>
        </div>
      </main>
    </div>
  );
};

export default AICounselor;