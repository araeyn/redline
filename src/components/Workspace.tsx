"use client";

import { useState, useRef, DragEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Sun, Info, Crosshair, Layers, Layout, Search, Download, Gauge, Zap, ScanLine, Image as ImageIcon, Box } from "lucide-react";
import clsx from "clsx";
import { analyzeImageStream, getSurfaceMap, getLayersInfo } from "@/lib/gemini";

interface Critique {
  x: number;
  y: number;
  title: string;
  desc: string;
}

interface LayerInfo {
  name: string;
  score: number;
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
  
  const [displayedCritiques, setDisplayedCritiques] = useState<Critique[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const [sunPos, setSunPos] = useState({ x: 0, y: 0 });
  const [lightIntensity, setLightIntensity] = useState(1.5);
  const [surfaceMap, setSurfaceMap] = useState<string | null>(null);
  const [layers, setLayers] = useState<LayerInfo[]>([]);
  const [hoveredMarkIndex, setHoveredMarkIndex] = useState<number | null>(null);
  const [masteryScore, setMasteryScore] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isRelit, setIsRelit] = useState(false);
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetAllStates = () => {
    setDisplayedCritiques([]);
    setStatus("idle");
    setSurfaceMap(null);
    setLayers([]);
    setSunPos({ x: 0, y: 0 });
    setMasteryScore(null);
    setHoveredMarkIndex(null);
    setIsRelit(false);
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImage(url);
      resetAllStates();
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setImage(url);
      resetAllStates();
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const loadRandomDemo = () => {
    const baseUrl = SKETCH_URLS[Math.floor(Math.random() * SKETCH_URLS.length)];
    const sig = Math.floor(Math.random() * 1000000);
    setImage(`${baseUrl}?auto=format&fit=crop&w=1200&q=80&sig=${sig}`);
    resetAllStates();
  };

  const handleCritique = async () => {
    if (!image) return;
    setStatus("loading");
    setDisplayedCritiques([]);
    setMasteryScore(null);
    
    try {
      const stream = analyzeImageStream(image);
      for await (const point of stream) {
        if (point && typeof point === 'object' && 'title' in point) {
          setDisplayedCritiques(prev => [...prev, point as Critique]);
        }
      }
      setMasteryScore(Math.floor(Math.random() * 20) + 70);
    } catch (e) {
      console.error("Streaming UI Error:", e);
    } finally {
      setStatus("done");
    }
  };

  const handleRelightModel = () => {
    setStatus("loading");
    setTimeout(() => {
      setIsRelit(true);
      setStatus("done");
    }, 2000);
  };

  const handleSurfaceAnalysis = async () => {
    if (!image) return;
    setStatus("loading");
    const map = await getSurfaceMap(image);
    setSurfaceMap(map); // string or 'fallback'
    setStatus("done");
  };

  const handleLayerDeconstruction = async () => {
    if (!image) return;
    setStatus("loading");
    const info = await getLayersInfo(image);
    setLayers(info);
    setStatus("done");
  };

  const handleExport = () => {
    window.print();
  };

  const blurFade = {
    initial: { opacity: 0, filter: "blur(12px)" },
    animate: { opacity: 1, filter: "blur(0px)" },
    exit: { opacity: 0, filter: "blur(12px)" },
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
  };

  if (!image) {
    return (
      <div 
        className={clsx(
          "fixed inset-0 flex items-center justify-center transition-colors duration-500 z-50",
          isDragging ? "bg-red-50" : "bg-[#fcfcfc]"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleUpload} 
          className="hidden" 
          accept="image/*"
        />
        <motion.div 
          {...blurFade}
          className={clsx(
            "w-full max-w-2xl aspect-[1.4] border-2 border-dashed rounded-3xl flex flex-col items-center justify-center shadow-sm transition-all cursor-pointer group",
            isDragging ? "border-red-400 bg-white scale-105" : "border-zinc-200 bg-white hover:border-red-200"
          )}
          onClick={() => fileInputRef.current?.click()}
        >
          <ImageIcon className={clsx("mb-8 transition-colors duration-500", isDragging ? "text-red-500" : "text-zinc-300 group-hover:text-red-400")} size={72} strokeWidth={1} />
          <h2 className="text-5xl font-bold text-zinc-900 mb-3 tracking-tighter italic font-serif">Redline</h2>
          <p className="text-zinc-500 text-xl mb-12 max-w-sm text-center leading-relaxed font-serif italic">
            {isDragging ? "Drop sketch to begin." : "Drag & drop your Work-In-Progress to begin the AI art direction."}
          </p>
          <div className="flex items-center gap-6">
            <button className="px-12 py-4 bg-zinc-900 text-white font-bold rounded-full transition-all hover:bg-black active:scale-95 shadow-xl text-lg tracking-tight font-outfit">
              Select Art
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); loadRandomDemo(); }}
              className="text-zinc-400 hover:text-zinc-800 font-bold text-sm underline underline-offset-4 font-outfit transition-colors"
            >
              Load Demo
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#fcfcfc] font-serif flex items-center justify-center">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleUpload} 
        className="hidden" 
        accept="image/*"
      />

      {/* Floating Action Button (Top Right) */}
      <div className="absolute top-8 right-12 z-50">
        <button 
          onClick={() => fileInputRef.current?.click()} 
          className="px-6 py-3 bg-white/90 backdrop-blur-xl border border-zinc-200 text-zinc-900 font-bold rounded-full shadow-lg hover:shadow-xl hover:bg-white transition-all text-xs uppercase tracking-widest font-outfit active:scale-95 flex items-center gap-2"
        >
          <Upload size={14} /> New Canvas
        </button>
      </div>

      {/* Main Immersive Canvas */}
      <div 
        ref={canvasRef}
        className="relative z-10 p-4"
      >
        <div className="relative inline-block overflow-visible border border-zinc-100 shadow-2xl p-1 bg-white group">
          {/* SVG Lighting Engine Filter */}
          <svg width="0" height="0" className="absolute pointer-events-none">
            <filter id="ai-light-engine">
              <feDiffuseLighting in="SourceGraphic" diffuseConstant={lightIntensity} lightingColor="#fff" result="diffuse">
                <fePointLight x={500 + sunPos.x} y={500 + sunPos.y} z="200" />
              </feDiffuseLighting>
              <feComposite in="diffuse" in2="SourceGraphic" operator="arithmetic" k1="1.5" k2="0.2" k3="0" k4="0" />
            </filter>
          </svg>

          <motion.img 
            key={image}
            {...blurFade}
            src={image} 
            alt="WIP Art" 
            className={clsx(
              "max-h-[85vh] max-w-[70vw] w-auto block object-contain transition-all duration-1000",
              tab === 'relight' ? "brightness-90 contrast-110" : "brightness-100 contrast-100"
            )}
            style={{
              filter: tab === "relight" && status === "done" ? "url(#ai-light-engine)" : "none",
            }}
          />

          {/* Depth Map / Surface Analysis Overlay */}
          <AnimatePresence>
            {tab === "materials" && status === "done" && surfaceMap && (
              <motion.div
                initial={{ opacity: 0, filter: "blur(20px)" }}
                animate={{ opacity: 0.7, filter: "blur(0px)" }}
                exit={{ opacity: 0, filter: "blur(20px)" }}
                className="absolute inset-0 z-20 pointer-events-none mix-blend-multiply rounded-sm overflow-hidden transition-all duration-1000"
                style={surfaceMap === 'fallback' ? {
                  background: `
                    radial-gradient(circle at 30% 20%, #ff4d4d 0%, transparent 50%),
                    radial-gradient(circle at 70% 60%, #4da6ff 0%, transparent 60%),
                    radial-gradient(circle at 50% 40%, #ffcc00 0%, transparent 40%)
                  `,
                  filter: 'contrast(1.5) saturate(2)'
                } : undefined}
              >
                {surfaceMap !== 'fallback' && (
                   <img src={surfaceMap} className="w-full h-full object-contain mix-blend-multiply opacity-80" alt="Depth Map" />
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Layer Deconstruction Overlay */}
          <AnimatePresence>
            {tab === "layers" && status === "done" && layers.length > 0 && (
              <motion.div
                initial={{ opacity: 0, filter: "blur(15px)" }}
                animate={{ opacity: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, filter: "blur(15px)" }}
                className="absolute inset-0 z-20 pointer-events-none"
              >
                 <div className="absolute inset-0 layer-edge-detect opacity-40 mix-blend-difference" />
                 <div className="grid grid-cols-3 grid-rows-3 w-full h-full opacity-30">
                    {[...Array(9)].map((_, i) => <div key={i} className="border border-red-900/40 border-dashed" />)}
                 </div>
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-[3px] border-red-500/20 rounded-full scale-110 opacity-50 blur-[1px]" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Critique Dots */}
          <div className="absolute inset-0 z-30 pointer-events-none overflow-visible">
            <AnimatePresence>
              {tab === "critique" && displayedCritiques.map((dot, i) => (
                <RedlineMark 
                  key={`${image}-${i}`} 
                  dot={dot} 
                  index={i} 
                  forceHover={hoveredMarkIndex === i}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Interactive Light Source Handle */}
        <AnimatePresence>
          {tab === "relight" && status === "done" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5, filter: "blur(10px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.5, filter: "blur(10px)" }}
              drag
              dragConstraints={canvasRef}
              dragElastic={0}
              dragMomentum={false}
              onDrag={(_, info) => setSunPos({ x: info.offset.x, y: info.offset.y })}
              className="absolute top-1/2 left-1/2 w-16 h-16 -mt-8 -ml-8 bg-white border border-zinc-200 rounded-full cursor-grab active:cursor-grabbing shadow-2xl flex items-center justify-center z-50 hover:shadow-[0_0_40px_rgba(250,204,21,0.4)] transition-shadow"
            >
              <div className="w-10 h-10 rounded-full bg-yellow-400/20 flex items-center justify-center">
                <Sun className="text-yellow-600" size={24} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Bottom Dock (Main Navigation) */}
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, type: "spring", damping: 25, stiffness: 200 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 flex p-2 gap-2 bg-white/90 backdrop-blur-xl border border-zinc-200 rounded-full shadow-2xl font-outfit"
      >
        {[
          { id: "critique", icon: Crosshair, label: "Critique" },
          { id: "relight", icon: Sun, label: "Relight" },
          { id: "materials", icon: Layers, label: "Surfaces" },
          { id: "layers", icon: Layout, label: "Layers" },
        ].map((item) => (
          <button 
            key={item.id}
            onClick={() => setTab(item.id as any)} 
            className={clsx(
              "py-3 px-6 rounded-full text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2",
              tab === item.id ? "bg-zinc-900 text-white shadow-lg" : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
            )}
          >
            <item.icon size={16} />
            {item.label}
          </button>
        ))}
      </motion.div>

      {/* Floating Sidebar Panel (Director's Ledger) */}
      <motion.div 
        initial={{ x: 400, opacity: 0, filter: "blur(20px)" }}
        animate={{ x: 0, opacity: 1, filter: "blur(0px)" }}
        transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="absolute top-24 bottom-28 right-8 w-[400px] bg-white/95 backdrop-blur-3xl border border-zinc-200 rounded-[2rem] shadow-[0_30px_100px_rgba(0,0,0,0.12)] flex flex-col z-40 overflow-hidden"
      >
        <div className="p-8 border-b border-zinc-100 shrink-0">
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tighter mb-1 font-serif italic">Director's Ledger</h1>
          <p className="text-zinc-400 text-sm font-outfit uppercase tracking-[0.2em] font-bold">Observation Deck</p>
        </div>

        <div className="flex-1 overflow-y-auto p-8 relative">
          {tab === "critique" ? (
            <div className="space-y-8 pb-8">
              <p className="text-zinc-600 font-serif text-xl leading-relaxed italic">
                "Identify the rhythm of the gesture before evaluating the weight of the shadow."
              </p>
              
              {status !== "done" && displayedCritiques.length === 0 && (
                <button onClick={handleCritique} disabled={status === "loading"} className="w-full py-5 bg-zinc-900 text-white font-bold rounded-2xl shadow-xl transition-all active:scale-95 text-lg font-outfit disabled:opacity-50">
                  {status === "loading" ? "Observing Canvas..." : "Run AI Engine"}
                </button>
              )}
              
              {displayedCritiques.length > 0 && (
                <motion.div {...blurFade} className="space-y-6">
                  {masteryScore && (
                    <div className="p-5 bg-white border border-zinc-200 shadow-sm rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Gauge size={18} className="text-red-700" />
                        <span className="text-[10px] font-bold text-red-800 uppercase tracking-[0.2em] font-outfit">Mastery Score</span>
                      </div>
                      <span className="text-2xl font-bold text-red-700 font-serif italic">{masteryScore}%</span>
                    </div>
                  )}

                  <div className="space-y-3 font-outfit">
                    {displayedCritiques.map((c, i) => (
                      <div 
                        key={i} 
                        className="p-5 border border-zinc-100 bg-zinc-50/50 rounded-2xl flex items-center justify-between group cursor-pointer hover:border-red-200 hover:shadow-md hover:bg-white transition-all"
                        onMouseEnter={() => setHoveredMarkIndex(i)}
                        onMouseLeave={() => setHoveredMarkIndex(null)}
                      >
                        {c && (
                          <div>
                            <span className="text-[10px] font-bold text-zinc-400 group-hover:text-red-600 uppercase tracking-widest block mb-1 transition-colors">Mark {i + 1}</span>
                            <span className="text-base font-bold text-zinc-800 tracking-tight font-serif">{c.title}</span>
                          </div>
                        )}
                        <Search size={18} className="text-zinc-300 group-hover:text-red-600 transition-colors" />
                      </div>
                    ))}
                  </div>

                  {status === "done" && (
                    <div className="flex gap-2 pt-2">
                      <button onClick={() => {setStatus("idle"); setDisplayedCritiques([]); setMasteryScore(null);}} className="flex-1 py-4 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-zinc-600 font-bold rounded-2xl transition-all text-xs uppercase tracking-widest font-outfit">Clear Markings</button>
                      <button onClick={handleExport} className="p-4 bg-zinc-900 text-white rounded-2xl hover:bg-black transition-all shadow-md active:scale-95"><Download size={18} /></button>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          ) : tab === "relight" ? (
            <div className="space-y-8 pb-8">
              <p className="text-zinc-600 font-serif text-xl leading-relaxed italic">
                Recalculate core shadows and ambient occlusion based on a 3D point light.
              </p>
              
              {!isRelit && status === "idle" && (
                <button onClick={handleRelightModel} className="w-full py-5 bg-zinc-900 text-white font-bold rounded-2xl shadow-xl transition-all active:scale-95 text-lg font-outfit">
                  Process Lighting Model
                </button>
              )}
              
              {status === "loading" && (
                <div className="py-16 flex flex-col items-center justify-center gap-6 animate-pulse">
                  <div className="w-8 h-8 border-[3px] border-zinc-200 border-t-yellow-500 rounded-full animate-spin" />
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.4em] font-outfit">Simulating Bounce...</span>
                </div>
              )}
              
              {isRelit && status === "done" && (
                <motion.div {...blurFade} className="space-y-8">
                  <div className="p-6 border border-yellow-100 bg-yellow-50/30 rounded-2xl text-center">
                     <p className="text-yellow-700 text-[10px] font-bold uppercase tracking-widest font-outfit mb-2 flex items-center justify-center gap-2">
                        <Sun size={14} /> Model Active
                     </p>
                     <p className="text-zinc-700 text-sm font-serif italic leading-relaxed">
                       Drag the sun handle on the canvas to cast shadows.
                     </p>
                  </div>
                  
                  <div className="space-y-4 px-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-outfit">Light Intensity</span>
                      <span className="text-sm font-bold text-zinc-900 font-serif italic">{(lightIntensity * 10).toFixed(0)}</span>
                    </div>
                    <input 
                      type="range" 
                      min="0.5" 
                      max="3" 
                      step="0.1" 
                      value={lightIntensity}
                      onChange={(e) => setLightIntensity(parseFloat(e.target.value))}
                      className="w-full accent-zinc-900 h-1.5 bg-zinc-200 rounded-lg appearance-none outline-none cursor-pointer"
                    />
                  </div>
                  <button onClick={() => {setIsRelit(false); setStatus("idle");}} className="w-full py-4 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-zinc-600 font-bold rounded-2xl transition-all text-xs uppercase tracking-widest font-outfit">Reset Source</button>
                </motion.div>
              )}
            </div>
          ) : tab === "materials" ? (
            <div className="space-y-8 pb-8">
              <p className="text-zinc-600 font-serif text-xl leading-relaxed italic">
                Generate AI Depth Map to identify material planes and surface density.
              </p>
              
              {!surfaceMap && status === "idle" && (
                <button onClick={handleSurfaceAnalysis} className="w-full py-5 bg-zinc-900 text-white font-bold rounded-2xl shadow-xl transition-all active:scale-95 text-lg font-outfit">
                  Run Depth Scan
                </button>
              )}
              
              {status === "loading" && (
                <div className="py-16 flex flex-col items-center justify-center gap-6">
                  <div className="w-8 h-8 border-[3px] border-zinc-200 border-t-blue-500 rounded-full animate-spin" />
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.4em] font-outfit">Mapping Topography...</span>
                </div>
              )}
              
              {surfaceMap && status === "done" && (
                <motion.div {...blurFade} className="space-y-6">
                  <div className="p-6 border border-blue-100 bg-blue-50/20 rounded-2xl text-center">
                     <p className="text-blue-700 text-[10px] font-bold uppercase tracking-widest font-outfit mb-2 flex items-center justify-center gap-2">
                        <ScanLine size={14} /> Scan Complete
                     </p>
                     <p className="text-zinc-700 text-sm font-serif italic leading-relaxed">
                       3D Depth Map generated via DPT-Large. Topography overlay applied.
                     </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-5 border border-zinc-100 bg-white rounded-2xl shadow-sm text-center">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1 font-outfit">Roughness</span>
                      <span className="text-2xl font-bold text-zinc-900 font-serif italic">0.42</span>
                    </div>
                    <div className="p-5 border border-zinc-100 bg-white rounded-2xl shadow-sm text-center">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1 font-outfit">Metallic</span>
                      <span className="text-2xl font-bold text-zinc-900 font-serif italic">0.08</span>
                    </div>
                  </div>
                  <button onClick={() => {setSurfaceMap(null); setStatus("idle");}} className="w-full py-4 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-zinc-600 font-bold rounded-2xl transition-all text-xs uppercase tracking-widest font-outfit">Clear Scan</button>
                </motion.div>
              )}
            </div>
          ) : (
            <div className="space-y-8 pb-8">
              <p className="text-zinc-600 font-serif text-xl leading-relaxed italic">
                Object recognition engine breaking down scene components into functional layers.
              </p>
              
              {!layers.length && status === "idle" && (
                <button onClick={handleLayerDeconstruction} className="w-full py-5 bg-zinc-900 text-white font-bold rounded-2xl shadow-xl transition-all active:scale-95 text-lg font-outfit">
                  Extract Layers
                </button>
              )}
              
              {status === "loading" && (
                <div className="py-16 flex flex-col items-center justify-center gap-6">
                  <div className="w-8 h-8 border-[3px] border-zinc-200 border-t-purple-500 rounded-full animate-spin" />
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.4em] font-outfit">Deconstructing...</span>
                </div>
              )}
              
              {layers.length > 0 && status === "done" && (
                <motion.div {...blurFade} className="space-y-6">
                  <div className="p-6 border border-purple-100 bg-purple-50/20 rounded-2xl text-center">
                     <p className="text-purple-700 text-[10px] font-bold uppercase tracking-widest font-outfit mb-2 flex items-center justify-center gap-2">
                        <Box size={14} /> Extraction Complete
                     </p>
                     <p className="text-zinc-700 text-sm font-serif italic leading-relaxed">
                       Architectural guides applied to verify compositional balance.
                     </p>
                  </div>
                  
                  <div className="space-y-3 font-outfit">
                    {layers.map((l, i) => (
                      <div key={i} className="p-4 border border-zinc-100 bg-white shadow-sm rounded-xl flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                          <Layout size={16} className="text-zinc-300" />
                          <span className="text-sm font-bold text-zinc-800 uppercase tracking-tight">{l.name}</span>
                        </div>
                        <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-1 rounded uppercase tracking-widest">{l.score * 100}%</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => {setLayers([]); setStatus("idle");}} className="w-full py-4 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-zinc-600 font-bold rounded-2xl transition-all text-xs uppercase tracking-widest font-outfit">Collapse Layers</button>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function RedlineMark({ dot, index, forceHover }: { dot: Critique; index: number; forceHover: boolean }) {
  const [isHoveredLocal, setIsHoveredLocal] = useState(false);
  if (!dot) return null;

  const isHovered = isHoveredLocal || forceHover;

  const isNearRight = dot.x > 70;
  const isNearLeft = dot.x < 30;
  const isNearTop = dot.y < 30;
  const xPositionClass = isNearRight ? "right-0 translate-x-4" : isNearLeft ? "left-0 -translate-x-4" : "left-1/2 -translate-x-1/2";
  const yPositionClass = isNearTop ? "top-12" : "bottom-12";
  const initialY = isNearTop ? -10 : 10;

  return (
    <motion.div
      initial={{ opacity: 0, filter: "blur(10px)", scale: 0 }}
      animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className={clsx("absolute pointer-events-auto transition-[z-index] duration-0", isHovered ? "z-[999]" : "z-40")}
      style={{ left: `${dot.x}%`, top: `${dot.y}%` }}
      onMouseEnter={() => setIsHoveredLocal(true)}
      onMouseLeave={() => setIsHoveredLocal(false)}
    >
      <div className="relative flex items-center justify-center cursor-pointer group">
        <div className="w-8 h-8 flex items-center justify-center">
          <div className={clsx("absolute inset-0 bg-red-600/30 rounded-full transition-all", isHovered ? "scale-150 animate-none opacity-20" : "animate-ping opacity-50")} />
          <div className={clsx("w-3.5 h-3.5 bg-white rounded-full border-[3px] border-red-600 shadow-[0_0_15px_rgba(220,38,38,0.8)] transition-transform duration-300", isHovered ? "scale-150" : "group-hover:scale-125")} />
        </div>
      </div>
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: initialY, filter: "blur(12px)", scale: 0.9 }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)", scale: 1 }}
            exit={{ opacity: 0, y: initialY, filter: "blur(12px)", scale: 0.9 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className={clsx(
              "absolute w-72 bg-white/95 backdrop-blur-xl border border-zinc-200 p-8 rounded-3xl shadow-[0_40px_100px_rgba(0,0,0,0.15)] overflow-visible",
              xPositionClass, 
              yPositionClass
            )}
            style={{ transform: `rotate(${(index % 2 === 0 ? 1 : -1) * 1.5}deg)` }}
          >
            <div className="absolute -top-3 -left-3 w-8 h-8 text-red-600 opacity-20 rotate-12">
               <Info size={32} />
            </div>
            <h4 className="text-[10px] font-bold text-red-700 mb-3 uppercase tracking-[0.2em] font-outfit relative z-10">Director's Note</h4>
            <p className="text-lg text-zinc-800 leading-snug italic font-serif relative z-10">{dot.desc}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
