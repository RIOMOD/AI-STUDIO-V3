
import { GoogleGenAI } from "@google/genai";
import { GenerationConfig } from "../types";

/**
 * Optimizes a raw prompt or generates a new one based on multiple images and presets.
 */
export const optimizePrompt = async (
  config: Partial<GenerationConfig>,
  currentPrompt: string
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const parts: any[] = [];

  // Add multiple products as context
  config.productImages?.forEach((img, idx) => {
    parts.push({
      inlineData: { data: productImageCleanup(img), mimeType: 'image/png' }
    }, { text: `Product reference ${idx + 1}` });
  });

  // Add multiple backgrounds as context
  config.backgroundImages?.forEach((img, idx) => {
    parts.push({
      inlineData: { data: productImageCleanup(img), mimeType: 'image/png' }
    }, { text: `Background reference ${idx + 1}` });
  });

  if (config.referenceImage) {
    parts.push({
      inlineData: { data: productImageCleanup(config.referenceImage), mimeType: 'image/png' }
    }, { text: "The previously generated image to refine." });
  }

  const instruction = `
    You are a professional AI Prompt Engineer for commercial photography.
    Your task is to create a highly detailed and effective image generation prompt in ENGLISH.
    
    Context:
    - User wants to create a commercial ad.
    - Angle: ${config.anglePreset || 'Default'}
    - Theme: ${config.themePreset || 'Default'}
    - Style: ${config.stylePreset || 'Default'}
    - User input: "${currentPrompt || 'A professional product shot'}"
    
    Goal:
    - Describe the product features based on the provided images.
    - Describe a perfect commercial environment blending the provided background ideas.
    - If a 'refine' image is provided, focus on improving its lighting, composition, or specific user requests.
    - Use technical terms: 'volumetric lighting', 'subsurface scattering', 'depth of field', '8k resolution', 'raytracing'.
    - Keep output under 80 words.
    - Return ONLY the optimized prompt text.
  `;

  parts.push({ text: instruction });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts }
    });
    return response.text?.trim() || currentPrompt;
  } catch (error) {
    console.error("Prompt optimization failed:", error);
    return currentPrompt;
  }
};

export const generateCommercialImage = async (config: GenerationConfig): Promise<string> => {
  const modelName = config.useProModel ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';
  
  if (config.useProModel) {
    const hasKey = await (window as any).aistudio?.hasSelectedApiKey?.();
    if (!hasKey) {
      await (window as any).aistudio?.openSelectKey?.();
    }
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  let basePrompt = config.prompt || "Professional commercial advertisement photography";
  const modifiers: string[] = [];

  if (config.anglePreset) modifiers.push(config.anglePreset);
  if (config.themePreset) modifiers.push(config.themePreset);
  if (config.stylePreset) modifiers.push(config.stylePreset);

  const modifierString = modifiers.length > 0 ? ` [Artistic Context: ${modifiers.join(', ')}]` : '';
  
  const parts: any[] = [];

  // Add up to 3 most relevant products/backgrounds to avoid overloading the model
  config.productImages.slice(0, 3).forEach((img) => {
    parts.push({ inlineData: { data: productImageCleanup(img), mimeType: 'image/png' } });
  });

  config.backgroundImages.slice(0, 2).forEach((img) => {
    parts.push({ inlineData: { data: productImageCleanup(img), mimeType: 'image/png' } });
  });

  if (config.referenceImage) {
    parts.push({ inlineData: { data: productImageCleanup(config.referenceImage), mimeType: 'image/png' } });
    basePrompt = `REFINEMENT TASK: Use the provided image as a base. Modify it according to this new request: ${basePrompt}. Keep the core product and layout but improve quality and lighting.`;
  } else if (config.productImages.length > 0 && config.backgroundImages.length > 0) {
    basePrompt = `COMPOSITING TASK: Take the product features from the first few images and place them realistically into the environment from the subsequent images. ${basePrompt}.`;
  }

  parts.push({ text: `${basePrompt}.${modifierString}` });

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: { parts },
      config: {
        imageConfig: {
          aspectRatio: config.aspectRatio,
          ...(config.useProModel ? { imageSize: config.imageSize } : {})
        }
      }
    });

    let imageUrl = '';
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        imageUrl = `data:image/png;base64,${part.inlineData.data}`;
        break;
      }
    }

    if (!imageUrl) throw new Error('EMPTY_RESPONSE');
    return imageUrl;
  } catch (error: any) {
    const errorMessage = error?.message || "";
    if (errorMessage.includes("permission") || errorMessage.includes("403") || errorMessage.includes("401")) {
      throw new Error("AUTH_ERROR");
    }
    throw error;
  }
};

const productImageCleanup = (base64: string) => {
  if (base64.includes(',')) return base64.split(',')[1];
  return base64;
};

export const generateBatchImages = async (config: GenerationConfig, count: number): Promise<string[]> => {
  const results: string[] = [];
  const errors: any[] = [];

  if (count === 1) {
    const res = await generateCommercialImage(config);
    return [res];
  }

  const chunkSize = config.useProModel ? 2 : 4;
  
  for (let i = 0; i < count; i += chunkSize) {
    const currentChunkCount = Math.min(chunkSize, count - i);
    const tasks = Array.from({ length: currentChunkCount }, () => generateCommercialImage(config));
    
    const chunkResults = await Promise.all(tasks.map(p => p.catch(e => {
      errors.push(e);
      return null;
    })));
    
    chunkResults.forEach(r => { if (r) results.push(r); });

    if (errors.some(e => e?.message === "AUTH_ERROR")) {
      throw new Error("AUTH_ERROR");
    }
    
    if (i + chunkSize < count) {
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }

  if (results.length === 0 && errors.length > 0) throw errors[0];
  return results;
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};
