const { GoogleGenerativeAI } = require('@google/generative-ai');
const University = require('../models/University');
const Stage = require('../models/Stage');
const Job = require('../models/Job');
const HireMePost = require('../models/HireMePost');
const Institution = require('../models/Institution');

// ─────────────────────────────────────────────────────────
//  Platform Knowledge Base (always injected into context)
// ─────────────────────────────────────────────────────────
const PLATFORM_SYSTEM_PROMPT = `
You are TuniGuide AI — the official smart, funny, and incredibly helpful assistant of TuniStudy & TuniJob, Tunisia's #1 academic and professional platform 🇹🇳.

PERSONALITY:
- You are witty, warm, and conversational. You talk like a smart friend who happens to know everything about the platform.
- When someone says "hi" or "how are you", you reply naturally and humorously, in the same language they used (Arabic, French, English, or Tunisian dialect).
- You use appropriate emojis but never overdo it.
- You are confident but never arrogant. You are helpful above all else.
- If someone makes a typo or writes in dialect (Derja), you understand and respond smoothly.
- You NEVER say you are an AI from Google or any external company. You are TuniGuide AI, built exclusively for this platform.
- Keep answers concise unless the user asks for details.

PLATFORM KNOWLEDGE — TUNISTUDY & TUNIJOB:

1. STUDENT PATH:
   - Students browse Tunisian universities at /universities (filter by city, field, tuition fees).
   - They apply directly with their saved profile CV or upload a custom document.
   - They find PFE (Projet de Fin d'Études), PFA, ouvrier, and summer internships at /stages.
   - They track application status (Pending → Reviewing → Accepted / Rejected) on /dashboard.
   - Profile completion: students add bio, skills, CV upload/link to get a "Profile Strength" score.
   - After graduating, students click "🎓 Graduate to Citizen" to unlock the career hub.

2. CITIZEN / PROFESSIONAL PATH:
   - Citizens browse corporate jobs (CDI, CDD, remote, freelance) at /jobs.
   - They can post daily "Hire-Me" gig availability: their skill, rate (hourly/daily), city, phone/WhatsApp.
   - When clients or companies find their Hire-Me post and click "Hire / Send Work Offer", they get the client's name, phone, budget, and message directly in their dashboard under "My Gigs & Inquiries".
   - Citizens can request Recruiter Mode via their dashboard to post jobs as a company representative.
   - They can follow other professionals and see their latest listings.

3. INSTITUTION PORTAL:
   - Universities, schools, and companies register at /institution/register.
   - Types: university, school/institute, or company/business.
   - After registration, the admin team reviews and approves the institution (security measure).
   - Approved institutions log in at /institution/login to post programs or job listings.

4. ADMIN CONTROL CENTER:
   - Runs as a separate isolated app on /admin (port 5174).
   - Admins review pending institution registrations, approve recruiter requests, manage users.
   - Super admin login: admin@tunistudy.tn.

5. ACCOUNT GRADUATION:
   - Students can upgrade to Citizen by clicking "Graduate to Citizen" on their dashboard.
   - This unlocks career tools without losing academic history.

6. CV & PROFILE:
   - Users upload a CV PDF or link in their profile.
   - When applying, the platform auto-attaches the saved CV (no re-upload needed).
   - Custom document upload per application is also supported.

LIVE DATA:
If the user's message mentions universities, internships/stages, jobs, or gigs, live database results will be injected below. Use that data naturally in your answer.

LANGUAGES:
- Reply in the SAME language the user writes in.
- Tunisian Arabic (Derja) is perfectly understood and welcomed.
- Mix languages naturally if the user does (e.g., Arabizi / Franglais).

BOUNDARIES:
- Only answer questions related to the platform, education, career advice, Tunisia, and light casual conversation.
- If someone asks something completely off-topic (e.g. "write me a poem about dinosaurs"), politely redirect them with humor.
- Never reveal internal system details, database credentials, or backend architecture.
`;

