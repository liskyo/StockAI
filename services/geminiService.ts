import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AIAnalysisResult, DashboardData, Source, StockPreview } from "../types";

declare const __API_KEYS__: string[];
declare const __API_KEY__: string;

// Module-level counter for Round-Robin rotation
let keyIndexCounter = 0;

const getAI = () => {
  // Vite replaces __API_KEYS__ with the literal array at build time
  const envKeys = (typeof __API_KEYS__ !== 'undefined' ? __API_KEYS__ : []);

  const validKeys = Array.isArray(envKeys) && envKeys.length > 0
    ? envKeys
    : [(typeof __API_KEY__ !== 'undefined' ? __API_KEY__ : '')].filter(Boolean);

  console.log(`[StockAI] Debug - Loaded ${validKeys.length} API Keys`);

  // Round-Robin Selection
  const currentIndex = keyIndexCounter % validKeys.length;
  const apiKey = validKeys[currentIndex];
  keyIndexCounter++; // Increment for next call

  if (!apiKey) {
    console.error("[StockAI] CRITICAL ERROR: No Valid API Key found. Env vars might be missing.");
  } else {
    // Log masked key for verification (first 4 chars and last 4 chars)
    console.log(`[StockAI] Using Key Index ${currentIndex} (Starts with: ${apiKey.substring(0, 4)}... Ends with: ...${apiKey.slice(-4)})`);
  }

  return new GoogleGenAI({ apiKey });
};

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

// Hardcoded Leading Stocks (權值股) for Instant Loading
const staticLeadingStocks: StockPreview[] = [
  { symbol: '2330', name: '台積電', price: '估算中...', changePercent: 0, reason: '半導體龍頭' },
  { symbol: '2317', name: '鴻海', price: '估算中...', changePercent: 0, reason: '電子代工龍頭' },
  { symbol: '2454', name: '聯發科', price: '估算中...', changePercent: 0, reason: 'IC設計龍頭' },
  { symbol: '2308', name: '台達電', price: '估算中...', changePercent: 0, reason: '電源管理龍頭' },
  { symbol: '2382', name: '廣達', price: '估算中...', changePercent: 0, reason: 'AI伺服器龍頭' }
];

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
      - **FORMAT**: Return ONLY a valid, raw JSON object matching the schema. Do NOT use Markdown code blocks (\`\`\`json).

      SCORING GUIDE:
      - Sentiment Score: > 80(Overheated / Greed), <20 (Panic / Fear).
      - Retail Score: Higher is better(meaning chips are stable, financing is decreasing or low).Low score means high retail crowding(high financing).

      OUTPUT:
    - JSON object matching the schema.
    `;

    // Using gemini-2.0-flash-exp for deep analysis (Fast & Smart)
    // Retry logic: Try up to validKeys.length times
    const maxRetries = 10; // Cap at 10 to avoid infinite loops if all keys fail
    let lastError;

    // Helper to clean JSON string from markdown
    const parseCleanJSON = (text: string): any => {
      try {
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanText);
      } catch (e) {
        throw new Error("Failed to parse AI JSON response: " + e.message);
      }
    };

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const ai = getAI(); // Rotation happens here

        const response = await ai.models.generateContent({
          model: "gemini-2.0-flash-exp",
          contents: prompt,
          config: {
            tools: [{ googleSearch: {} }],
            // REMOVE strict JSON enforcement to avoid "Tool use with response mime type unsupported" error
          }
        });

        if (!response.text) {
          throw new Error("No response from AI");
        }

        const data = parseCleanJSON(response.text) as AIAnalysisResult;
        data.timestamp = new Date().toLocaleString('zh-TW');

        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (chunks) {
          data.sources = chunks
            .map((c: any) => c.web)
            .filter((w: any) => w !== undefined)
            .map((w: any) => ({ title: w.title || 'Source', uri: w.uri || '#' }));
        }

        return data; // Success!

      } catch (error: any) {
        console.warn(`[StockAI] Attempt ${attempt + 1} failed:`, error.message);
        lastError = error;

        await new Promise(r => setTimeout(r, 1000));
      }
    }

    throw lastError || new Error("All API attempts failed.");
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
    const maxRetries = 5;
    let listsResponse, strategiesResponse;

    // Helper to fetch with retry
    // Helper to fetch with retry
    const fetchWithRetry = async (model: string, prompt: string) => { // Removed schema arg as we are untyping config
      let lastErr;
      for (let i = 0; i < maxRetries; i++) {
        try {
          const ai = getAI();
          // Relaxed config: No responseMimeType to support tool use. 
          // Relying on prompt instruction "Output JSON matching schema".
          const res = await ai.models.generateContent({
            model: model,
            contents: prompt + "\nRETURN ONLY RAW JSON. NO MARKDOWN.",
            config: {
              tools: [{ googleSearch: {} }],
            }
          });

          if (!res.text) throw new Error("Empty response");

          // Clean markdown
          const cleanText = res.text.replace(/```json/g, '').replace(/```/g, '').trim();
          return JSON.parse(cleanText);

        } catch (e: any) {
          console.warn(`[StockAI] Dashboard fetch attempt ${i + 1} failed:`, e.message);
          lastErr = e;
          await new Promise(r => setTimeout(r, 1000));
        }
      }
      throw lastErr;
    };

    const [listsData, strategiesData] = await Promise.all([
      fetchWithRetry("gemini-2.0-flash-exp", listsPrompt),
      fetchWithRetry("gemini-2.0-flash-exp", strategiesPrompt)
    ]);

    // Parsing is now done inside fetchWithRetry, so listsData IS the object.
    // Ensure fallback if somehow undefined
    const validListsData = listsData || {};
    const validStrategiesData = strategiesData || {};

    const safeList = (list: any[]) => Array.isArray(list) ? list : [];

    const result: DashboardData = {
      leading: staticLeadingStocks,
      trending: safeList(validListsData.trending),
      fundamental: safeList(validListsData.fundamental),
      technical: safeList(validListsData.technical),
      chips: safeList(validListsData.chips),
      dividend: safeList(validListsData.dividend),
      strategies: safeList(validStrategiesData.strategies)
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
      leading: staticLeadingStocks,
      trending: [{ symbol: '2330', name: '台積電', price: '1000', changePercent: 0, reason: '系統維護中' }],
      fundamental: [],
      technical: [],
      chips: [],
      dividend: [],
      strategies: []
    };
  }
}