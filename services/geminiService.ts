import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AIAnalysisResult, DashboardData, Source, StockPreview } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const CACHE_KEY = 'stock_winner_dashboard_cache_v4';
const CACHE_DURATION = 15 * 60 * 1000;

// --- Shared Schemas ---
const stockPreviewSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    symbol: { type: Type.STRING },
    name: { type: Type.STRING },
    price: { type: Type.STRING },
    changePercent: { type: Type.NUMBER },
    reason: { type: Type.STRING }
  },
  required: ["symbol", "name", "price", "changePercent", "reason"]
};

const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    symbol: { type: Type.STRING },
    name: { type: Type.STRING },
    currentPrice: { type: Type.NUMBER },
    change: { type: Type.NUMBER },
    changePercent: { type: Type.NUMBER },
    overallScore: { type: Type.NUMBER },
    trend: { type: Type.STRING, enum: ["BULLISH", "BEARISH", "NEUTRAL"] },
    fundamental: {
      type: Type.OBJECT,
      properties: { score: { type: Type.NUMBER }, summary: { type: Type.STRING }, details: { type: Type.ARRAY, items: { type: Type.STRING } } },
      required: ["score", "summary", "details"]
    },
    technical: {
      type: Type.OBJECT,
      properties: { score: { type: Type.NUMBER }, summary: { type: Type.STRING }, details: { type: Type.ARRAY, items: { type: Type.STRING } } },
      required: ["score", "summary", "details"]
    },
    chips: {
      type: Type.OBJECT,
      properties: { score: { type: Type.NUMBER }, summary: { type: Type.STRING }, details: { type: Type.ARRAY, items: { type: Type.STRING } } },
      required: ["score", "summary", "details"]
    },
    institutionalEngine: {
      type: Type.OBJECT,
      properties: {
        phase: { type: Type.STRING, enum: ["LAYOUT", "TRIAL", "RETREAT"] },
        leadingActor: { type: Type.STRING },
        continuityScore: { type: Type.NUMBER },
        confidence: { type: Type.NUMBER },
        warningSignals: { type: Type.ARRAY, items: { type: Type.STRING } },
        description: { type: Type.STRING }
      },
      required: ["phase", "leadingActor", "continuityScore", "confidence", "warningSignals", "description"]
    },
    marketSentiment: {
      type: Type.OBJECT,
      properties: { score: { type: Type.NUMBER }, summary: { type: Type.STRING }, details: { type: Type.ARRAY, items: { type: Type.STRING } } },
      required: ["score", "summary", "details"]
    },
    retail: {
      type: Type.OBJECT,
      properties: { score: { type: Type.NUMBER }, summary: { type: Type.STRING }, details: { type: Type.ARRAY, items: { type: Type.STRING } } },
      required: ["score", "summary", "details"]
    },
    tradeSetup: {
      type: Type.OBJECT,
      properties: {
        action: { type: Type.STRING, enum: ["BUY", "SELL", "HOLD"] },
        entryPriceLow: { type: Type.NUMBER },
        entryPriceHigh: { type: Type.NUMBER },
        targetPrice: { type: Type.NUMBER },
        stopLoss: { type: Type.NUMBER },
        probability: { type: Type.NUMBER },
        timeframe: { type: Type.STRING }
      },
      required: ["action", "entryPriceLow", "entryPriceHigh", "targetPrice", "stopLoss", "probability", "timeframe"]
    },
    riskAnalysis: { type: Type.STRING }
  },
  required: ["symbol", "name", "currentPrice", "change", "changePercent", "overallScore", "trend", "fundamental", "technical", "chips", "institutionalEngine", "marketSentiment", "retail", "tradeSetup", "riskAnalysis"]
};

const dashboardListsSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    trending: { type: Type.ARRAY, items: stockPreviewSchema },
    fundamental: { type: Type.ARRAY, items: stockPreviewSchema },
    technical: { type: Type.ARRAY, items: stockPreviewSchema },
    chips: { type: Type.ARRAY, items: stockPreviewSchema },
    dividend: { type: Type.ARRAY, items: stockPreviewSchema }
  },
  required: ["trending", "fundamental", "technical", "chips", "dividend"]
};

const strategiesSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    strategies: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          name: { type: Type.STRING },
          description: { type: Type.STRING },
          source: { type: Type.STRING },
          stocks: { type: Type.ARRAY, items: stockPreviewSchema }
        },
        required: ["id", "name", "description", "source", "stocks"]
      }
    }
  }
};

export const analyzeStock = async (query: string, mode: 'flash' | 'pro' = 'flash'): Promise<AIAnalysisResult> => {
  try {
    const prompt = `
      Act as a Professional Institutional Data Scientist for the Taiwan Stock Market.
      Stock: "${query}"
      
      CORE ENGINE MISSION:
      Implement a "State Machine" logic to identify the current institutional behavior phase:
      1. LAYOUT (🟢佈局期): Consistent, gentle accumulation by major actors.
      2. TRIAL (🟡試單期): Inconsistent buying/selling, testing market depth.
      3. RETREAT (🔴撤退期): Strengthening selling, broken buy streaks, or volume-price divergence.
      
      ANALYSIS DIMENSIONS:
      - Continuity: Days of consecutive net buy/sell.
      - Acceleration: Strength of buying/selling change.
      - Divergence: Price vs Institutional flow consistency.
      - Identify the "Leading Actor" (Who is currently controlling the price?).
      
      Output must be in Traditional Chinese.
    `;

    const config: any = {
      tools: [{googleSearch: {}}],
      responseMimeType: "application/json",
      responseSchema: analysisSchema,
    };

    if (mode === 'pro') {
      config.thinkingConfig = { thinkingBudget: 20000 };
    }

    const response = await ai.models.generateContent({
      model: mode === 'pro' ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview',
      contents: prompt,
      config: config
    });

    if (!response.text) throw new Error("No response");

    const data = JSON.parse(response.text) as AIAnalysisResult;
    data.timestamp = new Date().toLocaleString('zh-TW');

    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
        data.sources = chunks
            .map((c: any) => c.web)
            .filter((w: any) => w !== undefined)
            .map((w: any) => ({ title: w.title || 'Source', uri: w.uri || '#' }));
    }
    
    return data;
  } catch (error) {
    console.error("Analysis failed:", error);
    throw error;
  }
};

export const getDashboardData = async (): Promise<DashboardData> => {
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            const { timestamp, data } = JSON.parse(cached);
            if (Date.now() - timestamp < CACHE_DURATION) return data;
        }
    } catch (e) {}

    const listsPrompt = `Fetch standard market ranking lists for TWSE from Yahoo/CMoney. Traditional Chinese.`;
    const strategiesPrompt = `Identify 3 current hot market themes/concepts for TWSE. Traditional Chinese.`;

    try {
        const [listsResponse, strategiesResponse] = await Promise.all([
            ai.models.generateContent({
                model: "gemini-3-flash-preview",
                contents: listsPrompt,
                config: { tools: [{googleSearch: {}}], responseMimeType: "application/json", responseSchema: dashboardListsSchema }
            }),
            ai.models.generateContent({
                model: "gemini-3-flash-preview",
                contents: strategiesPrompt,
                config: { tools: [{googleSearch: {}}], responseMimeType: "application/json", responseSchema: strategiesSchema }
            })
        ]);

        const listsData = listsResponse.text ? JSON.parse(listsResponse.text) : {};
        const strategiesData = strategiesResponse.text ? JSON.parse(strategiesResponse.text) : {};

        const result: DashboardData = {
            trending: listsData.trending || [],
            fundamental: listsData.fundamental || [],
            technical: listsData.technical || [],
            chips: listsData.chips || [],
            dividend: listsData.dividend || [],
            strategies: strategiesData.strategies || []
        };

        localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data: result }));
        return result;
    } catch (e) {
        const cached = localStorage.getItem(CACHE_KEY);
        return cached ? JSON.parse(cached).data : { trending: [], fundamental: [], technical: [], chips: [], dividend: [], strategies: [] };
    }
}