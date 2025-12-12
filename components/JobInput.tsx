"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { ClipboardPaste } from "lucide-react";
import { Button } from "@/components/ui/button";

interface JobInputProps {
  jobDescription: string;
  jobTitle: string;
  onJobDescriptionChange: (value: string) => void;
  onJobTitleChange: (value: string) => void;
  onAnalyze: () => void;
  disabled?: boolean;
}

export function JobInput({
  jobDescription,
  jobTitle,
  onJobDescriptionChange,
  onJobTitleChange,
  onAnalyze,
  disabled
}: JobInputProps) {
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const autoResize = () => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = "auto";
      textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
    }
  };

  const handlePasteClick = async () => {
    try {
      const text = await navigator.clipboard.readText();
      onJobDescriptionChange(text);
      setTimeout(autoResize, 0);
    } catch (error) {
      console.error("Clipboard error", error);
    }
  };

  return (
    <div className="glass-panel p-6">
      <p className="mb-3 text-sm font-medium text-indigo-600">Step 2 · Paste Job Description</p>
      <div className="space-y-4">
        <label className="text-sm font-semibold text-slate-800" htmlFor="jobTitle">
          Target Job Title
        </label>
        <input
          id="jobTitle"
          value={jobTitle}
          onChange={(event) => onJobTitleChange(event.target.value)}
          placeholder="e.g., Senior Frontend Engineer"
          className="w-full rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-sm focus:border-indigo-300 focus:outline-none"
        />
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-slate-800" htmlFor="jobDescription">
            Full Job Description
          </label>
          <Button variant="ghost" type="button" onClick={handlePasteClick}>
            <ClipboardPaste className="mr-2 h-4 w-4" /> Paste
          </Button>
        </div>
        <textarea
          id="jobDescription"
          ref={textAreaRef}
          value={jobDescription}
          onChange={(event) => {
            onJobDescriptionChange(event.target.value);
            autoResize();
          }}
          placeholder="Paste the responsibilities, must-have skills, and nice-to-haves for the role."
          className="min-h-[180px] w-full resize-none rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-sm leading-relaxed focus:border-indigo-300 focus:outline-none"
        />
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Button className="w-full" onClick={onAnalyze} loading={disabled} disabled={disabled}>
            Run AI Analysis
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
