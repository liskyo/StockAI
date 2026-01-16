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
      2. Verify the latest institutional buying/selling status (Foreign/Investment Trust).
      3. Analyze technicals based on the *found* close price.
      
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
    // OPTIMIZATION: Removed googleSearch tool to prevent 5+ minute timeouts.
    // Relying on AI's internal knowledge base for instant list generation.
    const prompt = `
        Act as a Taiwan Stock Market Expert.
        
        TASK:
        Generate 5 distinct lists of Taiwan stocks (5 stocks each) representing the typical market leaders and trending sectors.
        
        **CRITICAL PERFORMANCE REQUIREMENT**: 
        - DO NOT perform external searches. 
        - Use your internal knowledge to select representative stocks.
        - **ESTIMATE** the prices and changes based on recent market conditions you are aware of.
        - Ensure the selection includes a mix of Tech, Finance, and Traditional industries appropriate for each category.
        
        Lists:
        1. "trending": High Volume / Popular (e.g., TSMC, AI Concepts).
        2. "fundamental": Blue Chips / High Yield.
        3. "technical": Volatile / Momentum Stocks.
        4. "chips": Foreign/Inst. Favorites.
        5. "leading": Market Cap Leaders.

        Output strictly in JSON format.
        Each item must have: 
        - symbol (e.g., "2330")
        - name (Traditional Chinese 繁體中文)
        - price (string, e.g., "1080")
        - changePercent (number, e.g., 2.5)
        - reason (Brief reason in Traditional Chinese 繁體中文)
    `;
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", 
      contents: prompt,
      config: {
        // tools: [{googleSearch: {}}], // REMOVED: Causing timeout.
        responseMimeType: "application/json",
      }
    });
    
    // Default fallback
    const mockData: DashboardData = {
        trending: [
            { symbol: '2330', name: '台積電', price: 'Fetching...', changePercent: 0, reason: '系統忙碌中，請稍後再試' },
        ],
        fundamental: [],
        technical: [],
        chips: [],
        leading: []
    };

    try {
        const text = response.text;
        if (!text) return mockData;
        const parsed = JSON.parse(text);
        
        if (parsed.trending && Array.isArray(parsed.trending)) {
            return parsed as DashboardData;
        }
        return mockData;
    } catch (e) {
        console.error("Dashboard data fetch failed", e);
        return mockData;
    }
}