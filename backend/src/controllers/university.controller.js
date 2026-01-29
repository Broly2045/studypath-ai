const prisma = require('../config/database');
const Groq = require('groq-sdk');

// Initialize Groq
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const MODEL = 'llama-3.1-8b-instant';

// @desc    Get all universities
// @route   GET /api/universities
const getUniversities = async (req, res) => {
  try {
    const { country, search, limit = 20 } = req.query;

    const where = {};
    if (country) where.country = country;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ];
    }

    const universities = await prisma.university.findMany({
      where,
      take: parseInt(limit),
      orderBy: { ranking: 'asc' },
    });

    res.json({
      success: true,
      data: { universities },
    });
  } catch (error) {
    console.error('Get universities error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching universities.',
    });
  }
};

// @desc    Get AI-powered university recommendations
// @route   GET /api/universities/recommendations
const getRecommendations = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { profile: true },
    });



    if (!user.profile) {
      return res.status(400).json({
        success: false,
        message: 'Please complete your profile first.',
      });
    }

    const profile = user.profile;

    const prompt = `You are an expert study abroad counselor. Based on this student profile, recommend exactly 9 universities (3 Dream, 3 Target, 3 Safe).

STUDENT PROFILE:
- Education: ${profile.educationLevel || 'Not specified'}
- Major: ${profile.major || 'Not specified'}
- GPA: ${profile.gpa || 'Not specified'}${profile.gpaScale ? `/${profile.gpaScale}` : ''}
- Intended Degree: ${profile.intendedDegree || 'masters'}
- Field of Study: ${profile.fieldOfStudy || 'Not specified'}
- Preferred Countries: ${profile.preferredCountries?.join(', ') || 'USA, UK, Canada'}
- Budget: $${profile.budgetMin || 20000} - $${profile.budgetMax || 50000} per year
- IELTS Score: ${profile.ieltsScore || 'Not taken'}
- GRE Score: ${profile.greScore || 'Not taken'}

RESPOND IN THIS EXACT JSON FORMAT (no other text, just the JSON):
{
  "recommendations": [
    {
      "name": "University Name",
      "country": "Country",
      "city": "City",
      "category": "dream",
      "ranking": 10,
      "tuitionMin": 40000,
      "tuitionMax": 50000,
      "acceptanceChance": "low",
      "fitReason": "Why this university fits the student",
      "risks": "Any concerns or challenges"
    }
  ]
}

Categories:
- dream: Top-tier, harder to get into, but achievable
- target: Good match for profile, reasonable chance
- safe: High acceptance probability, still quality schools

Acceptance chances: "high", "medium", "low"

Provide exactly 3 universities per category (9 total). Use REAL universities that exist.`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: MODEL,
      temperature: 0.7,
      max_tokens: 2048,
    });

    let recommendations = [];
    const responseText = completion.choices[0]?.message?.content || '';

    try {
      // Extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        recommendations = parsed.recommendations || [];
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      console.log('Raw response:', responseText);
      
      // Return default recommendations if parsing fails
      recommendations = getDefaultRecommendations(profile);
    }


res.json({
  success: true,
  data: { recommendations },
});

  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating recommendations.',
    });
  }
};

