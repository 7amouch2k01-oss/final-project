const Task        = require('../models/Task');
const User        = require('../models/User');
const Institution = require('../models/Institution');
const Application = require('../models/Application');

// ── Student Task Management ────────────────────────────────────────────────
const getTasks = async (userId) => {
  return Task.find({ userId }).sort({ createdAt: -1 });
};

const createTask = async (userId, data) => {
  return Task.create({ userId, ...data });
};

const updateTask = async (userId, taskId, data) => {
  const task = await Task.findOneAndUpdate({ _id: taskId, userId }, data, { new: true });
  if (!task) { const e = new Error('Task not found'); e.statusCode = 404; throw e; }
  return task;
};

const deleteTask = async (userId, taskId) => {
  const task = await Task.findOneAndDelete({ _id: taskId, userId });
  if (!task) { const e = new Error('Task not found'); e.statusCode = 404; throw e; }
  return { success: true };
};

// ── Score & GPA Calculator Logic (Tunisian Baccalaureate & University) ──────
const calculateAcademicScore = ({ type, data }) => {
  if (type === 'bac_formula') {
    // Tunisian Baccalaureate Formule Globale (FG) calculation
    const { section, mg, math = 0, sp = 0, svt = 0, tec = 0, eco = 0, gest = 0, info = 0, algo = 0, bd = 0, fr = 0, ang = 0 } = data;
    const MoyenneG = Number(mg) || 10;

    let fg = 0;
    let details = '';

    switch (section) {
      case 'Mathématiques':
        // FG = 4 * MG + 2 * M + 1.5 * SP + 0.5 * SVT + 1 * FR + 1 * ANG
        fg = 4 * MoyenneG + 2 * Number(math) + 1.5 * Number(sp) + 0.5 * Number(svt) + 1 * Number(fr) + 1 * Number(ang);
        details = 'Formule Math: 4×MG + 2×Math + 1.5×Physique + 0.5×SVT + 1×Fr + 1×Ang';
        break;
      case 'Sciences Expérimentales':
        // FG = 4 * MG + 1.5 * M + 1.5 * SP + 1.5 * SVT + 1 * FR + 1 * ANG
        fg = 4 * MoyenneG + 1.5 * Number(math) + 1.5 * Number(sp) + 1.5 * Number(svt) + 1 * Number(fr) + 1 * Number(ang);
        details = 'Formule Sciences: 4×MG + 1.5×MG + 1.5×Physique + 1.5×SVT + 1×Fr + 1×Ang';
        break;
      case "Sciences de l'Informatique":
        // FG = 4 * MG + 1.5 * M + 1.5 * Algo + 1.5 * BD + 0.5 * SP + 1 * FR + 1 * ANG
        fg = 4 * MoyenneG + 1.5 * Number(math) + 1.5 * Number(algo || info) + 1.5 * Number(bd || info) + 0.5 * Number(sp) + 1 * Number(fr) + 1 * Number(ang);
        details = 'Formule Info: 4×MG + 1.5×Math + 1.5×Algo + 1.5×BD + 0.5×Physique + 1×Fr + 1×Ang';
        break;
      case 'Sciences Techniques':
        // FG = 4 * MG + 1.5 * M + 1.5 * SP + 1.5 * Tech + 1 * FR + 1 * ANG
        fg = 4 * MoyenneG + 1.5 * Number(math) + 1.5 * Number(sp) + 1.5 * Number(tec) + 1 * Number(fr) + 1 * Number(ang);
        details = 'Formule Technique: 4×MG + 1.5×Math + 1.5×Physique + 1.5×Technique + 1×Fr + 1×Ang';
        break;
      case 'Economie et Gestion':
        // FG = 4 * MG + 1.5 * Eco + 1.5 * Gest + 1 * M + 1 * FR + 1 * ANG
        fg = 4 * MoyenneG + 1.5 * Number(eco) + 1.5 * Number(gest) + 1 * Number(math) + 1 * Number(fr) + 1 * Number(ang);
        details = 'Formule Eco-Gestion: 4×MG + 1.5×Economie + 1.5×Gestion + 1×Math + 1×Fr + 1×Ang';
        break;
      default:
        fg = 4 * MoyenneG + 2 * Number(fr) + 2 * Number(ang);
        details = 'Formule Standard: 4×MG + 2×Français + 2×Anglais';
    }

    return {
      scoreType: 'Baccalaureate Orientation Score',
      section,
      moyenneGenerale: MoyenneG,
      formuleGlobale: Math.round(fg * 100) / 100,
      formulaExplanation: details,
    };
  }

  if (type === 'university_gpa') {
    // Calculate university semester moyenne based on modules list
    const { modules = [] } = data;
    if (!modules.length) return { moyenne: 0, totalCredits: 0, validated: false };

    let totalPoints = 0;
    let totalCoef = 0;
    let totalCredits = 0;

    modules.forEach(m => {
      const coef = Number(m.coef) || 1;
      const credit = Number(m.credit) || 0;
      const grade = Number(m.grade) || 0;

      totalPoints += grade * coef;
      totalCoef += coef;
      if (grade >= 10) totalCredits += credit;
    });

    const moyenne = totalCoef > 0 ? Math.round((totalPoints / totalCoef) * 100) / 100 : 0;
    const validated = moyenne >= 10;

    return {
      scoreType: 'University Semester Moyenne',
      moyenne,
      totalCredits,
      totalCoef,
      validated,
      mention: moyenne >= 16 ? 'Très Bien' : moyenne >= 14 ? 'Bien' : moyenne >= 12 ? 'Assez Bien' : moyenne >= 10 ? 'Passable' : 'Ajourné / Rachat',
    };
  }

  return { error: 'Invalid calculation type' };
};

