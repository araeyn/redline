"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Sparkles, Sun, Info, Crosshair, RefreshCcw, Layers, Layout, Brain } from "lucide-react";
import clsx from "clsx";
import { analyzeImage } from "@/lib/gemini";

interface Critique {
  x: number;
  y: number;
  title: string;
  desc: string;
}

const SKETCH_URLS = [
  "https://images.unsplash.com/photo-1513364776144-60967b0f800f",
  "https://images.unsplash.com/photo-1543857778-c4a1a3e0b2eb",
  "https://images.unsplash.com/photo-1580136579312-94651dfd596d",
  "https://images.unsplash.com/photo-1614850523296-d8c1af93d400",
  "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5",
];

export default function Workspace() {
  const [image, setImage] = useState<string | null>(null);
  const [tab, setTab] = useState<"critique" | "relight" | "materials" | "layers">("critique");
  
  const [critiques, setCritiques] = useState<Critique[]>([]);
  const [critiqueStatus, setCritiqueStatus] = useState<"idle" | "loading" | "done">("idle");
  const [relightStatus, setRelightStatus] = useState<"idle" | "loading" | "done">("idle");
  const [materialStatus, setMaterialStatus] = useState<"idle" | "loading" | "done">("idle");
  const [sunPos, setSunPos] = useState({ x: 0, y: 0 });
  
  const canvasRef = useRef<HTMLDivElement>(null);

  const loadRandomImage = () => {
    const baseUrl = SKETCH_URLS[Math.floor(Math.random() * SKETCH_URLS.length)];
    const sig = Math.floor(Math.random() * 1000000);
    setImage(`${baseUrl}?auto=format&fit=crop&w=1200&q=80&sig=${sig}`);
    setCritiques([]);
    setCritiqueStatus("idle");
    setRelightStatus("idle");
    setMaterialStatus("idle");
  };

  const handleCritique = async () => {
    if (!image) return;
    setCritiqueStatus("loading");
    const result = await analyzeImage(image);
    if (result && result.critiques) {
      setCritiques(result.critiques);
    }
    setCritiqueStatus("done");
  };

  const handleRelight = () => {
    setRelightStatus("loading");
    setTimeout(() => setRelightStatus("done"), 2000);
  };

  const handleAnalyzeMaterials = () => {
    setMaterialStatus("loading");
    setTimeout(() => setMaterialStatus("done"), 2000);
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

  const blurFade = {
    initial: { opacity: 0, filter: "blur(12px)" },
    animate: { opacity: 1, filter: "blur(0px)" },
    exit: { opacity: 0, filter: "blur(12px)" },
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
  };

  if (!image) {
    return (
      <div className="flex-1 flex items-center justify-center p-10 bg-[#fcfcfc]">
        <motion.div 
          {...blurFade}
          className="w-full max-w-xl aspect-[1.4] border border-zinc-200 rounded-lg flex flex-col items-center justify-center bg-white shadow-sm"
        >
          <h2 className="text-5xl font-bold text-zinc-800 mb-2 tracking-tighter italic">Redline</h2>
          <p className="text-zinc-400 text-xl mb-12 max-w-xs text-center leading-relaxed font-serif">
            Art direction for the analog-digital hybrid.
          </p>
          <button 
            onClick={loadRandomImage}
            className="px-14 py-4 bg-zinc-900 text-white font-bold rounded-full transition-all hover:bg-black active:opacity-90 shadow-lg text-lg tracking-tight"
          >
            Open Sketchbook
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex overflow-hidden bg-[#fcfcfc] relative">
      <div className="flex-1 relative flex items-center justify-center p-12 overflow-visible">
        <div 
          ref={canvasRef}
          className="relative paper-canvas bg-white p-4 overflow-visible"
        >
          <div className="relative inline-block overflow-visible border border-zinc-100 shadow-inner p-1">
            <motion.img 
              key={image}
              {...blurFade}
              src={image} 
              alt="WIP Sketch" 
              className={clsx(
                "max-h-[75vh] w-auto block object-contain grayscale-[0.2] transition-all duration-1000",
                relightStatus === "done" && tab === "relight" ? "brightness-110 contrast-125 saturate-110" : "brightness-100 contrast-100"
              )}
            />

            <AnimatePresence>
              {tab === "materials" && materialStatus === "done" && (
                <motion.div
                  initial={{ opacity: 0, filter: "blur(20px)" }}
                  animate={{ opacity: 0.2, filter: "blur(0px)" }}
                  exit={{ opacity: 0, filter: "blur(20px)" }}
                  className="absolute inset-0 z-20 pointer-events-none mix-blend-multiply"
                  style={{
                    background: "radial-gradient(circle at 30% 20%, rgba(239,68,68,0.4) 0%, transparent 40%), radial-gradient(circle at 70% 60%, rgba(59,130,246,0.4) 0%, transparent 40%)"
                  }}
                />
              )}
              {tab === "layers" && (
                <motion.div
                  initial={{ opacity: 0, filter: "blur(15px)" }}
                  animate={{ opacity: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, filter: "blur(15px)" }}
                  className="absolute inset-0 z-20 pointer-events-none opacity-10"
                >
                   <div className="grid grid-cols-3 grid-rows-3 w-full h-full">
                      {[...Array(9)].map((_, i) => <div key={i} className="border border-zinc-900" />)}
                   </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="absolute inset-0 z-30 pointer-events-none overflow-visible">
              <AnimatePresence>
                {tab === "critique" && critiqueStatus === "done" && (
                  critiques.map((dot, i) => (
                    <RedlineMark key={`${image}-${i}`} dot={dot} index={i} />
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>

          <AnimatePresence>
            {tab === "relight" && (
              <motion.div
                initial={{ opacity: 0, filter: "blur(10px)" }}
                animate={{ opacity: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, filter: "blur(10px)" }}
                drag
                dragConstraints={canvasRef}
                dragElastic={0.1}
                onDrag={(_, info) => setSunPos({ x: info.offset.x, y: info.offset.y })}
                className="absolute top-1/2 left-1/2 w-12 h-12 -mt-6 -ml-6 bg-white border-2 border-zinc-200 rounded-full cursor-grab active:cursor-grabbing shadow-lg flex items-center justify-center z-40"
              >
                <Sun className="text-zinc-400" size={24} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <motion.div 
        initial={{ x: 400 }}
        animate={{ x: 0 }}
        className="w-[420px] bg-white border-l border-zinc-200 flex flex-col z-20"
      >
        <div className="p-10 border-b border-zinc-100">
          <h1 className="text-4xl font-bold text-zinc-900 tracking-tighter mb-2">Director's Ledger</h1>
          <p className="text-zinc-400 text-lg italic leading-tight font-serif">Observations on structural integrity.</p>
        </div>

        <div className="flex p-2 gap-1 border-b border-zinc-50 bg-[#fafafa] overflow-x-auto no-scrollbar">
          <button onClick={() => setTab("critique")} className={clsx("flex-1 py-2 px-3 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all", tab === "critique" ? "bg-white text-zinc-900 shadow-sm border border-zinc-200" : "text-zinc-400")}>Critique</button>
          <button onClick={() => setTab("relight")} className={clsx("flex-1 py-2 px-3 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all", tab === "relight" ? "bg-white text-zinc-900 shadow-sm border border-zinc-200" : "text-zinc-400")}>Relight</button>
          <button onClick={() => setTab("materials")} className={clsx("flex-1 py-2 px-3 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all", tab === "materials" ? "bg-white text-zinc-900 shadow-sm border border-zinc-200" : "text-zinc-400")}>Surfaces</button>
          <button onClick={() => setTab("layers")} className={clsx("flex-1 py-2 px-3 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all", tab === "layers" ? "bg-white text-zinc-900 shadow-sm border border-zinc-200" : "text-zinc-400")}>Layers</button>
        </div>

        <div className="flex-1 p-10 overflow-y-auto">
          {tab === "critique" ? (
            <div className="space-y-10">
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-zinc-900 uppercase tracking-widest">Art Director</h3>
                <p className="text-zinc-500 font-serif text-xl leading-snug italic italic">"Identify the rhythm of the gesture before the weight of the shadow."</p>
              </div>
              {critiqueStatus === "idle" && (
                <button onClick={handleCritique} className="w-full py-5 bg-zinc-900 text-white font-bold rounded-xl shadow-xl transition-all active:opacity-80 text-lg">Analyze Piece</button>
              )}
              {critiqueStatus === "loading" && (
                <div className="py-12 flex flex-col items-center justify-center gap-6">
                  <div className="w-10 h-10 border-2 border-zinc-200 border-t-red-700 rounded-full animate-spin" />
                  <span className="text-xs text-zinc-400 font-bold uppercase tracking-[0.4em]">Observing...</span>
                </div>
              )}
              {critiqueStatus === "done" && (
                <motion.div {...blurFade} className="space-y-8">
                  <div className="p-8 border border-zinc-100 bg-zinc-50/50 rounded-2xl">
                    <p className="text-zinc-600 text-lg font-serif italic italic">The system has identified key areas for refinement. Note the red markings on the canvas.</p>
                  </div>
                  <div className="space-y-4">
                    {critiques.map((c, i) => (
                      <div key={i} className="p-4 border-b border-zinc-50">
                        <span className="text-[10px] font-bold text-red-700 uppercase tracking-widest block mb-1">Point {i + 1}</span>
                        <span className="text-xl font-bold text-zinc-800 tracking-tight">{c.title}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setCritiqueStatus("idle")} className="w-full py-4 border border-zinc-200 text-zinc-400 font-bold rounded-xl transition-all text-xs uppercase tracking-widest">Reset Analysis</button>
                </motion.div>
              )}
            </div>
          ) : tab === "relight" ? (
            <div className="space-y-10">
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-zinc-900 uppercase tracking-widest">Light Engine</h3>
                <p className="text-zinc-500 font-serif text-xl leading-snug italic italic">Simulate volume and depth via structural lighting.</p>
              </div>
              <div className="p-6 border border-zinc-100 bg-zinc-50 rounded-xl font-mono text-sm text-zinc-800">{getLightingPrompt()}</div>
              {relightStatus === "idle" && (
                <button onClick={handleRelight} className="w-full py-5 bg-zinc-900 text-white font-bold rounded-xl shadow-xl transition-all active:opacity-80 text-lg tracking-tight">Apply Engine</button>
              )}
              {relightStatus === "loading" && (
                <div className="py-12 flex flex-col items-center justify-center gap-6 animate-pulse">
                  <span className="text-xs text-zinc-400 font-bold uppercase tracking-[0.4em]">Calculating...</span>
                </div>
              )}
              {relightStatus === "done" && (
                <button onClick={() => setRelightStatus("idle")} className="w-full py-4 border border-zinc-200 text-zinc-400 font-bold rounded-xl transition-all text-xs uppercase tracking-widest">Adjust Source</button>
              )}
            </div>
          ) : (
            <div className="py-20 text-center space-y-4">
               <Layers className="mx-auto text-zinc-200" size={32} strokeWidth={1} />
               <p className="text-sm text-zinc-400 font-serif italic italic">Specialized structural tools currently locked in dev mode.</p>
            </div>
          )}
        </div>
        
        <div className="p-10 bg-zinc-50/30 border-t border-zinc-100">
           <button onClick={loadRandomImage} className="w-full py-4 bg-white text-zinc-900 font-bold rounded-xl transition-all border border-zinc-200 shadow-sm hover:shadow-md text-lg tracking-tight font-sans">Next Canvas</button>
        </div>
      </motion.div>
    </div>
  );
}

function RedlineMark({ dot, index }: { dot: Critique; index: number }) {
  const [isHovered, setIsHovered] = useState(false);
  const isNearRight = dot.x > 70;
  const isNearLeft = dot.x < 30;
  const isNearTop = dot.y < 30;
  const xPositionClass = isNearRight ? "right-0 translate-x-4" : isNearLeft ? "left-0 -translate-x-4" : "left-1/2 -translate-x-1/2";
  const yPositionClass = isNearTop ? "top-12" : "bottom-12";
  const initialY = isNearTop ? -10 : 10;

  return (
    <motion.div
      initial={{ opacity: 0, filter: "blur(10px)" }}
      animate={{ opacity: 1, filter: "blur(0px)" }}
      transition={{ delay: index * 0.15 + 0.5, duration: 0.8 }}
      className="absolute z-30 pointer-events-auto"
      style={{ left: `${dot.x}%`, top: `${dot.y}%` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => setIsHovered(!isHovered)}
    >
      <div className="relative flex items-center justify-center cursor-pointer group">
        <div className="text-red-700/90 font-bold text-3xl select-none leading-none -mt-4 opacity-80 hover:opacity-100 transition-opacity">✕</div>
        <div className="absolute w-12 h-12 bg-red-700/5 rounded-full blur-2xl animate-pulse" />
      </div>
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: initialY, filter: "blur(12px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: initialY, filter: "blur(12px)" }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className={clsx("absolute w-80 bg-white border border-zinc-200 p-10 rounded-sm z-50 shadow-[0_20px_70px_rgba(0,0,0,0.1)] overflow-visible", xPositionClass, yPositionClass)}
            style={{ transform: `rotate(${(index % 2 === 0 ? 1 : -1) * 1.5}deg)` }}
          >
            <h4 className="text-[10px] font-bold text-red-700 mb-4 uppercase tracking-[0.3em] font-sans">Director's Note</h4>
            <p className="text-2xl text-zinc-800 leading-tight italic font-serif">{dot.desc}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
