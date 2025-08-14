// src/app/api/analyze/route.js
import { NextResponse } from "next/server";
import { extractSkills } from "@/app/components/lib/extract";
import { scoreGaps } from "@/app/components/lib/score";

/* -------------------- Config -------------------- */
const MAX_TERMS = 30;
const ENABLE_ENHANCED_MATCHING = true;

/* -------------------------- Debug logger -------------------------- */
function debugLog(...messages) {
  if (process.env.NODE_ENV !== "production") {
    console.debug(`[${new Date().toISOString()}]`, ...messages);
  }
}

/* ------------------------ Enhanced Text Matching System ------------------------ */
async function getSemanticMatch(jd, resume, apiKey) {
  const prompt = `
Compare this Job Description and Resume to calculate a match percentage.
Focus on technical skills, experience level, domain knowledge, and requirements overlap.

Return ONLY a JSON object with this exact structure:
{
  "match_percentage": 85,
  "matching_skills": ["react", "nodejs", "typescript", "rest api"],
  "missing_critical": ["kubernetes", "microservices"],
  "experience_match": 75,
  "domain_match": 90,
  "explanation": "Strong frontend skills match, some backend gaps"
}

Job Description:
${jd.slice(0, 3000)}

Resume:
${resume.slice(0, 3000)}
`.trim();

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { 
            role: "system", 
            content: "You are an expert technical recruiter. Analyze job-resume matches accurately. Return ONLY valid JSON with no markdown or commentary." 
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.1,
        max_completion_tokens: 800,
        top_p: 1,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`LLAMA API error: ${response.status}`);
    }

    const data = await response.json();
    const rawContent = data?.choices?.[0]?.message?.content || "";
    
    debugLog("Raw semantic match response:", rawContent.slice(0, 200) + "...");
    
    // Parse the JSON response
    const parsed = coerceJson(rawContent);
    
    if (parsed && !parsed.error && typeof parsed.match_percentage === 'number') {
      return {
        match_pct: Math.max(0, Math.min(100, Math.round(parsed.match_percentage))),
        matching_skills: parsed.matching_skills || [],
        missing_critical: parsed.missing_critical || [],
        experience_match: parsed.experience_match || 0,
        domain_match: parsed.domain_match || 0,
        explanation: parsed.explanation || "",
        method: 'semantic_llm'
      };
    }
    
    throw new Error("Invalid response format from LLAMA API");
    
  } catch (error) {
    debugLog("Semantic matching failed:", error.message);
    return null;
  }
}

// Fallback: Enhanced keyword-based matching
function getKeywordMatch(jd, resume) {
  const techKeywords = [
    // Frontend
    'react', 'vue', 'angular', 'javascript', 'typescript', 'html', 'css', 'sass', 'tailwind',
    'next.js', 'nuxt', 'webpack', 'vite', 'babel', 'redux', 'mobx',
    
    // Backend
    'node.js', 'express', 'fastapi', 'django', 'flask', 'spring', 'laravel',
    'python', 'java', 'go', 'rust', 'php', 'ruby', 'c#', '.net',
    
    // Databases
    'mongodb', 'postgresql', 'mysql', 'redis', 'elasticsearch', 'cassandra',
    'sql', 'nosql', 'database', 'orm',
    
    // Cloud & DevOps
    'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'gitlab', 'github actions',
    'terraform', 'ansible', 'helm', 'prometheus', 'grafana',
    
    // Tools & Concepts
    'git', 'api', 'rest', 'graphql', 'microservices', 'testing', 'jest', 'cypress',
    'agile', 'scrum', 'ci/cd', 'oauth', 'jwt', 'authentication', 'authorization'
  ];

  const jdLower = jd.toLowerCase();
  const resumeLower = resume.toLowerCase();
  
  // Find keywords present in both
  const jdKeywords = techKeywords.filter(keyword => jdLower.includes(keyword));
  const resumeKeywords = techKeywords.filter(keyword => resumeLower.includes(keyword));
  const matchingKeywords = jdKeywords.filter(keyword => resumeKeywords.includes(keyword));
  
  debugLog("Keyword analysis - JD:", jdKeywords.length, "Resume:", resumeKeywords.length, "Matching:", matchingKeywords.length);
  
  if (jdKeywords.length === 0) {
    return { 
      match_pct: 50, 
      method: 'keyword_fallback',
      matching_skills: [],
      missing_critical: [],
      explanation: "No technical keywords found in job description"
    };
  }
  
  const baseScore = (matchingKeywords.length / jdKeywords.length) * 100;
  
  // Apply some intelligence to the scoring
  const match_pct = Math.round(Math.max(10, Math.min(95, baseScore)));
  
  return {
    match_pct,
    matching_skills: matchingKeywords,
    missing_critical: jdKeywords.filter(k => !resumeKeywords.includes(k)).slice(0, 10),
    jd_keywords_found: jdKeywords.length,
    resume_keywords_found: resumeKeywords.length,
    method: 'keyword_fallback',
    explanation: `Found ${matchingKeywords.length} matching skills out of ${jdKeywords.length} required`
  };
}