// ── AI Career & University Advisor ─────────────────────────────────────────
const getAICareerAdvice = async ({ message, userContext, history = [] }) => {
  // Built-in intelligent Tunisian higher-education & career advisor engine
  const msgLower = (message || '').toLowerCase();
  const bacSection = userContext?.baccalaureate?.section || 'Informatique / Sciences';
  const bacScore = userContext?.baccalaureate?.grade || '14.00';

  let reply = '';
  let recommendations = [];

  if (msgLower.includes('insat') || msgLower.includes('mpi') || msgLower.includes('cba')) {
    reply = `INSAT (Institut National des Sciences Appliquées et de Technologie) is one of the premier institutions in Tunisia for Engineering and Applied Sciences.
    
Key paths at INSAT:
• **MPI (Maths-Physique-Informatique)**: Leads to Software Engineering (GL), Cybersecurity, Networks (RT), and Industrial Automation (IIA).
• **CBA (Chimie-Biologie Appliquée)**: Leads to Biotechnology and Food Engineering.

Requirements: Requires a strong Baccalaureate (usually Formule Globale > 160-175 for MPI). High grades in Mathematics and Physics are critical.`;
    recommendations = ['INSAT - Software Engineering (GL)', 'INSAT - Networks & Telecommunications (RT)', 'ENIT - Computer Science'];
  } else if (msgLower.includes('esprit') || msgLower.includes('private') || msgLower.includes('privée')) {
    reply = `ESPRIT is the leading private engineering school in Tunisia with CTI and CDIO accreditations. 
    
Strengths:
• Strong project-based learning pedagogy (Active Learning).
• Specializations in Cloud Computing, AI & Data Science, IoT, Mobile, and DevOps.
• Very high employment rate upon graduation and dual-diploma exchange programs with French and Canadian universities.`;
    recommendations = ['ESPRIT - Computer Science & Software', 'TBS (Tunis Business School)', 'MSB (Mediterranean School of Business)'];
  } else if (msgLower.includes('data science') || msgLower.includes('ia') || msgLower.includes('ai') || msgLower.includes('intelligence')) {
    reply = `For careers in **Artificial Intelligence & Data Science** in Tunisia:

Top Universities:
1. **INSAT** — Master / Specialization in Data Science & Big Data.
2. **ESPRIT** — Track in Data Science & Machine Learning.
3. **FST (Faculté des Sciences de Tunis)** — Master in Big Data & AI.
4. **ENSI (École Nationale des Sciences de l'Informatique)** — Top engineering school in computer science.

Career Opportunities: Machine Learning Engineer, Data Analyst, AI Research Scientist at companies like InstaDeep, Vermeg, Expensya, or international remote roles.`;
    recommendations = ['INSAT (MPI → GL/IA)', 'ENSI (Computer Engineering)', 'FST Tunis (Big Data)', 'ESPRIT (Data Science Track)'];
  } else if (msgLower.includes('stage') || msgLower.includes('pfe') || msgLower.includes('internship')) {
    reply = `To land a top **PFE or Summer Internship** in Tunisia:
1. **Portfolio & GitHub**: Build 2-3 full-stack projects showcasing MERN, Python/FastAPI, or Spring Boot.
2. **Verified Documents**: Ensure your TuniStudy profile has your verified Baccalaureate and transcript attached.
3. **Targeted Companies**: Explore TuniJob listings for Vermeg, Telnet, Sofrecom, ACTIA, and Tunisian startups.
4. **Preparation**: Practice LeetCode algorithms and system design questions.`;
    recommendations = ['Explore PFE Listings on TuniJob', 'Download CV Template', 'Verify University Transcripts'];
  } else {
    reply = `Hello! I am your **TuniStudy AI Career & University Advisor**. 

Based on your profile (Baccalaureate ${bacSection}):
• You have strong eligibility for Engineering, Computer Science, and Data fields across Tunisian universities.
• You can apply to top public institutions (INSAT, ENIT, FST, ENSI) or leading accredited private universities (ESPRIT, TBS).

How can I help you today? You can ask me about:
- Orientation scores and admission requirements for any Tunisian faculty
- Choosing between Software Engineering, AI, Business, or Network tracks
- PFE & Internship advice to boost your CV`;
    recommendations = ['Calculate my Bac Orientation Score (FG)', 'Compare INSAT vs ENIT vs ESPRIT', 'Guide to PFE Internships in Tunisia'];
  }

  return {
    reply,
    recommendations,
    timestamp: new Date(),
  };
};

