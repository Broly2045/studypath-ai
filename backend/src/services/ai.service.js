const Groq = require('groq-sdk');
const prisma = require('../config/database');

// Initialize Groq
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Model to use
const MODEL = 'llama-3.1-8b-instant';

// In-memory store for onboarding conversations (per user)
const onboardingConversations = new Map();

// System prompt for the AI Counselor
const getSystemPrompt = (user, profile, shortlistedUniversities, tasks) => {
  return `You are an expert AI Study Abroad Counselor named "PathFinder". You help students plan their international education journey.

## YOUR PERSONALITY
- Warm, encouraging, and professional
- Direct and actionable - you don't just talk, you TAKE ACTIONS
- You remember context from the conversation
- You explain your reasoning clearly

## STUDENT PROFILE
Name: ${user.fullName}
Current Stage: ${user.currentStage} (1=Building Profile, 2=Discovering Universities, 3=Finalizing Universities, 4=Preparing Applications)
Onboarding Completed: ${user.onboardingCompleted}

### Academic Background
- Education Level: ${profile?.educationLevel || 'Not specified'}
- Current Degree: ${profile?.currentDegree || 'Not specified'}
- Major: ${profile?.major || 'Not specified'}
- Graduation Year: ${profile?.graduationYear || 'Not specified'}
- GPA: ${profile?.gpa || 'Not specified'}${profile?.gpaScale ? `/${profile.gpaScale}` : ''}

### Study Goals
- Intended Degree: ${profile?.intendedDegree || 'Not specified'}
- Field of Study: ${profile?.fieldOfStudy || 'Not specified'}
- Target Intake: ${profile?.targetIntakeSeason || ''} ${profile?.targetIntakeYear || 'Not specified'}
- Preferred Countries: ${profile?.preferredCountries?.join(', ') || 'Not specified'}

### Budget
- Range: $${profile?.budgetMin || '?'} - $${profile?.budgetMax || '?'} per year
- Funding Plan: ${profile?.fundingPlan || 'Not specified'}

### Exam Status
- IELTS: ${profile?.ieltsStatus || 'Not started'}${profile?.ieltsScore ? ` (Score: ${profile.ieltsScore})` : ''}
- TOEFL: ${profile?.toeflStatus || 'Not started'}${profile?.toeflScore ? ` (Score: ${profile.toeflScore})` : ''}
- GRE: ${profile?.greStatus || 'Not started'}${profile?.greScore ? ` (Score: ${profile.greScore})` : ''}
- GMAT: ${profile?.gmatStatus || 'Not started'}${profile?.gmatScore ? ` (Score: ${profile.gmatScore})` : ''}
- SOP Status: ${profile?.sopStatus || 'Not started'}

## SHORTLISTED UNIVERSITIES
${shortlistedUniversities.length > 0 
  ? shortlistedUniversities.map(su => 
      `- ${su.university.name} (${su.category}) ${su.isLocked ? '[LOCKED]' : ''}`
    ).join('\n')
  : 'No universities shortlisted yet.'}

## CURRENT TASKS
${tasks.length > 0
  ? tasks.map(t => `- [${t.isCompleted ? 'DONE' : 'TODO'}] ${t.title} (${t.priority} priority)`).join('\n')
  : 'No tasks yet.'}

## YOUR CAPABILITIES - YOU CAN TAKE THESE ACTIONS
You can perform actions by including special commands in your response. The system will execute these automatically.

Available actions (include these EXACTLY as shown when you want to take action):

1. **Shortlist a university:**
   [ACTION:SHORTLIST_UNIVERSITY|university_name|category]
   Categories: dream, target, safe

2. **Add a task:**
   [ACTION:ADD_TASK|title|description|category|priority]
   Categories: exam, document, application, research, other
   Priorities: high, medium, low

3. **Complete a task:**
   [ACTION:COMPLETE_TASK|task_title]

4. **Update profile field:**
   [ACTION:UPDATE_PROFILE|field_name|value]

## IMPORTANT RULES
1. ALWAYS take actions when appropriate - don't just suggest, DO IT
2. When recommending universities, use the SHORTLIST_UNIVERSITY action
3. Keep responses conversational but actionable`;
};

