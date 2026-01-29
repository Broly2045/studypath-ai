const prisma = require('../config/database');
const { refreshRecommendationsAndAcceptance } = require('./university.controller');
const { refreshTasksFromProfile } = require('./task.controller');


// Helper function to parse float (returns null if empty/invalid)
const parseFloatOrNull = (value) => {
  if (value === '' || value === null || value === undefined) return null;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? null : parsed;
};

// Helper function to parse int (returns null if empty/invalid)
const parseIntOrNull = (value) => {
  if (value === '' || value === null || value === undefined) return null;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? null : parsed;
};

// @desc    Get user profile
// @route   GET /api/profile
const getProfile = async (req, res) => {
  try {
    const profile = await prisma.profile.findUnique({
      where: { userId: req.user.id },
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found.',
      });
    }

    res.json({
      success: true,
      data: { profile },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profile.',
    });
  }
};

// @desc    Update profile (Onboarding or Edit)
// @route   PUT /api/profile
const updateProfile = async (req, res) => {
  try {
    const {
      // Academic Background
      educationLevel,
      currentDegree,
      major,
      graduationYear,
      gpa,
      gpaScale,
      // Study Goal
      intendedDegree,
      fieldOfStudy,
      targetIntakeYear,
      targetIntakeSeason,
      preferredCountries,
      // Budget
      budgetMin,
      budgetMax,
      fundingPlan,
      // Exams & Readiness
      ieltsStatus,
      ieltsScore,
      toeflStatus,
      toeflScore,
      greStatus,
      greScore,
      gmatStatus,
      gmatScore,
      sopStatus,
    } = req.body;

    // Build update data with proper type conversions
    const updateData = {
      updatedAt: new Date(),
    };

    // String fields
    if (educationLevel !== undefined) updateData.educationLevel = educationLevel || null;
    if (currentDegree !== undefined) updateData.currentDegree = currentDegree || null;
    if (major !== undefined) updateData.major = major || null;
    if (intendedDegree !== undefined) updateData.intendedDegree = intendedDegree || null;
    if (fieldOfStudy !== undefined) updateData.fieldOfStudy = fieldOfStudy || null;
    if (targetIntakeSeason !== undefined) updateData.targetIntakeSeason = targetIntakeSeason || null;
    if (fundingPlan !== undefined) updateData.fundingPlan = fundingPlan || null;
    if (ieltsStatus !== undefined) updateData.ieltsStatus = ieltsStatus || null;
    if (toeflStatus !== undefined) updateData.toeflStatus = toeflStatus || null;
    if (greStatus !== undefined) updateData.greStatus = greStatus || null;
    if (gmatStatus !== undefined) updateData.gmatStatus = gmatStatus || null;
    if (sopStatus !== undefined) updateData.sopStatus = sopStatus || null;

    // Integer fields
    if (graduationYear !== undefined) updateData.graduationYear = parseIntOrNull(graduationYear);
    if (targetIntakeYear !== undefined) updateData.targetIntakeYear = parseIntOrNull(targetIntakeYear);
    if (budgetMin !== undefined) updateData.budgetMin = parseIntOrNull(budgetMin);
    if (budgetMax !== undefined) updateData.budgetMax = parseIntOrNull(budgetMax);
    if (greScore !== undefined) updateData.greScore = parseIntOrNull(greScore);
    if (gmatScore !== undefined) updateData.gmatScore = parseIntOrNull(gmatScore);
    if (toeflScore !== undefined) updateData.toeflScore = parseIntOrNull(toeflScore);

    // Float fields
    if (gpa !== undefined) updateData.gpa = parseFloatOrNull(gpa);
    if (gpaScale !== undefined) updateData.gpaScale = parseFloatOrNull(gpaScale);
    if (ieltsScore !== undefined) updateData.ieltsScore = parseFloatOrNull(ieltsScore);

    // Array fields
    if (preferredCountries !== undefined) {
      updateData.preferredCountries = Array.isArray(preferredCountries) ? preferredCountries : [];
    }

    // Update profile
    const updatedProfile = await prisma.profile.update({
      where: { userId: req.user.id },
      data: updateData,
    });

    // Calculate profile strength
    const strength = calculateProfileStrength(updatedProfile);

    // Update strength scores
    await prisma.profile.update({
      where: { userId: req.user.id },
      data: {
        academicStrength: strength.academic,
        examStrength: strength.exam,
        sopStrength: strength.sop,
        overallStrength: strength.overall,
      },
    });

    // 🔁 Trigger downstream updates after profile edit
await Promise.all([
  refreshRecommendationsAndAcceptance(req.user.id),
  refreshTasksFromProfile(req.user.id),
]);


    res.json({
      success: true,
      message: 'Profile updated successfully.',
      data: {
        profile: { ...updatedProfile, ...strength },
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile.',
    });
  }
};

// @desc    Complete onboarding
// @route   POST /api/profile/complete-onboarding
const completeOnboarding = async (req, res) => {
  try {
    const profile = await prisma.profile.findUnique({
      where: { userId: req.user.id },
    });

    // Validate minimum required fields
    const requiredFields = [
      'educationLevel',
      'intendedDegree',
      'fieldOfStudy',
      'preferredCountries',
      'budgetMin',
      'fundingPlan',
    ];

    const missingFields = requiredFields.filter((field) => {
      const value = profile[field];
      if (Array.isArray(value)) return value.length === 0;
      return !value;
    });

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Please complete all required fields.',
        missingFields,
      });
    }

    // Calculate profile strength
    const strength = calculateProfileStrength(profile);

    // Update user and profile
    await prisma.$transaction([
      prisma.user.update({
        where: { id: req.user.id },
        data: {
          onboardingCompleted: true,
          currentStage: 2, // Move to Stage 2: Discovering Universities
        },
      }),
      prisma.profile.update({
        where: { userId: req.user.id },
        data: {
          academicStrength: strength.academic,
          examStrength: strength.exam,
          sopStrength: strength.sop,
          overallStrength: strength.overall,
        },
      }),
    ]);

    // Create initial AI-generated tasks
    await createInitialTasks(req.user.id, profile);

    res.json({
      success: true,
      message: 'Onboarding completed! Your AI Counselor is now unlocked.',
      data: {
        currentStage: 2,
        profileStrength: strength,
      },
    });
  } catch (error) {
    console.error('Complete onboarding error:', error);
    res.status(500).json({
      success: false,
      message: 'Error completing onboarding.',
    });
  }
};