// Main text matching function
async function getTextMatchScore(jd, resume, apiKey) {
  debugLog("Starting enhanced text matching...");
  
  if (!ENABLE_ENHANCED_MATCHING) {
    debugLog("Enhanced matching disabled, using fallback");
    return getKeywordMatch(jd, resume);
  }
  
  // Try semantic matching first
  if (apiKey) {
    debugLog("Attempting semantic matching with LLAMA API...");
    const semanticResult = await getSemanticMatch(jd, resume, apiKey);
    if (semanticResult) {
      debugLog("Semantic matching succeeded:", semanticResult.match_pct + "%");
      return semanticResult;
    }
  } else {
    debugLog("No API key available for semantic matching");
  }
  
  // Fallback to keyword matching
  debugLog("Falling back to keyword matching...");
  const keywordResult = getKeywordMatch(jd, resume);
  debugLog("Keyword matching result:", keywordResult.match_pct + "%");
  
  return keywordResult;
}

/* ------------------------- Prompt builder ------------------------- */
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
        { "title": "string", "description": "1–2 lines tailored to JD domain", "estimated_time": "e.g., '1–2 days'", "key_skills": ["a","b"] },
        { "title": "string", "description": "1–2 lines tailored to JD domain", "estimated_time": "e.g., '3–5 days'", "key_skills": ["c","d"] },
        { "title": "string", "description": "1–2 lines tailored to JD domain", "estimated_time": "e.g., '1 week'", "key_skills": ["e","f"] }
      ],
      "learning": [
        { "topic": "string", "outline": "1 line", "resources": [ { "title": "string", "url": "https://..." } ] },
        { "topic": "string", "outline": "1 line", "resources": [ { "title": "string", "url": "https://..." } ] },
        { "topic": "string", "outline": "1 line", "resources": [ { "title": "string", "url": "https://..." } ] }
      ],
      "checklist": ["5–7 short build/test/docs items"]
    }
  ],
  "resume_bullets": [
    "4–8 concise STAR-style bullets the candidate can add now (truthful, no exaggeration)"
  ]
}

