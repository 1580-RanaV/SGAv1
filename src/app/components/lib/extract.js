import skills from "./taxonomies/skills.json";

/**
 * Extract canonical skills and evidence spans from JD & Resume.
 * Spans are character index pairs: [[start, end], ...]
 */
export function extractSkills(jdText="", resumeText="") {
  const canon = buildCanonical(skills);        // canonical -> Set(synonyms)
  const reverse = buildReverseIndex(canon);    // synonym -> canonical

  const jdTokens = tokens(jdText);
  const resumeTokens = tokens(resumeText);

  const jdSet = new Set(mapToCanonical(jdTokens, reverse));
  const resumeSet = new Set(mapToCanonical(resumeTokens, reverse));

  // Evidence spans per canonical skill
  const jdSpans = findSpansForAll(jdText, canon);
  const resumeSpans = findSpansForAll(resumeText, canon);

  return {
    jdSkills: Array.from(jdSet),
    resumeSkills: Array.from(resumeSet),
    jdSpans,
    resumeSpans
  };
}

function buildCanonical(dict) {
  const map = {};
  Object.keys(dict).forEach(c => {
    map[c] = new Set([c, ...(dict[c] || [])].map(s => s.toLowerCase()));
  });
  return map;
}
function buildReverseIndex(canon) {
  const rev = {};
  Object.keys(canon).forEach(c => {
    canon[c].forEach(s => { rev[s] = c; });
  });
  return rev;
}
function tokens(text) {
  const base = (text || "").toLowerCase();
  const words = base.match(/[a-z0-9\+\.\#\-]+/g) || [];
  const bigrams = [];
  for (let i=0;i<words.length-1;i++) bigrams.push(words[i]+" "+words[i+1]);
  const trigrams = [];
  for (let i=0;i<words.length-2;i++) trigrams.push(words[i]+" "+words[i+1]+" "+words[i+2]);
  return [...words, ...bigrams, ...trigrams];
}
function mapToCanonical(list, reverseIndex) {
  const out = [];
  for (const t of list) if (reverseIndex[t]) out.push(reverseIndex[t]);
  return out;
}
function escapeReg(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function findSpansForAll(text="", canon) {
  const spans = [];
  const lower = text.toLowerCase();
  for (const canonical of Object.keys(canon)) {
    const synth = Array.from(canon[canonical]);
    const regex = new RegExp(`\\b(${synth.map(escapeReg).join("|")})\\b`, "g");
    let m, positions = [];
    while ((m = regex.exec(lower)) !== null) {
      positions.push([m.index, m.index + m[0].length]);
    }
    if (positions.length) spans.push({ skill: canonical, positions });
  }
  return spans;
}
