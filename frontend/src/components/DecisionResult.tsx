import React from "react";
import { CheckCircle2, XCircle, AlertTriangle, Shield, Check, X, AlertCircle } from "lucide-react";
import { AnalysisResult } from "../types";

interface DecisionResultProps {
  result: AnalysisResult;
}

export const DecisionResult: React.FC<DecisionResultProps> = ({ result }) => {
  const isEligible = result.decision === "ELIGIBLE";
  const isNotEligible = result.decision === "NOT ELIGIBLE";
  const isUnknown = result.decision.includes("CANNOT") || result.decision.includes("UNKNOWN");

  return (
    <div className="w-full transition-all">
      <div
        className={`rounded-2xl p-6 sm:p-8 border transition-all ${
          isEligible
            ? "bg-[#0b1613]/90 border-emerald-500/30 emerald-glow"
            : isNotEligible
            ? "bg-[#180d11]/90 border-rose-500/30 rose-glow"
            : "bg-[#16120c]/90 border-amber-500/30 amber-glow"
        }`}
      >
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
          <div className="flex items-center space-x-4">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center border ${
                isEligible
                  ? "bg-emerald-500/20 border-emerald-400/40 text-emerald-400"
                  : isNotEligible
                  ? "bg-rose-500/20 border-rose-400/40 text-rose-400"
                  : "bg-amber-500/20 border-amber-400/40 text-amber-400"
              }`}
            >
              {isEligible ? (
                <CheckCircle2 className="w-7 h-7" />
              ) : isNotEligible ? (
                <XCircle className="w-7 h-7" />
              ) : (
                <AlertTriangle className="w-7 h-7" />
              )}
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                  Target Program
                </span>
                <span className="text-slate-600">·</span>
                <span className="text-xs font-mono text-cyan-400 font-medium">
                  {result.target}
                </span>
              </div>
              <h2
                className={`text-2xl sm:text-3xl font-bold tracking-tight font-mono mt-0.5 ${
                  isEligible
                    ? "text-emerald-400"
                    : isNotEligible
                    ? "text-rose-400"
                    : "text-amber-400"
                }`}
              >
                {result.decision}
              </h2>
            </div>
          </div>

          <div className="sm:text-right">
            <span className="text-xs font-mono text-slate-400 block">
              Inference Engine
            </span>
            <span className="text-xs font-mono text-slate-300">
              {result._engine || "Hyperon MeTTa + ASI Cloud"}
            </span>
          </div>
        </div>

        {/* Concise Explanation */}
        <div className="py-5">
          <p className="text-base text-slate-200 leading-relaxed font-sans">
            {result.concise_explanation}
          </p>
        </div>

        {/* Condition Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Passed Conditions */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-emerald-500/20 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono font-medium text-emerald-400 pb-2 border-b border-slate-800">
              <span className="flex items-center space-x-1.5">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Passed Conditions ({result.passed_reasons.length})</span>
              </span>
            </div>

            {result.passed_reasons.length > 0 ? (
              <ul className="space-y-2 text-sm text-slate-300">
                {result.passed_reasons.map((reason, idx) => (
                  <li key={idx} className="flex items-start space-x-2 text-xs font-mono leading-relaxed">
                    <span className="text-emerald-400 font-bold mt-0.5">✓</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs font-mono text-slate-500 italic">
                No verified conditions met the qualifying threshold.
              </p>
            )}
          </div>

          {/* Failed Conditions */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-rose-500/20 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono font-medium text-rose-400 pb-2 border-b border-slate-800">
              <span className="flex items-center space-x-1.5">
                <X className="w-4 h-4 text-rose-400" />
                <span>Failed Conditions ({result.failed_reasons.length})</span>
              </span>
            </div>

            {result.failed_reasons.length > 0 ? (
              <ul className="space-y-2 text-sm text-slate-300">
                {result.failed_reasons.map((reason, idx) => (
                  <li key={idx} className="flex items-start space-x-2 text-xs font-mono leading-relaxed">
                    <span className="text-rose-400 font-bold mt-0.5">✗</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs font-mono text-slate-500 italic">
                Zero failed conditions detected in evaluated groups.
              </p>
            )}
          </div>
        </div>

        {/* Unknown / Missing Parameters (if any) */}
        {result.unknown_reasons && result.unknown_reasons.length > 0 && (
          <div className="mt-4 p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-2">
            <div className="flex items-center space-x-2 text-xs font-mono text-amber-400 font-semibold">
              <AlertCircle className="w-4 h-4" />
              <span>Missing Information Needed for Full Verification</span>
            </div>
            <ul className="space-y-1.5 pl-6 list-disc text-xs font-mono text-amber-200/90">
              {result.unknown_reasons.map((u, i) => (
                <li key={i}>{u}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
