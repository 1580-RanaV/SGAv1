"use client";

import { useMemo, useState } from "react";
import { Target, Sparkles, FileText, Download, BarChart3, Zap } from "lucide-react";

// Import components (keeping original functionality)
import Header from "@/app/components/Header";
import Editor from "@/app/components/Editor";
import ScoreGauge from "@/app/components/ScoreGauge";
import GapTable from "@/app/components/GapTable";
import Suggestions from "@/app/components/Suggestions";
import CoverageBar from "@/app/components/Charts/CoverageBar";
import LoadingDots from "@/app/components/LoadingDots";
import ExportPdf from "@/app/components/ExportPdf";
import EvidenceHighlighter from "@/app/components/EvidenceHighlighter";

export default function Page() {
  const [loading, setLoading] = useState(false);
  const [score, setScore] = useState(0);
  const [present, setPresent] = useState([]);
  const [missing, setMissing] = useState([]);
  const [weak, setWeak] = useState([]);

  // AI output
  const [ai, setAi] = useState({ plan: [], resume_bullets: [] });

  // Evidence/highlighter state
  const [jdText, setJdText] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [jdSpans, setJdSpans] = useState([]);
  const [resumeSpans, setResumeSpans] = useState([]);
  const [activeSkill, setActiveSkill] = useState(null);

  // Build skills for CoverageBar (normalize 0..1)
  const skills = useMemo(() => {
    const clamp01 = (v) => Math.max(0, Math.min(1, Number(v) || 0));

    const a = (present || []).map(p => ({
      skill: p.skill || p.name || "",
      jdWeight: clamp01(p.weight ?? 0.8),
      resumeScore: clamp01(p.resume_weight ?? p.weight ?? 0.7),
    }));

    const b = (missing || []).map(m => ({
      skill: m.skill || m.name || "",
      jdWeight: clamp01(m.weight ?? 0.9),
      resumeScore: 0,
    }));

    const c = (weak || []).map(w => ({
      skill: w.skill || w.name || "",
      jdWeight: clamp01(w.weight ?? 0.8),
      resumeScore: clamp01(w.resume_weight ?? 0.3),
    }));

    const map = new Map();
    [...a, ...b, ...c].forEach(s => {
      const key = s.skill.toLowerCase();
      const prev = map.get(key);
      if (!prev) map.set(key, s);
      else map.set(key, {
        skill: s.skill,
        jdWeight: Math.max(prev.jdWeight, s.jdWeight),
        resumeScore: Math.max(prev.resumeScore, s.resumeScore),
      });
    });

    return Array.from(map.values()).sort((x, y) => y.jdWeight - x.jdWeight);
  }, [present, missing, weak]);

  async function onAnalyze({ jd, resume }) {
    setLoading(true);
    setAi({ plan: [], resume_bullets: [] });
    setActiveSkill(null);
    setJdText(jd);
    setResumeText(resume);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jd, resume }),
      });

      const text = await res.text();
      let json;
      try { json = JSON.parse(text); } catch {
        throw new Error(`Non-JSON response: ${text.slice(0, 200)}`);
      }

      setScore(Math.round(json.match_pct || 0));
      setPresent(json.present || []);
      setMissing(json.missing || []);
      setWeak(json.weak || []);

      // ✅ store plan (fallback to suggestions key if API ever uses it)
      setAi({
        plan: json.plan || json.suggestions || [],
        resume_bullets: json.resume_bullets || [],
      });

      setJdSpans(json.jd_spans || []);
      setResumeSpans(json.resume_spans || []);
    } catch (e) {
      console.error(e);
      alert("Something went wrong. Check console.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      <Header />
      
      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Hero Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-slate-800 font-inter tracking-tighter">
                  Resume Gap Analysis
                </h1>
              </div>
              <p className="text-slate-600 font-inter tracking-tighter max-w-2xl">
                Analyze how well your resume matches job descriptions with AI-powered insights and actionable recommendations.
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <ExportPdf />
            </div>
          </div>
        </div>

        {/* Editor Section */}
        <div className="mb-8">
          <Editor onAnalyze={onAnalyze} />
        </div>

        {/* Results Section */}
        <div id="reportRoot" className="space-y-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg">
                <Zap className="w-8 h-8 text-white animate-pulse" />
              </div>
              <div className="text-slate-700 font-medium font-inter tracking-tighter mb-2">
                Analyzing your resume...
              </div>
              <LoadingDots />
            </div>
          ) : (
            <>
              {/* Score Section */}
              {score > 0 && (
                <div className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-6 shadow-sm">
                  <ScoreGauge value={score} />
                </div>
              )}

              {/* Gap Analysis Table */}
              {(present.length > 0 || missing.length > 0 || weak.length > 0) && (
                <div className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-200/60">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                        <Target className="w-4 h-4 text-white" />
                      </div>
                      <h2 className="text-lg font-semibold text-slate-800 font-inter tracking-tighter">
                        Skills Gap Analysis
                      </h2>
                    </div>
                    <p className="text-slate-600 text-sm font-inter tracking-tighter">
                      Detailed breakdown of skills found, missing, or needing improvement
                    </p>
                  </div>
                  <GapTable
                    present={present}
                    missing={missing}
                    weak={weak}
                    onSelectSkill={(s) => setActiveSkill(s)}
                  />
                </div>
              )}

              {/* AI Suggestions */}
              {ai.plan.length > 0 && (
                <div className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-200/60">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                      <h2 className="text-lg font-semibold text-slate-800 font-inter tracking-tighter">
                        AI Recommendations
                      </h2>
                    </div>
                    <p className="text-slate-600 text-sm font-inter tracking-tighter">
                      Personalized suggestions to improve your resume match score
                    </p>
                  </div>
                  <div className="p-6">
                    <Suggestions plan={ai.plan} resume_bullets={ai.resume_bullets} />
                  </div>
                </div>
              )}

              {/* Coverage Chart */}
              {skills.length > 0 && (
                <div className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                      <BarChart3 className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-800 font-inter tracking-tighter">
                        Skills Coverage
                      </h2>
                      <p className="text-slate-600 text-sm font-inter tracking-tighter">
                        Visual representation of skill alignment
                      </p>
                    </div>
                  </div>
                  <CoverageBar
                    skills={skills}
                    onBarClick={(s) => setActiveSkill(s.skill)}
                  />
                </div>
              )}

              {/* Evidence Highlighter */}
              {(jdText || resumeText) && (
                <div className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-200/60">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                        <FileText className="w-4 h-4 text-white" />
                      </div>
                      <h2 className="text-lg font-semibold text-slate-800 font-inter tracking-tighter">
                        Evidence Highlighting
                      </h2>
                    </div>
                    <p className="text-slate-600 text-sm font-inter tracking-tighter">
                      See exactly where skills are mentioned in both documents
                    </p>
                  </div>
                  <div className="p-6">
                    <div className="grid lg:grid-cols-2 gap-6">
                      <EvidenceHighlighter
                        title="Job Description"
                        text={jdText}
                        spans={jdSpans}
                        activeSkill={activeSkill}
                        onClear={() => setActiveSkill(null)}
                      />
                      <EvidenceHighlighter
                        title="Resume"
                        text={resumeText}
                        spans={resumeSpans}
                        activeSkill={activeSkill}
                        onClear={() => setActiveSkill(null)}
                      />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}