// ── Institution AI Candidate Matcher & Ranking Engine ──────────────────────
const rankApplicantsForListing = async (institutionId, listingId, listingRequirements = []) => {
  const applications = await Application.find({ targetId: listingId })
    .populate('applicantId', 'name email bio skills languages education experience baccalaureate cvUrl')
    .populate('targetId');

  if (!applications.length) {
    return { rankedApplicants: [], totalProcessed: 0 };
  }

  const scoredList = applications.map(app => {
    const candidate = app.applicantId || {};
    const bac = candidate.baccalaureate || {};
    let score = 50; // Base score
    const strengths = [];
    const gaps = [];

    // 1. Check verified Baccalaureate
    if (bac.proofDocUrl && bac.school) {
      score += 20;
      strengths.push(`Verified Baccalaureate (${bac.section || 'General'}, ${bac.year || ''})`);
    } else {
      score -= 10;
      gaps.push('Missing Baccalaureate proof document');
    }

    // 2. Check higher education
    if (candidate.education?.length > 0) {
      const topEdu = candidate.education[0];
      score += 15;
      strengths.push(`${topEdu.degree || 'Degree'} at ${topEdu.school || 'University'}`);
      if (topEdu.graduationCertUrl) {
        score += 5;
        strengths.push('Verified Graduation Diploma attached');
      }
    }

    // 3. Check skills & CV
    if (candidate.cvUrl) {
      score += 10;
      strengths.push('Official CV document attached');
    }

    if (candidate.skills?.length > 0) {
      score += Math.min(10, candidate.skills.length * 2);
      strengths.push(`Matches skills: ${candidate.skills.slice(0, 3).join(', ')}`);
    }

    const finalScore = Math.min(99, Math.max(25, score));
    let recommendation = 'Potential Match';
    if (finalScore >= 85) recommendation = '⭐ Top Candidate / Strong Fit';
    else if (finalScore >= 70) recommendation = '✅ Qualified Candidate';
    else recommendation = '⚠️ Missing Some Credentials';

    return {
      applicationId: app._id,
      candidateName: candidate.name,
      candidateEmail: candidate.email,
      matchScore: finalScore,
      recommendation,
      strengths,
      gaps,
      status: app.status,
      appliedAt: app.createdAt,
    };
  });

  // Sort by highest match score first
  scoredList.sort((a, b) => b.matchScore - a.matchScore);

  return {
    rankedApplicants: scoredList,
    totalProcessed: scoredList.length,
    analyzedAt: new Date(),
  };
};

