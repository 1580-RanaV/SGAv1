"use client";
import { useState } from "react";

function Section({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-neutral-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2"
      >
        <span className="text-sm font-medium">{title}</span>
        <span className="text-xs text-neutral-500">{open ? "Hide" : "Show"}</span>
      </button>
      {open ? <div className="px-3 pb-3">{children}</div> : null}
    </div>
  );
}

function CopyBtn({ getText }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        const txt = (typeof getText === "function" ? getText() : "") || "";
        await navigator.clipboard.writeText(txt);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      }}
      className="text-xs rounded-lg border px-2 py-1 hover:bg-neutral-50"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

export default function Suggestions({ plan = [], resume_bullets = [] }) {
  const planText = () =>
    (plan || [])
      .map((p) => {
        const projs = (p.projects || [])
          .map((pr) => `- ${pr.title}: ${pr.description}${pr.estimated_time ? ` (${pr.estimated_time})` : ""}`)
          .join("\n");
        const learn = (p.learning || [])
          .map((l) => {
            const links = (l.resources || []).map((r) => `${r.title}: ${r.url}`).join(" | ");
            return `- ${l.topic}: ${l.outline}${links ? " — " + links : ""}`;
          })
          .join("\n");
        const check = (p.checklist || []).map((c) => `- ${c}`).join("\n");
        return [`Skill: ${p.skill}`, `Why: ${p.why}`, `Projects:\n${projs}`, `Learning:\n${learn}`, `Checklist:\n${check}`].join("\n");
      })
      .join("\n\n");

  const bulletsText = () => (resume_bullets || []).map((b) => `- ${b}`).join("\n");

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      {/* AI plan */}
      <div className="card p-3 flex flex-col gap-3 max-h-[70vh] overflow-auto">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">AI Suggestions — Gap Closure Plan</div>
          <CopyBtn getText={planText} />
        </div>

        {!plan.length ? (
          <div className="text-sm text-neutral-500">—</div>
        ) : (
          <div className="space-y-3">
            {plan.map((p, idx) => (
              <div key={idx} className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
                <div className="text-sm font-semibold tracking-tight break-words">{p.skill}</div>

                {p.why ? (
                  <p className="text-sm text-neutral-700 mt-1 whitespace-pre-wrap break-words">{p.why}</p>
                ) : null}

                {Array.isArray(p.projects) && p.projects.length ? (
                  <div className="mt-2">
                    <div className="text-xs font-medium text-neutral-500 mb-1">Projects (2–3):</div>
                    <ul className="list-disc pl-5 space-y-1 text-sm whitespace-pre-wrap break-words">
                      {p.projects.map((pr, i) => (
                        <li key={i}>
                          <span className="font-medium">{pr.title}:</span> {pr.description}{" "}
                          {pr.estimated_time ? <span className="text-neutral-500">({pr.estimated_time})</span> : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {Array.isArray(p.learning) && p.learning.length ? (
                  <div className="mt-2">
                    <div className="text-xs font-medium text-neutral-500 mb-1">What to learn:</div>
                    <ul className="list-disc pl-5 space-y-1 text-sm whitespace-pre-wrap break-words">
                      {p.learning.map((l, i) => (
                        <li key={i}>
                          <span className="font-medium">{l.topic}:</span> {l.outline}{" "}
                          {Array.isArray(l.resources) && l.resources.length ? (
                            <>
                              {" — "}
                              {l.resources
                                .map((r, ri) => (
                                  <a key={ri} href={r.url} target="_blank" rel="noreferrer" className="underline break-all">
                                    {r.title}
                                  </a>
                                ))
                                .reduce((prev, curr) => [prev, " • ", curr])}
                            </>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {Array.isArray(p.checklist) && p.checklist.length ? (
                  <div className="mt-2">
                    <div className="text-xs font-medium text-neutral-500 mb-1">Checklist:</div>
                    <ul className="list-disc pl-5 space-y-1 text-sm whitespace-pre-wrap break-words">
                      {p.checklist.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Resume bullets */}
      <div className="card p-3 flex flex-col max-h-[70vh] overflow-auto">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium">Proposed Resume Bullets</div>
          <CopyBtn getText={bulletsText} />
        </div>
        <ul className="list-disc pl-5 space-y-1 text-sm whitespace-pre-wrap break-words">
          {resume_bullets.length ? (
            resume_bullets.map((s, i) => <li key={i}>{s}</li>)
          ) : (
            <li className="text-neutral-500">—</li>
          )}
        </ul>
      </div>
    </div>
  );
}
