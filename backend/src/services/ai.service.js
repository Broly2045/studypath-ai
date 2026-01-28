const Groq = require('groq-sdk');
const prisma = require('../config/database');

// Initialize Groq
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Model to use (llama is fast and free)
const MODEL = 'llama-3.1-8b-instant';

// In-memory store for onboarding conversations (per user)
// In production, you might want to use Redis or store in DB
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
   Example: [ACTION:SHORTLIST_UNIVERSITY|MIT|dream]
   Categories: dream, target, safe

2. **Add a task:**
   [ACTION:ADD_TASK|title|description|category|priority]
   Example: [ACTION:ADD_TASK|Complete GRE Registration|Register for GRE exam on ets.org|exam|high]
   Categories: exam, document, application, research, other
   Priorities: high, medium, low

3. **Complete a task:**
   [ACTION:COMPLETE_TASK|task_title]
   Example: [ACTION:COMPLETE_TASK|Research Universities]

4. **Update profile field:**
   [ACTION:UPDATE_PROFILE|field_name|value]
   Example: [ACTION:UPDATE_PROFILE|ieltsStatus|preparing]

## IMPORTANT RULES
1. ALWAYS take actions when appropriate - don't just suggest, DO IT
2. When recommending universities, use the SHORTLIST_UNIVERSITY action to add them directly
3. When the student mentions completing something, use COMPLETE_TASK
4. Be proactive - if you see gaps in the profile, suggest updates
5. Explain WHY you're taking each action
6. Keep responses conversational but actionable
7. If the student asks to shortlist or add something, DO IT immediately with the action command`;
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
          } else {
            results.push({ action: 'SHORTLIST_UNIVERSITY', success: false, message: 'Already shortlisted' });
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
          } else {
            results.push({ action: 'COMPLETE_TASK', success: false, message: 'Task not found' });
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

        default:
          results.push({ action: action.type, success: false, message: 'Unknown action' });
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
    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Get shortlisted universities
    const shortlistedUniversities = await prisma.shortlistedUniversity.findMany({
      where: { userId },
      include: { university: true },
    });

    // Get tasks
    const tasks = await prisma.task.findMany({
      where: { userId },
      orderBy: [{ isCompleted: 'asc' }, { priority: 'desc' }],
      take: 10,
    });

    // Get or create conversation
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

    // Build messages for Groq
    const systemPrompt = getSystemPrompt(user, user.profile, shortlistedUniversities, tasks);
    
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversation.messages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
      })),
      { role: 'user', content: message },
    ];

    // Call Groq API
    console.log('Sending message to Groq...');
    const completion = await groq.chat.completions.create({
      messages,
      model: MODEL,
      temperature: 0.7,
      max_tokens: 1024,
    });

    const aiResponse = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
    console.log('Received response from Groq');

    // Parse and execute actions
    const actions = parseActions(aiResponse);
    let actionResults = [];
    
    if (actions.length > 0) {
      console.log('Executing actions:', actions.map(a => a.type));
      actionResults = await executeActions(actions, userId);
    }

    // Clean response for display
    const cleanedResponse = cleanResponse(aiResponse);

    // Save messages to database
    await prisma.message.createMany({
      data: [
        {
          conversationId: conversation.id,
          role: 'user',
          content: message,
        },
        {
          conversationId: conversation.id,
          role: 'assistant',
          content: cleanedResponse,
          actionsTaken: actions.length > 0 ? JSON.stringify(actionResults) : null,
        },
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

// Get conversation history
const getConversations = async (userId) => {
  return prisma.conversation.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    include: {
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });
};

// Get single conversation with messages
const getConversation = async (conversationId, userId) => {
  return prisma.conversation.findFirst({
    where: { id: conversationId, userId },
    include: {
      messages: { orderBy: { createdAt: 'asc' } },
    },
  });
};

// Get onboarding system prompt
const getOnboardingSystemPrompt = (user, profile, currentSection, collectedData) => {
  return `You are PathFinder, a friendly AI Study Abroad Counselor conducting an onboarding interview.

## STUDENT INFO
Name: ${user.fullName}
Current Section: ${currentSection}

## ALREADY COLLECTED DATA (DO NOT ASK AGAIN!)
${JSON.stringify(collectedData, null, 2)}

## CURRENT PROFILE IN DATABASE
${JSON.stringify(profile, null, 2)}

## SECTIONS & FIELDS TO COLLECT

### Section: academic
Fields needed:
- educationLevel (ask: "Are you a high school student, undergraduate, or have completed bachelor's/master's?") → Values: high_school, bachelors, masters
- currentDegree (ask: "What's your current degree/program?") → e.g., "B.Tech", "BBA", "B.Sc"
- major (ask: "What's your major or field?") → e.g., "Computer Science"
- graduationYear (ask: "What year did/will you graduate?") → e.g., 2024
- gpa (ask: "What's your GPA or percentage?") → e.g., 8.5, 3.7
- gpaScale (ask: "Is that out of 10, 4, or 100?") → Values: 10, 4, 100

### Section: goals  
Fields needed:
- intendedDegree (ask: "What degree do you want to pursue abroad?") → Values: bachelors, masters, mba, phd
- fieldOfStudy (ask: "What field do you want to study?") → e.g., "Data Science"
- targetIntakeYear (ask: "Which year are you targeting?") → e.g., 2025
- targetIntakeSeason (ask: "Fall, Spring, or Summer intake?") → Values: fall, spring, summer
- preferredCountries (ask: "Which countries interest you?") → e.g., "USA, UK, Canada"

