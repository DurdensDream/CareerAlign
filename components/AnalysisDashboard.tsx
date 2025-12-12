"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer
} from "recharts";
import type { AnalysisResult } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface AnalysisDashboardProps {
  analysis: AnalysisResult;
}

type SkillKey = keyof AnalysisResult["skillBreakdown"];

const skillMeta: Record<SkillKey, { label: string; gradient: string; hint: string }> = {
  hardSkills: {
    label: "Hard skill depth",
    gradient: "from-amber-400 to-amber-500",
    hint: "Tooling & technical fluency"
  },
  softSkills: {
    label: "Soft skill signal",
    gradient: "from-emerald-400 to-emerald-500",
    hint: "Leadership & communication"
  },
  experience: {
    label: "Experience evidence",
    gradient: "from-sky-400 to-sky-500",
    hint: "Narrative + delivery arc"
  },
  education: {
    label: "Education strength",
    gradient: "from-slate-400 to-slate-500",
    hint: "Academic credibility"
  }
};

function scoreColor(score: number) {
  if (score < 50) return "#f97316";
  if (score < 75) return "#fb923c";
  return "#10b981";
}

export function AnalysisDashboard({ analysis }: AnalysisDashboardProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const animation = requestAnimationFrame(() => setAnimatedScore(analysis.matchScore));
    return () => cancelAnimationFrame(animation);
  }, [analysis.matchScore]);

  const radialData = [{ name: "Match", value: animatedScore, fill: scoreColor(animatedScore) }];
  const radarData = Object.entries(analysis.skillBreakdown).map(([key, value]) => ({
    metric: key,
    score: value
  }));
  const heroMatched = analysis.keywordInsights.matched.slice(0, 4);
  const heroGaps = analysis.keywordInsights.missing.slice(0, 4);
  const highlightStats = [
    {
      label: "Hard-skill readiness",
      value: `${analysis.skillBreakdown.hardSkills}%`,
      hint: "Tools + systems referenced"
    },
    {
      label: "Soft-skill signal",
      value: `${analysis.skillBreakdown.softSkills}%`,
      hint: "Leadership + influence"
    },
    { label: "Keyword overlaps", value: `${analysis.keywordInsights.matched.length}`, hint: "Unique JD matches" }
  ];

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-[#04131f] via-[#0c3b4b] to-[#0d6d62] p-8 text-white shadow-[0_60px_140px_rgba(4,19,31,0.45)]">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 25% 20%, rgba(255,255,255,0.45), transparent 35%), radial-gradient(circle at 80% 0%, rgba(255,255,255,0.25), transparent 40%)"
          }}
        />
        <div className="relative z-10 flex flex-col gap-10 lg:flex-row lg:items-center">
          <div className="flex-1 space-y-4">
            <p className="text-xs uppercase tracking-[0.35em] text-white/60">Analysis prepared for</p>
            <h2 className="text-3xl font-semibold tracking-tight text-white">{analysis.jobTitle}</h2>
            <p className="text-base text-white/85">{analysis.summary}</p>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-white/60">Signals nailed</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {heroMatched.length ? (
                    heroMatched.map((keyword) => (
                      <Badge key={keyword} className="border-white/40 bg-white/10 text-white" variant="success">
                        {keyword}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-white/70">Upload another resume to detect overlaps.</p>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-white/60">Urgent gaps</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {heroGaps.length ? (
                    heroGaps.map((keyword) => (
                      <Badge key={keyword} className="border-white/40 bg-white/10 text-white" variant="danger">
                        {keyword}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-white/70">No blocking gaps detected.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="w-full rounded-3xl bg-white/10 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.25)] backdrop-blur-2xl lg:w-80">
            <p className="text-xs uppercase tracking-[0.35em] text-white/60">Match score</p>
            <div className="mt-2 flex items-end gap-4">
              <motion.span
                key={analysis.matchScore}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-6xl font-semibold tracking-tight"
              >
                {analysis.matchScore}%
              </motion.span>
              <span className="text-sm text-white/70">vs JD semantic signal</span>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {highlightStats.map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-white/60">{stat.label}</p>
                  <p className="text-2xl font-semibold text-white">{stat.value}</p>
                  <p className="text-[0.65rem] text-white/70">{stat.hint}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="col-span-1">
          <CardHeader className="space-y-1">
            <CardTitle className="text-base text-slate-900">Match Arc</CardTitle>
            <p className="text-sm text-slate-500">Semantic similarity vs. JD</p>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart data={radialData} innerRadius="55%" outerRadius="95%" startAngle={90} endAngle={-270}>
                  <RadialBar minAngle={15} clockWise dataKey="value" cornerRadius={24} />
                  <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-sm text-slate-500">Higher arcs mean stronger contextual overlap.</p>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader className="space-y-1">
            <CardTitle className="text-base text-slate-900">Skills Radar</CardTitle>
            <p className="text-sm text-slate-500">Balance vs. JD emphasis</p>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} outerRadius={100}>
                  <PolarGrid stroke="#e2e8f0" strokeDasharray="4 4" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: "#475569", fontSize: 12 }} />
                  <Radar name="Resume" dataKey="score" stroke="#0d9488" fill="#14b8a6" fillOpacity={0.45} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader className="space-y-1">
            <CardTitle className="text-base text-slate-900">Capability Momentum</CardTitle>
            <p className="text-sm text-slate-500">Where to double down</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              {(Object.keys(skillMeta) as SkillKey[]).map((key) => {
                const meta = skillMeta[key];
                const value = analysis.skillBreakdown[key];
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between text-sm font-medium text-slate-600">
                      <span>{meta.label}</span>
                      <span>{value}%</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-slate-100">
                      <div className={`h-full rounded-full bg-gradient-to-r ${meta.gradient}`} style={{ width: `${value}%` }} />
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{meta.hint}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader className="space-y-1">
            <CardTitle className="text-base text-slate-900">Keyword Intelligence</CardTitle>
            <p className="text-sm text-slate-500">Matched vs. missing signal phrases</p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <p className="mb-3 text-sm font-semibold text-emerald-700">Matched Skills</p>
                <div className="flex flex-wrap gap-2">
                  {analysis.keywordInsights.matched.slice(0, 24).map((keyword) => (
                    <Badge key={keyword} variant="success">
                      {keyword}
                    </Badge>
                  ))}
                  {!analysis.keywordInsights.matched.length && (
                    <p className="text-sm text-slate-500">No overlaps yet. Add JD terminology to your bullets.</p>
                  )}
                </div>
              </div>
              <div>
                <p className="mb-3 text-sm font-semibold text-rose-600">Gaps to Close</p>
                <div className="flex flex-wrap gap-2">
                  {analysis.keywordInsights.missing.slice(0, 24).map((keyword) => (
                    <Badge key={keyword} variant="danger">
                      {keyword}
                    </Badge>
                  ))}
                  {!analysis.keywordInsights.missing.length && <p className="text-sm text-slate-500">No major gaps detected.</p>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader className="space-y-1">
            <CardTitle className="text-base text-slate-900">AI Recommendations</CardTitle>
            <p className="text-sm text-slate-500">Action items to boost alignment</p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm text-slate-700">
              {analysis.recommendations.map((recommendation) => (
                <li
                  key={recommendation}
                  className="rounded-2xl border border-slate-100 bg-gradient-to-br from-[#fef9f1] to-white p-3 shadow-[0_15px_35px_rgba(15,23,42,0.08)]"
                >
                  {recommendation}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-base text-slate-900">Resume Fixes</CardTitle>
            <p className="text-sm text-slate-500">Specific edits to make next</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analysis.resumeSuggestions.length ? (
                analysis.resumeSuggestions.map((suggestion, index) => (
                  <div
                    key={`${suggestion.section}-${index}`}
                    className="rounded-2xl border border-slate-100/70 bg-white/90 p-4 shadow-[0_20px_45px_rgba(15,23,42,0.08)]"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">{suggestion.section}</p>
                    <p className="mt-1 font-medium text-slate-900">{suggestion.action}</p>
                    <p className="mt-1 text-sm text-slate-500">{suggestion.reason}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No edits detected. Upload another resume to compare.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-base text-slate-900">Tailored Resume Draft</CardTitle>
            <p className="text-sm text-slate-500">Ready-to-edit talking points for this role</p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-5 md:grid-cols-2">
              {analysis.tailoredResume.length ? (
                analysis.tailoredResume.map((section, sectionIndex) => (
                  <div
                    key={`${section.title}-${sectionIndex}`}
                    className="flex flex-col rounded-3xl border border-slate-100 bg-white/80 p-4 shadow-[0_25px_60px_rgba(15,23,42,0.08)]"
                  >
                    <p className="text-sm font-semibold text-[#0d6d62]">{section.title}</p>
                    <ul className="mt-3 space-y-2 text-sm text-slate-700">
                      {section.bullets.map((bullet, bulletIndex) => (
                        <li key={`${section.title}-${bulletIndex}`} className="flex items-start gap-2">
                          <span className="mt-1 h-2 w-2 rounded-full bg-[#f97316]" />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">Tailored talking points will appear after your first analysis.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
