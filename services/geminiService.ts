import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AIAnalysisResult, DashboardData, Source, StockPreview } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const CACHE_KEY = 'stock_winner_dashboard_cache_v3';

// Helper to determine the "data period"
// The cycle refreshes at 12:00 PM daily.
// Any time between Day N 12:00 PM and Day N+1 11:59 AM belongs to the same period.
const getCachePeriodId = (timestamp: number): string => {
  const date = new Date(timestamp);
  // Subtract 12 hours. 
  // If time is >= 12:00, it stays in current day.
  // If time is < 12:00, it goes to previous day.
  // The resulting date string uniquely identifies the period.
  date.setHours(date.getHours() - 12);
  return date.toDateString();
};

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
      properties: {
        score: { type: Type.NUMBER },
        summary: { type: Type.STRING },
        details: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["score", "summary", "details"]
    },
    technical: {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.NUMBER },
        summary: { type: Type.STRING },
        details: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["score", "summary", "details"]
    },
    chips: {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.NUMBER },
        summary: { type: Type.STRING },
        details: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["score", "summary", "details"]
    },
    industry: {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.NUMBER },
        summary: { type: Type.STRING },
        details: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["score", "summary", "details"]
    },
    marketSentiment: {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.NUMBER },
        summary: { type: Type.STRING },
        details: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["score", "summary", "details"]
    },
    retail: {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.NUMBER },
        summary: { type: Type.STRING },
        details: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
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
  required: ["symbol", "name", "currentPrice", "change", "changePercent", "overallScore", "trend", "fundamental", "technical", "chips", "industry", "marketSentiment", "retail", "tradeSetup", "riskAnalysis"]
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
    const now = new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei', hour12: false });
    
    // Explicitly add "即時股價" (Real-time price) to the search context for the model
    const prompt = `
      Current System Time (Taiwan): ${now}
      Target Stock: "${query}"
      
      **CRITICAL INSTRUCTION FOR PRICE DATA:**
      1. You MUST use Google Search with the query: "${query} 即時股價" or "${query} stock price live".
      2. **VERIFY THE TIMESTAMP:** Ensure the price you find is from TODAY (${now.split(' ')[0]}).
      3. **DO NOT** use the "Previous Close" (昨日收盤) as the "currentPrice". 
      4. Look for the large, bold number indicating the specific **current trading price**.
      
      TASK:
      1. Get the REAL-TIME price, change, and percentage.
      2. Analyze Fundamental, Technical, Chips, Industry/Macro, Market Sentiment, and Retail Indicators.
      
      CRITICAL SCORING RULES (STRICTLY FOLLOW):
      Calculate the 'overallScore' (0-100) based on this 6-point weighted formula:
      
      1. Fundamentals (30%): EPS, ROE, Revenue Growth, Dividend Yield.
      2. Technicals (20%): MA Lines, KD, RSI, MACD trend.
      3. Chips (Institutional) (15%): Foreign Investor & Investment Trust buying/selling.
      4. Industry & Macro (15%): 
         - Is the sector (e.g., AI, Shipping, Finance) currently trending UP or DOWN? 
         - Is the global macro environment favorable? 
         - (Score > 80 if sector is Hot; < 40 if sector is facing headwinds).
      5. Retail Indicators (10%) [CONTRARIAN]: 
         - High Financing Increase / High Retail Buy -> NEGATIVE Score.
         - Decreasing Financing / Retail Sell -> POSITIVE Score.
      6. Market Sentiment/News (10%): Short-term news impact.
      
      REQUIREMENTS:
      - All text must be Traditional Chinese (繁體中文).
      - Risk Analysis: Specifically explain if the score is dragged down by short-term factors, retail crowding, or bad industry trends.
    `;

    const config: any = {
      tools: [{googleSearch: {}}],
      responseMimeType: "application/json",
      responseSchema: analysisSchema,
    };

    if (mode === 'pro') {
      config.thinkingConfig = { thinkingBudget: 16384 }; // Enable deep reasoning for Pro
    }

    const response = await ai.models.generateContent({
      model: mode === 'pro' ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview',
      contents: prompt,
      config: config
    });

    if (!response.text) throw new Error("No response");

    const data = JSON.parse(response.text) as AIAnalysisResult;
    data.timestamp = now; // Use the captured time

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
            
            // Check if cache is still valid based on 12:00 PM cutoff
            const currentPeriod = getCachePeriodId(Date.now());
            const cachedPeriod = getCachePeriodId(timestamp);

            if (currentPeriod === cachedPeriod) {
                return data;
            }
        }
    } catch (e) {
        console.error("Cache read error", e);
    }

    const listsPrompt = `Fetch standard market ranking lists for TWSE. Traditional Chinese.`;
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
        // Fallback to cache if network fails, even if expired
        const cached = localStorage.getItem(CACHE_KEY);
        return cached ? JSON.parse(cached).data : { trending: [], fundamental: [], technical: [], chips: [], dividend: [], strategies: [] };
    }
}
