export function Navbar() {
  return (
    <nav className="absolute top-0 left-0 right-0 h-24 flex items-center justify-between px-12 z-50 pointer-events-none">
      <div className="flex flex-col">
        <div className="flex items-baseline drop-shadow-sm">
          <span className="text-5xl font-serif italic text-red-700 leading-none tracking-tight">
            Red
          </span>
          <span className="text-5xl font-bold tracking-tighter text-zinc-900 leading-none">
            line
          </span>
        </div>
        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.4em] mt-2 ml-1 font-sans">
          Immersive Art Direction
        </span>
      </div>
      <div className="flex items-center gap-4 bg-white/60 backdrop-blur-md px-4 py-2 rounded-full border border-zinc-200 shadow-sm pointer-events-auto">
        <div className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse shadow-[0_0_12px_rgba(220,38,38,0.6)]" />
        <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em] font-sans">
          Live Session
        </div>
      </div>
    </nav>
  );
}