// ── Subscription & Pro Activation ──────────────────────────────────────────
const activateFreeTrial = async (userId) => {
  const user = await User.findById(userId);
  if (!user) { const e = new Error('User not found'); e.statusCode = 404; throw e; }

  if (user.subscription?.trialUsed) {
    const e = new Error('You have already used your 1-day free trial.');
    e.statusCode = 400;
    throw e;
  }

  const oneDayLater = new Date(Date.now() + 24 * 60 * 60 * 1000);
  user.subscription = {
    ...user.subscription,
    plan: 'pro',
    trialUsed: true,
    trialExpiresAt: oneDayLater,
    expiresAt: oneDayLater,
    unlockedFeatures: ['all'],
    paymentMethod: 'trial',
  };

  await user.save();
  return {
    success: true,
    plan: user.subscription.plan,
    trialExpiresAt: user.subscription.trialExpiresAt,
    unlockedFeatures: user.subscription.unlockedFeatures,
  };
};

const processProPurchase = async (userId, { packageType, paymentMethod, paymentDetails }) => {
  const user = await User.findById(userId);
  if (!user) { const e = new Error('User not found'); e.statusCode = 404; throw e; }

  // Map packageType to unlockedFeatures array
  // packageType: 'all' | 'advisor' | 'tasks' | 'calculator'
  let newFeatures = user.subscription?.unlockedFeatures || [];
  if (packageType === 'all') {
    newFeatures = ['all'];
  } else if (!newFeatures.includes('all') && !newFeatures.includes(packageType)) {
    newFeatures.push(packageType);
  }

  const oneYearLater = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  user.subscription = {
    ...user.subscription,
    plan: 'pro',
    expiresAt: oneYearLater,
    unlockedFeatures: newFeatures,
    paymentMethod: paymentMethod || 'carte_bancaire',
  };

  await user.save();
  return {
    success: true,
    plan: user.subscription.plan,
    expiresAt: user.subscription.expiresAt,
    unlockedFeatures: user.subscription.unlockedFeatures,
    paymentMethod: user.subscription.paymentMethod,
    user: user.toPublicProfile(),
  };
};

const upgradeToProPlan = async (userIdOrInstId, isInstitution = false, plan = 'pro') => {
  if (isInstitution) {
    const inst = await Institution.findByIdAndUpdate(
      userIdOrInstId,
      { 'subscription.plan': plan, 'subscription.expiresAt': new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) },
      { new: true }
    );
    return { type: 'institution', plan: inst.subscription.plan };
  }

  const user = await User.findByIdAndUpdate(
    userIdOrInstId,
    { 
      'subscription.plan': plan, 
      'subscription.expiresAt': new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      'subscription.unlockedFeatures': ['all']
    },
    { new: true }
  );
  return { type: 'user', plan: user.subscription.plan };
};

module.exports = {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  calculateAcademicScore,
  getAICareerAdvice,
  rankApplicantsForListing,
  activateFreeTrial,
  processProPurchase,
  upgradeToProPlan,
};
