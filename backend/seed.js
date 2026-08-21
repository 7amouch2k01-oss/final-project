/**
 * seed.js (Expanded Edition)
 * ──────────────────────────
 * Expanded database seeder script for TuniStudy / TuniJob.
 * Populates MongoDB with an extensive set of realistic Tunisian universities, 
 * internships, jobs, users, and applications across various regions.
 * Run via: node seed.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const University = require('./models/University');
const Stage = require('./models/Stage');
const Job = require('./models/Job');
const Application = require('./models/Application');
const Notification = require('./models/Notification');

const SEED_PASSWORD = 'Password123!';

const seed = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected.');

    console.log('🧹 Cleaning database collections...');
    await Promise.all([
      User.deleteMany({}),
      University.deleteMany({}),
      Stage.deleteMany({}),
      Job.deleteMany({}),
      Application.deleteMany({}),
      Notification.deleteMany({}),
    ]);
    console.log('✅ Databases cleared.');

    // ── 1. SEED USERS ────────────────────────────────────────────────────────
    console.log('👤 Seeding users...');
    
    // Admins
    const superAdmin = await User.create({
      name: 'Platform Super Admin',
      email: 'admin@tunistudy.tn',
      password: SEED_PASSWORD,
      role: 'admin',
      isActive: true,
    });

    // Recruiters (Citizens with approved recruit rights)
    const recruiterVermeg = await User.create({
      name: 'Houssem (Vermeg HR)',
      email: 'hr@vermeg.com',
      password: SEED_PASSWORD,
      role: 'citizen',
      isActive: true,
      recruitRights: {
        status: 'approved',
        requestedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        reviewedAt: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000),
      },
      company: {
        name: 'Vermeg',
        description: 'Financial software publisher, global leader in software solutions for insurance and finance.',
        website: 'https://www.vermeg.com',
        location: 'Les Berges du Lac, Tunis',
        logo: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
      }
    });

    const recruiterInstadeep = await User.create({
      name: 'Amira (Instadeep Talent)',
      email: 'careers@instadeep.com',
      password: SEED_PASSWORD,
      role: 'citizen',
      isActive: true,
      recruitRights: {
        status: 'approved',
        requestedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        reviewedAt: new Date(Date.now() - 19 * 24 * 60 * 60 * 1000),
      },
      company: {
        name: 'InstaDeep',
        description: 'InstaDeep delivers AI-powered decision-making systems for the enterprise.',
        website: 'https://www.instadeep.com',
        location: 'Ariana, Tunis',
        logo: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
      }
    });

    const recruiterEsprit = await User.create({
      name: 'Prof. Mohamed (ESPRIT Admission)',
      email: 'admissions@esprit.tn',
      password: SEED_PASSWORD,
      role: 'citizen',
      isActive: true,
      recruitRights: {
        status: 'approved',
        requestedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        reviewedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      },
      company: {
        name: 'ESPRIT Group',
        description: 'Ecole Supérieure Privée d\'Ingénierie et de Technologies.',
        website: 'https://esprit.tn',
        location: 'Ghazela, Ariana',
        logo: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
      }
    });

    const recruiterSatoripop = await User.create({
      name: 'Marwen (Satoripop Sousse)',
      email: 'careers@satoripop.com',
      password: SEED_PASSWORD,
      role: 'citizen',
      isActive: true,
      recruitRights: {
        status: 'approved',
        requestedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
        reviewedAt: new Date(Date.now() - 24 * 24 * 60 * 60 * 1000),
      },
      company: {
        name: 'Satoripop',
        description: 'Digital agency specializing in mobile development, UX/UI, and web integrations.',
        website: 'https://satoripop.com',
        location: 'Sahloul, Sousse',
        logo: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
      }
    });

    const recruiterTelnet = await User.create({
      name: 'Anis (Telnet Group)',
      email: 'hr@telnet.com.tn',
      password: SEED_PASSWORD,
      role: 'citizen',
      isActive: true,
      recruitRights: {
        status: 'approved',
        requestedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        reviewedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
      },
      company: {
        name: 'Telnet Group',
        description: 'Product engineering, embedded systems, and consulting in innovation and space technology.',
        website: 'http://www.groupe-telnet.com',
        location: 'Charguia II, Tunis',
        logo: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
      }
    });

    const recruiterBiat = await User.create({
      name: 'Selima (BIAT Talent)',
      email: 'recrutement@biat.com.tn',
      password: SEED_PASSWORD,
      role: 'citizen',
      isActive: true,
      recruitRights: {
        status: 'approved',
        requestedAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
        reviewedAt: new Date(Date.now() - 39 * 24 * 60 * 60 * 1000),
      },
      company: {
        name: 'BIAT',
        description: 'Banque Internationale Arabe de Tunisie - the largest private sector bank in Tunisia.',
        website: 'https://www.biat.com.tn',
        location: 'Avenue Habib Bourguiba, Tunis',
        logo: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
      }
    });

    // Students
    const studentAli = await User.create({
      name: 'Ali Ben Salem',
      email: 'ali.bensalem@esprit.tn',
      password: SEED_PASSWORD,
      role: 'student',
      isActive: true,
      bio: 'Final year software engineering student passionate about full stack development and cloud systems.',
      skills: ['React', 'Node.js', 'MongoDB', 'Docker', 'Git'],
      languages: ['Arabic', 'French', 'English'],
      education: [{
        school: 'ESPRIT',
        degree: 'Engineering Degree',
        field: 'Computer Science',
        from: new Date('2022-09-15'),
        to: new Date('2027-06-30')
      }]
    });

    const studentSana = await User.create({
      name: 'Sana Trabelsi',
      email: 'sana.trabelsi@insat.u-carthage.tn',
      password: SEED_PASSWORD,
      role: 'student',
      isActive: true,
      bio: 'Applied mathematics and computer science enthusiast looking for machine learning internships.',
      skills: ['Python', 'TensorFlow', 'SQL', 'Data Analytics'],
      languages: ['Arabic', 'French', 'English', 'German'],
      education: [{
        school: 'INSAT',
        degree: 'National Engineering Diploma',
        field: 'Software Engineering',
        from: new Date('2021-09-15'),
        to: new Date('2026-06-30')
      }]
    });

    const studentYassine = await User.create({
      name: 'Yassine Khelifi',
      email: 'yassine.khelifi@enit.rnu.tn',
      password: SEED_PASSWORD,
      role: 'student',
      isActive: true,
      bio: 'Embedded hardware and IoT software engineer student at ENIT.',
      skills: ['C++', 'Embedded C', 'Microcontrollers', 'RTOS', 'Linux'],
      languages: ['Arabic', 'French', 'English'],
      education: [{
        school: 'ENIT - Ecole Nationale d\'Ingénieurs de Tunis',
        degree: 'Engineering Degree',
        field: 'Embedded Systems',
        from: new Date('2023-09-15'),
        to: new Date('2026-06-30')
      }]
    });

    const studentAmal = await User.create({
      name: 'Amal Ghorbel',
      email: 'amal.ghorbel@enis.rnu.tn',
      password: SEED_PASSWORD,
      role: 'student',
      isActive: true,
      bio: 'Telecom student at ENIS. Interested in cloud architectures and 5G network safety protocols.',
      skills: ['Networking', 'Python', 'Kubernetes', 'Linux', 'Cisco'],
      languages: ['Arabic', 'French', 'English', 'Italian'],
      education: [{
        school: 'ENIS - Ecole Nationale d\'Ingénieurs de Sfax',
        degree: 'Engineering Degree',
        field: 'Telecommunications',
        from: new Date('2023-09-15'),
        to: new Date('2026-06-30')
      }]
    });

    // Citizens (Regular Job Seekers)
    const citizenRamy = await User.create({
      name: 'Ramy Gharbi',
      email: 'ramy.gharbi@gmail.com',
      password: SEED_PASSWORD,
      role: 'citizen',
      isActive: true,
      bio: 'Experienced frontend engineer with 3+ years of experience working with React and modern CSS systems.',
      skills: ['JavaScript', 'React', 'HTML5', 'CSS3', 'Tailwind', 'Next.js'],
      languages: ['Arabic', 'French', 'English'],
      experience: [{
        company: 'Innovate Tunisia',
        title: 'Frontend Developer',
        from: new Date('2023-01-10'),
        to: new Date('2025-05-30'),
        description: 'Developed modern dashboards and static landing pages using React and responsive layouts.'
      }]
    });

    const citizenLinda = await User.create({
      name: 'Linda Mahjoub',
      email: 'linda.mahjoub@yahoo.com',
      password: SEED_PASSWORD,
      role: 'citizen',
      isActive: true,
      bio: 'DevOps professional specialized in CI/CD pipeline automation and AWS infrastructure.',
      skills: ['AWS', 'Kubernetes', 'Terraform', 'Jenkins', 'Bash', 'Linux'],
      languages: ['Arabic', 'French', 'English'],
      experience: [{
        company: 'TechSolutions Tunisia',
        title: 'DevOps Engineer',
        from: new Date('2024-03-01'),
        to: new Date('2026-07-15'),
        description: 'Managed Kubernetes clusters, deployment setups, and automated testing integrations.'
      }]
    });

    const citizenKhalil = await User.create({
      name: 'Khalil Mansour',
      email: 'khalil.mansour@gmail.com',
      password: SEED_PASSWORD,
      role: 'citizen',
      isActive: true,
      bio: 'Quality Assurance specialist focused on automation testing, mobile apps, and load tests.',
      skills: ['Selenium', 'Cypress', 'Appium', 'Postman', 'JavaScript', 'JIRA'],
      languages: ['Arabic', 'French', 'English'],
      experience: [{
        company: 'Focus Corp',
        title: 'QA Analyst',
        from: new Date('2022-05-15'),
        to: new Date('2025-07-01'),
        description: 'Executed manual test runs and implemented Cypress end-to-end testing pipelines.'
      }]
    });

    const citizenEmna = await User.create({
      name: 'Emna Bouazizi',
      email: 'emna.bouazizi@outlook.com',
      password: SEED_PASSWORD,
      role: 'citizen',
      isActive: true,
      bio: 'Mobile App Developer specialized in Dart and Flutter. Creative design coder.',
      skills: ['Dart', 'Flutter', 'iOS', 'Android', 'Firebase', 'State Management'],
      languages: ['Arabic', 'French', 'English'],
      experience: [{
        company: 'Satoripop',
        title: 'Junior Mobile Developer',
        from: new Date('2023-10-01'),
        to: new Date('2025-11-30'),
        description: 'Built customer loyalty apps and handled API integrations using Flutter.'
      }]
    });

    console.log('✅ Users successfully seeded.');

    // ── 2. SEED UNIVERSITIES ──────────────────────────────────────────────────
    console.log('🏫 Seeding universities...');

    const uniEsprit = await University.create({
      recruiterId: recruiterEsprit._id,
      name: 'ESPRIT - Ecole Supérieure Privée d\'Ingénierie',
      country: 'Tunisia',
      city: 'Ariana',
      logo: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
      description: 'Accredited by EUR-ACE, ESPRIT offers outstanding engineering curricula in Computer Science, Telecommunications, Civil Engineering, Electromechanics, and Business.',
      fields: ['Computer Science', 'Telecommunications', 'Electromechanics', 'Civil Engineering', 'Management'],
      requirements: ['Baccalaureate Diploma', 'Successfully pass admission file review & oral interview'],
      tuitionFee: { amount: 8500, currency: 'TND', period: 'year' },
      applicationDeadline: new Date('2026-09-10'),
      website: 'https://esprit.tn',
      email: 'contact@esprit.tn',
      phone: '+216 71 857 000',
      isActive: true,
      isFeatured: true,
    });

    const uniInsat = await University.create({
      recruiterId: superAdmin._id,
      name: 'INSAT - Institut National des Sciences Appliquées et de Technologie',
      country: 'Tunisia',
      city: 'Tunis',
      logo: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
      description: 'A leading public engineering institute in Tunis, famous for its integrated curricula combining science education with hands-on industrial projects.',
      fields: ['Software Engineering', 'Industrial Networks', 'Biological Engineering', 'Instrumentation'],
      requirements: ['Baccalaureate Diploma (High Score required)', 'Orientation system allocation'],
      tuitionFee: { amount: 0, currency: 'TND', period: 'year' },
      applicationDeadline: new Date('2026-09-01'),
      website: 'http://www.insat.rnu.tn',
      email: 'insat.admin@rnu.tn',
      phone: '+216 71 703 829',
      isActive: true,
      isFeatured: false,
    });

    const uniMsb = await University.create({
      recruiterId: recruiterEsprit._id,
      name: 'MSB - Mediterranean School of Business',
      country: 'Tunisia',
      city: 'Tunis',
      logo: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
      description: 'The first English-speaking business school in Tunisia, offering international-standard undergraduate, graduate, and executive programs.',
      fields: ['Business Administration', 'Finance', 'Marketing', 'Business Analytics'],
      requirements: ['Baccalaureate or Equivalent', 'English proficiency test pass', 'Interview'],
      tuitionFee: { amount: 14000, currency: 'TND', period: 'year' },
      applicationDeadline: new Date('2026-08-30'),
      website: 'https://www.msb.tn',
      email: 'info@msb.tn',
      phone: '+216 71 857 857',
      isActive: true,
      isFeatured: true,
    });

    const uniEnit = await University.create({
      recruiterId: superAdmin._id,
      name: 'ENIT - Ecole Nationale d\'Ingénieurs de Tunis',
      country: 'Tunisia',
      city: 'Tunis',
      logo: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
      description: 'The oldest public engineering school in Tunisia, founded in 1968, known for its academic rigor and elite entry program.',
      fields: ['Electrical Engineering', 'Civil Engineering', 'Mechanical Engineering', 'IT Systems', 'Hydraulics'],
      requirements: ['Top score in national competitive exam for engineering school entry'],
      tuitionFee: { amount: 0, currency: 'TND', period: 'year' },
      applicationDeadline: new Date('2026-08-25'),
      website: 'http://www.enit.rnu.tn',
      email: 'enit@enit.utm.tn',
      phone: '+216 71 874 700',
      isActive: true,
      isFeatured: false,
    });

    const uniSesame = await University.create({
      recruiterId: recruiterEsprit._id,
      name: 'Sesame University',
      country: 'Tunisia',
      city: 'Ariana',
      logo: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
      description: 'Sesame is a private higher education institution offering customized courses in engineering, computer science, and business management.',
      fields: ['Software Engineering', 'Digital Business', 'Data Science', 'Network Administration'],
      requirements: ['Baccalaureate degree', 'Interview and files validation'],
      tuitionFee: { amount: 6500, currency: 'TND', period: 'year' },
      applicationDeadline: new Date('2026-09-15'),
      website: 'https://sesame.com.tn',
      email: 'contact@sesame.tn',
      phone: '+216 71 858 585',
      isActive: true,
      isFeatured: false,
    });

    const uniTekup = await University.create({
      recruiterId: recruiterEsprit._id,
      name: 'TEK-UP - Technology University',
      country: 'Tunisia',
      city: 'Ariana',
      logo: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
      description: 'Private higher school specializing in engineering and technologies with strong professional certification focus (Oracle, Cisco, AWS).',
      fields: ['Software Engineering', 'Computer Networks', 'Telecommunications', 'Data Science'],
      requirements: ['Baccalaureate', 'Scientific profile validation'],
      tuitionFee: { amount: 7200, currency: 'TND', period: 'year' },
      applicationDeadline: new Date('2026-09-15'),
      website: 'https://tek-up.de',
      email: 'info@tek-up.de',
      phone: '+216 70 242 424',
      isActive: true,
      isFeatured: false,
    });

    const uniEnis = await University.create({
      recruiterId: superAdmin._id,
      name: 'ENIS - Ecole Nationale d\'Ingénieurs de Sfax',
      country: 'Tunisia',
      city: 'Sfax',
      logo: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
      description: 'Prestigious public engineering school in Sfax, specializing in electro-mechanics, computer science, materials science, and civil engineering.',
      fields: ['Computer Engineering', 'Materials Engineering', 'Civil Engineering', 'Electrical Engineering'],
      requirements: ['Baccalaureate', 'National entry exam scoring'],
      tuitionFee: { amount: 0, currency: 'TND', period: 'year' },
      applicationDeadline: new Date('2026-09-01'),
      website: 'http://www.enis.rnu.tn',
      email: 'enis@enis.rnu.tn',
      phone: '+216 74 276 400',
      isActive: true,
      isFeatured: false,
    });

    console.log('✅ Universities seeded.');

    // ── 3. SEED INTERNSHIPS (STAGES) ──────────────────────────────────────────
    console.log('💼 Seeding internships...');

    const stageInstadeepAI = await Stage.create({
      recruiterId: recruiterInstadeep._id,
      title: 'AI Research & Deep Learning Intern',
      company: 'InstaDeep',
      companyLogo: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
      description: 'Join our Research team working on state-of-the-art reinforcement learning algorithms. You will run experiments, implement ML architectures, and contribute to cutting-edge AI software.',
      domain: 'Artificial Intelligence',
      requirements: ['Strong Python programming skills', 'Knowledge of PyTorch or TensorFlow', 'Understanding of basic calculus and linear algebra'],
      location: 'Tunis / Remote',
      type: 'hybrid',
      duration: '4-6 Months',
      stipend: { amount: 600, currency: 'TND', isPaid: true },
      deadline: new Date('2026-11-30'),
      isActive: true,
      isFeatured: true,
    });

    const stageOrangeDev = await Stage.create({
      recruiterId: recruiterVermeg._id,
      title: 'Web Application Development Intern (MERN)',
      company: 'Orange Digital Center',
      companyLogo: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
      description: 'Design and build features for ODC community apps using MongoDB, Express, React, and Node.js. This is a practical, project-based internship.',
      domain: 'Software Engineering',
      requirements: ['HTML, CSS, and modern Javascript knowledge', 'Basic React understanding', 'Familiarity with Git'],
      location: 'Tunis',
      type: 'on-site',
      duration: '3 Months',
      stipend: { amount: 300, currency: 'TND', isPaid: true },
      deadline: new Date('2026-10-15'),
      isActive: true,
      isFeatured: false,
    });

    const stageVermegQA = await Stage.create({
      recruiterId: recruiterVermeg._id,
      title: 'QA Automated Testing Intern',
      company: 'Vermeg',
      companyLogo: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
      description: 'Write, execute, and analyze automated test suites for financial applications. You will work with Selenium and JUnit platforms.',
      domain: 'Quality Assurance',
      requirements: ['Basic Java or Python knowledge', 'Interest in testing frameworks and QA standards'],
      location: 'Lac 1, Tunis',
      type: 'on-site',
      duration: '4 Months',
      stipend: { amount: 450, currency: 'TND', isPaid: true },
      deadline: new Date('2026-12-01'),
      isActive: true,
      isFeatured: false,
    });

    const stageSatoripopFlutter = await Stage.create({
      recruiterId: recruiterSatoripop._id,
      title: 'Mobile Flutter App Intern',
      company: 'Satoripop',
      companyLogo: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
      description: 'Build native iOS and Android apps using Flutter. Learn state management (Bloc/Provider) and connect local views to REST APIs.',
      domain: 'Mobile Development',
      requirements: ['Basic knowledge of Dart language', 'Familiarity with layout designs and responsive mobile styling principles'],
      location: 'Sousse',
      type: 'on-site',
      duration: '4 Months',
      stipend: { amount: 350, currency: 'TND', isPaid: true },
      deadline: new Date('2026-11-15'),
      isActive: true,
      isFeatured: true,
    });

    const stageTelnetEmbedded = await Stage.create({
      recruiterId: recruiterTelnet._id,
      title: 'Embedded Systems & IoT Intern',
      company: 'Telnet Group',
      companyLogo: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
      description: 'Prototype IoT solutions using ESP32 chips and sensors. Work on MQTT data transmission and cloud dashboard integrations.',
      domain: 'Embedded Systems',
      requirements: ['C/C++ knowledge', 'Basic electronics knowledge (I2C, SPI protocols)', 'Enthusiasm for hardware development'],
      location: 'Tunis',
      type: 'on-site',
      duration: '5 Months',
      stipend: { amount: 400, currency: 'TND', isPaid: true },
      deadline: new Date('2026-11-01'),
      isActive: true,
      isFeatured: false,
    });

    const stageBiatData = await Stage.create({
      recruiterId: recruiterBiat._id,
      title: 'Data Analytics & Reporting Intern',
      company: 'BIAT',
      companyLogo: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
      description: 'Assist the risk analysis department in setting up automated data collection routines, building SQL datasets, and producing PowerBI panels.',
      domain: 'Data Science',
      requirements: ['Good SQL skills', 'Basic Python (Pandas/Numpy) knowledge', 'Knowledge of visualization tools (PowerBI/Tableau)'],
      location: 'Tunis',
      type: 'hybrid',
      duration: '3-6 Months',
      stipend: { amount: 500, currency: 'TND', isPaid: true },
      deadline: new Date('2026-10-30'),
      isActive: true,
      isFeatured: false,
    });

    console.log('✅ Internships seeded.');

    // ── 4. SEED JOBS ──────────────────────────────────────────────────────────
    console.log('👔 Seeding jobs...');

    const jobVermegNode = await Job.create({
      recruiterId: recruiterVermeg._id,
      title: 'Senior Node.js Backend Engineer',
      company: 'Vermeg',
      companyLogo: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
      description: 'We are seeking a senior backend engineer to join our core architecture team. You will lead development of robust APIs, maintain microservice stability, and optimize MongoDB data queries.',
      requirements: ['5+ years Node.js software development experience', 'Strong database modeling (MongoDB & PostgreSQL)', 'Familiarity with containerization (Docker, K8s)'],
      responsibilities: ['Architect scalable backend codebases', 'Conduct code reviews and guide junior engineers', 'Collaborate with frontend leads on API integrations'],
      location: 'Les Berges du Lac, Tunis',
      type: 'hybrid',
      salary: { min: 3800, max: 5500, currency: 'TND', period: 'month', isHidden: false },
      contractType: 'CDI',
      experienceLevel: 'senior',
      tags: ['Node.js', 'Express', 'MongoDB', 'Docker', 'Microservices'],
      deadline: new Date('2026-09-30'),
      isActive: true,
      isFeatured: true,
    });

    const jobInstadeepReact = await Job.create({
      recruiterId: recruiterInstadeep._id,
      title: 'React / Frontend Developer (Remote)',
      company: 'InstaDeep',
      companyLogo: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
      description: 'Build user-facing web tools that visualize complex machine learning pipelines, reinforcement learning environments, and business metrics.',
      requirements: ['2+ years experience building React components', 'Proficiency with modern state management (Zustand, Redux)', 'Exceptional styling skills (CSS modules, CSS variables)'],
      responsibilities: ['Develop clean, interactive frontends', 'Optimize frontend performance', 'Ensure design responsive standards'],
      location: 'Ariana / Remote',
      type: 'remote',
      salary: { min: 2800, max: 4200, currency: 'TND', period: 'month', isHidden: false },
      contractType: 'CDI',
      experienceLevel: 'mid',
      tags: ['React', 'JavaScript', 'Zustand', 'Vite', 'CSS'],
      deadline: new Date('2026-10-01'),
      isActive: true,
      isFeatured: true,
    });

    const jobSofrecomDevOps = await Job.create({
      recruiterId: recruiterVermeg._id,
      title: 'DevOps and Cloud Infrastructure Engineer',
      company: 'Sofrecom Tunisia',
      companyLogo: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
      description: 'Maintain and automate cloud pipelines for international telecommunications applications. You will be responsible for uptime, backup plans, and scaling servers.',
      requirements: ['Kubernetes and Docker proficiency', 'Strong Ansible or Terraform scripting', 'AWS or GCP certified is a plus'],
      responsibilities: ['Automate code validation pipelines', 'Monitor system loads and troubleshoot node configurations', 'Maintain database backups'],
      location: 'Charguia, Tunis',
      type: 'on-site',
      salary: { min: 3000, max: 4800, currency: 'TND', period: 'month', isHidden: true },
      contractType: 'CDI',
      experienceLevel: 'mid',
      tags: ['Kubernetes', 'Ansible', 'Terraform', 'CI/CD', 'AWS'],
      deadline: new Date('2026-09-15'),
      isActive: true,
      isFeatured: false,
    });

    const jobSatoripopFlutter = await Job.create({
      recruiterId: recruiterSatoripop._id,
      title: 'Mobile Flutter Engineer (Mid)',
      company: 'Satoripop',
      companyLogo: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
      description: 'Looking for a skilled Flutter developer to build beautiful, fluid e-commerce and booking applications. You will cooperate directly with UI/UX designers.',
      requirements: ['2+ years of professional Flutter production experience', 'Knowledge of BLoC or Riverpod state management', 'Good understanding of animations and custom drawings'],
      responsibilities: ['Develop clean mobile structures', 'Integrate payment gateways (Stripe, KlikPay)', 'Deploy builds to App Store and Google Play'],
      location: 'Sahloul, Sousse',
      type: 'on-site',
      salary: { min: 2000, max: 3200, currency: 'TND', period: 'month', isHidden: false },
      contractType: 'CDI',
      experienceLevel: 'mid',
      tags: ['Flutter', 'Dart', 'Mobile', 'Git', 'API'],
      deadline: new Date('2026-10-15'),
      isActive: true,
      isFeatured: true,
    });

    const jobTelnetEmbedded = await Job.create({
      recruiterId: recruiterTelnet._id,
      title: 'Embedded Linux Systems Engineer',
      company: 'Telnet Group',
      companyLogo: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
      description: 'Join the aerospace and communication tech team at Telnet. Develop kernel drivers, configure Yocto layers, and optimize embedded devices.',
      requirements: ['Strong C programming skills', 'Experience with Yocto project or Buildroot systems', 'Understanding of Linux kernel internals and driver development'],
      responsibilities: ['Customize Linux board support packages', 'Debug low-level system failures using logic analyzers', 'Optimize memory usage and system start-up times'],
      location: 'Tunis',
      type: 'on-site',
      salary: { min: 3200, max: 5000, currency: 'TND', period: 'month', isHidden: false },
      contractType: 'CDI',
      experienceLevel: 'senior',
      tags: ['C', 'Embedded Linux', 'Yocto', 'Kernel', 'RTOS'],
      deadline: new Date('2026-10-20'),
      isActive: true,
      isFeatured: false,
    });

    const jobBiatAnalyst = await Job.create({
      recruiterId: recruiterBiat._id,
      title: 'Senior Financial Risk Analyst',
      company: 'BIAT',
      companyLogo: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
      description: 'Manage credit and market risk modeling pipelines. Analyze financial reports, validate asset portfolios, and report directly to risk directors.',
      requirements: ['Degree in Finance, Statistics, or Actuarial Sciences', '3+ years experience in bank risk analytics', 'Strong knowledge of banking regulation standards (Basel III)'],
      responsibilities: ['Monitor credit portfolio structures', 'Build financial risk projection models', 'Liaise with audit teams'],
      location: 'Avenue Habib Bourguiba, Tunis',
      type: 'hybrid',
      salary: { min: 3500, max: 4800, currency: 'TND', period: 'month', isHidden: false },
      contractType: 'CDI',
      experienceLevel: 'senior',
      tags: ['Finance', 'Risk Analysis', 'SQL', 'Excel', 'Statistics'],
      deadline: new Date('2026-09-30'),
      isActive: true,
      isFeatured: false,
    });

    const jobInstadeepAI = await Job.create({
      recruiterId: recruiterInstadeep._id,
      title: 'Machine Learning Research Engineer',
      company: 'InstaDeep',
      companyLogo: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
      description: 'Implement AI technologies based on latest papers. Optimize transformer architectures for custom industry pipelines (genetics, scheduling, chemistry).',
      requirements: ['Master or PhD in AI, Math, or Computer Science', 'Excellent Python skills and PyTorch mastery', 'Published papers in NeurIPS/ICML is a huge plus'],
      responsibilities: ['Conduct state-of-the-art AI research', 'Convert ML models into optimized production systems', 'Write clean mathematical formulations'],
      location: 'Tunis / Remote',
      type: 'hybrid',
      salary: { min: 4500, max: 7000, currency: 'TND', period: 'month', isHidden: false },
      contractType: 'CDI',
      experienceLevel: 'senior',
      tags: ['Python', 'PyTorch', 'Machine Learning', 'AI', 'Transformers'],
      deadline: new Date('2026-10-30'),
      isActive: true,
      isFeatured: true,
    });

    console.log('✅ Jobs seeded.');

    // ── 5. SEED APPLICATIONS ──────────────────────────────────────────────────
    console.log('📥 Seeding application logs...');

    // Student Ali
    await Application.create({
      applicantId: studentAli._id,
      targetId: stageOrangeDev._id,
      targetModel: 'Stage',
      recruiterId: stageOrangeDev.recruiterId,
      status: 'pending',
      coverLetter: 'I am highly interested in building MERN stack application tools for ODC.',
      documents: ['https://res.cloudinary.com/demo/image/upload/v1312461204/sample.pdf'],
      statusHistory: [{ status: 'pending', note: 'Application submitted.' }],
    });

    await Application.create({
      applicantId: studentAli._id,
      targetId: uniInsat._id,
      targetModel: 'University',
      recruiterId: uniInsat.recruiterId,
      status: 'accepted',
      coverLetter: 'Applying for the credit validation program in computer science.',
      documents: ['https://res.cloudinary.com/demo/image/upload/v1312461204/sample.pdf'],
      statusHistory: [
        { status: 'pending', note: 'Application submitted.' },
        { status: 'under_review', note: 'Reviewing undergraduate credits.' },
        { status: 'accepted', note: 'Welcome to INSAT!' },
      ],
    });

    // Student Sana
    await Application.create({
      applicantId: studentSana._id,
      targetId: stageInstadeepAI._id,
      targetModel: 'Stage',
      recruiterId: stageInstadeepAI.recruiterId,
      status: 'under_review',
      coverLetter: 'Machine Learning is my major passion. I would love to join Amiras ML team.',
      documents: ['https://res.cloudinary.com/demo/image/upload/v1312461204/sample.pdf'],
      statusHistory: [
        { status: 'pending', note: 'Application submitted.' },
        { status: 'under_review', note: 'Scheduling initial technical screening interview.' }
      ],
    });

    await Application.create({
      applicantId: studentSana._id,
      targetId: uniEsprit._id,
      targetModel: 'University',
      recruiterId: uniEsprit.recruiterId,
      status: 'accepted',
      coverLetter: 'Seeking academic transfer to Esprit Engineering Program.',
      documents: ['https://res.cloudinary.com/demo/image/upload/v1312461204/sample.pdf'],
      statusHistory: [
        { status: 'pending', note: 'Application submitted.' },
        { status: 'accepted', note: 'Transfer approved.' }
      ]
    });

    // Student Yassine
    await Application.create({
      applicantId: studentYassine._id,
      targetId: stageTelnetEmbedded._id,
      targetModel: 'Stage',
      recruiterId: stageTelnetEmbedded.recruiterId,
      status: 'under_review',
      coverLetter: 'My engineering background aligns perfectly with this IoT prototyping role.',
      documents: ['https://res.cloudinary.com/demo/image/upload/v1312461204/sample.pdf'],
      statusHistory: [
        { status: 'pending', note: 'Application submitted.' },
        { status: 'under_review', note: 'Allocating technical lab session.' }
      ]
    });

    // Student Amal
    await Application.create({
      applicantId: studentAmal._id,
      targetId: stageBiatData._id,
      targetModel: 'Stage',
      recruiterId: stageBiatData.recruiterId,
      status: 'pending',
      coverLetter: 'Interested in utilizing Risk Data pipelines in Python.',
      documents: ['https://res.cloudinary.com/demo/image/upload/v1312461204/sample.pdf'],
      statusHistory: [{ status: 'pending', note: 'Application submitted.' }]
    });

    // Citizen Ramy
    await Application.create({
      applicantId: citizenRamy._id,
      targetId: jobVermegNode._id,
      targetModel: 'Job',
      recruiterId: jobVermegNode.recruiterId,
      status: 'pending',
      coverLetter: 'I have extensive experience deploying Node.js and MongoDB applications.',
      documents: ['https://res.cloudinary.com/demo/image/upload/v1312461204/sample.pdf'],
      statusHistory: [{ status: 'pending', note: 'Application submitted.' }],
    });

    await Application.create({
      applicantId: citizenRamy._id,
      targetId: jobInstadeepReact._id,
      targetModel: 'Job',
      recruiterId: jobInstadeepReact.recruiterId,
      status: 'rejected',
      coverLetter: 'I am a highly motivated React developer.',
      documents: ['https://res.cloudinary.com/demo/image/upload/v1312461204/sample.pdf'],
      statusHistory: [
        { status: 'pending', note: 'Application submitted.' },
        { status: 'rejected', note: 'Thank you for your interest. We selected another profile with more senior experience.' }
      ],
    });

    // Citizen Linda
    await Application.create({
      applicantId: citizenLinda._id,
      targetId: jobSofrecomDevOps._id,
      targetModel: 'Job',
      recruiterId: jobSofrecomDevOps.recruiterId,
      status: 'under_review',
      coverLetter: 'I have managed Kubernetes deployments and set up CI/CD workflows for scale.',
      documents: ['https://res.cloudinary.com/demo/image/upload/v1312461204/sample.pdf'],
      statusHistory: [
        { status: 'pending', note: 'Application submitted.' },
        { status: 'under_review', note: 'Reviewing infrastructure credentials.' }
      ],
    });

    // Citizen Khalil
    await Application.create({
      applicantId: citizenKhalil._id,
      targetId: jobSofrecomDevOps._id,
      targetModel: 'Job',
      recruiterId: jobSofrecomDevOps.recruiterId,
      status: 'pending',
      coverLetter: 'I would like to apply risk test pipelines to DevOps systems.',
      documents: ['https://res.cloudinary.com/demo/image/upload/v1312461204/sample.pdf'],
      statusHistory: [{ status: 'pending', note: 'Application submitted.' }]
    });

    // Citizen Emna
    await Application.create({
      applicantId: citizenEmna._id,
      targetId: jobSatoripopFlutter._id,
      targetModel: 'Job',
      recruiterId: jobSatoripopFlutter.recruiterId,
      status: 'accepted',
      coverLetter: 'I have worked on iOS and Android widgets. Ready to join Satoripop.',
      documents: ['https://res.cloudinary.com/demo/image/upload/v1312461204/sample.pdf'],
      statusHistory: [
        { status: 'pending', note: 'Application submitted.' },
        { status: 'under_review', note: 'Reviewed portfolio.' },
        { status: 'accepted', note: 'Welcome to the team!' }
      ]
    });

    console.log('✅ Application logs successfully seeded.');

    // ── 6. SEED NOTIFICATIONS ─────────────────────────────────────────────────
    console.log('🔔 Seeding platform notification logs...');
    
    await Notification.create({
      userId: studentAli._id,
      title: 'Application Accepted',
      message: 'Your application to INSAT orientation program has been accepted!',
      type: 'application_status',
      link: '/dashboard',
    });

    await Notification.create({
      userId: studentSana._id,
      title: 'Under Review',
      message: 'Your application to InstaDeep AI Internship is now under review.',
      type: 'application_status',
      link: '/dashboard',
    });

    await Notification.create({
      userId: recruiterVermeg._id,
      title: 'New Applicant',
      message: 'Ramy Gharbi has applied for Senior Node.js Backend Engineer.',
      type: 'application_new',
      link: '/recruiter',
    });

    console.log('✅ Notification records seeded.');

    console.log('\n🌟 DATABASE SEEDING COMPLETED SUCCESSFULLY! 🌟');
    console.log('────────────────────────────────────────────────');
    console.log('Logins (Password: Password123!):');
    console.log('  1. Super Admin: admin@tunistudy.tn');
    console.log('  2. Recruiter (Vermeg): hr@vermeg.com');
    console.log('  3. Recruiter (Instadeep): careers@instadeep.com');
    console.log('  4. Student (Ali): ali.bensalem@esprit.tn');
    console.log('  5. Student (Yassine): yassine.khelifi@enit.rnu.tn');
    console.log('  6. Citizen (Ramy): ramy.gharbi@gmail.com');
    console.log('  7. Citizen (Emna): emna.bouazizi@outlook.com');
    console.log('────────────────────────────────────────────────\n');

    if (require.main === module) {
      await mongoose.disconnect();
      console.log('🔌 Disconnected from MongoDB.');
      process.exit(0);
    }
  } catch (err) {
    console.error('❌ Database seeding failed:', err.message);
    if (require.main === module) process.exit(1);
  }
};

if (require.main === module) {
  seed();
}

module.exports = seed;
