import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface Step {
  label: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
}

export const Stepper = ({ steps, currentStep }: StepperProps) => {
  return (
    <ol className="flex items-start w-full">
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;

        return (
          <li
            key={step.label}
            className={cn(
              "flex w-full items-center",
              index !== steps.length - 1 && "after:content-[''] after:w-full after:h-1 after:border-b after:border-4 after:inline-block",
              isCompleted ? "after:border-primary" : "after:border-muted"
            )}
          >
            <div className="flex flex-col items-center justify-center w-24">
              <div
                className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-full lg:h-12 lg:w-12 shrink-0",
                  isCompleted ? "bg-primary text-primary-foreground" : isCurrent ? "border-2 border-primary bg-background text-primary" : "border bg-muted text-muted-foreground"
                )}
              >
                {isCompleted ? <Check className="w-5 h-5" /> : <span className="font-bold">{index + 1}</span>}
              </div>
              <p className={cn("font-medium mt-2 text-center text-sm", isCurrent ? "text-primary" : "text-muted-foreground")}>{step.label}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
};