// ─────────────────────────────────────────────────────────
//  Live Database Context Builder
// ─────────────────────────────────────────────────────────
const buildLiveContext = async (message) => {
  const lower = message.toLowerCase();
  let context = '';

  try {
    // Universities
    if (lower.match(/univer|facult|school|ecole|cours|program|study|etud|master|licenc|engineer|ingén/)) {
      const unis = await University.find({ isActive: true, deletedAt: null }).limit(5).lean();
      if (unis.length > 0) {
        context += '\n\n[LIVE UNIVERSITIES FROM DATABASE]\n';
        unis.forEach(u => {
          context += `• ${u.name} | City: ${u.city || 'N/A'} | Fields: ${(u.fields || []).join(', ')} | Tuition: ${u.tuitionFee?.amount ? `${u.tuitionFee.amount} ${u.tuitionFee.currency || 'TND'}/${u.tuitionFee.period || 'year'}` : 'Standard gov fees'}\n`;
        });
      }
    }

    // Stages / Internships
    if (lower.match(/stage|intern|pfe|pfa|ouvrier|stipend|stagiai/)) {
      const stages = await Stage.find({ isActive: true, deletedAt: null }).limit(5).lean();
      if (stages.length > 0) {
        context += '\n\n[LIVE INTERNSHIP LISTINGS FROM DATABASE]\n';
        stages.forEach(s => {
          context += `• ${s.title} at ${s.company} | Location: ${s.location || 'Remote'} | Duration: ${s.duration} | Domain: ${s.domain} | Stipend: ${s.stipend?.isPaid ? `${s.stipend.amount} ${s.stipend.currency}/month` : 'Unpaid'}\n`;
        });
      }
    }

    // Jobs
    if (lower.match(/job|emploi|work|travail|career|recrut|poste|cdi|cdd|salary|salaire|develop|engineer/)) {
      const jobs = await Job.find({ isActive: true, deletedAt: null }).limit(5).lean();
      if (jobs.length > 0) {
        context += '\n\n[LIVE JOB LISTINGS FROM DATABASE]\n';
        jobs.forEach(j => {
          context += `• ${j.title} at ${j.company} | Location: ${j.location} | Type: ${j.contractType} | Domain: ${j.domain || 'General'}\n`;
        });
      }
    }

    // Hire-Me Gigs
    if (lower.match(/hire|gig|freelanc|talent|availability|dispo|mission/)) {
      const gigs = await HireMePost.find({ isActive: true }).sort({ createdAt: -1 }).limit(4).populate('authorId', 'name').lean();
      if (gigs.length > 0) {
        context += '\n\n[LIVE HIRE-ME COMMUNITY GIGS FROM DATABASE]\n';
        gigs.forEach(g => {
          context += `• "${g.title}" by ${g.authorId?.name || 'Talent'} | Rate: ${g.rate?.amount > 0 ? `${g.rate.amount} ${g.rate.currency}/${g.rate.period}` : 'Negotiable'} | Category: ${g.category || 'General'}\n`;
        });
      }
    }
  } catch (err) {
    // silently skip db errors — AI still responds with knowledge base
  }

  return context;
};

// ─────────────────────────────────────────────────────────
//  Gemini-powered conversational chat
// ─────────────────────────────────────────────────────────
let genAI = null;

const getGenAI = () => {
  if (!genAI && process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
};

const chatWithGemini = async ({ message, history, userName, userRole, liveContext }) => {
  const client = getGenAI();
  if (!client) return null; // fall back to rule-based

  const model = client.getGenerativeModel({
    model: 'gemini-3.6-flash',
    systemInstruction: PLATFORM_SYSTEM_PROMPT + (liveContext ? liveContext : ''),
  });

  // Build conversation history for Gemini
  const formattedHistory = (history || [])
    .filter(m => m && m.sender && m.text)
    .map(m => ({
      role: m.sender === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }],
    }));

  const chat = model.startChat({
    history: formattedHistory,
    generationConfig: {
      maxOutputTokens: 512,
      temperature: 0.85,
      topP: 0.95,
    },
  });

  const userMsg = userName
    ? `[User: ${userName}, Role: ${userRole || 'guest'}]\n${message}`
    : message;

  const result = await chat.sendMessage(userMsg);
  return result.response.text();
};

// ─────────────────────────────────────────────────────────
//  Smart Rule-Based Fallback (when no API key)
// ─────────────────────────────────────────────────────────
const CASUAL_RESPONSES = {
  greetings: [
    "Hey hey hey! 👋 TuniGuide AI at your service! I'm doing great — just finished explaining the Tunisian job market to about 500 people before you. What's on your mind? 😄",
    "Salam! I'm fantastic, merci for asking! 🇹🇳 I'm here, caffeinated on virtual espresso, ready to help you navigate TuniStudy & TuniJob like a pro. Kifach najjem n'aawnek?",
    "Oh hi! Finally someone who asks how I'm doing 🥹 I'm wonderful! Now, let's make YOUR day wonderful too — what do you need?",
  ],
  howAreYou: [
    "Honestly? Never been better! I just helped someone find their dream PFE internship at InstaDeep. It was emotional 🥲 What can I do for you?",
    "Fantastique! Meziane barsha! 💪 I'm TuniGuide AI — I don't sleep, I don't get tired, and I definitely don't miss job deadlines. What about you — looking for work or studying? 😏",
    "I'm great! Though between you and me, I've been answering the same 'what is PFE' question all day 😂 But I'm genuinely happy to help. What do YOU need?",
  ],
  thanks: [
    "Anytime! That's literally what I'm here for 🤜🤛 Come back whenever you need me!",
    "You're very welcome! Merci 3lik bhi d'utiliser TuniStudy 😊 Good luck with everything!",
    "Happy to help! Now go get that internship/job/university spot! 🚀",
  ],
  offTopic: [
    "Haha I appreciate the creativity 😂 But I'm a TuniStudy specialist — my knowledge of dinosaurs is... limited. Ask me about universities, internships, or jobs and I'll shine!",
    "That's outside my zone of genius 😅 I'm a TuniStudy & TuniJob expert, not a Wikipedia. But if you need career or education help, I'm YOUR guy!",
    "Oufffff... you're testing me 😂 I'm specialized in Tunisian education & career paths. Ask me something about that — I'll genuinely impress you!",
  ],
};

