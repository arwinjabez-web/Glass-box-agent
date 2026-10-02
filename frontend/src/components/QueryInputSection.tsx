import React, { useState } from "react";
import { Search, Sparkles, Sliders, ArrowRight, Loader2, RefreshCw, HelpCircle } from "lucide-react";

interface QueryInputSectionProps {
  question: string;
  setQuestion: (q: string) => void;
  userInfo: string;
  setUserInfo: (info: string) => void;
  onAnalyze: () => void;
  isLoading: boolean;
}

const PRESET_PROGRAMS = [
  {
    label: "Khorana Program",
    query: "What are the eligibility requirements for Khorana Program?",
    defaultInfo: "percentage=82, cgpa=8.2, age=20"
  },
  {
    label: "Engineering Scholarship",
    query: "minimum eligibility requirements for engineering scholarship India",
    defaultInfo: "percentage=78, income=250000, age=19"
  },
  {
    label: "University Attendance Rule",
    query: "minimum university attendance percentage requirement for semester exam",
    defaultInfo: "attendance=80, percentage=72"
  },
  {
    label: "DAAD Fellowship",
    query: "DAAD postgraduate fellowship minimum academic requirements",
    defaultInfo: "cgpa=8.5, percentage=85, year=2024"
  }
];

export const QueryInputSection: React.FC<QueryInputSectionProps> = ({
  question,
  setQuestion,
  userInfo,
  setUserInfo,
  onAnalyze,
  isLoading
}) => {
  const [showHelper, setShowHelper] = useState(false);

  // Helper to quickly append or update a key=value in the userInfo string
  const updateParam = (key: string, value: string | number) => {
    const pairs: Record<string, string> = {};
    for (const item of userInfo.split(",")) {
      if (item.includes("=")) {
        const [k, v] = item.split("=");
        pairs[k.trim().toLowerCase()] = v.trim();
      }
    }
    pairs[key.toLowerCase()] = String(value);

    const updated = Object.entries(pairs)
      .map(([k, v]) => `${k}=${v}`)
      .join(", ");
    setUserInfo(updated);
  };

  const handlePresetSelect = (preset: typeof PRESET_PROGRAMS[0]) => {
    setQuestion(preset.query);
    setUserInfo(preset.defaultInfo);
  };

  return (
    <div className="glass-panel-glow rounded-2xl p-5 sm:p-7 relative transition-all">
      <div className="space-y-6">
        {/* Preset Selector Bar */}
        <div className="flex flex-wrap items-center gap-2 pb-2">
          <span className="text-xs font-mono text-slate-400 flex items-center space-x-1 mr-1">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Benchmark Scenarios:</span>
          </span>
          {PRESET_PROGRAMS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => handlePresetSelect(preset)}
              className="text-xs font-mono px-2.5 py-1 rounded bg-slate-900/80 hover:bg-cyan-950/50 border border-slate-700/60 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer"
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Input 1: Question Input */}
        <div>
          <label className="block text-xs font-mono font-medium uppercase tracking-wider text-slate-300 mb-2">
            Target Program or Decision Inquiry
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-cyan-400 transition-colors">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g., What are the eligibility requirements for Khorana Program?"
              className="w-full pl-10 pr-4 py-3 bg-[#0a0d16]/90 border border-slate-700/70 focus:border-cyan-400 rounded-xl text-white placeholder-slate-500 text-sm font-sans focus:outline-none focus:ring-1 focus:ring-cyan-400/50 transition-all"
            />
          </div>
        </div>

        {/* Input 2: User Information Input */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-mono font-medium uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
              <span>Applicant Parameters</span>
              <button
                type="button"
                onClick={() => setShowHelper(!showHelper)}
                className="text-slate-400 hover:text-cyan-400 cursor-pointer transition-colors"
                title="Toggle Parameter Helpers"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            </label>
            <span className="text-[11px] font-mono text-slate-400">
              Format: <code className="text-cyan-300">key=value, key2=value2</code>
            </span>
          </div>

          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-cyan-400 transition-colors">
              <Sliders className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={userInfo}
              onChange={(e) => setUserInfo(e.target.value)}
              placeholder="e.g., percentage=82, cgpa=8.2, age=18, attendance=85"
              className="w-full pl-10 pr-4 py-3 bg-[#0a0d16]/90 border border-slate-700/70 focus:border-cyan-400 rounded-xl text-white placeholder-slate-500 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-cyan-400/50 transition-all"
            />
          </div>

          {/* Quick Param Adjuster Buttons */}
          <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs font-mono">
            <span className="text-slate-400 text-[11px] mr-1">Quick Adjust:</span>
            <button
              type="button"
              onClick={() => updateParam("percentage", 82)}
              className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
            >
              % = 82
            </button>
            <button
              type="button"
              onClick={() => updateParam("percentage", 70)}
              className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
            >
              % = 70
            </button>
            <button
              type="button"
              onClick={() => updateParam("cgpa", 8.2)}
              className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
            >
              CGPA = 8.2
            </button>
            <button
              type="button"
              onClick={() => updateParam("cgpa", 7.5)}
              className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
            >
              CGPA = 7.5
            </button>
            <button
              type="button"
              onClick={() => updateParam("age", 18)}
              className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
            >
              Age = 18
            </button>
            <button
              type="button"
              onClick={() => updateParam("attendance", 85)}
              className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
            >
              Attendance = 85
            </button>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-400 font-mono flex items-center space-x-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
            <span>Deterministic MeTTa deduction · Zero hallucinations</span>
          </div>

          <button
            type="button"
            onClick={onAnalyze}
            disabled={isLoading || !question.trim() || !userInfo.trim()}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-cyan-400 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-semibold text-sm font-sans flex items-center justify-center space-x-2.5 transition-all shadow-lg hover:shadow-cyan-500/25 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-[0.98]"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                <span>Running Neuro-Symbolic Agent...</span>
              </>
            ) : (
              <>
                <span>Analyze Eligibility</span>
                <ArrowRight className="w-4 h-4 text-slate-950" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
