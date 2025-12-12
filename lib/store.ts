"use client";

import { create } from "zustand";
import type { AnalysisResult } from "@/lib/types";

interface AnalysisState {
  analysis: AnalysisResult | null;
  status: "idle" | "upload" | "job" | "analyzing" | "insights";
  setAnalysis: (analysis: AnalysisResult | null) => void;
  setStatus: (status: AnalysisState["status"]) => void;
}

export const useAnalysisStore = create<AnalysisState>((set) => ({
  analysis: null,
  status: "idle",
  setAnalysis: (analysis) => set({ analysis }),
  setStatus: (status) => set({ status })
}));
