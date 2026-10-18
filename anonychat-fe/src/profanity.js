/**
 * Client-side profanity filter — English & Vietnamese.
 *
 * Strategy:
 *  1. Normalise: strip accents/diacritics so "đ1t" still matches "đit", lowercase everything.
 *  2. Strip common separator noise (dots, underscores, spaces squeezed inside a word).
 *  3. Match whole-word patterns so "classic" doesn't catch anything unintended.
 *  4. The list lives here on the client only — it is NOT sent to the server.
 *
 * To extend: add words/patterns to PATTERNS below.
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Remove Vietnamese diacritics, lowercase, collapse whitespace. */
function normalise(text) {
  return text
    .toLowerCase()
    // Decompose combined Unicode chars (e.g. "ặ" → "a" + combining marks)
    .normalize('NFD')
    // Strip combining marks
    .replace(/[\u0300-\u036f]/g, '')
    // Vietnamese standalone letters that survive NFD decomposition
    .replace(/đ/g, 'd')
    .replace(/ð/g, 'd');
}

/**
 * Build a RegExp that matches the word with optional non-letter noise
 * between characters (e.g. "f*ck", "f.u.c.k", "f_u_c_k").
 * noise = zero or more non-alphanumeric chars between every two letters.
 */
function loose(word) {
  const noised = [...word].map((c) => escapeRegex(c)).join('[^a-z0-9]*');
  return new RegExp(`(?<![a-z0-9])${noised}(?![a-z0-9])`, 'i');
}

function escapeRegex(c) {
  return c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ---------------------------------------------------------------------------
// Pattern list
// ---------------------------------------------------------------------------

/**
 * Each entry is either:
 *   - a plain string  → matched as a loose whole-word (noise-tolerant)
 *   - a RegExp        → matched as-is on the normalised text
 *
 * Add cautiously — false positives are annoying.
 * Sorted roughly by language then severity.
 */
const PATTERNS = [
  // ── English ──────────────────────────────────────────────────────────────
  // Sexual
  loose('fuck'),
  loose('fuk'),
  loose('f0ck'),
  loose('fuq'),
  loose('fvck'),
  loose('fcuk'),
  loose('feck'),
  loose('cunt'),
  loose('c0nt'),
  loose('cock'),
  loose('c0ck'),
  loose('dick'),
  loose('d1ck'),
  loose('pussy'),
  loose('asshole'),
  loose('arsehole'),
  loose('bastard'),
  loose('bitch'),
  loose('b1tch'),
  loose('shit'),
  loose('sh1t'),
  loose('piss'),
  loose('whore'),
  loose('slut'),
  loose('porn'),
  loose('blowjob'),
  loose('handjob'),
  loose('rimjob'),
  loose('dildo'),
  loose('vibrator'),
  loose('jizz'),
  loose('cum'),
  loose('orgasm'),
  loose('masturbat'),
  loose('penis'),
  loose('vagina'),
  loose('vulva'),
  loose('anus'),
  loose('rectum'),
  loose('anal'),
  loose('nipple'),
  loose('boobs'),
  loose('tits'),
  loose('titties'),
  loose('nude'),
  loose('naked'),
  loose('nsfw'),
  // Slurs / hate
  loose('nigger'),
  loose('nigga'),
  loose('faggot'),
  loose('fag'),
  loose('dyke'),
  loose('tranny'),
  loose('retard'),
  loose('spastic'),
  // Violence / threat
  loose('kill yourself'),
  loose('kys'),
  /\bgo\s+die\b/,
  /\bi\s+will\s+kill\b/,
  /\bshoot\s+you\b/,
  // Drugs
  loose('heroin'),
  loose('cocaine'),
  loose('methamphetamine'),
  loose('meth'),

  // ── Vietnamese ───────────────────────────────────────────────────────────
  // Sexual (normalised — diacritics stripped before matching)
  // "dit" / "đít" / "địt"
  /\bd[iuy1!]t\b/,
  /\bdit\b/,
  /\bdi[t]+\b/,
  // "cặc" / "cac"
  /\bc[a4][ck]\b/,
  /\bcac\b/,
  /\bcak\b/,
  // "lồn" / "lon"
  /\bl[o0]n\b/,
  /\blon\b/,
  // "buồi" / "buoi"
  /\bbuoi\b/,
  /\bbu0i\b/,
  // "dái" / "dai"
  /\bd[a4]i\b/,
  // "lòn" / "lonn"
  /\bl[o0]n+\b/,
  // "chịch" / "chich"
  /\bch[iy][c4][h]?\b/,
  // "đéo" / "deo"  (very common Vietnamese profanity — negation slang + insult)
  /\bd[e3]o\b/,
  // "vãi" / "vai"
  /\bv[a4][iy]\b/,
  // "mẹ" / "me" as insult fragment — must be followed by "kiếp / may / mày"
  /\bme\s*(kiep|may|m[a4]y)\b/,
  // "má mày" / "má m"
  /\bma\s*m[a4]y\b/,
  // "đồ chó" / "do cho"
  /\bdo\s*cho\b/,
  // "thằng chó" / "thang cho"
  /\bthang\s*cho\b/,
  // "ngu" as standalone insult
  /\bngu\b/,
  // "óc chó" / "oc cho"
  /\boc\s*cho\b/,
  // "đm" "dm" short for "địt mẹ"
  /\bd[m]+\b/,
  // "vcl" — "vãi cái lồn"
  /\bvcl\b/,
  // "clgt" — "cái lồn gì thế"
  /\bclgt\b/,
  // "wtf" English but commonly used
  /\bwtf\b/,
  // "đéo hiểu" → "deo hieu" — often offensive regardless
  /\bdeo\b/,
  // "con bò" / "con bo" — calling someone a cow (insult)
  /\bcon\s*bo\b/,
  // "đụ" / "du" (copulation)
  /\bdu\b/,
  // "cứt" / "cut" (feces)
  /\bc[u]t\b/,
  // "đái" / "dai" (urinate)
  /\bd[a4]i\b/,
  // "chloe" → skip — not offensive; careful with short patterns
  // "khốn" / "khon" — wretch / bastard
  /\bkh[o0]n\b/,
  // "súc vật" / "suc vat"
  /\bsuc\s*vat\b/,
  // "chó má" / "cho ma"
  /\bcho\s*ma\b/,
  // "vô học" / "vo hoc"
  /\bvo\s*hoc\b/,
  // "thần kinh" / "than kinh" (crazy)
  /\bthan\s*kinh\b/,
  // "điên" / "dien"
  /\bdien\b/,
  // "chết đi" / "chet di"
  /\bchet\s*di\b/,
  // "tự tử" / "tu tu"
  /\btu\s*tu\b/,
];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns true if `text` contains a profane word/phrase.
 * @param {string} text
 * @param {string[]} [extraWords=[]]
 * @returns {boolean}
 */
export function containsProfanity(text, extraWords = []) {
  if (!text || typeof text !== 'string') return false;

  const norm = normalise(text);

  const defaultMatched = PATTERNS.some((pattern) => {
    if (pattern instanceof RegExp) {
      return pattern.test(norm);
    }
    return pattern.test(norm);
  });

  if (defaultMatched) return true;

  if (Array.isArray(extraWords) && extraWords.length > 0) {
    return extraWords.some((word) => {
      if (typeof word !== 'string') return false;
      const clean = normalise(word.trim());
      if (!clean) return false;
      return loose(clean).test(norm);
    });
  }

  return false;
}