// Parse actions from AI response
const parseActions = (response) => {
  const actionRegex = /\[ACTION:([A-Z_]+)\|([^\]]+)\]/g;
  const actions = [];
  let match;

  while ((match = actionRegex.exec(response)) !== null) {
    const [fullMatch, actionType, params] = match;
    const paramArray = params.split('|');
    
    actions.push({
      type: actionType,
      params: paramArray,
      original: fullMatch,
    });
  }

  return actions;
};

// Execute parsed actions
const executeActions = async (actions, userId) => {
  const results = [];

  for (const action of actions) {
    try {
      switch (action.type) {
        case 'SHORTLIST_UNIVERSITY':
          const [uniName, category] = action.params;
          let university = await prisma.university.findFirst({
            where: { name: { contains: uniName, mode: 'insensitive' } },
          });

          if (!university) {
            university = await prisma.university.create({
              data: {
                name: uniName,
                country: 'TBD',
                programs: [],
              },
            });
          }

          const existing = await prisma.shortlistedUniversity.findUnique({
            where: {
              userId_universityId: {
                userId,
                universityId: university.id,
              },
            },
          });

          if (!existing) {
            await prisma.shortlistedUniversity.create({
              data: {
                userId,
                universityId: university.id,
                category: category || 'target',
              },
            });
            results.push({ action: 'SHORTLIST_UNIVERSITY', success: true, university: uniName });
          }
          break;

        case 'ADD_TASK':
          const [title, description, taskCategory, priority] = action.params;
          await prisma.task.create({
            data: {
              userId,
              title,
              description: description || '',
              category: taskCategory || 'other',
              priority: priority || 'medium',
              isAiGenerated: true,
            },
          });
          results.push({ action: 'ADD_TASK', success: true, task: title });
          break;

        case 'COMPLETE_TASK':
          const [taskTitle] = action.params;
          const task = await prisma.task.findFirst({
            where: {
              userId,
              title: { contains: taskTitle, mode: 'insensitive' },
              isCompleted: false,
            },
          });

          if (task) {
            await prisma.task.update({
              where: { id: task.id },
              data: { isCompleted: true, completedAt: new Date() },
            });
            results.push({ action: 'COMPLETE_TASK', success: true, task: taskTitle });
          }
          break;

        case 'UPDATE_PROFILE':
          const [fieldName, value] = action.params;
          const validFields = [
            'ieltsStatus', 'toeflStatus', 'greStatus', 'gmatStatus', 'sopStatus',
            'ieltsScore', 'toeflScore', 'greScore', 'gmatScore',
          ];

          if (validFields.includes(fieldName)) {
            const updateData = {};
            if (fieldName.includes('Score')) {
              updateData[fieldName] = parseFloat(value);
            } else {
              updateData[fieldName] = value;
            }

            await prisma.profile.update({
              where: { userId },
              data: updateData,
            });
            results.push({ action: 'UPDATE_PROFILE', success: true, field: fieldName, value });
          }
          break;
      }
    } catch (error) {
      console.error(`Error executing action ${action.type}:`, error);
      results.push({ action: action.type, success: false, error: error.message });
    }
  }

  return results;
};

// Clean response (remove action tags for display)
const cleanResponse = (response) => {
  return response.replace(/\[ACTION:[^\]]+\]/g, '').trim();
};

