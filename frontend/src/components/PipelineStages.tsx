import React from "react";
import { Search, Brain, Cpu, CheckCircle2, ChevronRight, Loader2 } from "lucide-react";

export type PipelineStageId = "evidence" | "analysis" | "metta" | "decision";

interface PipelineStagesProps {
  isLoading: boolean;
  activeStage?: PipelineStageId;
  hasResult: boolean;
  onSelectStage?: (stageId: PipelineStageId) => void;
  selectedStage?: PipelineStageId;
}

const STAGES: Array<{
  id: PipelineStageId;
  name: string;
  subtext: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    id: "evidence",
    name: "Web Evidence",
    subtext: "Tavily Search Engine",
    icon: Search
  },
  {
    id: "analysis",
    name: "AI Analysis",
    subtext: "ASI Cloud Requirement Extraction",
    icon: Brain
  },
  {
    id: "metta",
    name: "MeTTa Reasoning",
    subtext: "Hyperon Symbolic Logic",
    icon: Cpu
  },
  {
    id: "decision",
    name: "Final Decision",
    subtext: "Deterministic Synthesis",
    icon: CheckCircle2
  }
];

export const PipelineStages: React.FC<PipelineStagesProps> = ({
  isLoading,
  activeStage,
  hasResult,
  onSelectStage,
  selectedStage
}) => {
  return (
    <div className="w-full">
      <div className="glass-panel rounded-xl p-4 sm:p-5 relative overflow-hidden">
        {/* Subtle top indicator bar */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/80">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            <span className="text-xs font-mono font-medium uppercase tracking-wider text-slate-300">
              Neuro-Symbolic Execution Pipeline
            </span>
          </div>

          <span className="text-xs font-mono text-cyan-400/80">
            {isLoading
              ? "PIPELINE PROCESSING..."
              : hasResult
              ? "REASONING CHAIN VERIFIED"
              : "READY FOR INGESTION"}
          </span>
        </div>

        {/* 4 Connected Stages */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 relative">
          {STAGES.map((stage, idx) => {
            const Icon = stage.icon;
            const isCurrent = isLoading && activeStage === stage.id;
            const isCompleted = hasResult;
            const isSelected = selectedStage === stage.id;

            return (
              <div key={stage.id} className="relative group">
                <button
                  type="button"
                  onClick={() => onSelectStage && onSelectStage(stage.id)}
                  disabled={!hasResult}
                  className={`w-full text-left p-3.5 rounded-lg border transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? "bg-cyan-950/40 border-cyan-400/60 cyan-glow-subtle"
                      : isCurrent
                      ? "bg-cyan-950/30 border-cyan-500/50 cyan-glow"
                      : isCompleted
                      ? "bg-slate-900/60 border-cyan-500/20 hover:border-cyan-500/40 hover:bg-slate-800/50"
                      : "bg-slate-900/30 border-slate-800/60 opacity-60"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] font-mono font-bold text-slate-500">
                        0{idx + 1}
                      </span>
                      <div
                        className={`p-1.5 rounded-md ${
                          isCurrent
                            ? "bg-cyan-500/20 text-cyan-300"
                            : isCompleted
                            ? "bg-cyan-950/60 text-cyan-400"
                            : "bg-slate-800 text-slate-500"
                        }`}
                      >
                        {isCurrent ? (
                          <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                        ) : (
                          <Icon className="w-4 h-4" />
                        )}
                      </div>
                    </div>

                    {isCompleted && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    )}
                  </div>

                  <div className="text-sm font-semibold tracking-tight text-white group-hover:text-cyan-200 transition-colors">
                    {stage.name}
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 truncate mt-0.5">
                    {stage.subtext}
                  </div>
                </button>

                {/* Arrow connector between stages on desktop */}
                {idx < STAGES.length - 1 && (
                  <div className="hidden md:flex absolute -right-2 top-1/2 -translate-y-1/2 z-10 text-slate-600 pointer-events-none">
                    <ChevronRight className="w-4 h-4 text-cyan-500/40" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