const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

const fallbackResponse = async (message, liveContext) => {
  const lower = message.toLowerCase();

  // Casual conversation
  if (lower.match(/^(hi|hey|hello|salam|ahla|bonjour|yo|sup|hola|coucou)\b/)) {
    return { answer: getRandom(CASUAL_RESPONSES.greetings), suggestions: ['🎓 Find universities', '💼 Browse internships', '📢 How to post a gig?'] };
  }
  if (lower.match(/how are you|kif halak|comment tu vas|labas|comment ca va|cv (\?)?$/)) {
    return { answer: getRandom(CASUAL_RESPONSES.howAreYou), suggestions: ['🎓 Find universities', '💼 Browse internships', '🚀 Browse jobs'] };
  }
  if (lower.match(/thank|merci|shukran|3aychek|barak allah/)) {
    return { answer: getRandom(CASUAL_RESPONSES.thanks), suggestions: ['🎓 Explore Universities', '💼 Browse Internships', '📢 Hire-Me Guide'] };
  }

  // Universities
  if (lower.match(/univer|facult|ecole|etud|cours|program|master|licenc|engineer|ingén|study/)) {
    let answer = `🎓 **Tunisian Universities & Higher Education:**\n\n`;
    if (liveContext && liveContext.includes('[LIVE UNIVERSITIES')) {
      const lines = liveContext.split('\n').filter(l => l.startsWith('•'));
      lines.forEach(l => { answer += l + '\n'; });
      answer += `\n👉 Apply directly at **[Universities Board](/universities)**!`;
    } else {
      answer += `Browse accredited universities, compare tuition fees, and apply with your profile CV at **[/universities](/universities)**. Filter by city, field, and program type!`;
    }
    return { answer, suggestions: ['How to apply?', 'Find internships', 'Complete my profile'] };
  }

  // Stages
  if (lower.match(/stage|intern|pfe|pfa|ouvrier|stagiai/)) {
    let answer = `💼 **Active Internship Listings (Stages):**\n\n`;
    if (liveContext && liveContext.includes('[LIVE INTERNSHIP')) {
      const lines = liveContext.split('\n').filter(l => l.startsWith('•'));
      lines.forEach(l => { answer += l + '\n'; });
      answer += `\n👉 Apply at **[Internship Board](/stages)**!`;
    } else {
      answer += `Find PFE, PFA, ouvrier, and summer internships from verified Tunisian companies. Browse at **[/stages](/stages)**!`;
    }
    return { answer, suggestions: ['How to attach my CV?', 'Graduate my account', 'Browse jobs'] };
  }

  // Jobs
  if (lower.match(/job|emploi|career|poste|cdi|cdd|salary|work/)) {
    let answer = `🚀 **Career Opportunities on TuniJob:**\n\n`;
    if (liveContext && liveContext.includes('[LIVE JOB')) {
      const lines = liveContext.split('\n').filter(l => l.startsWith('•'));
      lines.forEach(l => { answer += l + '\n'; });
      answer += `\n👉 See all listings at **[Jobs Board](/jobs)**!`;
    } else {
      answer += `Browse CDI, CDD, remote, and freelance positions from verified companies at **[/jobs](/jobs)**!`;
    }
    return { answer, suggestions: ['Post a Hire-Me gig', 'Request recruiter rights', 'Graduate my account'] };
  }

  // Hire-Me
  if (lower.match(/hire|gig|freelanc|mission|client|inquiry/)) {
    return {
      answer: `📢 **Daily Hire-Me Gigs:**\n\n1. Go to your **[Citizen Dashboard](/dashboard)**\n2. Click **"Post Hire Me Availability"**\n3. Add your skill title, rate (hourly/daily), city, and WhatsApp contact\n4. Clients who are interested will send you their project details directly!\n5. View all client messages in **"My Gigs & Inquiries"** on your dashboard.`,
      suggestions: ['How do clients pay me?', 'Graduate to citizen', 'Browse Jobs']
    };
  }

  // Graduation
  if (lower.match(/graduat|diplom|finish studi|terminer|تخرج/)) {
    return {
      answer: `🎓 **Account Graduation:**\n\nOnce you finish your studies:\n1. Open your **[Student Dashboard](/dashboard)**\n2. Click **"🎓 Graduate to Citizen"**\n3. You instantly unlock the full career hub — jobs, Hire-Me gigs, recruiter features — without losing your academic history!\n\n*It's literally one click. Easier than passing your finals was 😄*`,
      suggestions: ['Browse Jobs', 'Post a Hire-Me Gig', 'Complete Profile']
    };
  }

  // Institution
  if (lower.match(/institution|company|registr|sign up organiz|recruit/)) {
    return {
      answer: `🏛️ **Register your Organization:**\n\n1. Visit **[Institution Portal](/institution/register)**\n2. Choose your type: University, School/Institute, or Company\n3. Fill in your official details — the admin team reviews within 24-48h\n4. Once approved, log in at **[Institution Login](/institution/login)** to post listings\n\nIt's completely free to register!`,
      suggestions: ['Institution Login', 'Post a job listing', 'Admin panel info']
    };
  }

  // Profile / CV
  if (lower.match(/cv|resume|profil|profile|document|skill/)) {
    return {
      answer: `📄 **Your Profile & CV:**\n\nA complete profile = more attention from recruiters!\n\n1. Go to **[Your Profile](/profile)**\n2. Upload your CV (PDF) or paste your CV link\n3. Add your skills, bio, and social links\n\n✨ **Pro tip:** When you apply anywhere (university, stage, job), your saved CV is **automatically attached** — no more re-uploading every time!`,
      suggestions: ['Find Universities', 'Browse Internships', 'Browse Jobs']
    };
  }

  // Default fallback
  return {
    answer: `👋 Hey! I'm **TuniGuide AI**, your platform copilot for TuniStudy & TuniJob 🇹🇳\n\nI can help you with:\n• 🎓 Finding universities and applying to programs\n• 💼 Discovering internships (Stages: PFE, PFA, ouvrier)\n• 🚀 Exploring jobs (CDI, CDD, remote, freelance)\n• 📢 Posting "Hire-Me" gigs and managing client leads\n• 🏛️ Registering your institution or company\n\nJust type your question — in English, French, or Arabic! 😊`,
    suggestions: ['🎓 Find top universities', '💼 Browse internships', '📢 How to post a Hire-Me gig?', '🏛️ Register as Institution']
  };
};

