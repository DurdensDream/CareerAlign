"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { ResumeUploader } from "@/components/ResumeUploader";
import { JobInput } from "@/components/JobInput";
import { AnalysisDashboard } from "@/components/AnalysisDashboard";
import { SkeletonLoader } from "@/components/SkeletonLoader";
import { AnalysisStepper } from "@/components/AnalysisStepper";
import { useAnalysisStore } from "@/lib/store";

export default function HomePage() {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [jobTitle, setJobTitle] = useState("AI Product Manager");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { analysis, setAnalysis, status, setStatus } = useAnalysisStore();

  const activeStep = useMemo(() => {
    switch (status) {
      case "upload":
        return 1;
      case "job":
        return 2;
      case "analyzing":
        return 3;
      case "insights":
        return 4;
      default:
        return 1;
    }
  }, [status]);

  const handleFileAccepted = (file: File) => {
    setUploading(true);
    setError(null);
    setResumeFile(file);
    setStatus("upload");
    setTimeout(() => {
      setUploading(false);
      setStatus("job");
    }, 600);
  };

  const handleAnalyze = async () => {
    if (!resumeFile) {
      setError("Please upload a PDF resume first.");
      return;
    }
    if (!jobDescription.trim()) {
      setError("Paste the target job description to continue.");
      return;
    }

    setStatus("analyzing");
    setError(null);

    try {
      const body = new FormData();
      body.append("resume", resumeFile);
      body.append("jobDescription", jobDescription);
      body.append("jobTitle", jobTitle || "General Role");

      const response = await fetch("/api/analyze", {
        method: "POST",
        body
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.message ?? "Unable to analyze resume.");
      }
      setAnalysis(payload.data);
      setStatus("insights");
    } catch (requestError) {
      console.error(requestError);
      setError(requestError instanceof Error ? requestError.message : "Unexpected error.");
      setStatus("job");
    }
  };

  const showSkeleton = status === "analyzing";

  return (
    <main className="mx-auto max-w-6xl space-y-10 px-4 py-12">
      <section className="grid gap-10 lg:grid-cols-2 lg:items-center">
        <div>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-flex items-center rounded-full border border-indigo-100 bg-white px-4 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-600">
              <Sparkles className="mr-2 h-4 w-4" /> Beat the ATS
            </span>
            <h1 className="mt-6 text-5xl font-semibold text-slate-900">
              Align your resume with <span className="text-indigo-600">AI precision</span>
            </h1>
            <p className="mt-4 text-lg text-slate-600">
              CareerAlign performs semantic matching between your resume and any job description, revealing actionable gaps, prioritized keywords, and AI guidance to land more interviews.
            </p>
          </motion.div>
        </div>
        <div className="glass-panel p-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pipeline</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">AI Analysis Journey</h2>
          <p className="mt-2 text-sm text-slate-500">Upload, contextualize, and get insights in less than a minute.</p>
          <div className="mt-6">
            <AnalysisStepper activeStep={activeStep} />
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <ResumeUploader
          onFileAccepted={handleFileAccepted}
          uploading={uploading}
          uploadedFileName={resumeFile?.name}
          error={error}
        />
        <JobInput
          jobDescription={jobDescription}
          jobTitle={jobTitle}
          onJobDescriptionChange={setJobDescription}
          onJobTitleChange={setJobTitle}
          onAnalyze={handleAnalyze}
          disabled={status === "analyzing"}
        />
      </section>

      {error && <p className="rounded-2xl border border-red-100 bg-red-50/60 p-4 text-sm text-red-600">{error}</p>}

      <section>
        {showSkeleton && <SkeletonLoader />}
        {!showSkeleton && analysis && <AnalysisDashboard analysis={analysis} />}
      </section>
    </main>
  );
}
