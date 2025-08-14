// src/app/api/analyze/route.js
import { NextResponse } from "next/server";
import { extractSkills } from "@/app/components/lib/extract";
import { scoreGaps } from "@/app/components/lib/score";

// Debug logger with timestamp
function debugLog(...messages) {
  if (process.env.NODE_ENV !== "production") {
    console.debug(`[${new Date().toISOString()}]`, ...messages);
  }
}

// ----- Prompt builder -----
function buildRichPlanPrompt({ present, missing, weak, jd }) {
  const jdPreview = (jd || "").slice(0, 4000);
  debugLog("Building prompt with JD preview:", jdPreview.slice(0, 100) + "...");

  return `
Compare this Job Description (JD) and Resume evidence (present/weak/missing skills)
and produce a practical gap-closure plan for a fresher frontend/consulting candidate.

Return ONLY a single JSON object (no markdown, no extra text) that matches:

{
  "match_pct": 0,                       // integer 0-100 estimating fit
  "plan": [
    {
      "skill": "string",
      "why": "1 line, specific to THIS JD",
      "projects": [
        { "title": "string", "description": "1–2 lines tailored to JD domain", "estimated_time": "e.g., '1–2 days'", "key_skills": ["a","b"] }
      ],
      "learning": [
        { "topic": "string", "outline": "1 line", "resources": [ { "title": "string", "url": "https://..." } ] }
      ],
      "checklist": ["3–5 short build/test/docs items"]
    }
  ],
  "resume_bullets": [
    "4–8 concise STAR-style bullets the candidate can add now (truthful, no exaggeration)"
  ]
}

Guidelines:
- Choose the top 3–5 missing/weak areas from THESE lists (don’t invent unrelated skills).
- Tailor projects to the JD domain (analytics/fintech/e-com/ESG/etc.).
- Keep content concise, actionable, and realistic for a fresher.
- Output VALID JSON only.

present_skills: ${JSON.stringify(present || [])}
missing_skills: ${JSON.stringify(missing || [])}
weak_skills: ${JSON.stringify(weak || [])}

JD:
${jdPreview}
`.trim();
}

// ----- API handler -----
export async function POST(req) {
  const startTime = Date.now();
  let debugData = { step: "init", timing: {}, errors: [], warnings: [] };

  try {
    // Parse request
    debugData.step = "parse_request";
    const { jd = "", resume = "" } = await req.json();
    debugLog("Request received with JD length:", jd.length, "resume length:", resume.length);

    // 1) Extract & score deterministically
    debugData.step = "extract_skills";
    const extractStart = Date.now();
    const { jdSkills, resumeSkills, jdSpans = [], resumeSpans = [] } = extractSkills(jd, resume);
    const scored = scoreGaps({ jdSkills, resumeSkills });
    debugData.timing.extract = Date.now() - extractStart;
    debugLog("Skills extracted - present:", scored.present.length, "missing:", scored.missing.length);

    // 2) Prepare fallbacks
    debugData.step = "prepare_fallbacks";
    let plan = rbPlan(scored);
    let resume_bullets = rbResumeBullets(scored);
    let match_pct = scored?.match_pct ?? null;

    // 3) Groq API call
    debugData.step = "groq_api";
    let apiResponse = null;
    let rawResponse = null;
    let parsedResponse = null;

    if (process.env.LLAMA_API_KEY) {
      try {
        const prompt = buildRichPlanPrompt({
          present: scored.present,
          missing: scored.missing.map((m) => m.skill),
          weak: scored.weak,
          jd,
        });

        debugLog("Sending to Groq API with prompt length:", prompt.length);
        const apiStart = Date.now();
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.LLAMA_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "llama3-70b-8192", // change if your key doesn't have this
            messages: [
              { role: "system", content: "Return ONLY valid JSON that matches the schema. No markdown. No commentary." },
              { role: "user", content: prompt },
            ],
            temperature: 0.25,
            top_p: 0.95,
            max_tokens: 2200,
            stream: false,
          }),
        });

        debugData.timing.api_call = Date.now() - apiStart;

        if (!response.ok) {
          const errorText = await response.text();
          debugData.errors.push({ type: "groq_api_error", status: response.status, message: errorText });
          debugLog("Groq API error:", response.status, errorText);
        } else {
          apiResponse = await response.json();
          rawResponse = apiResponse?.choices?.[0]?.message?.content ?? "";
          debugLog("Raw API response length:", rawResponse.length);

          parsedResponse = coerceJson(rawResponse);
          debugData.api_response = {
            raw_length: rawResponse.length,
            parsed_type: typeof parsedResponse,
            parse_success: !parsedResponse?.error,
          };

          if (parsedResponse?.error) {
            debugData.errors.push({ type: "json_parse_error", message: parsedResponse.error });
          } else {
            if (Array.isArray(parsedResponse?.plan)) {
              plan = parsedResponse.plan;
              debugLog("Received plan items:", plan.length);
            }
            if (Array.isArray(parsedResponse?.resume_bullets)) {
              resume_bullets = parsedResponse.resume_bullets;
              debugLog("Received resume bullets:", resume_bullets.length);
            }
            if (Number.isFinite(parsedResponse?.match_pct)) {
              match_pct = parsedResponse.match_pct;
            }
          }
        }
      } catch (err) {
        debugData.errors.push({ type: "groq_exception", message: err.message });
        debugLog("Groq call exception:", err);
      }
    } else {
      debugData.warnings.push("No LLAMA_API_KEY in environment");
    }

    // 4) Prepare response
    debugData.step = "prepare_response";
    const responseData = {
      match_pct,
      present: scored.present,
      missing: scored.missing,
      weak: scored.weak,
      jd_spans: jdSpans,
      resume_spans: resumeSpans,
      plan,
      resume_bullets,
      meta: {
        api_status: apiResponse ? "success" : "not_used",
        timing_ms: { total: Date.now() - startTime, ...debugData.timing },
        debug: debugData,
      },
    };

    if (process.env.NODE_ENV !== "production") {
      responseData.debug_raw = rawResponse?.slice(0, 500) + (rawResponse?.length > 500 ? "..." : "");
    }

    debugLog("Response prepared with plan items:", plan.length);
    return NextResponse.json(responseData);
  } catch (e) {
    debugData.errors.push({ type: "route_exception", message: e.message });
    debugLog("Route error:", e);

    return NextResponse.json(
      { error: "server_error", message: e.message, meta: { debug: debugData } },
      { status: 500 }
    );
  }
}

