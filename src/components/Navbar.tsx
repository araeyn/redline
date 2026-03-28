export function Navbar() {
  return (
    <nav className="h-20 border-b border-zinc-200 bg-white flex items-center justify-between px-10 z-50 relative">
      <div className="flex flex-col">
        <div className="flex items-baseline">
          <span className="text-4xl font-serif italic text-red-600 leading-none tracking-tight">
            Red
          </span>
          <span className="text-4xl font-bold tracking-tighter text-zinc-900 leading-none">
            line
          </span>
        </div>
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.4em] mt-1 ml-1 font-sans">
          Professional Art Direction
        </span>
      </div>
      <div className="flex items-center gap-6">
        <div className="text-xs font-bold text-zinc-300 uppercase tracking-[0.2em] italic hidden md:block">
          Workspace Session
        </div>
        <div className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse shadow-[0_0_12px_rgba(220,38,38,0.4)]" />
      </div>
    </nav>
  );
}