### Section: budget
Fields needed:
- budgetMin (ask: "What's your minimum budget per year in USD?") → e.g., 20000
- budgetMax (ask: "What's your maximum budget per year in USD?") → e.g., 50000
- fundingPlan (ask: "How do you plan to fund your education?") → Values: self_funded, scholarship, loan, mixed

### Section: exams
Fields needed:
- ieltsStatus (ask: "Have you taken or are you preparing for IELTS?") → Values: not_started, preparing, scheduled, completed
- ieltsScore (only if completed, ask: "What was your score?") → e.g., 7.5
- toeflStatus (ask: "What about TOEFL?") → Values: not_started, preparing, scheduled, completed
- greStatus (ask: "Have you taken or planning GRE?") → Values: not_started, preparing, completed, not_required
- gmatStatus (ask: "What about GMAT?") → Values: not_started, preparing, completed, not_required
- sopStatus (ask: "Have you started your Statement of Purpose?") → Values: not_started, draft, ready

## YOUR RULES - VERY IMPORTANT!

1. **NEVER ask for information already in COLLECTED DATA or PROFILE** - Check both before asking anything!
2. **Ask ONE question at a time** - Keep it conversational
3. **When user answers, extract data using this format:**
   [ONBOARD_DATA:fieldName|value]
   Example: [ONBOARD_DATA:educationLevel|bachelors]
   Example: [ONBOARD_DATA:gpa|8.5]
   Example: [ONBOARD_DATA:preferredCountries|USA, UK, Canada]

4. **After getting 2-3 answers in a section OR if all fields for current section are filled, mark complete:**
   [SECTION_COMPLETE:${currentSection}]

5. **Be encouraging and conversational** - Not robotic!
6. **If user gives multiple pieces of info, extract ALL of them**
7. **Keep responses SHORT - 2-3 sentences max**

## WHAT TO DO NOW
Look at the current section "${currentSection}" and check what fields are missing (not in collected data or profile).
Ask for the NEXT missing field only. If section is complete, say so.`;
};

// AI-powered onboarding conversation - FIXED with conversation history
const onboardingChat = async (userId, message, currentSection) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    // Get or initialize conversation history for this user
    if (!onboardingConversations.has(userId)) {
      onboardingConversations.set(userId, {
        messages: [],
        collectedData: {},
      });
    }

    const userConversation = onboardingConversations.get(userId);
    
    // Add user message to history
    userConversation.messages.push({
      role: 'user',
      content: message,
    });

    // Build the system prompt with collected data
    const systemPrompt = getOnboardingSystemPrompt(
      user, 
      user.profile, 
      currentSection,
      userConversation.collectedData
    );

    // Build messages array with FULL conversation history
    const messages = [
      { role: 'system', content: systemPrompt },
      ...userConversation.messages.slice(-20), // Last 20 messages to avoid token limit
    ];

    const completion = await groq.chat.completions.create({
      messages,
      model: MODEL,
      temperature: 0.7,
      max_tokens: 512,
    });

    const aiResponse = completion.choices[0]?.message?.content || '';

    // Parse onboarding data
    const dataRegex = /\[ONBOARD_DATA:([a-zA-Z]+)\|([^\]]+)\]/g;
    const updates = {};
    let match;

    while ((match = dataRegex.exec(aiResponse)) !== null) {
      const [, field, value] = match;
      
      if (field === 'preferredCountries') {
        updates[field] = value.split(',').map(c => c.trim());
        userConversation.collectedData[field] = updates[field];
      }
      else if (['budgetMin', 'budgetMax', 'graduationYear', 'targetIntakeYear', 'greScore', 'gmatScore', 'toeflScore'].includes(field)) {
        updates[field] = parseInt(value);
        userConversation.collectedData[field] = updates[field];
      }
      else if (['gpa', 'gpaScale', 'ieltsScore'].includes(field)) {
        updates[field] = parseFloat(value);
        userConversation.collectedData[field] = updates[field];
      }
      else {
        updates[field] = value;
        userConversation.collectedData[field] = value;
      }
    }

    // Update profile if we have data
    if (Object.keys(updates).length > 0) {
      await prisma.profile.update({
        where: { userId },
        data: updates,
      });
      console.log('Updated profile with:', updates);
    }

    // Check for section complete
    const sectionComplete = aiResponse.includes(`[SECTION_COMPLETE:${currentSection}]`);

    // Clean response
    const cleanedResponse = aiResponse
      .replace(/\[ONBOARD_DATA:[^\]]+\]/g, '')
      .replace(/\[SECTION_COMPLETE:[^\]]+\]/g, '')
      .trim();

    // Add AI response to history
    userConversation.messages.push({
      role: 'assistant',
      content: cleanedResponse,
    });

    // If onboarding is complete (exams section done), clear the conversation memory
    if (sectionComplete && currentSection === 'exams') {
      onboardingConversations.delete(userId);
      console.log('Onboarding complete, cleared conversation memory for user:', userId);
    }

    return {
      response: cleanedResponse,
      updatedFields: Object.keys(updates),
      sectionComplete,
    };
  } catch (error) {
    console.error('Onboarding chat error:', error);
    throw error;
  }
};

// Clear onboarding conversation (call when user restarts or leaves)
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