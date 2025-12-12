"use client";

import { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ResumeUploaderProps {
  onFileAccepted: (file: File) => void;
  uploading: boolean;
  uploadedFileName?: string;
  error?: string | null;
}

export function ResumeUploader({ onFileAccepted, uploading, uploadedFileName, error }: ResumeUploaderProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (uploading) {
      setProgress(15);
      const timer = setInterval(() => {
        setProgress((prev) => (prev < 90 ? prev + 10 : prev));
      }, 200);
      return () => clearInterval(timer);
    }
    if (!uploading && progress) {
      setProgress(100);
      const timeout = setTimeout(() => setProgress(0), 600);
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [uploading, progress]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles?.[0]) {
        onFileAccepted(acceptedFiles[0]);
      }
    },
    [onFileAccepted]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1
  });

  return (
    <div className="glass-panel p-6">
      <p className="mb-3 text-sm font-medium text-indigo-600">Step 1 · Upload Resume</p>
      <div
        {...getRootProps()}
        className="gradient-border relative flex h-48 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/60 text-center transition hover:border-indigo-300"
      >
        <input {...getInputProps()} />
        <UploadCloud className="mb-4 h-10 w-10 text-indigo-600" />
        <p className="text-lg font-semibold text-slate-900">Drag & Drop your PDF</p>
        <p className="text-sm text-slate-500">or click to browse · Max 5MB</p>
        <AnimatePresence>
          {isDragActive && (
            <motion.div
              className="absolute inset-0 rounded-2xl bg-indigo-50/80"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
          )}
        </AnimatePresence>
      </div>

      {progress > 0 && (
        <div className="mt-4 h-2 w-full rounded-full bg-slate-100">
          <motion.div
            className="h-full rounded-full bg-indigo-600"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ ease: "easeOut", duration: 0.4 }}
          />
        </div>
      )}

      <div className="mt-4 flex items-center justify-between">
        <div>
          {uploadedFileName ? (
            <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
              <CheckCircle2 className="h-4 w-4 text-green-500" /> {uploadedFileName}
            </div>
          ) : (
            <p className="text-sm text-slate-500">PDFs are parsed securely on the server.</p>
          )}
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
        <Button variant="ghost" type="button">
          Need tips?
        </Button>
      </div>
    </div>
  );
}
