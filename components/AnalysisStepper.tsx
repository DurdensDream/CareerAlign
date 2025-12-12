import { cn } from "@/lib/utils";

const steps = [
  "Upload",
  "Job Description",
  "Analyzing",
  "Insights"
];

interface AnalysisStepperProps {
  activeStep: number;
}

export function AnalysisStepper({ activeStep }: AnalysisStepperProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      {steps.map((label, index) => {
        const stepNumber = index + 1;
        const state = stepNumber === activeStep ? "active" : stepNumber < activeStep ? "done" : "todo";
        return (
          <div key={label} className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold",
                state === "active" && "border-indigo-600 bg-indigo-600 text-white",
                state === "done" && "border-green-500 bg-green-500 text-white",
                state === "todo" && "border-slate-200 text-slate-400"
              )}
            >
              {stepNumber}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">{label}</p>
              <p className="text-xs text-slate-500">
                {state === "active" && "In progress"}
                {state === "done" && "Complete"}
                {state === "todo" && "Pending"}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