Guidelines:
- Each skill must have EXACTLY 3 projects and EXACTLY 3 learning topics.
- Choose the top 3–5 missing/weak areas from THESE lists (don't invent unrelated skills).
- Tailor projects to the JD domain (analytics/fintech/e-com/ESG/etc.).
- Projects should progress from basic to intermediate to advanced.
- Keep content concise, actionable, and realistic for a fresher.
- Output VALID JSON only.

present_skills: ${JSON.stringify(present || [])}
missing_skills: ${JSON.stringify(missing || [])}
weak_skills: ${JSON.stringify(weak || [])}

JD:
${jdPreview}
`.trim();
}

/* --------------------- API handler (main) --------------------- */
export async function POST(req) {
  const startTime = Date.now();
  let debugData = { step: "init", timing: {}, errors: [], warnings: [] };

  try {
    // Parse request
    debugData.step = "parse_request";
    const { jd = "", resume = "" } = await req.json();
    debugLog("Request received with JD length:", jd.length, "resume length:", resume.length);

    if (!jd.trim() || !resume.trim()) {
      return NextResponse.json(
        { error: "missing_data", message: "Both job description and resume are required" },
        { status: 400 }
      );
    }

    /* 1) Extract & score skills (existing features) */
    debugData.step = "extract_skills";
    const extractStart = Date.now();
    const { jdSkills, resumeSkills, jdSpans = [], resumeSpans = [] } = extractSkills(jd, resume);
    const scored = scoreGaps({ jdSkills, resumeSkills });
    debugData.timing.extract = Date.now() - extractStart;
    debugLog("Skills extracted - present:", scored.present?.length || 0, "missing:", scored.missing?.length || 0);

    /* 2) Enhanced text matching */
    debugData.step = "text_matching";
    const matchStart = Date.now();
    const apiKey = process.env.GROQ_API_KEY || process.env.LLAMA_API_KEY;

    let textMatchResult;
    try {
      textMatchResult = await getTextMatchScore(jd, resume, apiKey);
      debugData.timing.text_matching = Date.now() - matchStart;
      debugLog("Text matching completed:", textMatchResult.match_pct + "%", "Method:", textMatchResult.method);
    } catch (error) {
      debugData.errors.push({ type: "text_matching_error", message: error.message });
      textMatchResult = { 
        match_pct: 30, 
        method: "error_fallback",
        matching_skills: [],
        missing_critical: [],
        explanation: "Error occurred during matching analysis"
      };
    }

    const final_match_pct = textMatchResult.match_pct;

    /* 3) Prepare fallbacks for plan/bullets */
    debugData.step = "prepare_fallbacks";
    let plan = rbPlan(scored);
    let resume_bullets = rbResumeBullets(scored);

    /* 4) Groq API call for enhanced plan/bullets */
    debugData.step = "groq_api";
    let apiResponse = null;
    let rawResponse = null;

    if (apiKey) {
      try {
        const prompt = buildRichPlanPrompt({
          present: scored.present,
          missing: scored.missing?.map((m) => m.skill) || [],
          weak: scored.weak || [],
          jd,
        });

        debugLog("Sending to Groq API for plan generation with prompt length:", prompt.length);
        const apiStart = Date.now();
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "llama3-70b-8192",
            messages: [
              { role: "system", content: "Return ONLY valid JSON that matches the schema. No markdown. No commentary." },
              { role: "user", content: prompt },
            ],
            temperature: 0.25,
            top_p: 0.95,
            max_tokens: 3000,
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

          const parsedResponse = coerceJson(rawResponse);
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
          }
        }
      } catch (err) {
        debugData.errors.push({ type: "groq_exception", message: err.message });
        debugLog("Groq call exception:", err);
      }
    } else {
      debugData.warnings.push("No API key found for enhanced plan generation");
    }

    /* 5) Prepare response */
    debugData.step = "prepare_response";
    const responseData = {
      // Use enhanced match score
      match_pct: final_match_pct,
      
      // Enhanced matching details
      text_match_details: {
        method: textMatchResult.method,
        matching_skills: textMatchResult.matching_skills || [],
        missing_critical: textMatchResult.missing_critical || [],
        explanation: textMatchResult.explanation || "",
        experience_match: textMatchResult.experience_match,
        domain_match: textMatchResult.domain_match
      },

      // Existing skill analysis
      present: scored.present || [],
      missing: scored.missing || [],
      weak: scored.weak || [],
      jd_spans: jdSpans,
      resume_spans: resumeSpans,

      // Plan and suggestions
      plan,
      resume_bullets,

      // Metadata
      meta: {
        api_status: apiResponse ? "success" : "fallback_used",
        timing_ms: { total: Date.now() - startTime, ...debugData.timing },
        debug: process.env.NODE_ENV !== "production" ? debugData : undefined,
        version: "enhanced_v3"
      },
    };

    // Add debug info in development
    if (process.env.NODE_ENV !== "production") {
      responseData.debug_raw = (rawResponse || "").slice(0, 500) + ((rawResponse || "").length > 500 ? "..." : "");
    }

    debugLog("Response prepared successfully - Match:", final_match_pct + "%", "Plan items:", plan.length);
    return NextResponse.json(responseData);

  } catch (e) {
    debugData.errors.push({ type: "route_exception", message: e.message, stack: e.stack });
    debugLog("Route error:", e);

    return NextResponse.json(
      { 
        error: "server_error", 
        message: e.message, 
        meta: { debug: debugData, timing_ms: { total: Date.now() - startTime } }
      },
      { status: 500 }
    );
  }
}

/* --------------------- Enhanced JSON Parser --------------------- */
function coerceJson(text) {
  if (!text) {
    debugLog("coerceJson: Empty input");
    return { error: "empty_input" };
  }

  // First try direct parsing
  try {
    const parsed = JSON.parse(text);
    debugLog("Direct JSON parse successful");
    return parsed;
  } catch {
    debugLog("Initial parse failed, attempting recovery");
  }

  // Try to extract JSON from the text
  try {
    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}");
    if (jsonStart >= 0 && jsonEnd > jsonStart) {
      let candidate = text.slice(jsonStart, jsonEnd + 1);
      debugLog("Extracted JSON candidate length:", candidate.length);

      // Apply common fixes
      const fixes = [
        [/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":'], // Fix unquoted keys
        [/'/g, '"'],                                 // Single to double quotes
        [/,\s*([}\]])/g, "$1"],                      // Remove trailing commas
        [/\\"/g, '"'],                               // Fix over-escaped quotes
        [/\n\s*/g, ' '],                            // Remove newlines and extra whitespace
      ];

      for (const [regex, replacement] of fixes) {
        try {
          const fixed = candidate.replace(regex, replacement);
          const parsed = JSON.parse(fixed);
          debugLog("JSON recovery successful with fix");
          return parsed;
        } catch {
          // Continue to next fix
        }
      }
      return { error: "json_recovery_failed", candidate: candidate.slice(0, 200) + "..." };
    }
  } catch (e) {
    debugLog("Recovery attempt failed:", e.message);
  }

  return { error: "no_valid_json", input_sample: text.slice(0, 200) + (text.length > 200 ? "..." : "") };
}

/* ---------------------- Utility functions ---------------------- */
const cap = (s) => (s || "").charAt(0).toUpperCase() + (s || "").slice(1);
const clamp01 = (v) => Math.max(0, Math.min(1, Number(v) || 0));

/* ---------------------- Enhanced fallbacks with 3 projects & 3 learning points ---------------------- */
function rbPlan(scored) {
  const miss = (scored?.missing || []).map((m) => m.skill);
  if (!miss.length) return [];
  
  return miss.slice(0, 5).map((skill) => ({
    skill,
    why: `The JD expects ${skill}, but your resume does not show it.`,
    projects: [
      {
        title: `${cap(skill)} Starter Project`,
        description: `Build a minimal demo showcasing core ${skill} features with basic functionality and clean code structure.`,
        estimated_time: "1–2 days",
        key_skills: [skill, "fundamentals", "best practices"],
      },
      {
        title: `${cap(skill)} + Database Integration`,
        description: `Create a practical application integrating ${skill} with database operations, CRUD functionality, and API design.`,
        estimated_time: "3–5 days",
        key_skills: [skill, "database", "API design", "testing"],
      },
      {
        title: `${cap(skill)} Production App`,
        description: `Develop a full-featured application with ${skill}, including authentication, deployment, monitoring, and documentation.`,
        estimated_time: "1–2 weeks",
        key_skills: [skill, "authentication", "deployment", "monitoring", "documentation"],
      },
    ],
    learning: [
      {
        topic: `${cap(skill)} Fundamentals`,
        outline: "Core concepts, syntax, installation, and basic examples to get started.",
        resources: [{ 
          title: "Official Documentation", 
          url: `https://www.google.com/search?q=${encodeURIComponent(skill + " official documentation tutorial")}` 
        }],
      },
      {
        topic: `${cap(skill)} Best Practices & Testing`,
        outline: "Industry standards, code quality, testing strategies, and debugging techniques.",
        resources: [{ 
          title: "Best Practices Guide", 
          url: `https://www.google.com/search?q=${encodeURIComponent(skill + " best practices testing guide")}` 
        }],
      },
      {
        topic: `${cap(skill)} Production & Deployment`,
        outline: "Performance optimization, security considerations, deployment strategies, and monitoring.",
        resources: [{ 
          title: "Production Deployment Guide", 
          url: `https://www.google.com/search?q=${encodeURIComponent(skill + " production deployment guide")}` 
        }],
      },
    ],
    checklist: [
      `Set up development environment and create first ${skill} application.`,
      "Implement core functionality with proper error handling and validation.",
      "Add comprehensive README with setup instructions and examples.",
      "Write unit tests and integration tests with good coverage.",
      "Deploy to cloud platform with live demo link and monitoring.",
      "Document architecture decisions and key learnings.",
      "Review code for security vulnerabilities and performance optimizations.",
    ],
  }));
}

