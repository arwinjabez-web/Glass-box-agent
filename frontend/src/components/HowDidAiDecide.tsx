import React, { useState } from "react";
import { 
  ChevronDown, 
  ChevronUp, 
  Search, 
  Brain, 
  Cpu, 
  CheckCircle2, 
  ExternalLink, 
  Copy, 
  Check, 
  Terminal, 
  Info,
  ShieldCheck,
  FileCode
} from "lucide-react";
import { AnalysisResult } from "../types";

interface HowDidAiDecideProps {
  result: AnalysisResult;
  defaultOpen?: boolean;
  selectedTab?: "evidence" | "analysis" | "metta" | "decision";
  onTabChange?: (tab: "evidence" | "analysis" | "metta" | "decision") => void;
}

export const HowDidAiDecide: React.FC<HowDidAiDecideProps> = ({
  result,
  defaultOpen = true,
  selectedTab: controlledTab,
  onTabChange
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [internalTab, setInternalTab] = useState<"evidence" | "analysis" | "metta" | "decision">("evidence");
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const activeTab = controlledTab || internalTab;
  const setActiveTab = (tab: "evidence" | "analysis" | "metta" | "decision") => {
    setInternalTab(tab);
    if (onTabChange) onTabChange(tab);
  };

  const handleCopy = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  return (
    <div className="glass-panel rounded-2xl overflow-hidden border border-cyan-500/20 transition-all">
      {/* Collapsible Header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-5 bg-[#090d18]/90 hover:bg-[#0c1222] flex items-center justify-between transition-colors cursor-pointer border-b border-slate-800"
      >
        <div className="flex items-center space-x-3 text-left">
          <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold font-mono tracking-wide text-white flex items-center space-x-2">
              <span>HOW DID AI DECIDE?</span>
              <span className="text-xs font-normal text-cyan-400/90 font-mono hidden sm:inline">
                [EXPLAINABLE AUDIT TRAIL]
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Inspect the 4 verification layers: Web Evidence · AI Extraction · MeTTa Logic · Decision Graph
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <span className="text-xs font-mono text-cyan-400 font-medium hidden sm:inline">
            {isOpen ? "COLLAPSE AUDIT" : "EXPAND AUDIT"}
          </span>
          <div className="p-1 rounded bg-slate-800 text-slate-300">
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </button>

      {/* Collapsible Content */}
      {isOpen && (
        <div className="p-5 sm:p-7 space-y-6">
          {/* 4 Navigation Tabs */}
          <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
            <button
              type="button"
              onClick={() => setActiveTab("evidence")}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                activeTab === "evidence"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 font-semibold"
                  : "bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>1. Web Evidence ({result.web_evidence.results.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("analysis")}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                activeTab === "analysis"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 font-semibold"
                  : "bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
            >
              <Brain className="w-3.5 h-3.5" />
              <span>2. AI Requirement Extraction</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("metta")}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                activeTab === "metta"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 font-semibold"
                  : "bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>3. MeTTa Logical Reasoning ({result.metta_reasoning.expressions.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("decision")}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                activeTab === "decision"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 font-semibold"
                  : "bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>4. Final Decision Synthesis</span>
            </button>
          </div>

          {/* TAB 1: WEB EVIDENCE */}
          {activeTab === "evidence" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold font-mono text-cyan-300 uppercase tracking-wide">
                    Live Web Evidence Gathered by Tavily Search
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Official authoritative sources fetched in real time with advanced query depth.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopy(result.web_evidence.formatted_evidence, "evidence")}
                  className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-xs font-mono text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer"
                >
                  {copiedSection === "evidence" ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy Full Evidence</span>
                    </>
                  )}
                </button>
              </div>

              {/* Sources Cards */}
              <div className="space-y-3">
                {result.web_evidence.results.map((src, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl bg-[#0b0e17]/80 border border-slate-800 hover:border-cyan-500/30 transition-all space-y-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-[11px] font-mono text-cyan-400 font-bold bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/40">
                          SOURCE 0{i + 1}
                        </span>
                        <h5 className="text-sm font-medium text-slate-200">
                          {src.title}
                        </h5>
                      </div>

                      {src.url && (
                        <a
                          href={src.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center space-x-1 text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors shrink-0"
                        >
                          <span>Visit Source</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                    <p className="text-xs font-mono text-slate-400 leading-relaxed bg-[#06080e] p-3 rounded-lg border border-slate-900 whitespace-pre-wrap">
                      {src.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: AI REQUIREMENT EXTRACTION */}
          {activeTab === "analysis" && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold font-mono text-cyan-300 uppercase tracking-wide">
                    ASI Cloud Requirement Extraction (Minimax-m3)
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Unstructured legal / qualification text converted into deterministic AND / OR groups.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    handleCopy(
                      JSON.stringify(result.extracted_requirements, null, 2),
                      "json"
                    )
                  }
                  className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-xs font-mono text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer"
                >
                  {copiedSection === "json" ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>Copied JSON</span>
                    </>
                  ) : (
                    <>
                      <FileCode className="w-3 h-3" />
                      <span>Copy Extracted JSON</span>
                    </>
                  )}
                </button>
              </div>

              {/* Requirement Groups Visualizer */}
              <div className="space-y-4">
                {result.extracted_requirements.groups.map((grp, gIdx) => (
                  <div
                    key={gIdx}
                    className="p-4 rounded-xl bg-[#0b0e17]/80 border border-slate-800 space-y-3"
                  >
                    <div className="flex items-center space-x-2 text-xs font-mono">
                      <span className="text-slate-400 font-semibold">Group {gIdx + 1}:</span>
                      <span
                        className={`px-2 py-0.5 rounded font-bold ${
                          grp.logic.toUpperCase() === "OR"
                            ? "bg-amber-950/60 text-amber-300 border border-amber-800/40"
                            : "bg-blue-950/60 text-blue-300 border border-blue-800/40"
                        }`}
                      >
                        {grp.logic.toUpperCase()} GROUP
                      </span>
                      <span className="text-slate-400">
                        {grp.logic.toUpperCase() === "OR"
                          ? "· At least one condition must be satisfied"
                          : "· All conditions must be strictly satisfied"}
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs font-mono">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-400">
                            <th className="pb-2 font-medium">Field</th>
                            <th className="pb-2 font-medium">Operator</th>
                            <th className="pb-2 font-medium">Required Value</th>
                            <th className="pb-2 font-medium">Description</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 text-slate-300">
                          {grp.requirements.map((req, rIdx) => (
                            <tr key={rIdx} className="hover:bg-slate-900/40">
                              <td className="py-2 text-cyan-300 font-semibold">{req.field}</td>
                              <td className="py-2 text-amber-300 font-bold">{req.operator}</td>
                              <td className="py-2 text-emerald-300">{String(req.required_value)}</td>
                              <td className="py-2 text-slate-400">{req.description}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>

              {/* Raw JSON Accordion / Preview */}
              <div className="space-y-2">
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block">
                  Raw ASI Cloud JSON Schema:
                </span>
                <pre className="p-4 rounded-xl bg-[#05070c] border border-slate-800 text-xs font-mono text-cyan-300/90 overflow-x-auto">
                  {JSON.stringify(result.extracted_requirements, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 3: METTA LOGICAL REASONING */}
          {activeTab === "metta" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-500/20 flex items-start space-x-3">
                <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-300 leading-relaxed font-sans">
                  <strong className="font-semibold text-cyan-300">Why MeTTa (Hyperon)? </strong>
                  Instead of allowing an LLM to hallucinate or guess numerical comparisons, Glass Box AI compiles
                  each user attribute into a formal MeTTa symbolic expression executed in an atomspace:
                  <code className="text-cyan-300 ml-1 font-mono text-[11px]">{`!(if (>= user required) "PASS" "FAIL")`}</code>.
                  This ensures 100% deterministic, mathematically sound verification.
                </div>
              </div>

              {/* MeTTa Expressions Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#090d18]">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="bg-slate-900/90 text-slate-400 border-b border-slate-800">
                      <th className="p-3">MeTTa Symbolic Query</th>
                      <th className="p-3">User Input</th>
                      <th className="p-3">Requirement</th>
                      <th className="p-3 text-right">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {result.metta_reasoning.expressions.map((expr, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40">
                        <td className="p-3 font-semibold text-cyan-300">
                          <code>{expr.expression}</code>
                        </td>
                        <td className="p-3 text-slate-200">
                          {expr.user_value !== null ? (
                            <span>
                              {expr.field} = <strong className="text-white">{String(expr.user_value)}</strong>
                            </span>
                          ) : (
                            <span className="text-amber-400 italic">Not Provided</span>
                          )}
                        </td>
                        <td className="p-3 text-slate-300">
                          {expr.operator} {String(expr.required_value)}
                        </td>
                        <td className="p-3 text-right">
                          <span
                            className={`px-2 py-0.5 rounded font-bold ${
                              expr.status === "PASS"
                                ? "bg-emerald-950/80 text-emerald-400 border border-emerald-800/50"
                                : expr.status === "FAIL"
                                ? "bg-rose-950/80 text-rose-400 border border-rose-800/50"
                                : "bg-amber-950/80 text-amber-400 border border-amber-800/50"
                            }`}
                          >
                            {expr.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: FINAL DECISION SYNTHESIS */}
          {activeTab === "decision" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <h4 className="text-sm font-semibold font-mono text-cyan-300 uppercase tracking-wide">
                Deterministic Decision Logic Graph
              </h4>

              <div className="space-y-3">
                {result.group_evaluations.map((grp, i) => {
                  const isOr = grp.logic.toUpperCase() === "OR";
                  const groupPassed = isOr
                    ? grp.requirements.some((r) => r.status === "PASS")
                    : grp.requirements.every((r) => r.status === "PASS");

                  return (
                    <div
                      key={i}
                      className={`p-4 rounded-xl border ${
                        groupPassed
                          ? "bg-emerald-950/15 border-emerald-500/30"
                          : "bg-rose-950/15 border-rose-500/30"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-mono font-bold text-slate-300">
                            Logical Evaluation Group #{grp.group_index + 1}
                          </span>
                          <span className="text-xs font-mono text-cyan-400 font-semibold">
                            [{grp.logic}]
                          </span>
                        </div>
                        <span
                          className={`text-xs font-mono font-bold ${
                            groupPassed ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {groupPassed ? "GROUP SATISFIED (TRUE)" : "GROUP UNSATISFIED (FALSE)"}
                        </span>
                      </div>

                      <div className="space-y-2">
                        {grp.requirements.map((req, rIdx) => (
                          <div
                            key={rIdx}
                            className="flex items-center justify-between text-xs font-mono p-2 rounded bg-slate-900/60"
                          >
                            <span className="text-slate-300">
                              {req.description}: {String(req.user_value)} {req.operator} {String(req.required)}
                            </span>
                            <span
                              className={`font-bold ${
                                req.status === "PASS"
                                  ? "text-emerald-400"
                                  : req.status === "FAIL"
                                  ? "text-rose-400"
                                  : "text-amber-400"
                              }`}
                            >
                              {req.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Synthesis Summary */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block">
                  Final Boolean Evaluation:
                </span>
                <p className="text-sm font-mono text-slate-200">
                  {result.decision === "ELIGIBLE"
                    ? "✓ All required conjunctive clauses (AND) and disjunctive alternatives (OR) evaluated to TRUE."
                    : "✗ One or more non-negotiable clauses evaluated to FALSE or INCOMPLETE."}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
