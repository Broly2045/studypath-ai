import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GraduationCap, 
  BookOpen, 
  Target, 
  Wallet, 
  FileText,
  ArrowRight,
  ArrowLeft,
  Check,
  Sparkles,
  MessageSquare,
  Loader2,
  Mic,
  MicOff,
  X,
  Volume2,
  VolumeX
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { profileAPI, aiAPI } from '../services/api';
import toast from 'react-hot-toast';

const SECTIONS = [
  { id: 'academic', title: 'Academic Background', icon: BookOpen },
  { id: 'goals', title: 'Study Goals', icon: Target },
  { id: 'budget', title: 'Budget & Funding', icon: Wallet },
  { id: 'exams', title: 'Exams & Readiness', icon: FileText },
];

const COUNTRIES = [
  { code: 'USA', name: 'United States', flag: '🇺🇸' },
  { code: 'UK', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'CAN', name: 'Canada', flag: '🇨🇦' },
  { code: 'AUS', name: 'Australia', flag: '🇦🇺' },
  { code: 'GER', name: 'Germany', flag: '🇩🇪' },
  { code: 'NLD', name: 'Netherlands', flag: '🇳🇱' },
  { code: 'IRL', name: 'Ireland', flag: '🇮🇪' },
  { code: 'SGP', name: 'Singapore', flag: '🇸🇬' },
];

