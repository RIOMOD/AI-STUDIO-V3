
import React, { useState, useRef } from 'react';
import { 
  Camera, 
  Image as ImageIcon, 
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
  ChevronRight,
  LayoutGrid,
  ImagePlus,
  Compass,
  Palette,
  AlertCircle,
  Clock,
  CheckCircle2,
  Sparkles,
  Loader2,
  ArrowUpRight,
  Edit3
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

  const handleOptimizePrompt = async () => {
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

  const handleGenerate = async () => {
    if (!prompt && productImages.length === 0 && backgroundImages.length === 0 && !referenceImage) {
      alert("Vui lòng nhập mô tả hoặc tải ảnh lên.");
      return;
    }
    
    setIsGenerating(true);
    try {
      const results = await generateBatchImages({
        ...config,
        prompt: prompt || "Professional commercial advertisement",
        productImages,
        backgroundImages,
        referenceImage: referenceImage || undefined
      }, config.batchCount);
      
      setCurrentBatch(results);
      
      const newHistoryItems: GeneratedImage[] = results.map((url, idx) => ({
        id: `${Date.now()}-${idx}`,
        url,
        prompt: prompt || "Ad Render",
        timestamp: Date.now(),
        aspectRatio: config.aspectRatio,
        config: { ...config, prompt, productImages, backgroundImages, referenceImage: referenceImage || undefined }
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'product' | 'background') => {
    const files = Array.from(e.target.files || []);
    const remainingSlots = 5 - (type === 'product' ? productImages.length : backgroundImages.length);
    const filesToProcess = files.slice(0, remainingSlots);

    const base64s = await Promise.all(filesToProcess.map(fileToBase64));
    if (type === 'product') {
      setProductImages(prev => [...prev, ...base64s].slice(0, 5));
    } else {
      setBackgroundImages(prev => [...prev, ...base64s].slice(0, 5));
    }
    e.target.value = '';
  };

  const handleRefine = (url: string) => {
    setReferenceImage(url);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    alert("Đã đặt ảnh này làm cơ sở (Refine). Bạn có thể thay đổi Prompt hoặc Settings để render lại.");
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

      <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-lg shadow-lg">
            <Camera size={24} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-white leading-tight tracking-tight uppercase italic">AI Ad Studio</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1">
              Multi-Asset Pro Edition <span className="w-1 h-1 rounded-full bg-slate-700"></span> 2025
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-slate-900/80 rounded-full p-1 border border-slate-800">
             <button 
              onClick={() => setConfig({...config, useProModel: false})}
              className={`px-4 py-1.5 rounded-full text-[10px] font-black transition-all uppercase tracking-wider ${
                !config.useProModel ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Flash
            </button>
            <button 
              onClick={() => setConfig({...config, useProModel: true})}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black transition-all uppercase tracking-wider ${
                config.useProModel ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Zap size={12} fill={config.useProModel ? "currentColor" : "none"} />
              Gemini 3 Pro
            </button>
          </div>
          <div className="h-6 w-px bg-slate-800"></div>
          <button className="text-slate-50