// Default recommendations if AI fails
const getDefaultRecommendations = (profile) => {
  const countries = profile.preferredCountries || ['USA', 'UK', 'Canada'];
  const field = profile.fieldOfStudy || 'Computer Science';
  
  const defaults = {
    USA: [
      { name: 'MIT', city: 'Cambridge', ranking: 1, category: 'dream' },
      { name: 'University of Michigan', city: 'Ann Arbor', ranking: 21, category: 'target' },
      { name: 'Arizona State University', city: 'Tempe', ranking: 121, category: 'safe' },
    ],
    UK: [
      { name: 'University of Oxford', city: 'Oxford', ranking: 4, category: 'dream' },
      { name: 'University of Edinburgh', city: 'Edinburgh', ranking: 22, category: 'target' },
      { name: 'University of Leeds', city: 'Leeds', ranking: 86, category: 'safe' },
    ],
    Canada: [
      { name: 'University of Toronto', city: 'Toronto', ranking: 21, category: 'dream' },
      { name: 'University of British Columbia', city: 'Vancouver', ranking: 34, category: 'target' },
      { name: 'University of Alberta', city: 'Edmonton', ranking: 110, category: 'safe' },
    ],
  };

  const recommendations = [];
  
  countries.forEach(country => {
    const countryUnis = defaults[country] || defaults['USA'];
    countryUnis.forEach(uni => {
      recommendations.push({
        ...uni,
        country,
        tuitionMin: 30000,
        tuitionMax: 50000,
        acceptanceChance: uni.category === 'dream' ? 'low' : uni.category === 'target' ? 'medium' : 'high',
        fitReason: `Good program for ${field}`,
        risks: uni.category === 'dream' ? 'Highly competitive' : null,
      });
    });
  });

  return recommendations.slice(0, 9);
};

// @desc    Get user's shortlisted universities
// @route   GET /api/universities/shortlist
const getShortlist = async (req, res) => {
  try {
    const shortlist = await prisma.shortlistedUniversity.findMany({
      where: { userId: req.user.id },
      include: { university: true },
      orderBy: { createdAt: 'desc' },
    });

    // Group by category
    const grouped = {
      dream: shortlist.filter(s => s.category === 'dream'),
      target: shortlist.filter(s => s.category === 'target'),
      safe: shortlist.filter(s => s.category === 'safe'),
    };

    res.json({
      success: true,
      data: { 
        shortlist,
        grouped,
        counts: {
          total: shortlist.length,
          dream: grouped.dream.length,
          target: grouped.target.length,
          safe: grouped.safe.length,
          locked: shortlist.filter(s => s.isLocked).length,
        },
      },
    });
  } catch (error) {
    console.error('Get shortlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching shortlist.',
    });
  }
};

// @desc    Add university to shortlist
// @route   POST /api/universities/shortlist
const addToShortlist = async (req, res) => {
  try {
    const { universityId, universityName, universityCountry, universityCity, category, fitReason, risks, acceptanceChance } = req.body;

    let university;

    // Find or create university
    if (universityId) {
      university = await prisma.university.findUnique({
        where: { id: universityId },
      });
    } else if (universityName) {
      university = await prisma.university.findFirst({
        where: { name: { contains: universityName, mode: 'insensitive' } },
      });

      if (!university) {
        university = await prisma.university.create({
          data: {
            name: universityName,
            country: universityCountry || 'USA',
            city: universityCity || null,
            programs: [],
          },
        });
      }
    }

    if (!university) {
      return res.status(400).json({
        success: false,
        message: 'University not found.',
      });
    }

    // Check if already shortlisted
    const existing = await prisma.shortlistedUniversity.findUnique({
      where: {
        userId_universityId: {
          userId: req.user.id,
          universityId: university.id,
        },
      },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'University already in shortlist.',
      });
    }

    // Add to shortlist
    const shortlisted = await prisma.shortlistedUniversity.create({
      data: {
        userId: req.user.id,
        universityId: university.id,
        category: category || 'target',
        fitReason,
        risks,
        acceptanceChance,
      },
      include: { university: true },
    });

    res.json({
      success: true,
      message: 'University added to shortlist.',
      data: { shortlisted },
    });
  } catch (error) {
    console.error('Add to shortlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding to shortlist.',
    });
  }
};

// @desc    Remove university from shortlist
// @route   DELETE /api/universities/shortlist/:id
const removeFromShortlist = async (req, res) => {
  try {
    const { id } = req.params;

    const shortlisted = await prisma.shortlistedUniversity.findFirst({
      where: { id, userId: req.user.id },
    });

    if (!shortlisted) {
      return res.status(404).json({
        success: false,
        message: 'Shortlist entry not found.',
      });
    }

    if (shortlisted.isLocked) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove a locked university.',
      });
    }

    await prisma.shortlistedUniversity.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'University removed from shortlist.',
    });
  } catch (error) {
    console.error('Remove from shortlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing from shortlist.',
    });
  }
};

