import { GoogleGenAI, Type } from "@google/genai";
import { AIAnalysisResult, DashboardData, Source } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Schema for structured output
const analysisSchema = {
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
  required: ["symbol", "name", "currentPrice", "change", "changePercent", "overallScore", "trend", "fundamental", "technical", "chips", "tradeSetup", "riskAnalysis"]
};

export const analyzeStock = async (query: string): Promise<AIAnalysisResult> => {
  try {
    const prompt = `
      Act as a professional financial analyst for the Taiwan Stock Market (TWSE/TPEX).
      Target Stock: "${query}"
      
      TASK:
      1. USE GOOGLE SEARCH to find the LATEST REAL-TIME PRICE, Change, and Change% for this stock.
      2. Verify the latest institutional buying/selling status (Foreign/Investment Trust) similar to data found on CMoney.
      3. Analyze technicals based on the *found* close price similar to Yahoo Finance charts.
      
      REQUIREMENTS:
      - Currency: TWD.
      - If searching finds multiple prices, use the most recent one.
      - If the market is closed, use the last close price.
      - **CRITICAL**: All text output (Name, Summary, Details, Risk Analysis) MUST be in **Traditional Chinese (繁體中文)**.
      
      OUTPUT:
      - JSON object matching the schema.
    `;

    // Using gemini-3-pro-preview with Google Search tool
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

    // Extract citations
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
    const prompt = `
        Act as a Taiwan Stock Market Expert.
        
        TASK 1: STANDARD LISTS
        Use Google Search to find the **LATEST** market rankings for Taiwan Stocks (TWSE/TPEX).
        Retrieve 3-5 distinct stocks for each:
        1. "trending": Search for "Yahoo股市 熱門成交排行".
        2. "fundamental": Search for "CMoney 績優股" or "台股 營收成長排行".
        3. "technical": Search for "Yahoo股市 強勢漲幅排行".
        4. "chips": Search for "CMoney 法人買超排行榜".
        5. "leading": Search for "台股 權值股排名".

        TASK 2: DYNAMIC MARKET STRATEGIES (Hot Topics)
        Search for "台股 熱門族群", "Yahoo股市 概念股排行", "CMoney 選股網 熱門選股" to identify **3 CURRENTLY TRENDING THEMES** (e.g., "AI Cooling", "Earthquake Reconstruction", "Military Industry", "High Dividend ETF").
        Create 3 distinct strategy groups based on what you find.
        
        REQUIREMENTS:
        - **USE REAL DATA** from search results.
        - Output strictly in JSON format matching the schema.
        - Text must be Traditional Chinese (繁體中文).
        
        OUTPUT SCHEMA:
        {
          "trending": [ { "symbol": "2330", "name": "台積電", "price": "1000", "changePercent": 1.2, "reason": "..." }, ... ],
          "fundamental": [ ... ],
          "technical": [ ... ],
          "chips": [ ... ],
          "leading": [ ... ],
          "strategies": [
             {
               "id": "strategy_1",
               "name": "Strategy Name (e.g. 散熱模組)",
               "description": "Short description of why this is hot (e.g. NVDA effect)",
               "source": "Yahoo/CMoney",
               "stocks": [ ... 3-5 stocks ... ]
             },
             { "id": "strategy_2", ... },
             { "id": "strategy_3", ... }
          ]
        }
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-pro-preview", 
            contents: prompt,
            config: {
                tools: [{googleSearch: {}}],
                responseMimeType: "application/json",
            }
        });

        const text = response.text;
        if (!text) throw new Error("Empty response");
        
        const parsed = JSON.parse(text);
        
        const safeList = (list: any[]) => Array.isArray(list) ? list : [];

        return {
            trending: safeList(parsed.trending),
            fundamental: safeList(parsed.fundamental),
            technical: safeList(parsed.technical),
            chips: safeList(parsed.chips),
            leading: safeList(parsed.leading),
            strategies: safeList(parsed.strategies) // Dynamic strategies
        };
    } catch (e) {
        console.error("Dashboard real-time fetch failed", e);
        
        // Fallback
        return {
            trending: [{ symbol: '2330', name: '台積電', price: '1080', changePercent: 1.5, reason: '系統繁忙，顯示預設值' }],
            fundamental: [],
            technical: [],
            chips: [],
            leading: [],
            strategies: [
                {
                    id: 'fallback_1',
                    name: 'AI 伺服器 (預設)',
                    description: '資料載入失敗，顯示預設 AI 概念股。',
                    source: 'System',
                    stocks: [{ symbol: '3231', name: '緯創', price: '110', changePercent: 0.5, reason: 'AI' }]
                }
            ]
        };
    }
}