import Groq from "groq-sdk";

export function getGroq() {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not set");
  }
  return new Groq({ apiKey: process.env.GROQ_API_KEY });
}
