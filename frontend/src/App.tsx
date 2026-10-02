import React, { useState, useEffect, useRef } from "react";
import { Navbar } from "./components/Navbar";
import { PipelineStages, PipelineStageId } from "./components/PipelineStages";
import { QueryInputSection } from "./components/QueryInputSection";
import { DecisionResult } from "./components/DecisionResult";
import { HowDidAiDecide } from "./components/HowDidAiDecide";
import { BackendDiagnosticsModal } from "./components/BackendDiagnosticsModal";
import { AnalysisResult, BackendStatus } from "./types";
import { AlertCircle, Shield, Sparkles, Terminal, Activity } from "lucide-react";

export default function App() {
  const [question, setQuestion] = useState(
    "What are the eligibility requirements for Khorana Program?"
  );
  const [userInfo, setUserInfo] = useState(
    "percentage=82, cgpa=8.2, age=20"
  );
  const [isLoading, setIsLoading] = useState(false);
  const [activeStage, setActiveStage] = useState<PipelineStageId>("evidence");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [backendStatus, setBackendStatus] = useState<BackendStatus | null>(null);
  const [isRefreshingStatus, setIsRefreshingStatus] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [auditTab, setAuditTab] = useState<"evidence" | "analysis" | "metta" | "decision">("evidence");

  const auditSectionRef = useRef<HTMLDivElement>(null);

  // Fetch backend status on mount
  const checkBackendStatus = async () => {
    setIsRefreshingStatus(true);
    try {
      const res = await fetch("/api/backend-status");
      if (res.ok) {
        const data = await res.json();
        setBackendStatus(data);
      }
    } catch {
      // Backend status unavailable
    } finally {
      setIsRefreshingStatus(false);
    }
  };

  useEffect(() => {
    checkBackendStatus();
  }, []);

  // Main pipeline execution
  const handleAnalyze = async () => {
    if (!question.trim() || !userInfo.trim()) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    // Progressive stage animation while waiting for backend
    setActiveStage("evidence");

    const stageTimer1 = setTimeout(() => {
      setActiveStage("analysis");
    }, 1400);

    const stageTimer2 = setTimeout(() => {
      setActiveStage("metta");
    }, 2800);

    const stageTimer3 = setTimeout(() => {
      setActiveStage("decision");
    }, 4200);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          question: question.trim(),
          user_info: userInfo.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.detail || "Analysis failed.");
      }

      setResult(data);
      setActiveStage("decision");
    } catch (err: any) {
      console.error("Execution error:", err);
      setError(err.message || "Failed to contact the decision agent.");
    } finally {
      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);
      clearTimeout(stageTimer3);
      setIsLoading(false);
    }
  };

  const handleStageSelect = (stageId: PipelineStageId) => {
    setAuditTab(stageId);
    if (auditSectionRef.current) {
      auditSectionRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col lab-grid">
      {/* Navbar */}
      <Navbar
        backendStatus={backendStatus}
        onOpenDiagnostics={() => setShowDiagnostics(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-500/20 text-xs font-mono text-cyan-300">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
            <span>Neuro-Symbolic Decision Intelligence</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black font-mono tracking-tight text-white uppercase">
            GLASS BOX <span className="text-cyan-400">AI</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-400 font-sans max-w-2xl mx-auto leading-relaxed">
            Eliminate black-box hallucinations. Grounded web search, structured LLM requirement
            extraction, and formal <span className="text-cyan-300 font-medium">Hyperon MeTTa</span> symbolic
            deduction for verifiable decision audit trails.
          </p>
        </div>

        {/* Pipeline Stages Tracker */}
        <PipelineStages
          isLoading={isLoading}
          activeStage={activeStage}
          hasResult={Boolean(result)}
          onSelectStage={handleStageSelect}
          selectedStage={auditTab}
        />

        {/* Question & User Info Input */}
        <QueryInputSection
          question={question}
          setQuestion={setQuestion}
          userInfo={userInfo}
          setUserInfo={setUserInfo}
          onAnalyze={handleAnalyze}
          isLoading={isLoading}
        />

        {/* Error Display */}
        {error && (
          <div className="p-4 sm:p-5 rounded-xl bg-rose-950/30 border border-rose-500/40 text-rose-300 text-sm font-mono flex items-start space-x-3 animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="font-bold">Evaluation Incomplete:</strong>
              <p className="text-rose-200 text-xs">{error}</p>
              <div className="pt-2">
                <button
                  onClick={() => setShowDiagnostics(true)}
                  className="text-xs text-cyan-400 underline hover:text-cyan-300 cursor-pointer"
                >
                  View Backend API Diagnostics & Key Configuration →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Decision Result Card */}
        {result && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <DecisionResult result={result} />

            {/* Collapsible Section: HOW DID AI DECIDE? */}
            <div ref={auditSectionRef}>
              <HowDidAiDecide
                result={result}
                defaultOpen={true}
                selectedTab={auditTab}
                onTabChange={setAuditTab}
              />
            </div>
          </div>
        )}
      </main>

      {/* Backend Diagnostics Modal */}
      <BackendDiagnosticsModal
        isOpen={showDiagnostics}
        onClose={() => setShowDiagnostics(false)}
        backendStatus={backendStatus}
        onRefresh={checkBackendStatus}
        isRefreshing={isRefreshingStatus}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-[#06080d] py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-400">
          <div className="flex items-center space-x-2">
            <span className="text-slate-200 font-semibold">GLASS BOX AI</span>
            <span>·</span>
            <span>Explainable AI Decision Agent</span>
          </div>

          <div className="flex items-center space-x-4 text-slate-400">
            <span>Tavily Search</span>
            <span>·</span>
            <span>ASI Cloud LLM</span>
            <span>·</span>
            <span>Hyperon MeTTa Symbolic Logic</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
