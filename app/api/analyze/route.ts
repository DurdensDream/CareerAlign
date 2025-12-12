import { NextResponse } from "next/server";
import { z } from "zod";
import { analyzeResume } from "@/lib/ai-service";
import { connectDB } from "@/lib/db";
import { AnalysisModel } from "@/models/Analysis";
import { sanitizeInput } from "@/lib/utils";

export const runtime = "nodejs";
export const maxDuration = 60;

const requestSchema = z.object({
  jobDescription: z.string().min(40, "Job description is too short."),
  jobTitle: z.string().min(2).max(80)
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const resume = formData.get("resume");
    const jobDescription = formData.get("jobDescription");
    const jobTitle = formData.get("jobTitle") ?? "General Role";

    if (!(resume instanceof File)) {
      return NextResponse.json({ success: false, message: "Resume PDF is required." }, { status: 400 });
    }

    if (resume.type !== "application/pdf") {
      return NextResponse.json({ success: false, message: "Only PDF resumes are supported." }, { status: 400 });
    }

    if (resume.size > 5 * 1024 * 1024) {
      return NextResponse.json({ success: false, message: "PDF must be under 5MB." }, { status: 400 });
    }

    const parsed = requestSchema.safeParse({
      jobDescription,
      jobTitle
    });

    if (!parsed.success) {
      return NextResponse.json({ success: false, message: parsed.error.errors[0]?.message }, { status: 400 });
    }

    const arrayBuffer = await resume.arrayBuffer();
    const resumeBuffer = Buffer.from(arrayBuffer);

    const analysis = await analyzeResume({
      resumeBuffer,
      jobDescription: parsed.data.jobDescription,
      jobTitle: sanitizeInput(parsed.data.jobTitle),
      fileName: resume.name
    });

    try {
      await connectDB();
      await AnalysisModel.create({
        fileName: analysis.resumeFileName,
        jobTitle: analysis.jobTitle,
        matchScore: analysis.matchScore,
        missingKeywords: analysis.keywordInsights.missing,
        matchedKeywords: analysis.keywordInsights.matched,
        recommendations: analysis.recommendations,
        resumeSuggestions: analysis.resumeSuggestions,
        tailoredResume: analysis.tailoredResume
      });
    } catch (dbError) {
      // Persisting is non-critical for the response; log but do not block the analysis payload.
      console.error("Failed to persist analysis result", dbError);
    }

    return NextResponse.json({ success: true, data: analysis });
  } catch (error) {
    console.error("Analyze API error", error);
    return NextResponse.json(
      {
        success: false,
        message: "We were unable to process this resume. Please try again in a few moments."
      },
      { status: 500 }
    );
  }
}
