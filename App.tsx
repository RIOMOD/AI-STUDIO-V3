
import React, { useState, useRef } from 'react';
import { 
  Camera, 
  Wand2, 
  Download, 
  History, 
  Layers, 
  Settings2,
  Trash2,
  X,
  Upload,
  Zap,
  ShieldCheck,
  LayoutGrid,
  ImagePlus,
  Compass,
  Palette,
  Clock,
  CheckCircle2,
  Sparkles,
  Loader2,
  Edit3,
  RefreshCw,
  Plus,
  Play,
  FileUp
} from 'lucide-react';
import { 
  GeneratedImage, 
  GenerationConfig, 
  AspectRatio, 
  ImageSize, 
  STYLE_PRESETS, 
  ANGLE_PRESETS, 
  THEME_PRESETS 
} from './types';
import { generateBatchImages, fileToBase64, optimizePrompt } from './services/geminiService';
import LoadingOverlay from './components/LoadingOverlay';

const App: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [history, setHistory] = useState<GeneratedImage[]>([]);
  const [currentBatch, setCurrentBatch] = useState<string[]>([]);
  const [productImages, setProductImages] = useState<string[]>([]);
  const [backgroundImages, setBackgroundImages] = useState<string[]>([]);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isDraggingProduct, setIsDraggingProduct] = useState(false);
  const [isDraggingBackground, setIsDraggingBackground] = useState(false);
  const [config, setConfig] = useState<Omit<GenerationConfig, 'prompt' | 'productImages' | 'backgroundImages' | 'referenceImage'>>({
    aspectRatio: "1:1",
    imageSize: "1K",
    stylePreset: "none",
    anglePreset: "",
    themePreset: "",
    useProModel: false,
    batchCount: 4,
  });

  const productInputRef = useRef<HTMLInputElement>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);

  const processFiles = async (files: File[], type: 'product' | 'background') => {
    const currentList = type === 'product' ? productImages : backgroundImages;
    const remainingSlots = 5 - currentList.length;
    if (remainingSlots <= 0) return;

    const filesToProcess = files.slice(0, remainingSlots);
    const base64s = await Promise.all(filesToProcess.map(fileToBase64));
    
    if (type === 'product') {
      setProductImages(prev => [...prev, ...base64s].slice(0, 5));
    } else {
      setBackgroundImages(prev => [...prev, ...base64s].slice(0, 5));
    }
  };

  const runGeneration = async (generationConfig: GenerationConfig) => {
    setIsGenerating(true);
    try {
      const results = await generateBatchImages(generationConfig, generationConfig.batchCount);
      
      setCurrentBatch(results);
      
      const newHistoryItems: GeneratedImage[] = results.map((url, idx) => ({
        id: `${Date.now()}-${idx}`,
        url,
        prompt: generationConfig.prompt || "Ad Render",
        timestamp: Date.now(),
        aspectRatio: generationConfig.aspectRatio,
        config: { ...generationConfig }
      }));
      
      setHistory(prev => [...newHistoryItems, ...prev].slice(0, 50));
    } catch (error: any) {
      console.error("Batch generation failed:", error);
      if (error?.message === "AUTH_ERROR") {
        const confirmRetry = window.confirm("Lỗi xác thực (403/401). Vui lòng chọn lại API Key.");
        if (confirmRetry) (window as any).aistudio?.openSelectKey?.();
      } else {
        alert("Lỗi tạo ảnh: " + (error?.message || "Lỗi hệ thống"));
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt && productImages.length === 0 && backgroundImages.length === 0 && !referenceImage) {
      alert("Vui lòng nhập mô tả hoặc tải ảnh lên.");
      return;
    }

    const currentGenerationConfig: GenerationConfig = {
      ...config,
      prompt: prompt || "Professional commercial advertisement",
      productImages,
      backgroundImages,
      referenceImage: referenceImage || undefined
    };

    await runGeneration(currentGenerationConfig);
  };

  const handleQuickRetry = async (item: GeneratedImage) => {
    setPrompt(item.config.prompt);
    setProductImages(item.config.productImages);
    setBackgroundImages(item.config.backgroundImages);
    setReferenceImage(item.config.referenceImage || null);
    setConfig({
      aspectRatio: item.config.aspectRatio,
      imageSize: item.config.imageSize,
      stylePreset: item.config.stylePreset,
      anglePreset: item.config.anglePreset || "",
      themePreset: item.config.themePreset || "",
      useProModel: item.config.useProModel,
      batchCount: item.config.batchCount,
    });

    await runGeneration(item.config);
  };

  const handleOptimizePrompt = async () => {
    if (!prompt && productImages.length === 0 && backgroundImages.length === 0) {
      alert("Please provide at least one asset or text context to optimize.");
      return;
    }
    setIsOptimizing(true);
    try {
      const optimized = await optimizePrompt(
        { 
          ...config, 
          productImages, 
          backgroundImages,
          referenceImage: referenceImage || undefined 
        },
        prompt
      );
      setPrompt(optimized);
    } catch (error) {
      console.error("Optimization error", error);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'product' | 'background') => {
    // Explicitly cast FileList items to File array to satisfy TypeScript requirements
    const files = Array.from(e.target.files || []) as File[];
    processFiles(files, type);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent, type: 'product' | 'background') => {
    e.preventDefault();
    if (type === 'product') setIsDraggingProduct(false);
    else setIsDraggingBackground(false);

    // Explicitly cast FileList items to File array to ensure type safety for property 'type'
    const files = (Array.from(e.dataTransfer.files) as File[]).filter(file => file.type.startsWith('image/'));
    processFiles(files, type);
  };

  const handleDragOver = (e: React.DragEvent, type: 'product' | 'background') => {
    e.preventDefault();
    if (type === 'product') setIsDraggingProduct(true);
    else setIsDraggingBackground(true);
  };

  const handleDragLeave = (e: React.DragEvent, type: 'product' | 'background') => {
    e.preventDefault();
    if (type === 'product') setIsDraggingProduct(false);
    else setIsDraggingBackground(false);
  };

  const removeImage = (index: number, type: 'product' | 'background') => {
    if (type === 'product') {
      setProductImages(prev => prev.filter((_, i) => i !== index));
    } else {
      setBackgroundImages(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleRefine = (url: string) => {
    setReferenceImage(url);
    const sidebar = document.querySelector('aside');
    if (sidebar) sidebar.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const downloadImage = (url: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `vn-ad-studio-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-200">
      {isGenerating && <LoadingOverlay />}

      {/* Header */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-lg shadow-lg">
            <Camera size={24} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-white leading-tight tracking-tight">AI Ad Studio</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1">
              Vietnam Studio Pro <span className="w-1 h-1 rounded-full bg-slate-700"></span> 2025 Edition
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-slate-900/80 rounded-full p-1 border border-slate-800">
             <button 
              onClick={() => setConfig({...config, useProModel: false})}
              className={`px-4 py-1.5 rounded-full text-[10px] font-black transition-all uppercase tracking-wider ${
                !config.useProModel 
                  ? 'bg-slate-700 text-white' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Flash
            </button>
            <button 
              onClick={() => setConfig({...config, useProModel: true})}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black transition-all uppercase tracking-wider ${
                config.useProModel 
                  ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Zap size={12} fill={config.useProModel ? "currentColor" : "none"} />
              Gemini 3 Pro
            </button>
          </div>
          <div className="h-6 w-px bg-slate-800"></div>
          <button className="text-slate-500 hover:text-white" title="Settings">
            <Settings2 size={20} />
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-85 border-r border-slate-800 bg-slate-900 flex flex-col overflow-y-auto custom-scrollbar">
          <div className="p-5 space-y-8">
            {/* Multi-Asset Selection */}
            <section className="space-y-4">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <Layers size={14} /> Product Assets ({productImages.length}/5)
              </label>
              <div 
                className={`flex flex-wrap gap-2 p-3 rounded-xl border-2 border-dashed transition-all ${
                  isDraggingProduct ? 'border-indigo-500 bg-indigo-500/10 scale-[1.02]' : 'border-slate-800 bg-slate-950/30'
                }`}
                onDragOver={(e) => handleDragOver(e, 'product')}
                onDragLeave={(e) => handleDragLeave(e, 'product')}
                onDrop={(e) => handleDrop(e, 'product')}
              >
                {productImages.map((img, idx) => (
                  <div key={idx} className="relative w-14 h-14 rounded-lg overflow-hidden border border-slate-700 group shadow-lg">
                    <img src={img} className="w-full h-full object-cover" />
                    <button 
                      onClick={() => removeImage(idx, 'product')}
                      className="absolute top-0 right-0 p-0.5 bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
                {productImages.length < 5 && (
                  <button 
                    onClick={() => productInputRef.current?.click()}
                    className="w-14 h-14 rounded-lg border border-dashed border-slate-700 flex flex-col items-center justify-center hover:bg-slate-800 transition-colors text-slate-500 hover:text-indigo-400"
                  >
                    <Plus size={16} />
                    <span className="text-[8px] font-bold mt-0.5 uppercase">Drop</span>
                  </button>
                )}
                {productImages.length === 0 && !isDraggingProduct && (
                  <div className="w-full py-4 flex flex-col items-center justify-center text-slate-600 pointer-events-none">
                    <FileUp size={20} className="mb-1 opacity-20" />
                    <p className="text-[9px] font-bold uppercase tracking-tight">Drag products here</p>
                  </div>
                )}
              </div>
              <input type="file" ref={productInputRef} multiple onChange={(e) => handleImageUpload(e, 'product')} className="hidden" accept="image/*" />

              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2 pt-2">
                <ImagePlus size={14} /> Background Sets ({backgroundImages.length}/5)
              </label>
              <div 
                className={`flex flex-wrap gap-2 p-3 rounded-xl border-2 border-dashed transition-all ${
                  isDraggingBackground ? 'border-emerald-500 bg-emerald-500/10 scale-[1.02]' : 'border-slate-800 bg-slate-950/30'
                }`}
                onDragOver={(e) => handleDragOver(e, 'background')}
                onDragLeave={(e) => handleDragLeave(e, 'background')}
                onDrop={(e) => handleDrop(e, 'background')}
              >
                {backgroundImages.map((img, idx) => (
                  <div key={idx} className="relative w-14 h-14 rounded-lg overflow-hidden border border-slate-700 group shadow-lg">
                    <img src={img} className="w-full h-full object-cover" />
                    <button 
                      onClick={() => removeImage(idx, 'background')}
                      className="absolute top-0 right-0 p-0.5 bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
                {backgroundImages.length < 5 && (
                  <button 
                    onClick={() => backgroundInputRef.current?.click()}
                    className="w-14 h-14 rounded-lg border border-dashed border-slate-700 flex flex-col items-center justify-center hover:bg-slate-800 transition-colors text-slate-500 hover:text-emerald-400"
                  >
                    <Plus size={16} />
                    <span className="text-[8px] font-bold mt-0.5 uppercase">Drop</span>
                  </button>
                )}
                {backgroundImages.length === 0 && !isDraggingBackground && (
                  <div className="w-full py-4 flex flex-col items-center justify-center text-slate-600 pointer-events-none">
                    <FileUp size={20} className="mb-1 opacity-20" />
                    <p className="text-[9px] font-bold uppercase tracking-tight">Drag backgrounds here</p>
                  </div>
                )}
              </div>
              <input type="file" ref={backgroundInputRef} multiple onChange={(e) => handleImageUpload(e, 'background')} className="hidden" accept="image/*" />
            </section>

            {/* Prompt & Optimize */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Creative Brief</label>
                <button 
                  onClick={handleOptimizePrompt}
                  disabled={isOptimizing}
                  className="flex items-center gap-1 text-[10px] font-black text-indigo-400 hover:text-indigo-300 transition-colors bg-indigo-500/10 px-2 py-1 rounded-md border border-indigo-500/20 disabled:opacity-50"
                >
                  {isOptimizing ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                  AI OPTIMIZE
                </button>
              </div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ex: Elegant watch on a white marble surface..."
                className="w-full h-24 bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder:text-slate-600 focus:ring-1 focus:ring-indigo-500 outline-none resize-none transition-all"
              />
            </section>

            {/* Refinement (Reference) Context */}
            {referenceImage && (
              <section className="space-y-3 p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-xl">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                    <RefreshCw size={12} /> Refinement Active
                  </label>
                  <button onClick={() => setReferenceImage(null)} className="text-slate-500 hover:text-red-400">
                    <X size={12} />
                  </button>
                </div>
                <div className="relative w-full aspect-square rounded-lg overflow-hidden border border-indigo-500/30">
                  <img src={referenceImage} className="w-full h-full object-cover opacity-60" />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-[10px] font-bold text-white bg-indigo-600/80 px-2 py-1 rounded uppercase">Current Base</span>
                  </div>
                </div>
                <p className="text-[9px] text-slate-500 italic">Adjust your brief above to modify this image.</p>
              </section>
            )}

            {/* Variations Count */}
            <section className="space-y-3">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <LayoutGrid size={14} /> Output Variations
              </label>
              <div className="flex gap-2">
                {[1, 2, 4, 8].map((count) => (
                  <button
                    key={count}
                    onClick={() => setConfig({ ...config, batchCount: count })}
                    className={`flex-1 py-2 rounded-lg text-[10px] font-black border transition-all ${
                      config.batchCount === count
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </section>

            {/* Presets Grid */}
            <div className="space-y-6">
              <section className="space-y-3">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <Compass size={14} /> Perspective
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {ANGLE_PRESETS.map((angle) => (
                    <button
                      key={angle.id}
                      onClick={() => setConfig({ ...config, anglePreset: angle.prompt })}
                      className={`p-2 rounded-lg text-[10px] font-bold text-left border transition-all ${
                        config.anglePreset === angle.prompt
                          ? 'bg-indigo-600 border-indigo-500 text-white'
                          : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}
                    >
                      {angle.name}
                    </button>
                  ))}
                </div>
              </section>

              <section className="space-y-3">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <Palette size={14} /> Campaign Theme
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {THEME_PRESETS.map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => setConfig({ ...config, themePreset: theme.prompt })}
                      className={`p-2 rounded-lg text-[10px] font-bold text-left border transition-all ${
                        config.themePreset === theme.prompt
                          ? 'bg-emerald-600 border-emerald-500 text-white'
                          : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}
                    >
                      {theme.name}
                    </button>
                  ))}
                </div>
              </section>

              <section className="space-y-3">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <Wand2 size={14} /> Art Direction
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {STYLE_PRESETS.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => setConfig({ ...config, stylePreset: style.prompt })}
                      className={`p-2 rounded-lg text-[10px] font-bold text-left border transition-all ${
                        config.stylePreset === style.prompt
                          ? 'bg-indigo-600 border-indigo-500 text-white'
                          : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}
                    >
                      {style.name}
                    </button>
                  ))}
                </div>
              </section>
            </div>

            {/* Ratio & Model */}
            <section className="space-y-3">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Aspect Ratio</label>
              <div className="flex flex-wrap gap-2">
                {(["1:1", "4:3", "3:4", "16:9", "9:16"] as AspectRatio[]).map((ratio) => (
                  <button
                    key={ratio}
                    onClick={() => setConfig({ ...config, aspectRatio: ratio })}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                      config.aspectRatio === ratio
                        ? 'bg-white text-slate-950 border-white'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </section>
          </div>

          <div className="mt-auto p-5 border-t border-slate-800 bg-slate-900/80 sticky bottom-0 z-10">
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white font-black py-4 rounded-xl shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-3 transition-all active:scale-95 uppercase text-xs tracking-widest"
            >
              <LayoutGrid size={18} />
              Render Variations
            </button>
          </div>
        </aside>

        {/* Workspace */}
        <section className="flex-1 bg-slate-950 p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
          {currentBatch.length > 0 ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wide">
                    <LayoutGrid size={16} /> Latest Render
                  </h2>
                  <div className="flex gap-2">
                    <span className="text-[9px] font-black bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1">
                      <CheckCircle2 size={10} /> {currentBatch.length} VARS GENERATED
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => { setCurrentBatch([]); setReferenceImage(null); }}
                  className="text-xs font-bold text-slate-500 hover:text-white flex items-center gap-1 px-3 py-1 rounded-lg border border-slate-800"
                >
                  <X size={14} /> Clear Results
                </button>
              </div>
              
              <div className={`grid gap-6 ${
                currentBatch.length === 1 ? 'grid-cols-1 max-w-2xl mx-auto' : 
                currentBatch.length === 2 ? 'grid-cols-2 max-w-4xl mx-auto' :
                'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
              }`}>
                {currentBatch.map((img, idx) => (
                  <div key={idx} className="group relative aspect-square bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl transition-all hover:scale-[1.02] hover:shadow-indigo-500/10">
                    <img src={img} className="w-full h-full object-cover" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all flex flex-col justify-end p-4">
                      <div className="flex gap-2 mb-2">
                        <button 
                          onClick={() => downloadImage(img)}
                          className="flex-1 bg-white text-slate-950 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-indigo-50 transition-all flex items-center justify-center gap-1"
                        >
                          <Download size={14} /> Save
                        </button>
                        <button 
                          onClick={() => handleRefine(img)}
                          className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-indigo-500 transition-all flex items-center justify-center gap-1"
                        >
                          <Edit3 size={14} /> Refine
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center max-w-2xl mx-auto space-y-10">
              <div className="relative">
                <div className="absolute -inset-10 bg-indigo-500/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="relative w-32 h-32 bg-slate-900 border border-slate-800 rounded-[2.5rem] flex items-center justify-center shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                  <Camera size={56} className="text-indigo-500/40" />
                </div>
              </div>
              <div className="space-y-4">
                <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic">Professional AI Ad Studio</h2>
                <p className="text-slate-500 text-sm leading-relaxed font-medium">
                  Upload up to 5 products and 5 background references. Gemini AI will blend them seamlessly into professional advertisement imagery. Use the <b>Refine</b> tool to iterate on specific results.
                </p>
              </div>
              
              <div className="grid grid-cols-3 gap-6 w-full pt-4">
                {[
                  { icon: <Clock size={18}/>, title: "Rapid Rendering", desc: "Sequential GPU Batching" },
                  { icon: <ShieldCheck size={18}/>, title: "Advanced Blending", desc: "AI Visual Compositing" },
                  { icon: <Edit3 size={18}/>, title: "Smart Refine", desc: "Modify specific renders" }
                ].map((feature, i) => (
                  <div key={i} className="p-5 rounded-3xl bg-slate-900/40 border border-slate-800/50">
                    <div className="text-indigo-500 mb-3 flex justify-center">{feature.icon}</div>
                    <p className="text-[10px] font-black text-slate-200 uppercase mb-1 tracking-wider">{feature.title}</p>
                    <p className="text-[9px] text-slate-500 uppercase font-bold tracking-tight">{feature.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* History */}
          {history.length > 0 && (
            <div className="mt-12 space-y-4 pt-8 border-t border-slate-900">
              <div className="flex items-center justify-between text-slate-500">
                <div className="flex items-center gap-3">
                  <History size={16} />
                  <h3 className="text-[10px] font-black uppercase tracking-widest">Studio History</h3>
                </div>
                <button onClick={() => setHistory([])} className="text-[9px] font-bold hover:text-red-400 uppercase">Wipe Cache</button>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-8 custom-scrollbar">
                {history.map((item) => (
                  <div key={item.id} className="flex-shrink-0 group relative">
                    <button
                      onClick={() => {
                        setCurrentBatch([item.url]);
                        setPrompt(item.config.prompt);
                        setProductImages(item.config.productImages);
                        setBackgroundImages(item.config.backgroundImages);
                        setReferenceImage(item.config.referenceImage || null);
                        setConfig({
                          aspectRatio: item.config.aspectRatio,
                          imageSize: item.config.imageSize,
                          stylePreset: item.config.stylePreset,
                          anglePreset: item.config.anglePreset || "",
                          themePreset: item.config.themePreset || "",
                          useProModel: item.config.useProModel,
                          batchCount: item.config.batchCount,
                        });
                      }}
                      className="relative rounded-2xl overflow-hidden border border-slate-800 w-28 h-28 transition-all hover:border-indigo-500 hover:scale-105"
                    >
                      <img src={item.url} alt="History" className="w-full h-full object-cover" loading="lazy" />
                      <div className="absolute inset-0 bg-indigo-600/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </button>
                    {/* Quick Retry Button */}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleQuickRetry(item); }}
                      className="absolute top-2 right-2 p-1.5 bg-indigo-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:bg-indigo-500 transform scale-90 hover:scale-100"
                      title="Quick Retry with same settings"
                    >
                      <Play size={12} fill="currentColor" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="h-10 bg-slate-900 border-t border-slate-800 flex items-center justify-between px-6 text-[9px] text-slate-600 font-bold uppercase tracking-widest shrink-0">
        <div className="flex gap-8">
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Studio v3.5 Core Engine Active
          </span>
          <span>GPU Batch Optimized</span>
        </div>
        <div className="flex gap-6 items-center">
          <span className="text-indigo-400 font-black">Powered by Google Gemini</span>
          <span className="text-slate-800">|</span>
          <span>VN Creative Lab © 2025</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