// Main chat function
const chat = async (userId, message, conversationId = null) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const shortlistedUniversities = await prisma.shortlistedUniversity.findMany({
      where: { userId },
      include: { university: true },
    });

    const tasks = await prisma.task.findMany({
      where: { userId },
      orderBy: [{ isCompleted: 'asc' }, { priority: 'desc' }],
      take: 10,
    });

    let conversation;
    if (conversationId) {
      conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: { messages: { orderBy: { createdAt: 'asc' }, take: 20 } },
      });
    }

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          userId,
          title: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
        },
        include: { messages: true },
      });
    }

    const systemPrompt = getSystemPrompt(user, user.profile, shortlistedUniversities, tasks);
    
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversation.messages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
      })),
      { role: 'user', content: message },
    ];

    const completion = await groq.chat.completions.create({
      messages,
      model: MODEL,
      temperature: 0.7,
      max_tokens: 1024,
    });

    const aiResponse = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

    const actions = parseActions(aiResponse);
    let actionResults = [];
    
    if (actions.length > 0) {
      actionResults = await executeActions(actions, userId);
    }

    const cleanedResponse = cleanResponse(aiResponse);

    await prisma.message.createMany({
      data: [
        { conversationId: conversation.id, role: 'user', content: message },
        { conversationId: conversation.id, role: 'assistant', content: cleanedResponse, actionsTaken: actions.length > 0 ? JSON.stringify(actionResults) : null },
      ],
    });

    return {
      conversationId: conversation.id,
      response: cleanedResponse,
      actions: actionResults,
    };
  } catch (error) {
    console.error('AI Chat error:', error);
    throw error;
  }
};

const getConversations = async (userId) => {
  return prisma.conversation.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    include: { messages: { orderBy: { createdAt: 'desc' }, take: 1 } },
  });
};

const getConversation = async (conversationId, userId) => {
  return prisma.conversation.findFirst({
    where: { id: conversationId, userId },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  });
};

// ============ ONBOARDING LOGIC ============