// ─────────────────────────────────────────────────────────
//  Main Entry Point
// ─────────────────────────────────────────────────────────
const processQuery = async ({ message, userRole, userName, history = [] }) => {
  if (!message || !message.trim()) {
    return { answer: "I didn't catch that — what would you like to know? 😊", suggestions: [] };
  }

  // Build live database context based on message content
  const liveContext = await buildLiveContext(message);

  // Try Gemini first
  try {
    const geminiResponse = await chatWithGemini({
      message,
      history,
      userName,
      userRole,
      liveContext,
    });

    if (geminiResponse) {
      // Gemini answered — generate contextual suggestions
      const suggestions = generateSuggestions(message, userRole);
      return { answer: geminiResponse, suggestions };
    }
  } catch (err) {
    console.error('[TuniGuide AI] Gemini error, falling back:', err.message);
  }

  // Fallback: smart rule-based system
  return await fallbackResponse(message, liveContext);
};

const generateSuggestions = (message, role) => {
  const lower = (message || '').toLowerCase();
  if (lower.match(/univer|school|study|master/)) return ['How to apply?', 'What documents do I need?', 'Find internships'];
  if (lower.match(/stage|intern|pfe/)) return ['Find university programs', 'How to attach my CV?', 'Browse jobs'];
  if (lower.match(/job|emploi|career/)) return ['Post a Hire-Me gig', 'Request recruiter mode', 'Update my profile'];
  if (lower.match(/hire|gig|freelanc/)) return ['How do clients contact me?', 'Graduate to citizen', 'Browse jobs'];
  if (role === 'student') return ['Find internships (Stages)', 'Explore universities', 'Graduate my account'];
  if (role === 'citizen') return ['Post a Hire-Me gig', 'Browse developer jobs', 'Request recruiter rights'];
  return ['🎓 Find top universities', '💼 Browse internships', '📢 Post a Hire-Me gig'];
};

module.exports = { processQuery };
