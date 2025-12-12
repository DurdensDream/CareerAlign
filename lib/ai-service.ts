import axios from "axios";
import nlp from "compromise";
import pdf from "pdf-parse";
import { cosineSimilarity, sanitizeInput, tfIdfScore } from "@/lib/utils";
import type { AnalysisResult, SkillBreakdown, ResumeSuggestion, TailoredResumeSection } from "@/lib/types";

type HFEmbedding = number[] | number[][];

const DEFAULT_HF_MODEL = "BAAI/bge-large-en-v1.5";
const HF_MODEL = process.env.HUGGINGFACE_MODEL?.trim() || DEFAULT_HF_MODEL;
const HF_ENDPOINT = `https://api-inference.huggingface.co/models/${encodeURIComponent(HF_MODEL)}`;

const HARD_SKILL_CUES = [
  "typescript",
  "javascript",
  "react",
  "next.js",
  "node",
  "python",
  "ai",
  "ml",
  "sql",
  "mongodb",
  "aws",
  "devops"
];

const SOFT_SKILL_CUES = [
  "leadership",
  "communication",
  "collaboration",
  "team",
  "stakeholder",
  "mentorship",
  "problem solving",
  "ownership"
];

const BUSINESS_STRATEGY_CUES = [
  "roadmap",
  "strategy",
  "vision",
  "go-to-market",
  "customer research",
  "experimentation",
  "analytics",
  "stakeholder",
  "insights",
  "growth",
  "delivery"
];

const ACTION_VERBS = ["Scaled", "Launched", "Designed", "Optimized", "Led", "Automated"];

const METRIC_FRAMES = [
  "driving double-digit adoption gains",
  "accelerating roadmap velocity by 30%+",
  "reducing operational overhead by millions",
  "lifting CSAT/NPS into top quartile",
  "shortening experimentation cycles to under 2 weeks",
  "creating executive-ready visibility across KPIs"
];

interface AnalyzeInput {
  resumeBuffer: Buffer;
  jobDescription: string;
  jobTitle: string;
  fileName: string;
}

async function extractResumeText(buffer: Buffer) {
  const parsed = await pdf(buffer);
  return sanitizeInput(parsed.text);
}

function normalizeEmbeddingPayload(payload: unknown): HFEmbedding {
  if (Array.isArray(payload)) {
    return payload as HFEmbedding;
  }
  if (payload && typeof payload === "object") {
    const { embedding, data } = payload as {
      embedding?: unknown;
      data?: unknown;
    };
    if (Array.isArray(embedding)) {
      return embedding as HFEmbedding;
    }
    if (Array.isArray(data)) {
      return data as HFEmbedding;
    }
  }
  throw new Error("Unexpected embedding payload returned by Hugging Face.");
}

function segmentSections(raw: string) {
  const sections = raw.split(/\n(?=([A-Z][A-Za-z ]{2,20}:?))/);
  const map = new Map<string, string>();
  let currentKey = "General";
  sections.forEach((section) => {
    const headerMatch = section.match(/^([A-Z][A-Za-z ]{2,25}):?/);
    if (headerMatch) {
      currentKey = headerMatch[1].trim();
      map.set(currentKey, section.replace(headerMatch[0], "").trim());
    } else {
      map.set(currentKey, `${map.get(currentKey) ?? ""}\n${section}`.trim());
    }
  });
  return map;
}

function containsTerm(source: string, term: string) {
  const normalizedSource = source.toLowerCase();
  const normalizedTerm = term.toLowerCase();
  return normalizedSource.includes(normalizedTerm);
}

function extractPrioritySkills(text: string) {
  const catalog = Array.from(new Set([...HARD_SKILL_CUES, ...SOFT_SKILL_CUES, ...BUSINESS_STRATEGY_CUES]));
  const lower = text.toLowerCase();
  return catalog.filter((term) => lower.includes(term)).slice(0, 10);
}