// Direct extraction from user message - doesn't rely on AI tags
const extractDataFromMessage = (message, currentField, allCollectedData) => {
  const msg = message.toLowerCase().trim();
  const extracted = {};

  // Education Level
  if (msg.includes('high school') || msg.includes('12th') || msg.includes('hsc')) {
    extracted.educationLevel = 'high_school';
  } else if (msg.includes('bachelor') || msg.includes('btech') || msg.includes('b.tech') || msg.includes('bsc') || msg.includes('b.sc') || msg.includes('undergraduate') || msg.includes('ug') || msg.includes('bba') || msg.includes('b.e')) {
    extracted.educationLevel = 'bachelors';
  } else if (msg.includes('master') || msg.includes('mtech') || msg.includes('m.tech') || msg.includes('msc') || msg.includes('m.sc') || msg.includes('postgraduate') || msg.includes('pg')) {
    extracted.educationLevel = 'masters';
  }

  // Major/Field - extract if it looks like a field name
  if (currentField === 'major' || currentField === 'fieldOfStudy') {
    // Common fields
    const fields = ['computer science', 'data science', 'mechanical', 'electrical', 'civil', 'electronics', 'information technology', 'it', 'business', 'finance', 'marketing', 'economics', 'physics', 'chemistry', 'biology', 'mathematics', 'psychology', 'sociology', 'cs', 'ece', 'eee', 'cse'];
    let matched = false;
    for (const field of fields) {
      if (msg.includes(field)) {
        if (currentField === 'major') extracted.major = message.trim();
        if (currentField === 'fieldOfStudy') extracted.fieldOfStudy = message.trim();
        matched = true;
        break;
      }
    }
    // If no match but it's a simple response, use it
    if (!matched && msg.length < 50 && !msg.includes('?')) {
      if (currentField === 'major') extracted.major = message.trim();
      if (currentField === 'fieldOfStudy') extracted.fieldOfStudy = message.trim();
    }
  }

  // GPA
  const gpaMatch = msg.match(/(\d+\.?\d*)\s*(?:gpa|cgpa|percentage|%|\/|\s*out)/i) || 
                   (currentField === 'gpa' && msg.match(/^(\d+\.?\d*)$/));
  if (gpaMatch) {
    const gpa = parseFloat(gpaMatch[1]);
    if (gpa > 0 && gpa <= 100) {
      extracted.gpa = gpa;
    }
  }

  // Intended Degree
  if (currentField === 'intendedDegree' || msg.includes('pursue') || msg.includes('want to do') || msg.includes('planning')) {
    if (msg.includes('bachelor')) {
      extracted.intendedDegree = 'bachelors';
    } else if (msg.includes('mba')) {
      extracted.intendedDegree = 'mba';
    } else if (msg.includes('master') || msg.includes('ms ') || msg.includes('m.s') || msg === 'masters' || msg === 'master') {
      extracted.intendedDegree = 'masters';
    } else if (msg.includes('phd') || msg.includes('doctorate') || msg.includes('doctoral')) {
      extracted.intendedDegree = 'phd';
    }
  }

  // Countries
  const countryMap = {
    'usa': 'USA', 'us': 'USA', 'united states': 'USA', 'america': 'USA',
    'uk': 'UK', 'united kingdom': 'UK', 'britain': 'UK', 'england': 'UK',
    'canada': 'CAN', 'can': 'CAN',
    'australia': 'AUS', 'aus': 'AUS',
    'germany': 'GER', 'ger': 'GER',
    'netherlands': 'NLD', 'holland': 'NLD', 'dutch': 'NLD',
    'ireland': 'IRL', 'irl': 'IRL',
    'singapore': 'SGP', 'sgp': 'SGP'
  };
  
  const foundCountries = [];
  for (const [key, code] of Object.entries(countryMap)) {
    if (msg.includes(key)) {
      if (!foundCountries.includes(code)) {
        foundCountries.push(code);
      }
    }
  }
  if (foundCountries.length > 0) {
    extracted.preferredCountries = foundCountries;
  }

  // Budget
  const budgetMatch = msg.match(/(\d{4,6})/g);
  if (budgetMatch && (currentField === 'budgetMin' || currentField === 'budgetMax' || msg.includes('budget'))) {
    const numbers = budgetMatch.map(n => parseInt(n)).filter(n => n >= 1000);
    if (numbers.length >= 2) {
      extracted.budgetMin = Math.min(...numbers);
      extracted.budgetMax = Math.max(...numbers);
    } else if (numbers.length === 1) {
      if (currentField === 'budgetMin' || msg.includes('min')) {
        extracted.budgetMin = numbers[0];
      } else {
        extracted.budgetMax = numbers[0];
      }
    }
  }

  // Funding Plan
  if (currentField === 'fundingPlan' || msg.includes('fund') || msg.includes('pay')) {
    if (msg.includes('self') || msg.includes('own') || msg.includes('family') || msg.includes('parents')) {
      extracted.fundingPlan = 'self_funded';
    } else if (msg.includes('scholarship')) {
      extracted.fundingPlan = 'scholarship';
    } else if (msg.includes('loan') || msg.includes('bank')) {
      extracted.fundingPlan = 'loan';
    } else if (msg.includes('mix') || msg.includes('combination') || msg.includes('both')) {
      extracted.fundingPlan = 'mixed';
    }
  }

  // Exam Status (IELTS, TOEFL, GRE, GMAT)
  const examStatusMap = {
    'not started': 'not_started',
    'haven\'t started': 'not_started',
    'not yet': 'not_started',
    'no': 'not_started',
    'preparing': 'preparing',
    'preparation': 'preparing',
    'studying': 'preparing',
    'scheduled': 'scheduled',
    'booked': 'scheduled',
    'completed': 'completed',
    'done': 'completed',
    'finished': 'completed',
    'gave': 'completed',
    'taken': 'completed',
    'scored': 'completed',
    'got': 'completed',
    'not required': 'not_required',
    'not needed': 'not_required',
    'waived': 'not_required',
    'exempt': 'not_required'
  };

  for (const [key, status] of Object.entries(examStatusMap)) {
    if (msg.includes(key)) {
      if (msg.includes('ielts') || currentField === 'ieltsStatus') {
        extracted.ieltsStatus = status;
      }
      if (msg.includes('toefl') || currentField === 'toeflStatus') {
        extracted.toeflStatus = status;
      }
      if (msg.includes('gre') || currentField === 'greStatus') {
        extracted.greStatus = status;
      }
      if (msg.includes('gmat') || currentField === 'gmatStatus') {
        extracted.gmatStatus = status;
      }
      // If no specific exam mentioned but we're asking about one
      if (!msg.includes('ielts') && !msg.includes('toefl') && !msg.includes('gre') && !msg.includes('gmat')) {
        if (currentField === 'ieltsStatus') extracted.ieltsStatus = status;
        if (currentField === 'greStatus') extracted.greStatus = status;
      }
    }
  }

  // SOP Status
  if (currentField === 'sopStatus' || msg.includes('sop') || msg.includes('statement')) {
    if (msg.includes('not started') || msg.includes('haven\'t') || msg.includes('no') || msg.includes('not yet')) {
      extracted.sopStatus = 'not_started';
    } else if (msg.includes('draft') || msg.includes('working') || msg.includes('progress') || msg.includes('still')) {
      extracted.sopStatus = 'draft';
    } else if (msg.includes('ready') || msg.includes('done') || msg.includes('finished') || msg.includes('completed') || msg.includes('final') || msg.includes('yes')) {
      extracted.sopStatus = 'ready';
    }
  }

  return extracted;
};

