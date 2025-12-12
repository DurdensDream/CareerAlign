export interface SkillBreakdown {
  softSkills: number;
  hardSkills: number;
  experience: number;
  education: number;
}

export interface KeywordInsights {
  matched: string[];
  missing: string[];
}

export interface ResumeSuggestion {
  section: string;
  action: string;
  reason: string;
}

export interface TailoredResumeSection {
  title: string;
  bullets: string[];
}

export interface AnalysisResult {
  matchScore: number;
  jobTitle: string;
  resumeFileName: string;
  summary: string;
  keywordInsights: KeywordInsights;
  skillBreakdown: SkillBreakdown;
  recommendations: string[];
  resumeSuggestions: ResumeSuggestion[];
  tailoredResume: TailoredResumeSection[];
}
