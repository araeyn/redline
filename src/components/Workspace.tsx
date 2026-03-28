"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Sparkles, Sun, Info, Crosshair, RefreshCcw, Layers } from "lucide-react";
import clsx from "clsx";

const MOCK_DOTS = [
  { x: 40, y: 25, title: "Anatomy Flaw", desc: "The foreshortening on this left arm is structurally flawed." },
  { x: 65, y: 50, title: "Composition", desc: "Lacks contrast. Deepen shadows to guide the eye." },
  { x: 30, y: 70, title: "Proportion", desc: "The leg to torso ratio appears slightly elongated." },
  { x: 80, y: 20, title: "Lighting", desc: "Light source is ambiguous here. Commit to a direction." },
];

export default function Workspace() {
  const [image, setImage] = useState<string | null>(null);
  const [tab, setTab] = useState<"critique" | "relight" | "materials">("critique");
  
  const [critiqueStatus, setCritiqueStatus] = useState<"idle" | "loading" | "done">("idle");
  const [relightStatus, setRelightStatus] = useState<"idle" | "loading" | "done">("idle");
  const [materialStatus, setMaterialStatus] = useState<"idle" | "loading" | "done">("idle");
  const [sunPos, setSunPos] = useState({ x: 0, y: 0 });
  
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleCritique = () => {
    setCritiqueStatus("loading");
    setTimeout(() => {
      setCritiqueStatus("done");
    }, 2000);
  };

  const handleRelight = () => {
    setRelightStatus("loading");
    setTimeout(() => {
      setRelightStatus("done");
    }, 3000);
  };

  const handleAnalyzeMaterials = () => {
    setMaterialStatus("loading");
    setTimeout(() => {
      setMaterialStatus("done");
    }, 2500);
  };

  const getLightingPrompt = () => {
    const relX = sunPos.x;
    const relY = sunPos.y;
    if (relX === 0 && relY === 0) return "Direct front lighting, flat shadows.";
    let vertical = relY < -40 ? "top" : relY > 40 ? "bottom" : "center";
    let horizontal = relX < -40 ? "left" : relX > 40 ? "right" : "center";
    if (vertical === "center" && horizontal === "center") return "Direct front lighting, flat shadows.";
    return `Dramatic rim lighting from ${vertical} ${horizontal}.`;
  };

  if (!image) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-zinc-950 bg-mesh relative overflow-hidden">
        <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-red-600/10 rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute top-1/2 right-1/4 translate-x-1/4 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[150px] pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-3xl aspect-[16/10] border border-white/10 rounded-3xl flex flex-col items-center justify-center glass hover:bg-zinc-900/50 hover:border-white/20 transition-all cursor-pointer group z-10 relative overflow-hidden shadow-2xl"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/40 group-hover:opacity-100 opacity-50 transition-opacity" />
          <Upload className="text-zinc-500 mb-6 group-hover:text-red-400 transition-colors duration-500 transform group-hover:-translate-y-2 group-hover:scale-110 drop-shadow-lg" size={56} />
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 to-zinc-500 mb-3 tracking-tight">Drop your WIP sketch here</h2>
          <p className="text-zinc-400 font-medium mb-8">JPG, PNG, or WEBP up to 20MB</p>
          
          <div className="flex items-center gap-4 z-20">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setImage("https://images.unsplash.com/photo-1543857778-c4a1a3e0b2eb?auto=format&fit=crop&w=1200&q=80");
              }}
              className="px-8 py-3.5 bg-zinc-100 hover:bg-white text-zinc-950 font-bold rounded-2xl transition-all active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)]"
            >
              Load Demo Sketch
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex overflow-hidden bg-zinc-950 bg-mesh relative">
      <div className="flex-1 relative flex items-center justify-center p-8 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-red-600/5 rounded-full blur-[120px] pointer-events-none" />

        <div 
          ref={canvasRef}
          className="relative rounded-2xl shadow-2xl ring-1 ring-white/10 flex items-center justify-center z-10 bg-zinc-950/50 backdrop-blur-sm overflow-hidden"
        >
          <div className="relative inline-block">
            <motion.img 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              src={image} 
              alt="WIP Sketch" 
              className={clsx(
                "max-h-[85vh] w-auto block object-contain rounded-2xl transition-all duration-1000",
                relightStatus === "done" && tab === "relight" ? "brightness-110 contrast-125 saturate-150" : "brightness-100 contrast-100"
              )}
              style={{
                filter: relightStatus === "done" && tab === "relight" ? 'brightness(1.1) contrast(1.25) drop-shadow(0 0 60px rgba(250,250,250,0.15))' : 'none'
              }}
            />

            <AnimatePresence>
              {tab === "materials" && materialStatus === "done" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-20 pointer-events-none mix-blend-overlay"
                  style={{
                    background: "radial-gradient(circle at 30% 20%, rgba(239,68,68,0.4) 0%, transparent 40%), radial-gradient(circle at 70% 60%, rgba(59,130,246,0.4) 0%, transparent 40%), radial-gradient(circle at 50% 50%, rgba(168,85,247,0.4) 0%, transparent 60%)"
                  }}
                />
              )}
            </AnimatePresence>

            <div className="absolute inset-0 z-30 pointer-events-none">
              <AnimatePresence>
                {tab === "critique" && critiqueStatus === "done" && (
                  MOCK_DOTS.map((dot, i) => (
                    <CritiqueDot key={i} dot={dot} index={i} />
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>

          <AnimatePresence>
            {tab === "relight" && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                drag
                dragConstraints={canvasRef}
                dragElastic={0.1}
                onDrag={(_, info) => setSunPos({ x: info.offset.x, y: info.offset.y })}
                className="absolute top-1/2 left-1/2 w-16 h-16 -mt-8 -ml-8 bg-gradient-to-br from-yellow-200 to-amber-500 rounded-full cursor-grab active:cursor-grabbing shadow-[0_0_60px_rgba(245,158,11,0.8)] flex items-center justify-center z-40 border-2 border-white/20"
              >
                <Sun className="text-amber-900" size={32} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <motion.div 
        initial={{ x: 400 }}
        animate={{ x: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 25 }}
        className="w-[420px] glass-panel flex flex-col z-20 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-red-500/10 blur-[100px] pointer-events-none" />

        <div className="flex p-5 gap-2 border-b border-white/5 relative z-10 bg-black/20 overflow-x-auto no-scrollbar">
          <button 
            onClick={() => setTab("critique")}
            className={clsx(
              "flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0",
              tab === "critique" ? "bg-white/10 text-white shadow-lg border border-white/10" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5 border border-transparent"
            )}
          >
            <Crosshair size={14} /> Critique
          </button>
          <button 
            onClick={() => setTab("relight")}
            className={clsx(
              "flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0",
              tab === "relight" ? "bg-white/10 text-white shadow-lg border border-white/10" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5 border border-transparent"
            )}
          >
            <Sun size={14} /> Relight
          </button>
          <button 
            onClick={() => setTab("materials")}
            className={clsx(
              "flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0",
              tab === "materials" ? "bg-white/10 text-white shadow-lg border border-white/10" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5 border border-transparent"
            )}
          >
            <Layers size={14} /> Materials
          </button>
        </div>

        <div className="flex-1 p-6 overflow-y-auto relative z-10">
          {tab === "critique" ? (
            <div className="space-y-8">
              <div>
                <h3 className="text-2xl font-bold text-zinc-50 flex items-center gap-2 mb-3">
                  <Sparkles className="text-red-500" size={24} />
                  Spatial Critique
                </h3>
                <p className="text-sm text-zinc-400 leading-relaxed font-medium">
                  The Anatomy Mentor uses advanced vision models to analyze structural flaws, composition, and proportion in your WIP sketch.
                </p>
              </div>

              {critiqueStatus === "idle" && (
                <button 
                  onClick={handleCritique}
                  className="w-full py-4 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold rounded-2xl shadow-[0_0_30px_rgba(239,68,68,0.3)] transition-all active:scale-[0.98] flex items-center justify-center gap-3 group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent)] -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-1000 ease-in-out" />
                  <Sparkles className="group-hover:rotate-12 transition-transform" size={20} />
                  Generate AI Redline
                </button>
              )}

              {critiqueStatus === "loading" && (
                <div className="w-full py-10 border border-white/10 rounded-2xl bg-black/40 flex flex-col items-center justify-center gap-5 backdrop-blur-md shadow-inner">
                  <div className="w-10 h-10 border-4 border-white/10 border-t-red-500 rounded-full animate-spin shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
                  <span className="text-sm text-zinc-300 font-bold text-shiny">Running Vision Analysis...</span>
                </div>
              )}

              {critiqueStatus === "done" && (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="p-5 rounded-2xl border border-green-500/30 bg-green-500/10 text-green-400 text-sm flex items-start gap-4 backdrop-blur-md shadow-[0_0_30px_rgba(34,197,94,0.1)]">
                    <Info size={22} className="mt-0.5 shrink-0 text-green-400" />
                    <div>
                      <p className="font-bold mb-1 text-base text-green-300">Analysis Complete</p>
                      <p className="text-green-500/80 font-medium leading-relaxed">Found 4 potential areas for improvement. Hover over the pulsing red dots on the canvas.</p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => setCritiqueStatus("idle")}
                    className="w-full py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    <RefreshCcw size={16} /> Reset Analysis
                  </button>
                </motion.div>
              )}
            </div>
          ) : tab === "relight" ? (
            <div className="space-y-8">
              <div>
                <h3 className="text-2xl font-bold text-zinc-50 flex items-center gap-2 mb-3">
                  <Sun className="text-amber-500" size={24} />
                  Interactive Relighting
                </h3>
                <p className="text-sm text-zinc-400 leading-relaxed font-medium">
                  Drag the sun icon over the canvas to set a light source. The AI will simulate realistic light bounces on your 2D sketch.
                </p>
              </div>

              <div className="p-5 rounded-2xl border border-white/10 bg-black/40 shadow-inner backdrop-blur-md">
                <span className="text-xs font-bold text-amber-500/80 uppercase tracking-widest mb-3 block">Live AI Prompt</span>
                <p className="text-sm text-zinc-200 font-mono leading-relaxed h-12 flex items-center">
                  <span className="text-shiny">{getLightingPrompt()}</span>
                </p>
              </div>

              {relightStatus === "idle" && (
                <button 
                  onClick={handleRelight}
                  className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold rounded-2xl shadow-[0_0_30px_rgba(245,158,11,0.3)] transition-all active:scale-[0.98] flex items-center justify-center gap-3 group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.4),transparent)] -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-1000 ease-in-out" />
                  <Sparkles size={20} className="text-amber-900" />
                  Relight Canvas
                </button>
              )}

              {relightStatus === "loading" && (
                <div className="w-full py-10 border border-white/10 rounded-2xl bg-black/40 flex flex-col items-center justify-center gap-5 backdrop-blur-md shadow-inner">
                  <div className="w-10 h-10 border-4 border-white/10 border-t-amber-500 rounded-full animate-spin shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
                  <span className="text-sm text-zinc-300 font-bold text-shiny">Calculating Light Bounce...</span>
                </div>
              )}

              {relightStatus === "done" && (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="p-5 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-200 text-sm flex items-start gap-4 backdrop-blur-md shadow-[0_0_30px_rgba(245,158,11,0.15)]">
                    <Sparkles size={22} className="mt-0.5 shrink-0 text-amber-400" />
                    <div>
                      <p className="font-bold mb-1 text-base text-amber-300">Relighting Applied</p>
                      <p className="text-amber-500/80 font-medium leading-relaxed">Previewing simulated lighting. For final quality, export to hi-res.</p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => setRelightStatus("idle")}
                    className="w-full py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    <RefreshCcw size={16} /> Adjust Lighting
                  </button>
                </motion.div>
              )}
            </div>
          ) : (
            <div className="space-y-8">
              <div>
                <h3 className="text-2xl font-bold text-zinc-50 flex items-center gap-2 mb-3">
                  <Layers className="text-purple-500" size={24} />
                  Material Analysis
                </h3>
                <p className="text-sm text-zinc-400 leading-relaxed font-medium">
                  Scan surface textures to determine roughness, metallic values, and sub-surface scattering estimates.
                </p>
              </div>

              {materialStatus === "idle" && (
                <button 
                  onClick={handleAnalyzeMaterials}
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-500 hover:from-purple-500 hover:to-indigo-400 text-white font-bold rounded-2xl shadow-[0_0_30px_rgba(168,85,247,0.3)] transition-all active:scale-[0.98] flex items-center justify-center gap-3 group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent)] -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-1000 ease-in-out" />
                  <Sparkles size={20} />
                  Analyze Surface Materials
                </button>
              )}

              {materialStatus === "loading" && (
                <div className="w-full py-10 border border-white/10 rounded-2xl bg-black/40 flex flex-col items-center justify-center gap-5 backdrop-blur-md shadow-inner">
                  <div className="w-10 h-10 border-4 border-white/10 border-t-purple-500 rounded-full animate-spin shadow-[0_0_15px_rgba(168,85,247,0.5)]" />
                  <span className="text-sm text-zinc-300 font-bold text-shiny">Scanning Texture Maps...</span>
                </div>
              )}

              {materialStatus === "done" && (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 rounded-xl border border-white/5 bg-white/5">
                      <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1">Roughness</p>
                      <p className="text-xl font-bold text-purple-400">0.42</p>
                    </div>
                    <div className="p-4 rounded-xl border border-white/5 bg-white/5">
                      <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1">Metallic</p>
                      <p className="text-xl font-bold text-indigo-400">0.08</p>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl border border-white/5 bg-white/5">
                    <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1">Material Estimate</p>
                    <p className="text-sm font-bold text-zinc-200">Semi-Matte Synthetic / Organic Mix</p>
                  </div>
                  <button 
                    onClick={() => setMaterialStatus("idle")}
                    className="w-full py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    <RefreshCcw size={16} /> Re-scan
                  </button>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function CritiqueDot({ dot, index }: { dot: any; index: number }) {
  const [isHovered, setIsHovered] = useState(false);

  const isNearRight = dot.x > 70;
  const isNearLeft = dot.x < 30;
  const isNearTop = dot.y < 30;

  const xPositionClass = isNearRight 
    ? "right-0 translate-x-4" 
    : isNearLeft 
      ? "left-0 -translate-x-4" 
      : "left-1/2 -translate-x-1/2";

  const yPositionClass = isNearTop 
    ? "top-10" 
    : "bottom-10";

  const originClass = isNearTop
    ? (isNearRight ? "origin-top-right" : isNearLeft ? "origin-top-left" : "origin-top")
    : (isNearRight ? "origin-bottom-right" : isNearLeft ? "origin-bottom-left" : "origin-bottom");

  const initialY = isNearTop ? -15 : 15;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.2, type: "spring", stiffness: 300 }}
      className="absolute z-30 pointer-events-auto"
      style={{ left: `${dot.x}%`, top: `${dot.y}%` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => setIsHovered(!isHovered)}
    >
      <div className="relative flex items-center justify-center cursor-pointer group">
        <div className="absolute w-8 h-8 bg-red-500/40 rounded-full pulse-ring group-hover:bg-red-400/50 transition-colors" />
        <div className="w-4 h-4 bg-red-500 rounded-full shadow-[0_0_15px_rgba(239,68,68,1)] border-2 border-white/40 z-10 group-hover:scale-125 transition-transform" />
      </div>

      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: initialY, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: initialY, scale: 0.95 }}
            className={`absolute ${xPositionClass} ${yPositionClass} ${originClass} w-72 glass p-[1px] rounded-2xl z-50 shadow-[0_30px_60px_rgba(0,0,0,0.8)] overflow-hidden`}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 via-zinc-900/80 to-zinc-900/90 backdrop-blur-3xl" />
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.1),transparent)]" />
            
            <div className={`absolute ${isNearTop ? '-top-2' : '-bottom-2'} ${isNearRight ? 'right-4' : isNearLeft ? 'left-4' : 'left-1/2 -translate-x-1/2'} w-[2px] h-4 bg-red-500/50 blur-[1px]`} />

            <div className="relative p-5 z-10">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse" />
                <h4 className="text-base font-bold text-zinc-50 tracking-wide">{dot.title}</h4>
              </div>
              <p className="text-sm text-zinc-300 leading-relaxed font-medium">
                {dot.desc}
              </p>
              <div className="mt-5 flex gap-3">
                <button className="flex-1 text-xs font-bold bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 px-3 py-2.5 rounded-xl text-red-100 transition-all shadow-[0_0_10px_rgba(239,68,68,0.1)] hover:shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                  Fix with AI
                </button>
                <button className="flex-1 text-xs font-bold bg-zinc-800/30 hover:bg-zinc-800/60 border border-white/5 hover:border-white/10 px-3 py-2.5 rounded-xl text-zinc-400 transition-all">
                  Ignore
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
