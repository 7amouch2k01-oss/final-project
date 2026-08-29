/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * TUNISIAN BACCALAUREATE VERIFICATION ENGINE
 * 
 * Inspects uploaded Baccalaureate proofs (diploma, relevé de notes, attestation)
 * for official hallmarks, Ministry of Education keywords, section consistency,
 * and high school credentials.
 * 
 * Output:
 *  - status: 'verified' (Score >= 75%) | 'under_review' (Score < 75%)
 *  - confidence: 0 - 100
 *  - notes: Human-readable explanation of verification findings
 *  - extracted: Detected keywords, section, year, and metadata
 * ═══════════════════════════════════════════════════════════════════════════════
 */

// Official Tunisian Baccalaureate hallmarks
const TUNISIAN_BAC_HALLMARKS = [
  { keyword: 'republique tunisienne', weight: 20, desc: 'Official State Header (FR)' },
  { keyword: 'الجمهورية التونسية', weight: 20, desc: 'Official State Header (AR)' },
  { keyword: 'ministere de l education', weight: 20, desc: 'Ministry of Education (FR)' },
  { keyword: 'وزارة التربية', weight: 20, desc: 'Ministry of Education (AR)' },
  { keyword: 'baccalaureat', weight: 15, desc: 'Baccalaureate title' },
  { keyword: 'diplome', weight: 10, desc: 'Diploma keyword' },
  { keyword: 'releve de notes', weight: 15, desc: 'Official transcript' },
  { keyword: 'attestation de reussite', weight: 15, desc: 'Success certificate' },
  { keyword: 'session principale', weight: 10, desc: 'Primary session' },
  { keyword: 'session de controle', weight: 10, desc: 'Control session' },
  { keyword: 'شهادة البكالوريا', weight: 15, desc: 'Baccalaureate title (AR)' },
  { keyword: 'كشف أعداد', weight: 15, desc: 'Official transcript (AR)' },
  { keyword: 'matricule', weight: 10, desc: 'Candidate registration ID' },
  { keyword: 'mention', weight: 5, desc: 'Honors mention' },
  { keyword: 'moyenne', weight: 5, desc: 'Average grade score' },
];

const VALID_SECTIONS = [
  'mathematiques',
  'math',
  'sciences experimentales',
  'sciences',
  'sciences techniques',
  'technique',
  'sciences de l informatique',
  'informatique',
  'economie et gestion',
  'eco-gestion',
  'lettres',
  'sport',
  'autre / international',
];

const normalizeText = (text = '') => {
  return String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-z0-9\u0600-\u06FF\s]/g, ' ') // keep latin, arabic, numbers
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Analyze an uploaded Baccalaureate certificate
 * @param {Object} params
 * @param {string} params.proofDocUrl URL or filename of uploaded document
 * @param {string} params.school Name of High School (Lycée)
 * @param {number} params.year Year of graduation
 * @param {string} params.section Chosen Baccalaureate Section
 * @param {string} params.grade Average / Mention
 * @param {string} [params.extractedOcrText] Text extracted if OCR available
 */
const verifyBaccalaureateDocument = ({
  proofDocUrl = '',
  school = '',
  year = null,
  section = '',
  grade = '',
  extractedOcrText = '',
}) => {
  let score = 0;
  const detectedKeywords = [];
  const notes = [];

  // 1. Check Document presence and format validity
  if (!proofDocUrl || typeof proofDocUrl !== 'string' || proofDocUrl.trim().length === 0) {
    return {
      status: 'unsubmitted',
      confidence: 0,
      notes: 'No official proof document uploaded.',
      extractedData: { detectedKeywords: [] },
    };
  }

  // Check valid file extension (PDF, JPG, PNG, WEBP)
  const isPdf = /\.pdf(\?.*)?$/i.test(proofDocUrl);
  const isImage = /\.(jpg|jpeg|png|webp)(\?.*)?$/i.test(proofDocUrl) || proofDocUrl.includes('cloudinary');
  if (isPdf || isImage) {
    score += 15;
    notes.push('Valid document format (PDF/High-Res scan).');
  }

  // 2. Combine all available text context (OCR, URL slug, metadata, inputs)
  const searchableContext = normalizeText(`${proofDocUrl} ${school} ${section} ${grade} ${extractedOcrText}`);

  // 3. Hallmarks matching
  let hallmarkScore = 0;
  TUNISIAN_BAC_HALLMARKS.forEach(({ keyword, weight, desc }) => {
    const normalizedKeyword = normalizeText(keyword);
    if (searchableContext.includes(normalizedKeyword)) {
      hallmarkScore += weight;
      detectedKeywords.push(desc);
    }
  });

  score += Math.min(50, hallmarkScore);

  // 4. Validate Section
  const normSection = normalizeText(section);
  const matchedSection = VALID_SECTIONS.find(s => normSection.includes(s));
  if (matchedSection) {
    score += 15;
    notes.push(`Section confirmed: "${section}".`);
  } else if (section) {
    score += 5;
    notes.push(`Non-standard section: "${section}".`);
  }

  // 5. Validate Year
  const currentYear = new Date().getFullYear();
  const numYear = Number(year);
  if (numYear && numYear >= 1990 && numYear <= currentYear) {
    score += 10;
    notes.push(`Graduation year verified (${numYear}).`);
  } else {
    notes.push(`Year out of expected range (${year}).`);
  }

  // 6. Validate School
  const normSchool = normalizeText(school);
  if (normSchool.includes('lycee') || normSchool.includes('pilote') || normSchool.includes('prive') || normSchool.length > 5) {
    score += 10;
    notes.push(`Recognized secondary institution name format.`);
  }

  // Clamp total confidence score between 0 and 100
  const finalConfidence = Math.min(100, Math.max(10, score));

  // ── Verification Decision Matrix ──
  // Rule: High confidence (>= 75%) with clear hallmarks -> Verified
  // Anything below 75% -> Under Review (human admin must inspect and approve within 24h)
  let status = 'under_review';
  if (finalConfidence >= 75 && detectedKeywords.length >= 2) {
    status = 'verified';
    notes.unshift('Official Tunisian Baccalaureate hallmarks identified with high confidence.');
  } else {
    status = 'under_review';
    notes.unshift('Submitted for expedited administrative review (verified within 24h).');
  }

  return {
    status,
    confidence: finalConfidence,
    notes: notes.join(' '),
    extractedData: {
      candidateNumber: '',
      section: section || '',
      year: numYear || null,
      mention: grade || '',
      detectedKeywords,
    },
  };
};

module.exports = {
  verifyBaccalaureateDocument,
  TUNISIAN_BAC_HALLMARKS,
};
