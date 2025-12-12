import { Schema, model, models, type InferSchemaType } from "mongoose";

const AnalysisSchema = new Schema(
  {
    fileName: { type: String, required: true },
    jobTitle: { type: String, required: true },
    matchScore: { type: Number, required: true },
    missingKeywords: { type: [String], default: [] },
    matchedKeywords: { type: [String], default: [] },
    recommendations: { type: [String], default: [] },
    resumeSuggestions: {
      type: [
        new Schema(
          {
            section: String,
            action: String,
            reason: String
          },
          { _id: false }
        )
      ],
      default: []
    },
    tailoredResume: {
      type: [
        new Schema(
          {
            title: String,
            bullets: [String]
          },
          { _id: false }
        )
      ],
      default: []
    }
  },
  { timestamps: true }
);

export type AnalysisDocument = InferSchemaType<typeof AnalysisSchema>;

export const AnalysisModel = models.Analysis ?? model("Analysis", AnalysisSchema);
