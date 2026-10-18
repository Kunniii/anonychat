/**
 * Client-side profanity filter — English & Vietnamese.
 *
 * Designed with high precision to ELIMINATE false positives on innocent Vietnamese:
 * - Unaccented monosyllabic homophones (buoi, lon, cac, du, deo, dien, ngu, dai, vai, cut)
 *   are NEVER matched as single words because they collide with ordinary Vietnamese words
 *   (buổi, bưởi, lớn, lon nước, các bạn, du lịch, đeo kính, điện thoại, ngủ ngon, dài, vai trò, cắt).
 * - Accented Vietnamese words (địt, đụ, lồn, cặc, buồi, đéo, chịch, cứt, óc chó)
 *   are matched accurately using Unicode-aware boundaries.
 * - Unaccented vulgarity is caught via unambiguous acronyms (dm, dcm, vcl, clgt, vkl, dkm, dmm)
 *   and compound phrases (dit me, du ma, vai lon, an cut, cut di, oc cho, do ngu, thang cho).
 * - English swear words are isolated to avoid colliding with Vietnamese (e.g. cum vs cụm).
 */

// ---------------------------------------------------------------------------
// Normalization & Helpers
// ---------------------------------------------------------------------------

/**
 * Remove Vietnamese diacritics, lowercase, collapse whitespace.
 */
export function normalise(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/ð/g, 'd');
}

/**
 * Collapse noise punctuation (dots, dashes, underscores, spaces) between letters.
 * e.g. "f.u.c.k" -> "fuck", "d_c_m" -> "dcm", "v-c-l" -> "vcl"
 */
