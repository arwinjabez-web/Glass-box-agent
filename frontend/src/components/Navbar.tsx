import React from "react";
import { Box, Activity, Cpu, ShieldCheck, Terminal } from "lucide-react";
import { BackendStatus } from "../types";

interface NavbarProps {
  backendStatus: BackendStatus | null;
  onOpenDiagnostics: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ backendStatus, onOpenDiagnostics }) => {
  const isPythonConnected = backendStatus?.python_backend.connected;

  return (
    <header className="border-b border-cyan-500/15 bg-[#090c14]/80 backdrop-blur-md sticky top-0 z-40 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Brand Section */}
        <div className="flex items-center space-x-3.5">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 via-blue-600/10 to-transparent border border-cyan-400/30 cyan-glow-subtle">
            <Box className="w-5 h-5 text-cyan-400" />
            <div className="absolute inset-0 rounded-lg border border-cyan-400/20 animate-pulse pointer-events-none" />
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-lg font-bold tracking-wider text-white">
                GLASS BOX <span className="text-cyan-400">AI</span>
              </span>
              <span className="hidden sm:inline-block text-[10px] font-mono tracking-widest text-cyan-400/80 bg-cyan-950/60 border border-cyan-800/40 px-1.5 py-0.5 rounded">
                NEURO-SYMBOLIC
              </span>
            </div>
            <p className="text-xs text-slate-400 tracking-tight">
              Explainable AI Decision Agent
            </p>
          </div>
        </div>

        {/* Right Status Controls */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* Architecture / Python Link Button */}
          <button
            onClick={onOpenDiagnostics}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-md bg-slate-900/80 hover:bg-slate-800/90 border border-slate-700/60 hover:border-cyan-500/40 text-xs font-mono text-slate-300 hover:text-cyan-300 transition-all cursor-pointer shadow-sm"
            title="Inspect Python Backend & System Diagnostics"
          >
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline">Backend API:</span>
            <span className={isPythonConnected ? "text-emerald-400 font-medium" : "text-cyan-400 font-medium"}>
              {isPythonConnected ? "Python FastAPI" : "Active Engine"}
            </span>
          </button>

          {/* SYSTEM ONLINE Indicator */}
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-md bg-cyan-950/30 border border-cyan-500/30 cyan-glow-subtle">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
            </span>
            <span className="font-mono text-xs font-semibold tracking-wider text-cyan-300 uppercase">
              SYSTEM ONLINE
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
