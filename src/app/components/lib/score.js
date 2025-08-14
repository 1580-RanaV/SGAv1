/**
 * Weights by JD frequency; present/missing/weak; final % score.
 */
export function scoreGaps({ jdSkills=[], resumeSkills=[] }) {
  const freq = count(jdSkills);     // weight by frequency, capped
  const present = [];
  const weak = [];
  const missing = [];

  const jdSet = new Set(jdSkills);
  const resumeSet = new Set(resumeSkills);

  jdSet.forEach(s => {
    const w = Math.min(2.0, (freq[s] || 1));
    if (resumeSet.has(s)) present.push(s);
    else missing.push({ skill: s, weight: w });
  });

  // Weak: present in resume but not frequent in JD (demo heuristic)
  resumeSet.forEach(s => {
    if (!jdSet.has(s)) return;
    if ((freq[s] || 1) <= 1) weak.push(s);
  });

  const sumW = Object.keys(freq).reduce((a,k)=> a + Math.min(2.0, freq[k]), 0);
  const sumPresent = present.reduce((a,k)=> a + Math.min(2.0, freq[k] || 1), 0);
  const match_pct = sumW ? (sumPresent / sumW) * 100 : 0;

  missing.sort((a,b)=> b.weight - a.weight);
  return { match_pct, present, missing, weak };
}

function count(arr) {
  const c = {};
  arr.forEach(s => { c[s] = (c[s]||0)+1; });
  return c;
}