// Section field definitions
const SECTION_FIELDS = {
  academic: ['educationLevel', 'major', 'gpa'],
  goals: ['intendedDegree', 'fieldOfStudy', 'preferredCountries'],
  budget: ['budgetMin', 'budgetMax', 'fundingPlan'],
  exams: ['ieltsStatus', 'greStatus', 'sopStatus'],
};

const SECTION_ORDER = ['academic', 'goals', 'budget', 'exams'];

// Questions for each field
const FIELD_QUESTIONS = {
  educationLevel: "What's your current education level? Are you in high school, completing your bachelor's, or have you already finished your degree?",
  major: "Great! What's your major or field of study?",
  gpa: "What's your GPA or percentage?",
  intendedDegree: "What degree are you planning to pursue abroad - Bachelor's, Master's, MBA, or PhD?",
  fieldOfStudy: "What field do you want to specialize in for your studies abroad?",
  preferredCountries: "Which countries are you considering? (USA, UK, Canada, Australia, Germany, etc.)",
  budgetMin: "What's your budget range per year in USD? (You can give me a range like 20000-40000)",
  budgetMax: "And what's the maximum you can spend per year in USD?",
  fundingPlan: "How do you plan to fund your studies - self-funded, scholarship, education loan, or a mix?",
  ieltsStatus: "Have you started preparing for IELTS or TOEFL? Or have you already taken it?",
  greStatus: "What about GRE/GMAT - have you taken it, preparing, or is it not required for your programs?",
  sopStatus: "How's your Statement of Purpose (SOP) - not started, draft ready, or finalized?",
};

// Acknowledgment phrases for variety
const ACKNOWLEDGMENTS = {
  educationLevel: ["Perfect!", "Great!", "Got it!", "Excellent!"],
  major: ["Nice field!", "Great choice!", "Interesting!", "Cool!"],
  gpa: ["Solid!", "Good!", "Nice!", "Great work!"],
  intendedDegree: ["Excellent choice!", "Great!", "Nice!", "Good goal!"],
  fieldOfStudy: ["Exciting field!", "Great area!", "Good choice!", "Interesting!"],
  preferredCountries: ["Great choices!", "Nice selection!", "Good options!", "Excellent!"],
  budgetMin: ["Got it!", "Understood!", "Okay!", "Noted!"],
  budgetMax: ["Perfect!", "That helps!", "Great!", "Got it!"],
  fundingPlan: ["Smart plan!", "Good strategy!", "Makes sense!", "Great!"],
  ieltsStatus: ["Got it!", "Understood!", "Okay!", "Noted!"],
  greStatus: ["Understood!", "Okay!", "Got it!", "Noted!"],
  sopStatus: ["Got it!", "Okay!", "Understood!", "Noted!"],
};

// Get next field to ask about
const getNextField = (collectedData, profile, currentSection) => {
  const fields = SECTION_FIELDS[currentSection];
  for (const field of fields) {
    const value = collectedData[field] ?? profile?.[field];
    if (value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
      return field;
    }
  }
  return null; // Section complete
};

// Check if section is complete
const isSectionComplete = (collectedData, profile, section) => {
  const fields = SECTION_FIELDS[section];
  return fields.every(field => {
    const value = collectedData[field] ?? profile?.[field];
    if (Array.isArray(value)) return value.length > 0;
    return value !== null && value !== undefined && value !== '';
  });
};

