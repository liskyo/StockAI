import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AIAnalysisResult, DashboardData, Source, StockPreview } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Update cache key to invalidate potentially corrupted cache
const CACHE_KEY = 'stock_winner_dashboard_cache_v3';
const CACHE_DURATION = 15 * 60 * 1000; // 15 Minutes in milliseconds

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

// --- Analysis Schema ---

const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    symbol: { type: Type.STRING },
    name: { type: Type.STRING },
    currentPrice: { type: Type.NUMBER, description: "Current real-time stock price in TWD" },
    change: { type: Type.NUMBER, description: "Price change value" },
    changePercent: { type: Type.NUMBER, description: "Price change percentage" },
    overallScore: { type: Type.NUMBER, description: "Overall score 0-100" },
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
        summary: { type: Type.STRING, description: "Institutional investor analysis" },
        details: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["score", "summary", "details"]
    },
    marketSentiment: {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.NUMBER, description: "0 (Extreme Fear) to 100 (Extreme Greed)" },
        summary: { type: Type.STRING, description: "Analysis of news and social media sentiment" },
        details: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["score", "summary", "details"]
    },
    retail: {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.NUMBER, description: "Safety score (High means low retail crowding/safe financing levels)" },
        summary: { type: Type.STRING, description: "Analysis of Financing (融資) and Short Selling (融券)" },
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
        probability: { type: Type.NUMBER, description: "Success probability percentage 0-100" },
        timeframe: { type: Type.STRING }
      },
      required: ["action", "entryPriceLow", "entryPriceHigh", "targetPrice", "stopLoss", "probability", "timeframe"]
    },
    riskAnalysis: { type: Type.STRING }
  },
  required: ["symbol", "name", "currentPrice", "change", "changePercent", "overallScore", "trend", "fundamental", "technical", "chips", "marketSentiment", "retail", "tradeSetup", "riskAnalysis"]
};

// --- Dashboard Schemas ---

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

// Deep Analysis uses PRO model for reasoning
export const analyzeStock = async (query: string): Promise<AIAnalysisResult> => {
  try {
    const prompt = `
      Act as a professional financial analyst for the Taiwan Stock Market (TWSE/TPEX).
      Target Stock: "${query}"
      
      TASK:
      1. USE GOOGLE SEARCH to find the LATEST REAL-TIME PRICE, Change, and Change% for this stock.
      2. Analyze **Fundamental**, **Technical**, and **Chips (Institutional)** status.
      3. **Market Sentiment**: Search for recent news headlines, and discussions on PTT Stock board / Dcard / Mobile01 to gauge investor sentiment (Fear vs Greed).
      4. **Retail Indicators**: Search for "融資" (Margin Buying) and "融券" (Short Selling) trends. High margin balance is usually negative (unstable chips).
      
      REQUIREMENTS:
      - Currency: TWD.
      - If searching finds multiple prices, use the most recent one.
      - **CRITICAL**: All text output (Name, Summary, Details, Risk Analysis) MUST be in **Traditional Chinese (繁體中文)**.
      
      SCORING GUIDE:
      - Sentiment Score: >80 (Overheated/Greed), <20 (Panic/Fear).
      - Retail Score: Higher is better (meaning chips are stable, financing is decreasing or low). Low score means high retail crowding (high financing).

      OUTPUT:
      - JSON object matching the schema.
    `;

    // Using gemini-3-pro-preview for deep analysis (slower but smarter)
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        tools: [{googleSearch: {}}],
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        thinkingConfig: { thinkingBudget: 1024 }
      }
    });

    if (!response.text) {
      throw new Error("No response from AI");
    }

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

// Dashboard uses FLASH model + Parallel Execution for speed + Local Caching
export const getDashboardData = async (): Promise<DashboardData> => {
    
    // 1. CHECK CACHE
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            const { timestamp, data } = JSON.parse(cached);
            const now = Date.now();
            // If cache is valid (less than CACHE_DURATION old)
            if (now - timestamp < CACHE_DURATION) {
                console.log("Using Cached Dashboard Data");
                return data;
            }
        }
    } catch (e) {
        console.warn("Cache parsing failed", e);
    }

    // 2. Define Prompts for Parallel Execution
    
    // Request A: Standard Lists (Yahoo/CMoney)
    const listsPrompt = `
        Act as a TWSE Expert. Use Google Search to fetch data from:
        - Yahoo Rank: https://tw.stock.yahoo.com/rank/yield (High Dividend), https://tw.stock.yahoo.com/rank/volume
        - CMoney Institutional: https://www.cmoney.tw/finance/f00062.aspx
        
        TASK: Return 5 arrays of stocks (3-5 items each).
        1. "trending": Yahoo Popular Volume (熱門成交).
        2. "technical": Yahoo Top Gainers (強勢漲幅).
        3. "chips": CMoney Institutional Buying (法人買超).
        4. "fundamental": High Revenue Growth (營收成長).
        5. "dividend": Yahoo High Dividend Yield (高殖利率).

        REQUIREMENTS:
        - **ALL TEXT OUTPUT MUST BE IN TRADITIONAL CHINESE (繁體中文).**
        - Ensure "dividend" list is populated.
        - If exact data is missing, infer from top search results.

        Output JSON matching schema.
    `;

    // Request B: Dynamic Strategies (Hot Topics)
    const strategiesPrompt = `
        Act as a TWSE Expert. Search for "台股 熱門族群", "主流 概念股".
        Identify 3 CURRENT HOT THEMES (e.g. CoWoS, Robot, Energy, Military).
        
        LANGUAGE REQUIREMENT:
        - **ALL TEXT OUTPUT MUST BE IN TRADITIONAL CHINESE (繁體中文).**
        
        Output JSON matching schema.
    `;

    try {
        // Execute both requests in parallel using FLASH model for speed
        // Now using responseSchema to ensure valid JSON structure
        const [listsResponse, strategiesResponse] = await Promise.all([
            ai.models.generateContent({
                model: "gemini-3-flash-preview", // Flash is 5x faster
                contents: listsPrompt,
                config: { 
                    tools: [{googleSearch: {}}], 
                    responseMimeType: "application/json",
                    responseSchema: dashboardListsSchema
                }
            }),
            ai.models.generateContent({
                model: "gemini-3-flash-preview", // Flash is 5x faster
                contents: strategiesPrompt,
                config: { 
                    tools: [{googleSearch: {}}], 
                    responseMimeType: "application/json",
                    responseSchema: strategiesSchema
                }
            })
        ]);

        const listsData = listsResponse.text ? JSON.parse(listsResponse.text) : {};
        const strategiesData = strategiesResponse.text ? JSON.parse(strategiesResponse.text) : {};

        const safeList = (list: any[]) => Array.isArray(list) ? list : [];

        const result: DashboardData = {
            trending: safeList(listsData.trending),
            fundamental: safeList(listsData.fundamental),
            technical: safeList(listsData.technical),
            chips: safeList(listsData.chips),
            dividend: safeList(listsData.dividend),
            strategies: safeList(strategiesData.strategies)
        };

        // SAVE TO CACHE
        localStorage.setItem(CACHE_KEY, JSON.stringify({
            timestamp: Date.now(),
            data: result
        }));

        return result;

    } catch (e) {
        console.error("Dashboard fetch failed", e);
        // Fallback to cache if request fails, even if expired
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
             return JSON.parse(cached).data;
        }

        // Emergency fallback data
        return {
            trending: [{ symbol: '2330', name: '台積電', price: '1000', changePercent: 0, reason: '系統維護中' }],
            fundamental: [],
            technical: [],
            chips: [],
            dividend: [],
            strategies: []
        };
    }
}