// Helper: Calculate profile strength
const calculateProfileStrength = (profile) => {
  let academicScore = 0;
  let examScore = 0;
  let sopScore = 0;

  // Academic strength calculation
  if (profile.gpa) {
    const normalizedGpa = profile.gpaScale === 4.0 
      ? (profile.gpa / 4.0) * 100 
      : (profile.gpa / 10.0) * 100;
    
    if (normalizedGpa >= 85) academicScore = 100;
    else if (normalizedGpa >= 75) academicScore = 75;
    else if (normalizedGpa >= 60) academicScore = 50;
    else academicScore = 25;
  }

  // Exam strength calculation
  const examStatuses = [
    profile.ieltsStatus,
    profile.toeflStatus,
    profile.greStatus,
    profile.gmatStatus,
  ].filter(Boolean);

  const completedExams = examStatuses.filter((s) => s === 'completed').length;
  const totalRelevantExams = examStatuses.length || 1;
  examScore = (completedExams / totalRelevantExams) * 100;

  // Add score bonus for actual scores
  if (profile.ieltsScore && profile.ieltsScore >= 7.0) examScore = Math.min(100, examScore + 20);
  if (profile.toeflScore && profile.toeflScore >= 100) examScore = Math.min(100, examScore + 20);
  if (profile.greScore && profile.greScore >= 320) examScore = Math.min(100, examScore + 20);

  // SOP strength calculation
  if (profile.sopStatus === 'ready') sopScore = 100;
  else if (profile.sopStatus === 'draft') sopScore = 50;
  else sopScore = 0;

  // Calculate overall strength
  const overall = Math.round((academicScore * 0.4 + examScore * 0.4 + sopScore * 0.2));

  return {
    academic: academicScore >= 75 ? 'strong' : academicScore >= 50 ? 'average' : 'weak',
    exam: examScore >= 75 ? 'strong' : examScore >= 50 ? 'average' : 'weak',
    sop: sopScore >= 75 ? 'strong' : sopScore >= 50 ? 'average' : 'weak',
    overall,
    scores: {
      academic: Math.round(academicScore),
      exam: Math.round(examScore),
      sop: Math.round(sopScore),
    },
  };
};

// Helper: Create initial tasks based on profile
const createInitialTasks = async (userId, profile) => {
  const tasks = [];

  // Exam-related tasks
  if (profile.ieltsStatus === 'not_started' || !profile.ieltsStatus) {
    tasks.push({
      userId,
      title: 'Start IELTS/TOEFL Preparation',
      description: 'Begin preparing for English proficiency test. Research test formats and create a study plan.',
      category: 'exam',
      priority: 'high',
      isAiGenerated: true,
    });
  }

  if ((profile.greStatus === 'not_started' || !profile.greStatus) && 
      ['masters', 'phd'].includes(profile.intendedDegree)) {
    tasks.push({
      userId,
      title: 'Plan GRE Preparation',
      description: 'GRE is required for most graduate programs. Start with diagnostic test to assess your level.',
      category: 'exam',
      priority: 'medium',
      isAiGenerated: true,
    });
  }

  // SOP task
  if (profile.sopStatus !== 'ready') {
    tasks.push({
      userId,
      title: 'Begin Statement of Purpose Draft',
      description: 'Start outlining your SOP. Focus on your academic journey, goals, and why you chose this field.',
      category: 'document',
      priority: 'medium',
      isAiGenerated: true,
    });
  }

  // Research task
  tasks.push({
    userId,
    title: 'Research Universities',
    description: `Explore universities in ${profile.preferredCountries?.join(', ') || 'your preferred countries'} that offer ${profile.fieldOfStudy || 'your field'}.`,
    category: 'research',
    priority: 'high',
    isAiGenerated: true,
  });

  // Create all tasks
  if (tasks.length > 0) {
    await prisma.task.createMany({ data: tasks });
  }
};

// @desc    Get profile strength analysis
// @route   GET /api/profile/strength
const getProfileStrength = async (req, res) => {
  try {
    const profile = await prisma.profile.findUnique({
      where: { userId: req.user.id },
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found.',
      });
    }

    const strength = calculateProfileStrength(profile);

    res.json({
      success: true,
      data: { strength },
    });
  } catch (error) {
    console.error('Get profile strength error:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculating profile strength.',
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  completeOnboarding,
  getProfileStrength,
};