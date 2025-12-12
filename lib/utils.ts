import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function sanitizeInput(text: string) {
  return text.replace(/[\u0000-\u001F\u007F$<>`-]/g, " ").replace(/\s+/g, " ").trim();
}

export function normalizeVector(vector: number[]) {
  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
  if (!magnitude) {
    return vector.map(() => 0);
  }
  return vector.map((value) => value / magnitude);
}

export function cosineSimilarity(vectorA: number[], vectorB: number[]) {
  if (!vectorA.length || !vectorB.length || vectorA.length !== vectorB.length) {
    return 0;
  }
  const normalizedA = normalizeVector(vectorA);
  const normalizedB = normalizeVector(vectorB);
  const dotProduct = normalizedA.reduce((sum, value, index) => sum + value * normalizedB[index], 0);
  return Math.min(Math.max(dotProduct, -1), 1);
}

const tokenizer = /[A-Za-z][A-Za-z+\-#]+/g;

function termFrequency(text: string) {
  const counts = new Map<string, number>();
  const tokens = text.toLowerCase().match(tokenizer) ?? [];
  tokens.forEach((token) => counts.set(token, (counts.get(token) ?? 0) + 1));
  return { counts, tokens };
}

export function tfIdfScore(resumeText: string, jobText: string) {
  const { counts: resumeCounts, tokens: resumeTokens } = termFrequency(resumeText);
  const { counts: jobCounts } = termFrequency(jobText);
  const vocabulary = new Set([...resumeTokens, ...(jobText.toLowerCase().match(tokenizer) ?? [])]);

  let numerator = 0;
  let resumeMagnitude = 0;
  let jobMagnitude = 0;

  vocabulary.forEach((term) => {
    const tfResume = resumeCounts.get(term) ?? 0;
    const tfJob = jobCounts.get(term) ?? 0;
    if (!tfResume && !tfJob) {
      return;
    }
    const idf = Math.log(1 + vocabulary.size / (1 + (tfResume > 0 ? 1 : 0) + (tfJob > 0 ? 1 : 0)));
    const weightedResume = tfResume * idf;
    const weightedJob = tfJob * idf;
    numerator += weightedResume * weightedJob;
    resumeMagnitude += weightedResume * weightedResume;
    jobMagnitude += weightedJob * weightedJob;
  });

  if (!resumeMagnitude || !jobMagnitude) {
    return 0;
  }

  const similarity = numerator / (Math.sqrt(resumeMagnitude) * Math.sqrt(jobMagnitude));
  return Math.round(Math.min(Math.max(similarity, 0), 1) * 100);
}