function collapseNoise(text) {
  return text.replace(/([a-z0-9])[\s._\-*+=~#@!$%^&]+(?=[a-z0-9])/gi, '$1');
}

/**
 * Builds a regex that matches a word with optional noise between characters.
 */
function loose(word) {
  const noised = [...word].map((c) => escapeRegex(c)).join('[^a-z0-9]*');
  return new RegExp(`(?<![a-z0-9])${noised}(?![a-z0-9])`, 'i');
}

function escapeRegex(c) {
  return c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ---------------------------------------------------------------------------
// 1. Accented Vietnamese Swear Words & Insults (Checked on original text)
// ---------------------------------------------------------------------------
// Uses Unicode character class boundaries (?<![\p{L}\p{N}]) ... (?![\p{L}\p{N}])
const ACCENTED_VIETNAMESE_PATTERNS = [
  // Standalone unambiguously vulgar words
  /(?<![\p{L}\p{N}])(địt|đ!t|đít|đĩ|đụ|đù|cặc|lồn|buồi|đéo|chịch|dâm|dái)(?![\p{L}\p{N}])/iu,

  // "cứt" (excrement / insult: "ăn cứt", "như cứt", "cục cứt", "đống cứt", or standalone "cứt")
  // Note: "cút" (with u) is handled below to avoid colliding with "chim cút", "trứng cút"
  /(?<![\p{L}\p{N}])(cứt|cực cứt|ăn cứt|như cứt|đống cứt|mùi cứt)(?![\p{L}\p{N}])/iu,

  // "cút" in insult contexts (do not block "trứng cút", "chim cút")
  /(?<![\p{L}\p{N}])cút\s*(đi|xéo|ngay|khỏi|mẹ|cmm|hộ)(?![\p{L}\p{N}])/iu,

  // Insults & toxic addresses
  /(?<![\p{L}\p{N}])(óc\s*chó|chó\s*má|chó\s*đẻ|chó\s*chết)(?![\p{L}\p{N}])/iu,
  /(?<![\p{L}\p{N}])(thằng\s*chó|đồ\s*chó|thằng\s*ngu|đồ\s*ngu|con\s*ngu)(?![\p{L}\p{N}])/iu,
  /(?<![\p{L}\p{N}])(thằng\s*điên|đồ\s*điên|con\s*điên|bị\s*điên)(?![\p{L}\p{N}])/iu,
  /(?<![\p{L}\p{N}])(thằng\s*khốn|đồ\s*khốn|con\s*khốn|khốn\s*nạn)(?![\p{L}\p{N}])/iu,
  /(?<![\p{L}\p{N}])(súc\s*vật|đồ\s*súc\s*sinh|vô\s*học)(?![\p{L}\p{N}])/iu,
  /(?<![\p{L}\p{N}])ngu\s*(như\s*chó|nhu\s*bò|vcl|vãi|ngốc|lồn)(?![\p{L}\p{N}])/iu,
  /(?<![\p{L}\p{N}])(mẹ\s*mày|mẹ\s*kiếp|con\s*mẹ\s*mày|bố\s*mày)(?![\p{L}\p{N}])/iu,

  // Threats & self-harm
  /(?<![\p{L}\p{N}])(tự\s*tử|tự\s*sát|chết\s*đi|đi\s*chết\s*đi|giết\s*người|hiếp\s*dâm|hãm\s*hiếp)(?![\p{L}\p{N}])/iu,
];

// ---------------------------------------------------------------------------
// 2. Unaccented High-Confidence Slang & Acronyms (Noise-tolerant)
// ---------------------------------------------------------------------------
const UNACCENTED_ACRONYMS = [
  // High confidence swear abbreviations
  loose('dm'),
  loose('dcm'),
  loose('dkm'),
  loose('dmm'),
  loose('clgt'),
  loose('vcl'),
  loose('vkl'),
  loose('vcc'),
  loose('vcd'),
  loose('vlon'),
  loose('loz'),
  loose('l0z'),
  loose('cclgt'),
  loose('djt'),
  loose('wtf'),
  loose('stfu'),
];

// ---------------------------------------------------------------------------
// 3. Unaccented Compound Swear Phrases (Safe from homophone false positives)
// ---------------------------------------------------------------------------
const UNACCENTED_COMPOUND_PATTERNS = [
  // Dit
  /\b(dit|djt|d!t)\s*(me|con\s*me|cu|cha|ba|bo|may|m|nhau)\b/i,
  /\b(di\s*dit)\b/i,

  // Du
  /\b(du|dju)\s*(ma|me|may|me\s*may|mi)\b/i,

  // Lon / Buoi / Cac
  /\b(vai|mat|con|cai|do|ngu|ham)\s*(lon|l0n|loz|l0z)\b/i,
  /\b(vai\s*ca\s*lon)\b/i,
  /\b(dau|cai|an|bop|mut)\s*(buoi|bu0i)\b/i,
  /\b(buoi\s*to)\b/i,
  /\b(con|cai|nhu|hut|mut|bop|ngu\s*nhu)\s*(cac|cak|cack)\b/i,

  // Deo
  /\bdeo\s*(biet|hieu|nghe|them|can|duoc|bao\s*gio|co|ai|phai|on|nhe)\b/i,
  /\b(cai\s*deo\s*gi)\b/i,

  // Chich
  /\b(chich|ch!ch)\s*(nhau|dao|xoac)\b/i,
  /\b(di\s*chich)\b/i,

  // Cut (shit / get lost)
  /\b(an|nhu|cuc|dong|ngam)\s*(cut|cuc)\b/i,
  /\bcut\s*(di|xeo|ngay|me\s*may|cmm|khoi)\b/i,
  /\b(vai\s*cut)\b/i,

  // Insults & toxic slurs
  /\boc\s*cho\b/i,
  /\b(thang|do)\s*cho\b/i,
  /\bcho\s*(ma|de|chet)\b/i,
  /\b(do|thang|con)\s*(ngu|dien|khon)\b/i,
  /\bngu\s*(nhu\s*cho|nhu\s*bo|nhu\s*cac|vcl|vai|lon|loz|hoc|si|dan)\b/i,
  /\bdien\s*(vcl|vai|khung)\b/i,
  /\bkhon\s*nan\b/i,
  /\bsuc\s*vat\b/i,
  /\bvo\s*hoc\b/i,
  /\b(chet|di\s*chet)\s*di\b/i,
  /\bchet\s*me\s*(may)?\b/i,
  /\b(tu\s*sat|giet\s*nguoi|hiep\s*dam)\b/i,
];

// ---------------------------------------------------------------------------
// 4. English Profanities (Isolated from Vietnamese)
// ---------------------------------------------------------------------------
const ENGLISH_PATTERNS = [
  // Masked or common variants (f*ck, sh*t, b*tch, etc.)
  /(?<![a-z0-9])f[\W_]*[u*0!@_]?[\W_]*c[\W_]*k(?![a-z0-9])/i,
  /(?<![a-z0-9])sh[\W_]*[i*01!@_]?[\W_]*t(?![a-z0-9])/i,
  /(?<![a-z0-9])b[\W_]*[i*01!@_]?[\W_]*tch(?![a-z0-9])/i,
  /(?<![a-z0-9])d[\W_]*[i*01!@_]?[\W_]*ck(?![a-z0-9])/i,
  /(?<![a-z0-9])c[\W_]*[u*0!@_]?[\W_]*nt(?![a-z0-9])/i,
  loose('fuck'),
  loose('fuk'),
  loose('f0ck'),
  loose('fuq'),
  loose('fvck'),
  loose('fcuk'),
  loose('motherfucker'),
  loose('cunt'),
  loose('c0nt'),
  loose('dickhead'),
  loose('bitch'),
  loose('b1tch'),
  loose('asshole'),
  loose('arsehole'),
  loose('bastard'),
  loose('pussy'),
  loose('slut'),
  loose('whore'),
  loose('blowjob'),
  loose('handjob'),
  loose('rimjob'),
  loose('dildo'),
  loose('vibrator'),
  loose('jizz'),
  loose('nigger'),
  loose('nigga'),
  loose('faggot'),
  loose('fag'),
  loose('kill yourself'),
  loose('kys'),
  /\bgo\s+die\b/i,
  /\bshut\s+the\s+fuck\s+up\b/i,
  /\bi\s+will\s+kill\b/i,
  /\bshoot\s+you\b/i,
  loose('heroin'),
  loose('cocaine'),
  loose('methamphetamine'),
];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns true if `text` contains a profane word or offensive phrase.
 * @param {string} text
 * @param {string[]} [extraWords=[]]
 * @returns {boolean}
 */
export function containsProfanity(text, extraWords = []) {
  if (!text || typeof text !== 'string') return false;

  const rawTrimmed = text.trim();
  if (!rawTrimmed) return false;

  // 1. Accented Vietnamese check on original text
  for (const pattern of ACCENTED_VIETNAMESE_PATTERNS) {
    if (pattern.test(rawTrimmed)) {
      return true;
    }
  }

  // 2. Normalised check (lowercase, diacritics removed)
  const norm = normalise(rawTrimmed);
  const noised = collapseNoise(norm);

  // 2a. Unaccented Acronyms (e.g. dm, vcl, dkm, clgt, etc.)
  for (const pattern of UNACCENTED_ACRONYMS) {
    if (pattern.test(norm) || pattern.test(noised)) {
      return true;
    }
  }

  // 2b. Unaccented Compound Swear Phrases
  for (const pattern of UNACCENTED_COMPOUND_PATTERNS) {
    if (pattern.test(norm) || pattern.test(noised)) {
      return true;
    }
  }

  // 2c. English swear words
  for (const pattern of ENGLISH_PATTERNS) {
    if (pattern.test(norm) || pattern.test(noised)) {
      return true;
    }
  }

  // 3. Admin Custom Block List
  if (Array.isArray(extraWords) && extraWords.length > 0) {
    for (const word of extraWords) {
      if (typeof word !== 'string') continue;
      const clean = normalise(word.trim());
      if (!clean) continue;
      if (loose(clean).test(norm) || loose(clean).test(noised)) {
        return true;
      }
    }
  }

  return false;
}
