
export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
  aspectRatio: string;
  config: GenerationConfig;
}

export type AspectRatio = "1:1" | "3:4" | "4:3" | "9:16" | "16:9";
export type ImageSize = "1K" | "2K" | "4K";

export interface GenerationConfig {
  prompt: string;
  negativePrompt?: string;
  aspectRatio: AspectRatio;
  imageSize: ImageSize;
  stylePreset: string;
  anglePreset?: string;
  themePreset?: string;
  useProModel: boolean;
  batchCount: number;
  productImages: string[]; // Up to 5
  backgroundImages: string[]; // Up to 5
  referenceImage?: string; // Used for refining a previously generated image
}

export const STYLE_PRESETS = [
  { id: 'none', name: 'Original', prompt: '' },
  { id: 'cinematic', name: 'Cinematic', prompt: 'cinematic lighting, dramatic shadows, professional photography, high contrast' },
  { id: 'minimalist', name: 'Minimalist', prompt: 'minimalist design, clean background, soft lighting, elegant, simple' },
  { id: 'luxury', name: 'Luxury', prompt: 'luxury aesthetic, gold accents, premium material texture, expensive feel, high-end' },
  { id: 'vibrant', name: 'Vibrant', prompt: 'vibrant colors, energetic atmosphere, bright pop, commercial studio lighting' },
  { id: 'organic', name: 'Organic', prompt: 'natural elements, eco-friendly vibe, soft daylight, earthy tones, sustainable look' },
  { id: 'cyberpunk', name: 'Cyberpunk', prompt: 'neon lights, high-tech, futuristic aesthetic, dark background with blue and pink glows' },
];

export const ANGLE_PRESETS = [
  { id: 'none', name: 'Auto Angle', prompt: '' },
  { id: 'eye-level', name: 'Eye Level', prompt: 'eye level shot, straight-on perspective' },
  { id: 'top-down', name: 'Top Down', prompt: 'top-down view, flat lay photography' },
  { id: 'low-angle', name: 'Low Angle', prompt: 'low angle hero shot, looking up at the product' },
  { id: 'close-up', name: 'Close-up', prompt: 'macro photography, close-up shot, shallow depth of field' },
  { id: 'side-view', name: 'Side View', prompt: 'side profile view, side perspective' },
  { id: 'isometric', name: 'Isometric', prompt: 'isometric perspective, 45 degree angle view' },
];

export const THEME_PRESETS = [
  { id: 'none', name: 'Default', prompt: '' },
  { id: 'tech', name: 'Tech/Modern', prompt: 'modern technology lab, futuristic workbench, clean digital aesthetic' },
  { id: 'nature', name: 'Nature/Garden', prompt: 'lush garden setting, morning sunlight through leaves, natural outdoors' },
  { id: 'cosmetics', name: 'Beauty/Cosmetic', prompt: 'high-end cosmetic display, liquid ripples, soft pastel colors, elegant lighting' },
  { id: 'beverage', name: 'Beverage/Ice', prompt: 'chilled environment, condensation droplets, ice cubes, refreshing splashing water' },
  { id: 'urban', name: 'Urban/Street', prompt: 'gritty urban street, concrete textures, blurred city bokeh background' },
  { id: 'home', name: 'Interior/Home', prompt: 'cozy modern living room, soft home interior lighting, lifestyle background' },
];
