import { PenTool } from "lucide-react";

export function Navbar() {
  return (
    <nav className="h-16 border-b border-white/10 bg-zinc-950/40 backdrop-blur-2xl flex items-center justify-between px-6 z-50 relative">
      <div className="flex items-center gap-3">
        <div className="bg-gradient-to-br from-red-500/20 to-red-900/20 p-2 rounded-lg border border-red-500/30 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
          <PenTool size={20} className="fill-red-500/10" />
        </div>
        <span className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 to-zinc-400">
          Redline
        </span>
      </div>
      <div className="text-xs font-semibold text-shiny uppercase tracking-[0.2em]">
        Professional critique. Zero ego.
      </div>
    </nav>
  );
}
