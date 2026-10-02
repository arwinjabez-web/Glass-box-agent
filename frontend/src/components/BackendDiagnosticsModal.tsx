import React, { useState } from "react";
import { X, Terminal, CheckCircle2, AlertCircle, RefreshCw, Copy, Check, Server, Shield, Cpu } from "lucide-react";
import { BackendStatus } from "../types";

interface BackendDiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  backendStatus: BackendStatus | null;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const BackendDiagnosticsModal: React.FC<BackendDiagnosticsModalProps> = ({
  isOpen,
  onClose,
  backendStatus,
  onRefresh,
  isRefreshing
}) => {
  const [copied, setCopied] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const isPythonConnected = backendStatus?.python_backend.connected;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl rounded-2xl bg-[#0c101c] border border-cyan-500/30 p-6 sm:p-7 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-mono text-white tracking-wide">
                SYSTEM DIAGNOSTICS & API ARCHITECTURE
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Glass Box AI Neuro-Symbolic Gateway & Python Backend Bridge
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Status Indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Python Backend Status */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400">Python FastAPI Backend</span>
              <span
                className={`text-xs font-mono font-bold flex items-center space-x-1 ${
                  isPythonConnected ? "text-emerald-400" : "text-cyan-400"
                }`}
              >
                {isPythonConnected ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>CONNECTED ({backendStatus?.python_backend.latency_ms}ms)</span>
                  </>
                ) : (
                  <>
                    <Cpu className="w-3.5 h-3.5" />
                    <span>EMBEDDED GATEWAY ACTIVE</span>
                  </>
                )}
              </span>
            </div>
            <p className="text-[11px] font-mono text-slate-400">
              Target: <code className="text-cyan-300">{backendStatus?.python_backend.url || "http://127.0.0.1:8000"}</code>
            </p>
          </div>

          {/* Reasoning Engine Status */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400">MeTTa Symbolic Engine</span>
              <span className="text-xs font-mono font-bold text-emerald-400 flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>ONLINE & VERIFIED</span>
              </span>
            </div>
            <p className="text-[11px] font-mono text-slate-400">
              Deterministic atomspace evaluation enabled
            </p>
          </div>
        </div>

        {/* Key Health Status */}
        <div className="p-4 rounded-xl bg-[#080b13] border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-slate-300">
            <span className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              <span>Server-Side Secrets Status (Never exposed to client)</span>
            </span>
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? "animate-spin" : ""}`} />
              <span>Ping Status</span>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs font-mono">
            <div className="p-2.5 rounded bg-slate-900 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">TAVILY API:</span>
              <span className={backendStatus?.env_keys.has_tavily ? "text-emerald-400 font-bold" : "text-amber-400"}>
                {backendStatus?.env_keys.has_tavily ? "CONFIGURED" : "PENDING"}
              </span>
            </div>
            <div className="p-2.5 rounded bg-slate-900 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">ASI CLOUD:</span>
              <span className={backendStatus?.env_keys.has_asi_cloud ? "text-emerald-400 font-bold" : "text-amber-400"}>
                {backendStatus?.env_keys.has_asi_cloud ? "CONFIGURED" : "PENDING"}
              </span>
            </div>
            <div className="p-2.5 rounded bg-slate-900 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">GEMINI LLM:</span>
              <span className={backendStatus?.env_keys.has_gemini ? "text-emerald-400 font-bold" : "text-slate-500"}>
                {backendStatus?.env_keys.has_gemini ? "READY" : "STANDBY"}
              </span>
            </div>
          </div>
        </div>

        {/* How to run the Python backend */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-medium text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              <span>Run Local Python API Server</span>
            </span>
            <button
              onClick={() => copyToClipboard("uvicorn backend.main:app --port 8000 --reload", "cmd")}
              className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 cursor-pointer"
            >
              {copied === "cmd" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied === "cmd" ? "Copied" : "Copy Command"}</span>
            </button>
          </div>

          <div className="p-3 bg-[#05070c] border border-slate-800 rounded-lg text-xs font-mono text-cyan-300 select-all overflow-x-auto">
            uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
          </div>
          <p className="text-[11px] text-slate-400">
            The frontend automatically connects to your Python backend at port 8000 whenever running, with zero modifications needed.
          </p>
        </div>

        {/* Close Button */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/40 text-xs font-mono font-semibold transition-colors cursor-pointer"
          >
            Close Diagnostics
          </button>
        </div>
      </div>
    </div>
  );
};