const Onboarding = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [mode, setMode] = useState(null);
  const [currentSection, setCurrentSection] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // Refs for auto-scroll and voice
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  
  // Voice input state
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef(null);
  
  // Text-to-Speech state
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const speechSynthRef = useRef(null);
  
  const [formData, setFormData] = useState({
    educationLevel: '',
    currentDegree: '',
    major: '',
    graduationYear: new Date().getFullYear(),
    gpa: '',
    gpaScale: '10',
    intendedDegree: '',
    fieldOfStudy: '',
    targetIntakeYear: new Date().getFullYear() + 1,
    targetIntakeSeason: 'fall',
    preferredCountries: [],
    budgetMin: '',
    budgetMax: '',
    fundingPlan: '',
    ieltsStatus: 'not_started',
    ieltsScore: '',
    toeflStatus: 'not_started',
    toeflScore: '',
    greStatus: 'not_started',
    greScore: '',
    gmatStatus: 'not_started',
    gmatScore: '',
    sopStatus: 'not_started',
  });

  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [aiSection, setAiSection] = useState('academic');

  // Initialize speech recognition
  useEffect(() => {
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
        
        setChatInput(transcript);
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

    // Initialize speech synthesis
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
    const cleanText = text.replace(/[\u{1F600}-\u{1F6FF}]/gu, '').replace(/[\u{2700}-\u{27BF}]/gu, '');
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    // Try to get a good English voice
    const voices = speechSynthRef.current.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.lang.includes('en') && (voice.name.includes('Google') || voice.name.includes('Samantha') || voice.name.includes('Microsoft'))
    ) || voices.find(voice => voice.lang.includes('en'));
    
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

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, chatLoading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const toggleListening = () => {
    if (!speechSupported) {
      toast.error('Voice input is not supported in your browser. Try Chrome or Edge.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        toast.error('Could not start voice input. Please try again.');
      }
    }
  };

  const updateFormData = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleCountry = (code) => {
    setFormData((prev) => ({
      ...prev,
      preferredCountries: prev.preferredCountries.includes(code)
        ? prev.preferredCountries.filter((c) => c !== code)
        : [...prev.preferredCountries, code],
    }));
  };

  const handleNext = async () => {
    if (currentSection < SECTIONS.length - 1) {
      try {
        await profileAPI.update(formData);
      } catch (error) {
        console.error('Error saving profile:', error);
      }
      setCurrentSection((prev) => prev + 1);
    } else {
      await handleComplete();
    }
  };

  const handleBack = () => {
    if (currentSection > 0) {
      setCurrentSection((prev) => prev - 1);
    } else {
      // If on first section, go back to mode selection
      goBackToModeSelection();
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      await profileAPI.update(formData);
      await profileAPI.completeOnboarding();
      updateUser({ onboardingCompleted: true, currentStage: 2 });
      toast.success('Profile complete! Let\'s find your perfect universities.');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error completing onboarding');
    } finally {
      setLoading(false);
    }
  };

  const handleAIChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    // Stop listening if currently recording
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    const userMessage = chatInput.trim();
    setChatInput('');
    setChatMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setChatLoading(true);

    try {
      const response = await aiAPI.onboardingChat(userMessage, aiSection);
      const { response: aiResponse, sectionComplete } = response.data.data;
      
      setChatMessages((prev) => [...prev, { role: 'assistant', content: aiResponse }]);
      
      // Speak the AI response
      speakText(aiResponse);

      if (sectionComplete) {
        const sectionIndex = SECTIONS.findIndex((s) => s.id === aiSection);
        if (sectionIndex < SECTIONS.length - 1) {
          setAiSection(SECTIONS[sectionIndex + 1].id);
        } else {
          setTimeout(() => handleComplete(), 1500);
        }
      }
    } catch (error) {
      toast.error('AI response failed. Please try again.');
    } finally {
      setChatLoading(false);
    }
  };

  const startAIOnboarding = () => {
    setMode('ai');
    const greeting = `Hi ${user?.fullName?.split(' ')[0] || 'there'}! 👋 I'm PathFinder, your AI counselor. I'll help you set up your profile through a quick conversation.\n\nLet's start with your academic background. What's your current education level? Are you a high school student, undergraduate, or have you already completed your bachelor's degree?`;
    setChatMessages([{
      role: 'assistant',
      content: greeting
    }]);
    // Speak the greeting after a short delay
    setTimeout(() => speakText(greeting), 500);
  };

  const goBackToModeSelection = () => {
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
    // Stop any ongoing speech
    stopSpeaking();
    setMode(null);
    setChatMessages([]);
    setChatInput('');
    setAiSection('academic');
    setCurrentSection(0);
  };

  if (!mode) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl w-full">
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-3">Welcome, {user?.fullName?.split(' ')[0]}!</h1>
            <p className="text-dark-400">Let's set up your profile. Choose how you'd like to proceed:</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setMode('form')} className="glass-card p-8 text-left hover:border-primary-500/50 transition-all">
              <div className="w-12 h-12 bg-primary-500/20 rounded-xl flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-primary-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Step-by-Step Form</h3>
              <p className="text-dark-400 text-sm mb-4">Fill out a structured form with all required fields.</p>
              <div className="flex items-center gap-2 text-primary-400">
                <span className="text-sm font-medium">Start Form</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </motion.button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={startAIOnboarding} className="glass-card p-8 text-left hover:border-accent-500/50 transition-all relative overflow-hidden">
              <div className="absolute top-2 right-2 px-2 py-1 bg-accent-500/20 rounded-full">
                <span className="text-xs text-accent-400 font-medium">Recommended</span>
              </div>
              <div className="w-12 h-12 bg-accent-500/20 rounded-xl flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-accent-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Chat with AI</h3>
              <p className="text-dark-400 text-sm mb-4">Have a conversation with our AI counselor.</p>
              <div className="flex items-center gap-2 text-accent-400">
                <span className="text-sm font-medium">Start Conversation</span>
                <MessageSquare className="w-4 h-4" />
              </div>
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (mode === 'ai') {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="border-b border-dark-800 px-6 py-4">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Back Button */}
              <button 
                onClick={goBackToModeSelection}
                className="p-2 rounded-lg hover:bg-dark-800 transition-colors text-dark-400 hover:text-white"
                title="Go back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-semibold">PathFinder AI</h1>
                <p className="text-sm text-dark-500">Setting up your profile</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {SECTIONS.map((section, i) => (
                <div key={section.id} className={`w-2 h-2 rounded-full transition-all ${section.id === aiSection ? 'w-6 bg-primary-500' : SECTIONS.findIndex((s) => s.id === aiSection) > i ? 'bg-accent-500' : 'bg-dark-700'}`} />
              ))}
              {/* Speaker Toggle */}
              <button
                onClick={() => {
                  if (isSpeaking) stopSpeaking();
                  setTtsEnabled(!ttsEnabled);
                }}
                className={`ml-2 p-2 rounded-lg transition-all ${
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
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto px-6 py-8">
          <div className="max-w-3xl mx-auto space-y-4">
            <AnimatePresence>
              {chatMessages.map((msg, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`chat-bubble ${msg.role}`}>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {chatLoading && (
              <div className="flex justify-start">
                <div className="chat-bubble assistant flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Thinking...</span>
                </div>
              </div>
            )}
            {/* Auto-scroll anchor */}
            <div ref={messagesEndRef} />
          </div>
        </div>
        <div className="border-t border-dark-800 px-6 py-4">
          <form onSubmit={handleAIChat} className="max-w-3xl mx-auto flex gap-3">
            <div className="flex-1 relative">
              <input 
                type="text" 
                value={chatInput} 
                onChange={(e) => setChatInput(e.target.value)} 
                placeholder={isListening ? "Listening..." : "Type your response..."} 
                className="input-field w-full pr-12" 
                disabled={chatLoading} 
              />
              {/* Voice Input Button */}
              <button
                type="button"
                onClick={toggleListening}
                disabled={chatLoading}
                className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all ${
                  isListening 
                    ? 'bg-red-500/20 text-red-400 animate-pulse' 
                    : 'hover:bg-dark-700 text-dark-400 hover:text-white'
                } ${chatLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={isListening ? "Stop listening" : "Voice input"}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
            </div>
            <button type="submit" disabled={chatLoading || !chatInput.trim()} className="btn-primary px-6">Send</button>
          </form>
          {/* Voice input hint */}
          {speechSupported && (
            <p className="text-center text-xs text-dark-500 mt-2">
              {isListening ? '🎤 Speak now...' : isSpeaking ? '🔊 PathFinder is speaking...' : '🎤 Click mic to speak • 🔊 Voice is ' + (ttsEnabled ? 'on' : 'off')}
            </p>
          )}
        </div>
      </div>
    );
  }

  const renderSectionContent = () => {
    switch (SECTIONS[currentSection].id) {
      case 'academic':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-3">Current Education Level</label>
              <div className="grid grid-cols-3 gap-3">
                {[{ value: 'high_school', label: 'High School' }, { value: 'bachelors', label: "Bachelor's" }, { value: 'masters', label: "Master's" }].map((opt) => (
                  <button key={opt.value} type="button" onClick={() => updateFormData('educationLevel', opt.value)} className={`p-4 rounded-xl border transition-all ${formData.educationLevel === opt.value ? 'border-primary-500 bg-primary-500/10 text-primary-400' : 'border-dark-700 hover:border-dark-600'}`}>{opt.label}</button>
                ))}
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Current Degree/Program</label>
                <input type="text" value={formData.currentDegree} onChange={(e) => updateFormData('currentDegree', e.target.value)} placeholder="e.g., B.Tech, BBA" className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Major/Field</label>
                <input type="text" value={formData.major} onChange={(e) => updateFormData('major', e.target.value)} placeholder="e.g., Computer Science" className="input-field" />
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Graduation Year</label>
                <input type="number" value={formData.graduationYear} onChange={(e) => updateFormData('graduationYear', parseInt(e.target.value))} min="2000" max="2030" className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">GPA/Percentage</label>
                <input type="number" value={formData.gpa} onChange={(e) => updateFormData('gpa', e.target.value)} placeholder="e.g., 8.5" step="0.1" className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Scale</label>
                <select value={formData.gpaScale} onChange={(e) => updateFormData('gpaScale', e.target.value)} className="input-field">
                  <option value="10">Out of 10</option>
                  <option value="4">Out of 4</option>
                  <option value="100">Out of 100</option>
                </select>
              </div>
            </div>
          </div>
        );
      case 'goals':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-3">Intended Degree</label>
              <div className="grid grid-cols-4 gap-3">
                {[{ value: 'bachelors', label: "Bachelor's" }, { value: 'masters', label: "Master's" }, { value: 'mba', label: 'MBA' }, { value: 'phd', label: 'PhD' }].map((opt) => (
                  <button key={opt.value} type="button" onClick={() => updateFormData('intendedDegree', opt.value)} className={`p-4 rounded-xl border transition-all ${formData.intendedDegree === opt.value ? 'border-primary-500 bg-primary-500/10 text-primary-400' : 'border-dark-700 hover:border-dark-600'}`}>{opt.label}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">Field of Study</label>
              <input type="text" value={formData.fieldOfStudy} onChange={(e) => updateFormData('fieldOfStudy', e.target.value)} placeholder="e.g., Computer Science, Data Science" className="input-field" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Target Intake Year</label>
                <input type="number" value={formData.targetIntakeYear} onChange={(e) => updateFormData('targetIntakeYear', parseInt(e.target.value))} min={new Date().getFullYear()} max={new Date().getFullYear() + 5} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Target Season</label>
                <select value={formData.targetIntakeSeason} onChange={(e) => updateFormData('targetIntakeSeason', e.target.value)} className="input-field">
                  <option value="fall">Fall (Aug-Sep)</option>
                  <option value="spring">Spring (Jan-Feb)</option>
                  <option value="summer">Summer (May-Jun)</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-3">Preferred Countries</label>
              <div className="grid grid-cols-4 gap-3">
                {COUNTRIES.map((country) => (
                  <button key={country.code} type="button" onClick={() => toggleCountry(country.code)} className={`p-3 rounded-xl border transition-all flex items-center gap-2 ${formData.preferredCountries.includes(country.code) ? 'border-primary-500 bg-primary-500/10' : 'border-dark-700 hover:border-dark-600'}`}>
                    <span className="text-xl">{country.flag}</span>
                    <span className="text-sm">{country.code}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      case 'budget':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-3">Budget Range (USD per year)</label>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-dark-500 mb-1">Minimum</label>
                  <input type="number" value={formData.budgetMin} onChange={(e) => updateFormData('budgetMin', e.target.value)} placeholder="e.g., 20000" className="input-field" />
                </div>
                <div>
                  <label className="block text-xs text-dark-500 mb-1">Maximum</label>
                  <input type="number" value={formData.budgetMax} onChange={(e) => updateFormData('budgetMax', e.target.value)} placeholder="e.g., 50000" className="input-field" />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-3">Funding Plan</label>
              <div className="grid md:grid-cols-2 gap-3">
                {[{ value: 'self_funded', label: 'Self-Funded', desc: 'Personal/family funds' }, { value: 'scholarship', label: 'Scholarship-Dependent', desc: 'Need scholarship' }, { value: 'loan', label: 'Education Loan', desc: 'Planning to take a loan' }, { value: 'mixed', label: 'Mixed Funding', desc: 'Combination of sources' }].map((opt) => (
                  <button key={opt.value} type="button" onClick={() => updateFormData('fundingPlan', opt.value)} className={`p-4 rounded-xl border transition-all text-left ${formData.fundingPlan === opt.value ? 'border-primary-500 bg-primary-500/10' : 'border-dark-700 hover:border-dark-600'}`}>
                    <div className="font-medium">{opt.label}</div>
                    <div className="text-sm text-dark-500">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      case 'exams':
        return (
          <div className="space-y-6">
            <div className="glass-card p-5">
              <h4 className="font-medium mb-4">English Proficiency</h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-dark-400 mb-2">IELTS Status</label>
                  <select value={formData.ieltsStatus} onChange={(e) => updateFormData('ieltsStatus', e.target.value)} className="input-field">
                    <option value="not_started">Not Started</option>
                    <option value="preparing">Preparing</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-dark-400 mb-2">TOEFL Status</label>
                  <select value={formData.toeflStatus} onChange={(e) => updateFormData('toeflStatus', e.target.value)} className="input-field">
                    <option value="not_started">Not Started</option>
                    <option value="preparing">Preparing</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="glass-card p-5">
              <h4 className="font-medium mb-4">Standardized Tests</h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-dark-400 mb-2">GRE Status</label>
                  <select value={formData.greStatus} onChange={(e) => updateFormData('greStatus', e.target.value)} className="input-field">
                    <option value="not_started">Not Started</option>
                    <option value="preparing">Preparing</option>
                    <option value="completed">Completed</option>
                    <option value="not_required">Not Required</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-dark-400 mb-2">GMAT Status</label>
                  <select value={formData.gmatStatus} onChange={(e) => updateFormData('gmatStatus', e.target.value)} className="input-field">
                    <option value="not_started">Not Started</option>
                    <option value="preparing">Preparing</option>
                    <option value="completed">Completed</option>
                    <option value="not_required">Not Required</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="glass-card p-5">
              <h4 className="font-medium mb-4">Statement of Purpose</h4>
              <div className="grid grid-cols-3 gap-3">
                {[{ value: 'not_started', label: 'Not Started' }, { value: 'draft', label: 'Draft Ready' }, { value: 'ready', label: 'Final Ready' }].map((opt) => (
                  <button key={opt.value} type="button" onClick={() => updateFormData('sopStatus', opt.value)} className={`p-3 rounded-xl border transition-all ${formData.sopStatus === opt.value ? 'border-primary-500 bg-primary-500/10 text-primary-400' : 'border-dark-700 hover:border-dark-600'}`}>{opt.label}</button>
                ))}
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            {SECTIONS.map((section, i) => (
              <div key={section.id} className="flex items-center">
                <button onClick={() => i < currentSection && setCurrentSection(i)} className={`stage-indicator ${i === currentSection ? 'active' : i < currentSection ? 'completed' : 'pending'}`}>
                  {i < currentSection ? <Check className="w-5 h-5" /> : <section.icon className="w-5 h-5" />}
                </button>
                {i < SECTIONS.length - 1 && <div className={`w-16 h-1 mx-2 rounded ${i < currentSection ? 'bg-accent-500' : 'bg-dark-700'}`} />}
              </div>
            ))}
          </div>
        </div>
        <motion.div key={currentSection} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass-card p-8 mb-8">
          <h2 className="text-2xl font-bold mb-2">{SECTIONS[currentSection].title}</h2>
          <p className="text-dark-400 mb-8">
            {currentSection === 0 && "Tell us about your current academic standing."}
            {currentSection === 1 && "What are your study abroad goals?"}
            {currentSection === 2 && "Help us understand your budget constraints."}
            {currentSection === 3 && "Where are you in your exam preparation?"}
          </p>
          {renderSectionContent()}
        </motion.div>
        <div className="flex justify-between">
          <button onClick={handleBack} className="btn-secondary flex items-center gap-2">
            <ArrowLeft className="w-5 h-5" /> {currentSection === 0 ? 'Change Method' : 'Back'}
          </button>
          <button onClick={handleNext} disabled={loading} className="btn-primary flex items-center gap-2">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : currentSection === SECTIONS.length - 1 ? <><span>Complete Setup</span> <Check className="w-5 h-5" /></> : <><span>Continue</span> <ArrowRight className="w-5 h-5" /></>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;