/* ---------- Enhanced JSON Parser ---------- */
function coerceJson(text) {
  if (!text) {
    debugLog("coerceJson: Empty input");
    return { error: "empty_input" };
  }
  try {
    return JSON.parse(text);
  } catch {
    debugLog("Initial parse failed, attempting recovery");
  }

  try {
    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}");
    if (jsonStart >= 0 && jsonEnd > jsonStart) {
      let candidate = text.slice(jsonStart, jsonEnd + 1);
      debugLog("Extracted JSON candidate length:", candidate.length);

      const fixes = [
        [/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":'], // unquoted keys
        [/'/g, '"'],                                 // single -> double quotes
        [/,\s*([}\]])/g, "$1"],                      // trailing commas
        [/\\"/g, '"'],                               // over-escaped quotes
      ];

      for (const [regex, replacement] of fixes) {
        try {
          const fixed = candidate.replace(regex, replacement);
          return JSON.parse(fixed);
        } catch {
          // continue trying fixes
        }
      }
      return { error: "json_recovery_failed", candidate: candidate.slice(0, 200) + "..." };
    }
  } catch (e) {
    debugLog("Recovery attempt failed:", e);
  }

  return { error: "no_valid_json", input_sample: text.slice(0, 200) + (text.length > 200 ? "..." : "") };
}

/* ---------- Simple fallbacks ---------- */
function rbPlan(scored) {
  const miss = (scored?.missing || []).map((m) => m.skill);
  if (!miss.length) return [];
  return miss.slice(0, 5).map((skill) => ({
    skill,
    why: `The JD expects ${skill}, but your resume does not show it.`,
    projects: [
      { title: `${cap(skill)} Quickstart`, description: `Minimal demo highlighting core ${skill} features.`, estimated_time: "1–2 days", key_skills: [skill, "tests", "docs"] },
      { title: `${cap(skill)} + Database`, description: `Integrate ${skill} with Postgres/MySQL & CRUD.`, estimated_time: "2–4 days", key_skills: [skill, "SQL", "API"] },
    ],
    learning: [
      { topic: `${cap(skill)} basics`, outline: "Install & first example.", resources: [{ title: "Official docs", url: `https://www.google.com/search?q=${encodeURIComponent(skill + " docs")}` }] },
      { topic: "Testing", outline: "Write basic tests & run locally.", resources: [{ title: "Intro testing", url: `https://www.google.com/search?q=${encodeURIComponent(skill + " testing")}` }] },
      { topic: "Deployment", outline: "Deploy to a free host.", resources: [{ title: "Deploy guide", url: `https://www.google.com/search?q=${encodeURIComponent(skill + " deploy")}` }] },
    ],
    checklist: [
      `Implement a small app using ${skill}.`,
      "Add README with setup & screenshots.",
      "Write minimal tests or lint checks.",
      "Deploy and include a live link.",
    ],
  }));
}

function rbResumeBullets(scored) {
  const miss = (scored?.missing || []).map((m) => m.skill);
  const bullets = [];
  if (miss.includes("flask") || miss.includes("fastapi") || miss.includes("django")) {
    bullets.push("Built a small Python API (Flask/FastAPI) with Postgres and JWT auth; added basic tests and CI.");
  }
  if (miss.includes("postgres") || miss.includes("sql")) {
    bullets.push("Designed SQL schema and optimized queries with indexes; documented ERD and key joins.");
  }
  if (miss.includes("typescript")) {
    bullets.push("Migrated React components to TypeScript and added a Jest test suite for key utilities.");
  }
  if (!bullets.length) {
    bullets.push("Improved documentation and testing across projects; set up GitHub Actions CI and linting.");
  }
  return bullets;
}

const cap = (s) => (s || "").charAt(0).toUpperCase() + (s || "").slice(1);
