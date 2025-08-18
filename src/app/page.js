"use client";

import { useMemo, useState, useRef } from "react";
import { Target, Sparkles, FileText, BarChart3, Zap } from "lucide-react";

// Keep your existing components
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

  const [ai, setAi] = useState({ plan: [], resume_bullets: [] });

  const [jdText, setJdText] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [jdSpans, setJdSpans] = useState([]);
  const [resumeSpans, setResumeSpans] = useState([]);
  const [activeSkill, setActiveSkill] = useState(null);

  // 👇 NEW: ref for the area to export
  const reportRef = useRef(null);

  // Normalize skills for the coverage chart
  const skills = useMemo(() => {
    const clamp01 = (v) => Math.max(0, Math.min(1, Number(v) || 0));

    const a = (present || []).map((p) => ({
      skill: p.skill || p.name || "",
      jdWeight: clamp01(p.weight ?? 0.8),
      resumeScore: clamp01(p.resume_weight ?? p.weight ?? 0.7),
    }));

    const b = (missing || []).map((m) => ({
      skill: m.skill || m.name || "",
      jdWeight: clamp01(m.weight ?? 0.9),
      resumeScore: 0,
    }));

    const c = (weak || []).map((w) => ({
      skill: w.skill || w.name || "",
      jdWeight: clamp01(w.weight ?? 0.8),
      resumeScore: clamp01(w.resume_weight ?? 0.3),
    }));

    const map = new Map();
    [...a, ...b, ...c].forEach((s) => {
      const key = (s.skill || "").toLowerCase();
      const prev = map.get(key);
      if (!prev) map.set(key, s);
      else
        map.set(key, {
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
      try {
        json = JSON.parse(text);
      } catch {
        throw new Error(`Non-JSON response: ${text.slice(0, 200)}`);
      }

      setScore(Math.round(json.match_pct || 0));
      setPresent(json.present || []);
      setMissing(json.missing || []);
      setWeak(json.weak || []);

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
    <div className="min-h-screen bg-white ui-fix">
      <Header />

      <main className="mx-auto max-w-7xl px-6 py-10">
        {/* Intro / Toolbar */}
        <section className="mb-8">
          <div className="space-y-4">
            {/* Title + paragraph */}
            <div className="space-y-4 text-center mt-12">
              <div className="flex items-center justify-center gap-3">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-medium text-neutral-900 tracking-tighter">
                  Resume Gap Analysis: Skill Gap Analyzer (SGA) v1.1
                </h1>
              </div>
              <p className="text-xs sm:text-sm md:text-base text-neutral-600 max-w-2xl mx-auto text-center mb-12">
                Paste your job description and resume to instantly receive a detailed,
                visual analysis that highlights alignment, uncovers skill gaps, and
                provides clear recommendations for strengthening your profile and improving
                your chances of success.
              </p>
            </div>


            {/* Export button row */}
            <div className="flex justify-end">
              {/* 👇 Pass the ref to ExportPdf */}
              <ExportPdf targetRef={reportRef} />
            </div>
          </div>
        </section>

        {/* 👇 Everything inside this wrapper will be exported */}
        <div ref={reportRef}>
          {/* 1) Editors (full width card) */}
          <section className="mb-8">
            <div className="rounded-3xl bg-neutral-950 text-white ring-1 ring-black shadow-2xl">
              <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-black ring-1 ring-white/15 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-white" />
                  </div>
                  <h2 className="text-lg font-semibold tracking-tighter">Editors</h2>
                </div>
                <span className="rounded-full bg-white/10 px-4 py-1 text-xs font-semibold">
                  Job Description + Resume
                </span>
              </div>

              <div className="p-6">
                {/* Put Editor directly; it carries your form + analyze button */}
                <Editor onAnalyze={onAnalyze} />
              </div>
            </div>
          </section>

          {/* 2) Loading state */}
          {loading && (
            <section className="mb-8">
              <div className="rounded-3xl bg-neutral-950 text-white ring-1 ring-white/10 shadow-2xl p-10 text-center">
                <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-white/10 ring-1 ring-white/15 flex items-center justify-center">
                  <Zap className="w-8 h-8 text-white animate-pulse" />
                </div>
                <div className="text-white font-medium tracking-tighter mb-2">
                  Analyzing your resume…
                </div>
                <LoadingDots />
              </div>
            </section>
          )}

          {!loading && (
            <>
              {/* 3) Match Score (card) */}
              {score > 0 && (
                <section className="mb-8">
                  <div className="rounded-3xl bg-neutral-950 text-white ring-1 ring-white/10 shadow-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-xl bg-white/10 ring-1 ring-white/15 flex items-center justify-center">
                        <BarChart3 className="w-4 h-4 text-white" />
                      </div>
                      <h2 className="text-lg text-white font-semibold tracking-tighter">Match Score</h2>
                    </div>
                    <div className="bg-black rounded-2xl p-6">
                      <ScoreGauge value={score} />
                    </div>
                  </div>
                </section>
              )}

              {/* 4) Skills Gap Analysis (card) */}
              {(present.length > 0 || missing.length > 0 || weak.length > 0) && (
                <section className="mb-8">
                  <div className="rounded-3xl bg-neutral-950 text-white ring-1 ring-white/10 shadow-2xl overflow-hidden">
                    <div className="px-6 py-5 border-b border-white/10 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-white/10 ring-1 ring-white/15 flex items-center justify-center">
                        <Target className="w-4 h-4 text-white" />
                      </div>
                      <h2 className="text-lg font-semibold tracking-tighter">Skills Gap Analysis</h2>
                    </div>
                    <div className="p-6 bg-black">
                      <GapTable
                        present={present}
                        missing={missing}
                        weak={weak}
                        onSelectSkill={(s) => setActiveSkill(s)}
                      />
                    </div>
                  </div>
                </section>
              )}

              {/* 5) AI Recommendations (card) */}
              {ai.plan.length > 0 && (
                <section className="mb-8">
                  <div className="rounded-3xl bg-neutral-950 text-black ring-1 ring-white/10 shadow-2xl overflow-hidden">
                    <div className="px-6 py-5 border-b border-white/10 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-white/10 ring-1 ring-white/15 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                      <h2 className="text-lg text-white font-semibold tracking-tighter">AI Recommendations</h2>
                    </div>
                    <div className="p-6 bg-black">
                      <Suggestions plan={ai.plan} resume_bullets={ai.resume_bullets} />
                    </div>
                  </div>
                </section>
              )}

              {/* 6) Skills Coverage (card) */}
              {skills.length > 0 && (
                <section className="mb-8">
                  <div className="rounded-3xl bg-neutral-950 text-white ring-1 ring-white/10 shadow-2xl p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 rounded-xl bg-white/10 ring-1 ring-white/15 flex items-center justify-center">
                        <BarChart3 className="w-4 h-4 text-white" />
                      </div>
                      <h2 className="text-lg font-semibold tracking-tighter">Skills Coverage</h2>
                    </div>
                    <div className="bg-black rounded-2xl p-6">
                      <CoverageBar
                        skills={skills}
                        onBarClick={(s) => setActiveSkill(s.skill)}
                      />
                    </div>
                  </div>
                </section>
              )}

              {/* 7) Evidence Highlighting (card) */}
              {(jdText || resumeText) && (
                <section className="mb-8">
                  <div className="rounded-3xl bg-neutral-950 text-black ring-1 ring-white/10 shadow-2xl overflow-hidden">
                    <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-white/10 ring-1 ring-white/15 flex items-center justify-center">
                          <FileText className="w-4 h-4 text-white" />
                        </div>
                        <h2 className="text-lg text-white font-semibold tracking-tighter">Evidence Highlighting</h2>
                      </div>
                      <span className="rounded-full text-white bg-neutral-800 px-4 py-1 text-xs font-semibold">
                        Keywords
                      </span>
                    </div>

                    <div className="p-6 bg-black">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                </section>
              )}
            </>
          )}
        </div>
        {/* /ref wrapper */}
      </main>
    </div>
  );
}