function formatKeyword(keyword: string) {
  return keyword.replace(/[_-]/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

interface ResumeSuggestionInput {
  missing: string[];
  matched: string[];
  resumeText: string;
  jobDescription: string;
  jobTitle: string;
}

function buildResumeSuggestions({ missing, matched, resumeText, jobDescription, jobTitle }: ResumeSuggestionInput): ResumeSuggestion[] {
  const suggestions: ResumeSuggestion[] = [];
  const normalizedResume = resumeText.toLowerCase();
  const normalizedJD = jobDescription.toLowerCase();

  missing.slice(0, 6).forEach((keyword) => {
    suggestions.push({
      section: "Experience",
      action: `Add a metric-driven bullet that showcases ${keyword}.`,
      reason: `${formatKeyword(keyword)} is called out in the ${jobTitle} posting but never appears in your resume.`
    });
  });

  const metricsPattern = /(?:\b\d{1,3}%|\b\d+[km]?(?:\s|$))/;
  if (!metricsPattern.test(resumeText)) {
    suggestions.push({
      section: "Achievements",
      action: "Inject numbers (%, $, # users) into 2-3 bullets to prove scale.",
      reason: "The posting emphasizes measurable outcomes yet the resume reads narratively."
    });
  }

  if (containsTerm(normalizedJD, "stakeholder") && !containsTerm(normalizedResume, "stakeholder")) {
    suggestions.push({
      section: "Leadership",
      action: "Add a line that highlights exec or cross-functional stakeholder influence.",
      reason: "Stakeholder navigation is a core theme in the JD but absent from your story."
    });
  }

  if (containsTerm(normalizedJD, "roadmap") && !containsTerm(normalizedResume, "roadmap")) {
    suggestions.push({
      section: "Product Strategy",
      action: "Describe how you shaped or sequenced a roadmap tied to outcomes.",
      reason: "Roadmapping accountability is explicitly requested."
    });
  }

  if (!matched.length) {
    suggestions.push({
      section: "Branding",
      action: `Open with a headline that mirrors "${jobTitle}" to anchor relevance immediately.`,
      reason: "Applicant tracking systems boost resumes that repeat the target title early."
    });
  }

  return suggestions.slice(0, 8);
}

interface TailoredResumeInput {
  jobTitle: string;
  matched: string[];
  missing: string[];
  jobDescription: string;
}

function craftTailoredResume({ jobTitle, matched, missing, jobDescription }: TailoredResumeInput): TailoredResumeSection[] {
  const prioritySkills = extractPrioritySkills(jobDescription);
  const topMatched = matched.slice(0, 4).map(formatKeyword);
  const topMissing = missing.slice(0, 4).map(formatKeyword);

  const summaryBullets = [
    `Product leader targeting the ${jobTitle} role with strengths in ${topMatched.join(", ") || "modern AI delivery"}.`,
    `Pairs customer research with ${prioritySkills.slice(0, 3).join(", ") || "experimentation and insight"} to shape shipping plans.`
  ];

  const impactBullets = topMatched.length
    ? topMatched.map((keyword, index) => {
        const verb = ACTION_VERBS[index % ACTION_VERBS.length];
        const metricFrame = METRIC_FRAMES[index % METRIC_FRAMES.length];
        return `${verb} ${keyword.toLowerCase()} programs ${metricFrame}.`;
      })
    : [
        "Led cross-functional pods that moved activation, retention, and monetization metrics with disciplined experimentation.",
        "Translated ambiguous problem statements into measurable launch criteria and KPI trees."
      ];

  const focusBullets = topMissing.length
    ? topMissing.map((keyword) => `Add a bullet proving ownership of ${keyword.toLowerCase()} with a before/after metric.`)
    : ["Ensure each bullet claims a measurable win tied directly to the JD priorities."];

  const skillBullets = (prioritySkills.length ? prioritySkills : HARD_SKILL_CUES.slice(0, 5)).map(
    (skill) => `${formatKeyword(skill)} | highlight relevant tools, scale, and business impact.`
  );

  return [
    { title: "Professional Summary", bullets: summaryBullets },
    { title: "Impact Highlights", bullets: impactBullets.slice(0, 4) },
    { title: "Focus Areas To Add", bullets: focusBullets.slice(0, 4) },
    { title: "Skill Headlines", bullets: skillBullets.slice(0, 5) }
  ];
}

async function fetchEmbedding(text: string) {
  const apiKey = process.env.HUGGINGFACE_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("Missing HUGGINGFACE_API_KEY");
  }
  const { data } = await axios.post<unknown>(
    HF_ENDPOINT,
    {
      inputs: text,
      options: {
        wait_for_model: true,
        use_cache: true
      }
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      timeout: 30_000
    }
  );
  const payload = normalizeEmbeddingPayload(data);
  const embedding = Array.isArray(payload[0]) ? (payload as number[][])[0] : (payload as number[]);
  return embedding.map((value) => Number(value));
}

function keywordInsights(resumeText: string, jobDescription: string) {
  const resumeDoc = nlp(resumeText);
  const jobDoc = nlp(jobDescription);
  const resumeKeywords = new Set(resumeDoc.nouns().out("array").map((word: string) => word.toLowerCase()));
  const jdKeywords = Array.from(
    new Set(jobDoc.nouns().out("array").map((word: string) => word.toLowerCase()))
  );
  const matched = jdKeywords.filter((keyword) => resumeKeywords.has(keyword));
  const missing = jdKeywords.filter((keyword) => !resumeKeywords.has(keyword));
  return { matched, missing };
}

function scoreSkillBuckets(resumeText: string, jobText: string, matched: string[], missing: string[]): SkillBreakdown {
  const lowerResume = resumeText.toLowerCase();
  const lowerJob = jobText.toLowerCase();

  const presence = (terms: string[], source: string) =>
    terms.reduce((score, term) => (source.includes(term) ? score + 1 : score), 0);

  const hardBase = presence(HARD_SKILL_CUES, lowerResume);
  const hardExpected = presence(HARD_SKILL_CUES, lowerJob) || 1;
  const softBase = presence(SOFT_SKILL_CUES, lowerResume);
  const softExpected = presence(SOFT_SKILL_CUES, lowerJob) || 1;

  const ratio = (value: number, expected: number) => Math.min(Math.round((value / expected) * 100), 100);

  const experienceScore = Math.min(Math.round((matched.length / (matched.length + missing.length + 1)) * 120), 100);

  const educationScore = lowerResume.includes("bachelor") || lowerResume.includes("master") ? 90 : 65;

  return {
    hardSkills: ratio(hardBase, hardExpected),
    softSkills: ratio(softBase, softExpected),
    experience: experienceScore,
    education: educationScore
  };
}

function buildRecommendations(result: AnalysisResult) {
  const recommendations = [...result.keywordInsights.missing].slice(0, 5).map((keyword) =>
    `Highlight how you address "${keyword}" because the job description prioritizes it. Provide a quantifiable bullet if possible.`
  );
  if (result.skillBreakdown.hardSkills < 70) {
    recommendations.push("Expand on your technical toolkit with concrete tools, frameworks, or certifications that map directly to the JD.");
  }
  if (result.skillBreakdown.softSkills < 70) {
    recommendations.push("Showcase leadership and collaboration outcomes with metrics (e.g., team size, cross-functional impact).");
  }
  if (!recommendations.length) {
    recommendations.push("Great alignment detected. Consider adding a concise summary statement tailored to the job title for extra context.");
  }
  return recommendations;
}

export async function analyzeResume({
  resumeBuffer,
  jobDescription,
  jobTitle,
  fileName
}: AnalyzeInput): Promise<AnalysisResult> {
  const cleanedJobDescription = sanitizeInput(jobDescription);
  const resumeText = await extractResumeText(resumeBuffer);
  const sections = segmentSections(resumeText);

  let matchScore = 0;

  try {
    const [resumeVector, jobVector] = await Promise.all([
      fetchEmbedding(resumeText),
      fetchEmbedding(cleanedJobDescription)
    ]);
    const similarity = (cosineSimilarity(resumeVector, jobVector) + 1) / 2;
    matchScore = Math.round(similarity * 100);
  } catch (error) {
    console.error(`Embedding API failed for ${HF_MODEL}, falling back to TF-IDF`, error);
    matchScore = tfIdfScore(resumeText, cleanedJobDescription);
  }

  const { matched, missing } = keywordInsights(resumeText, cleanedJobDescription);
  const skillBreakdown = scoreSkillBuckets(resumeText, cleanedJobDescription, matched, missing);

  const summary = `CareerAlign analyzed ${sections.size} resume sections and detected ${matched.length} aligned keywords for the ${jobTitle} role.`;

  const resumeSuggestions = buildResumeSuggestions({
    missing,
    matched,
    resumeText,
    jobDescription: cleanedJobDescription,
    jobTitle
  });

  const tailoredResume = craftTailoredResume({
    jobTitle,
    matched,
    missing,
    jobDescription: cleanedJobDescription
  });

  const analysis: AnalysisResult = {
    matchScore,
    jobTitle,
    resumeFileName: fileName,
    summary,
    keywordInsights: {
      matched,
      missing
    },
    skillBreakdown,
    recommendations: [],
    resumeSuggestions,
    tailoredResume
  };

  analysis.recommendations = buildRecommendations(analysis);
  return analysis;
}