function rbResumeBullets(scored) {
  const miss = (scored?.missing || []).map((m) => m.skill);
  const bullets = [];
  
  // Generate contextual bullets based on missing skills
  if (miss.some(s => ['flask', 'fastapi', 'django', 'python'].includes(s.toLowerCase()))) {
    bullets.push("Built RESTful APIs using Python frameworks (Flask/FastAPI) with PostgreSQL integration, JWT authentication, and comprehensive test coverage achieving 90%+ reliability.");
  }
  
  if (miss.some(s => ['postgres', 'postgresql', 'mysql', 'sql'].includes(s.toLowerCase()))) {
    bullets.push("Designed and optimized database schemas with proper indexing and foreign key relationships; documented Entity-Relationship Diagrams and implemented complex query optimizations reducing response time by 40%.");
  }
  
  if (miss.some(s => ['typescript', 'ts'].includes(s.toLowerCase()))) {
    bullets.push("Migrated JavaScript codebase to TypeScript with strict type checking; implemented Jest test suites covering 95%+ code coverage and reduced runtime errors by 60%.");
  }
  
  if (miss.some(s => ['docker', 'kubernetes', 'k8s'].includes(s.toLowerCase()))) {
    bullets.push("Containerized applications using Docker and orchestrated deployments with Kubernetes; configured CI/CD pipelines with automated testing, security scanning, and zero-downtime deployments.");
  }
  
  if (miss.some(s => ['aws', 'azure', 'gcp', 'cloud'].includes(s.toLowerCase()))) {
    bullets.push("Deployed scalable applications on cloud platforms (AWS/Azure/GCP) using Infrastructure as Code (Terraform); implemented auto-scaling, load balancing, and comprehensive monitoring solutions.");
  }
  
  if (miss.some(s => ['react', 'vue', 'angular', 'frontend'].includes(s.toLowerCase()))) {
    bullets.push("Developed responsive single-page applications using modern JavaScript frameworks with state management, routing, and performance optimization achieving 95+ Lighthouse scores.");
  }
  
  if (miss.some(s => ['node.js', 'express', 'backend'].includes(s.toLowerCase()))) {
    bullets.push("Architected scalable Node.js backend services with Express framework, implementing microservices patterns, caching strategies, and API rate limiting for high-traffic applications.");
  }
  
  // Default bullets if no specific matches
  if (!bullets.length) {
    bullets.push(
      "Enhanced existing projects with comprehensive documentation, automated testing suites, and CI/CD pipeline integration using GitHub Actions with 100% deployment success rate.",
      "Implemented responsive web applications with modern JavaScript frameworks, focusing on accessibility standards (WCAG 2.1 AA) and performance optimization achieving sub-2s load times.",
      "Collaborated on code reviews and maintained version control best practices; contributed to 5+ open-source projects and authored technical documentation viewed by 1000+ developers."
    );
  }
  
  return bullets.slice(0, 8); // Allow up to 8 bullets as mentioned in prompt
}