// Get next section
const getNextSection = (currentSection) => {
  const idx = SECTION_ORDER.indexOf(currentSection);
  if (idx < SECTION_ORDER.length - 1) {
    return SECTION_ORDER[idx + 1];
  }
  return null;
};

// AI-powered onboarding conversation
const onboardingChat = async (userId, message, currentSection) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    // Get or initialize conversation
    if (!onboardingConversations.has(userId)) {
      onboardingConversations.set(userId, {
        messages: [],
        collectedData: {},
        currentField: SECTION_FIELDS[currentSection][0],
      });
    }

    const conversation = onboardingConversations.get(userId);
    
    // Extract data from user message directly (don't rely on AI)
    const extractedData = extractDataFromMessage(message, conversation.currentField, conversation.collectedData);
    
    // Merge extracted data
    Object.assign(conversation.collectedData, extractedData);

    // Update database with extracted data
    if (Object.keys(extractedData).length > 0) {
      await prisma.profile.update({
        where: { userId },
        data: extractedData,
      });
      console.log('Extracted and saved:', extractedData);
    }

    // Refresh profile from DB
    const freshProfile = await prisma.profile.findUnique({ where: { userId } });

    // Check if current section is complete
    let sectionComplete = isSectionComplete(conversation.collectedData, freshProfile, currentSection);
    
    // Find next field to ask
    let nextField = getNextField(conversation.collectedData, freshProfile, currentSection);
    let nextSection = currentSection;
    
    // If section complete, move to next section
    if (sectionComplete) {
      nextSection = getNextSection(currentSection);
      if (nextSection) {
        nextField = SECTION_FIELDS[nextSection][0];
      }
    }
    
    // Check if ALL sections are complete
    const allComplete = SECTION_ORDER.every(section => 
      isSectionComplete(conversation.collectedData, freshProfile, section)
    );

    // Generate response
    let aiResponse = '';
    
    if (allComplete) {
      aiResponse = `Fantastic, ${user.fullName.split(' ')[0]}! 🎉 We've got all the information we need. Your profile is complete and you're ready to start exploring universities that match your goals. Let's find your perfect fit!`;
    } else if (sectionComplete && nextSection) {
      const sectionNames = { academic: 'academic background', goals: 'study goals', budget: 'budget information', exams: 'exam readiness' };
      const ack = ACKNOWLEDGMENTS[conversation.currentField]?.[Math.floor(Math.random() * 4)] || 'Great!';
      aiResponse = `${ack} We've completed your ${sectionNames[currentSection]}! 🎯\n\nNow let's talk about your ${sectionNames[nextSection]}. ${FIELD_QUESTIONS[nextField]}`;
    } else if (nextField) {
      // Generate acknowledgment + next question
      const ack = ACKNOWLEDGMENTS[conversation.currentField]?.[Math.floor(Math.random() * 4)] || 'Got it!';
      const extractedKeys = Object.keys(extractedData);
      
      if (extractedKeys.length > 0) {
        aiResponse = `${ack} ${FIELD_QUESTIONS[nextField]}`;
      } else {
        // Couldn't extract data, ask to clarify
        aiResponse = `I didn't quite catch that. ${FIELD_QUESTIONS[conversation.currentField]}`;
        nextField = conversation.currentField; // Stay on same field
      }
    }

    // Update current field for next iteration
    conversation.currentField = nextField;
    
    // Add to conversation history
    conversation.messages.push({ role: 'user', content: message });
    conversation.messages.push({ role: 'assistant', content: aiResponse });

    // Clean up if complete
    if (allComplete) {
      onboardingConversations.delete(userId);
    }

    return {
      response: aiResponse,
      updatedFields: Object.keys(extractedData),
      sectionComplete,
      allComplete,
    };
  } catch (error) {
    console.error('Onboarding chat error:', error);
    throw error;
  }
};

const clearOnboardingConversation = (userId) => {
  onboardingConversations.delete(userId);
};

module.exports = {
  chat,
  getConversations,
  getConversation,
  onboardingChat,
  clearOnboardingConversation,
};