// @desc    Lock a university (finalize choice)
// @route   POST /api/universities/shortlist/:id/lock
const lockUniversity = async (req, res) => {
  try {
    const { id } = req.params;

    const shortlisted = await prisma.shortlistedUniversity.findFirst({
      where: { id, userId: req.user.id },
    });

    if (!shortlisted) {
      return res.status(404).json({
        success: false,
        message: 'Shortlist entry not found.',
      });
    }

    // Lock the university
    const updated = await prisma.shortlistedUniversity.update({
      where: { id },
      data: { isLocked: true },
      include: { university: true },
    });

        // 🧠 AUTO-GENERATE TASKS FOR LOCKED UNIVERSITY
    const existingTasks = await prisma.task.count({
      where: {
        userId: req.user.id,
        universityId: updated.university.id,
      },
    });

    if (existingTasks === 0) {
      await prisma.task.createMany({
        data: [
          {
            userId: req.user.id,
            title: `Research ${updated.university.name}`,
            category: 'university',
            priority: 'high',
            universityId: updated.university.id,
            isAiGenerated: true,
          },
          {
            userId: req.user.id,
            title: `Prepare documents for ${updated.university.name}`,
            category: 'application',
            priority: 'medium',
            universityId: updated.university.id,
            isAiGenerated: true,
          },
          {
            userId: req.user.id,
            title: `Track deadlines for ${updated.university.name}`,
            category: 'deadline',
            priority: 'high',
            universityId: updated.university.id,
            isAiGenerated: true,
          },
        ],
      });
    }


    // Check if user has at least one locked university to advance stage
    const lockedCount = await prisma.shortlistedUniversity.count({
      where: { userId: req.user.id, isLocked: true },
    });

    // If this is the first locked university, advance to Stage 3
    if (lockedCount === 1) {
      await prisma.user.update({
        where: { id: req.user.id },
        data: { currentStage: 3 },
      });
    }

    res.json({
      success: true,
      message: 'University locked successfully.',
      data: { shortlisted: updated, lockedCount },
    });
  } catch (error) {
    console.error('Lock university error:', error);
    res.status(500).json({
      success: false,
      message: 'Error locking university.',
    });
  }
};

// @desc    Unlock a university
// @route   POST /api/universities/shortlist/:id/unlock
const unlockUniversity = async (req, res) => {
  try {
    const { id } = req.params;

    const shortlisted = await prisma.shortlistedUniversity.findFirst({
      where: { id, userId: req.user.id },
    });

    if (!shortlisted) {
      return res.status(404).json({
        success: false,
        message: 'Shortlist entry not found.',
      });
    }

    const updated = await prisma.shortlistedUniversity.update({
      where: { id },
      data: { isLocked: false },
      include: { university: true },
    });

    res.json({
      success: true,
      message: 'University unlocked.',
      data: { shortlisted: updated },
    });
  } catch (error) {
    console.error('Unlock university error:', error);
    res.status(500).json({
      success: false,
      message: 'Error unlocking university.',
    });
  }
};

const refreshRecommendationsAndAcceptance = async (userId) => {
  const shortlist = await prisma.shortlistedUniversity.findMany({
    where: { userId },
  });

  for (const uni of shortlist) {
    const chance =
      uni.category === 'dream'
        ? 'low'
        : uni.category === 'target'
        ? 'medium'
        : 'high';

    await prisma.shortlistedUniversity.update({
      where: { id: uni.id },
      data: { acceptanceChance: chance },
    });
  }
};



module.exports = {
  getUniversities,
  getRecommendations,
  getShortlist,
  addToShortlist,
  removeFromShortlist,
  lockUniversity,
  unlockUniversity,
  refreshRecommendationsAndAcceptance,
};