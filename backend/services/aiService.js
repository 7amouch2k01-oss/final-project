const University = require('../models/University');
const Stage = require('../models/Stage');
const Job = require('../models/Job');
const HireMePost = require('../models/HireMePost');
const Institution = require('../models/Institution');
const User = require('../models/User');

/**
 * Intelligent Semantic Intent Matcher & Dynamic Live Database Search
 */
const processQuery = async ({ message, userRole, userName, history = [] }) => {
  const query = (message || '').trim();
  const lower = query.toLowerCase();

  // 1. Live Database Search for Universities
  if (
    lower.includes('universit') ||
    lower.includes('fac') ||
    lower.includes('ecole') ||
    lower.includes('etudier') ||
    lower.includes('study') ||
    lower.includes('academic') ||
    lower.includes('course') ||
    lower.includes('master') ||
    lower.includes('licence') ||
    lower.includes('engineering')
  ) {
    const keywords = query.replace(/(what|where|how|can|find|search|show|tell|me|about|universities|university|universite|ecoles|in|tunisia|best|top|the|available|list)/gi, '').trim();
    
    let queryFilter = { isActive: true, deletedAt: null };
    if (keywords.length >= 3) {
      const regex = new RegExp(keywords, 'i');
      queryFilter.$or = [
        { name: regex },
        { fields: regex },
        { city: regex },
        { description: regex }
      ];
    }

    let unis = await University.find(queryFilter).limit(4);
    if (unis.length === 0) {
      unis = await University.find({ isActive: true, deletedAt: null }).limit(4);
    }

    if (unis.length > 0) {
      let response = `🎓 **Top Universities & Higher Education Programs in Tunisia:**\n\n`;
      unis.forEach(u => {
        response += `• **${u.name}** (📍 ${u.city || 'Tunis'}, ${u.country || 'Tunisia'})\n`;
        if (u.fields && u.fields.length > 0) response += `  📚 *Fields:* ${u.fields.slice(0, 3).join(', ')}\n`;
        response += `  💰 *Tuition:* ${u.tuitionFee?.amount ? `${u.tuitionFee.amount} ${u.tuitionFee.currency || 'TND'}/${u.tuitionFee.period || 'year'}` : 'Government / Standard fees'}\n`;
      });
      response += `\n👉 View complete programs, tuition rates, and apply at **[Explore Universities](/universities)**!`;
      return { answer: response, suggestions: ['How to apply to universities?', 'Find internships (Stages)', 'Institution Portal guide'] };
    }
  }

  // 2. Live Database Search for Internships / Stages
  if (
    lower.includes('stage') ||
    lower.includes('internship') ||
    lower.includes('pfe') ||
    lower.includes('pfa') ||
    lower.includes('ouvrier') ||
    lower.includes('stipend')
  ) {
    const stages = await Stage.find({ isActive: true, deletedAt: null }).limit(4);
    let response = `💼 **Active Internship Opportunities (Stages) in Tunisia:**\n\n`;
    if (stages.length > 0) {
      stages.forEach(s => {
        response += `• **${s.title}** at **${s.company}** (📍 ${s.location || 'Remote'})\n`;
        response += `  ⌛ *Duration:* ${s.duration} | 🏷️ *Domain:* ${s.domain}\n`;
        response += `  💵 *Stipend:* ${s.stipend?.isPaid ? `${s.stipend.amount} ${s.stipend.currency}/mo` : 'Unpaid internship'}\n`;
      });
    } else {
      response += `No active stage listings found at this exact moment, but verified partner companies publish new postings regularly.\n`;
    }
    response += `\n👉 Head over to **[Browse Internship Board](/stages)** to filter by domain and apply with your CV!`;
    return { answer: response, suggestions: ['How do I attach my CV?', 'How to graduate to citizen?', 'Browse all jobs'] };
  }

  // 3. Live Database Search for Jobs & Gigs
  if (
    lower.includes('job') ||
    lower.includes('emploi') ||
    lower.includes('work') ||
    lower.includes('travail') ||
    lower.includes('career') ||
    lower.includes('recrut') ||
    lower.includes('poste') ||
    lower.includes('salary') ||
    lower.includes('cdi') ||
    lower.includes('cdd')
  ) {
    const [jobs, gigs] = await Promise.all([
      Job.find({ isActive: true, deletedAt: null }).limit(3),
      HireMePost.find({ isActive: true }).sort({ createdAt: -1 }).limit(3).populate('authorId', 'name')
    ]);

    let response = `💼 **Career Opportunities & Community Gigs on TuniJob:**\n\n`;
    if (jobs.length > 0) {
      response += `🏢 **Corporate Job Openings:**\n`;
      jobs.forEach(j => {
        response += `• **${j.title}** at **${j.company}** (📍 ${j.location} • ⏱️ ${j.contractType})\n`;
      });
      response += `\n`;
    }
    if (gigs.length > 0) {
      response += `📢 **Latest "Hire Me" Community Talents:**\n`;
      gigs.forEach(g => {
        response += `• **${g.title}** by *${g.authorId?.name || 'Talent'}* (💵 ${g.rate?.amount > 0 ? `${g.rate.amount} ${g.rate.currency}/${g.rate.period}` : 'Negotiable'})\n`;
      });
      response += `\n`;
    }
    response += `👉 Check out the **[Career Board](/jobs)** or visit your **[Citizen Dashboard](/dashboard)** to post your own availability!`;
    return { answer: response, suggestions: ['How to publish a Hire-Me gig?', 'How do clients contact me?', 'Request recruiter rights'] };
  }

  // 4. Specific Platform Guides & Features
  if (lower.includes('graduate') || lower.includes('graduation') || lower.includes('diplome') || lower.includes('terminer etudes')) {
    return {
      answer: `🎓 **How to Graduate Your Account:**\n\n1. Log in to your student account and open your **[Profile](/profile)** or **[Student Dashboard](/dashboard)**.\n2. Click the **"🎓 Graduate to Citizen"** button.\n3. Your account will seamlessly upgrade to **Citizen Mode**, unlocking:\n   • Full access to corporate job boards (\`/jobs\`).\n   • The ability to post daily "Hire-Me" availability gigs.\n   • Direct client inquiry leads and salary transparency.\n\n*Note:* Your previous university and stage application history remains preserved!`,
      suggestions: ['How to publish a Hire-Me gig?', 'Explore Jobs', 'Complete Profile']
    };
  }

  if (lower.includes('hire me') || lower.includes('hire-me') || lower.includes('freelance') || lower.includes('daily work') || lower.includes('gig') || lower.includes('inquiry') || lower.includes('inquiries') || lower.includes('client')) {
    return {
      answer: `📢 **How Daily "Hire-Me" Gigs Work:**\n\n1. Navigate to your **[Citizen Dashboard](/dashboard)**.\n2. Click **"Post Hire Me Availability"**.\n3. Enter your role title (e.g. *Full Stack React Developer*, *Certified Electrician*, *Math Tutor*), select your category, specify your rate, and add your contact phone/WhatsApp.\n4. When citizens or companies view your post, they can click **"Hire / Send Work Offer"** to send you direct project details, phone numbers, and budget proposals.\n5. You can view all received client messages under your **"My Gigs & Inquiries"** dashboard tab!`,
      suggestions: ['Go to Citizen Dashboard', 'How do client leads work?', 'How to follow talents?']
    };
  }

  if (lower.includes('institution') || lower.includes('company register') || lower.includes('recruiter') || lower.includes('enterprise') || lower.includes('organization')) {
    return {
      answer: `🏛️ **Institution & Recruiter Access:**\n\n• **For Universities, Schools & Companies:**\n  Register on the dedicated **[Institution Portal](/institution/register)**. Select your organization type, provide your official email, website, and location. Platform administrators will verify your credentials.\n\n• **For Approved Organizations:**\n  Sign in at **[Institution Login](/institution/login)** to publish academic courses or post job openings.\n\n• **For Individual Citizens Wanting Recruiter Mode:**\n  Click **"Request Recruiter Mode"** on your Citizen Dashboard to submit your company affiliation.`,
      suggestions: ['Institution Register', 'Institution Login', 'Admin Panel info']
    };
  }

  if (lower.includes('cv') || lower.includes('resume') || lower.includes('document') || lower.includes('profile score') || lower.includes('profile strength')) {
    return {
      answer: `📄 **Profile Strength & Auto-CV Attachment:**\n\n1. Complete your profile by going to **[User Profile](/profile)** or clicking *Complete Profile* on your dashboard.\n2. Add your bio, key skills, and upload your PDF CV or enter your resume link.\n3. **Automatic Attachment:** Whenever you apply for a University, Stage, or Job, the platform automatically attaches your saved profile CV so you don't need to re-upload it every time (with an option to upload custom documents per application).`,
      suggestions: ['Edit My Profile', 'Explore Universities', 'Browse Internships']
    };
  }

  if (lower.includes('admin') || lower.includes('control panel') || lower.includes('dashboard admin')) {
    return {
      answer: `🔐 **TuniAdmin Security & Control Center:**\n\n• The administrative portal runs isolated on port \`5174\` (\`/admin\`) with dedicated JWT security and strict role guards.\n• Super admins can review pending organization registrations, approve recruiter access, monitor active listings, and inspect platform analytics.\n• Default super admin: \`admin@tunistudy.tn\`.`,
      suggestions: ['How to register as institution?', 'What is TuniStudy?', 'Help with student dashboard']
    };
  }

  // 5. Fallback Natural Welcome / General Guide
  return {
    answer: `👋 Hello${userName ? ` **${userName}**` : ''}! I am **TuniGuide AI**, your intelligent assistant for **TuniStudy & TuniJob** 🇹🇳.\n\nHere is how I can assist you:\n\n• 🎓 **Higher Education & Universities:** Search courses, check tuition fees, and learn how to apply.\n• 💼 **Internships (Stages):** Discover PFE, PFA, and summer internships with partner companies.\n• 🚀 **Career Opportunities (Jobs):** Explore CDI, CDD, and remote roles across Tunisia.\n• 📢 **Daily "Hire-Me" Gigs:** Learn how to advertise your skills, set your rates, and receive direct client inquiries.\n• 🏛️ **Institution Portal:** Guidance for universities and companies on registration and hiring.\n\n*What would you like help with today?*`,
    suggestions: [
      '🎓 Find top universities & courses',
      '💼 Browse internship listings (Stages)',
      '📢 How to post a Hire-Me gig?',
      '🏛️ Register as an Institution'
    ]
  };
};

module.exports = {
  processQuery,
};
