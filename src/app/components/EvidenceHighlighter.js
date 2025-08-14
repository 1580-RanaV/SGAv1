"use client";
import { useMemo } from "react";
import Button from "./ui/Button";

/**
 * Props:
 *  - title: "Job Description" | "Resume"
 *  - text: raw string
 *  - spans: [{ skill, positions: [[start,end], ...] }]
 *  - activeSkill: string | null  -> highlight only this skill's spans (if null, show all)
 *  - onClear: function
 */
export default function EvidenceHighlighter({ title, text = "", spans = [], activeSkill = null, onClear }) {
  const ranges = useMemo(() => {
    if (!text) return [];
    const toUse = activeSkill
      ? spans.filter(s => s.skill === activeSkill)
      : spans;

    const flat = [];
    for (const s of toUse) {
      for (const [start, end] of s.positions || []) {
        if (Number.isFinite(start) && Number.isFinite(end) && end > start) {
          flat.push({ start, end, skill: s.skill });
        }
      }
    }
    // sort & merge overlaps
    flat.sort((a,b)=> a.start - b.start);
    const merged = [];
    for (const r of flat) {
      const last = merged[merged.length - 1];
      if (!last || r.start > last.end) merged.push({ ...r });
      else if (r.end > last.end) last.end = r.end; // extend
    }
    return merged;
  }, [text, spans, activeSkill]);

  const parts = useMemo(() => {
    if (!ranges.length) return [ { t: text, hi: false } ];
    const out = [];
    let cursor = 0;
    for (const r of ranges) {
      if (cursor < r.start) out.push({ t: text.slice(cursor, r.start), hi: false });
      out.push({ t: text.slice(r.start, r.end), hi: true });
      cursor = r.end;
    }
    if (cursor < text.length) out.push({ t: text.slice(cursor), hi: false });
    return out;
  }, [text, ranges]);

  return (
    <div className="card p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium">{title} Evidence {activeSkill ? `— ${activeSkill}` : ""}</div>
        <div className="flex items-center gap-2">
          {activeSkill ? <Button variant="ghost" onClick={onClear}>Clear skill</Button> : null}
        </div>
      </div>
      <article className="whitespace-pre-wrap text-sm leading-relaxed">
        {parts.map((p, i) =>
          p.hi ? (
            <mark key={i} className="rounded-[6px] bg-yellow-200/70 px-0.5">{p.t}</mark>
          ) : (
            <span key={i}>{p.t}</span>
          )
        )}
      </article>
    </div>
  );
}
