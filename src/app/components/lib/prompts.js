// src/lib/prompts.js

/**
 * Build messages for a rich, structured roadmap:
 * - plan[] per missing/weak skill
 * - each plan item has why, projects[], learning[], checklist[]
 * - resume_bullets[] (STAR-style, copy-ready)
 */
export function buildRichPlanMessages(payload) {
  return [
    {
      role: "system",
      content:
        "Return ONLY strict JSON that matches the given schema. No extra text, no markdown. Keep language concise and specific, suitable for a fresher."
    },
    {
      role: "user",
      content: JSON.stringify({
        instruction:
          "You are building a gap-closure plan for a fresher applying to frontend + consulting style roles. Input arrays: present, missing, weak. For EACH missing or weak skill (top 5 max), create a plan item with: 'skill', 'why', 2-3 'projects' (title, description in 1-2 lines, estimated_time like '1-2 days' or '1 week', key_skills array), 3-6 'learning' items (topic, outline sentence, resources array with {title,url}), and a 3-5 item 'checklist' (what to implement/test/document). Then produce 4-6 concise 'resume_bullets' in STAR style that a fresher can add NOW (no exaggeration).",
        schema: {
          type: "object",
          properties: {
            plan: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  skill: { type: "string" },
                  why: { type: "string" },
                  projects: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        description: { type: "string" },
                        estimated_time: { type: "string" },
                        key_skills: { type: "array", items: { type: "string" } }
                      },
                      required: ["title", "description", "estimated_time", "key_skills"]
                    },
                    minItems: 2,
                    maxItems: 3
                  },
                  learning: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        topic: { type: "string" },
                        outline: { type: "string" },
                        resources: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              title: { type: "string" },
                              url: { type: "string" }
                            },
                            required: ["title", "url"]
                          },
                          minItems: 1,
                          maxItems: 2
                        }
                      },
                      required: ["topic", "outline", "resources"]
                    },
                    minItems: 3,
                    maxItems: 6
                  },
                  checklist: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 5 }
                },
                required: ["skill", "why", "projects", "learning", "checklist"]
              }
            },
            resume_bullets: { type: "array", items: { type: "string" }, minItems: 4, maxItems: 6 }
          },
          required: ["plan", "resume_bullets"]
        },
        payload
      })
    }
  ];
}
