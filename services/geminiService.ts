import { GoogleGenAI, Type } from "@google/genai";
import { AIAnalysisResult, DashboardData, Source, StockPreview } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Schema for structured output (Analysis)
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

// Deep Analysis uses PRO model for reasoning
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

// Dashboard uses FLASH model + Parallel Execution for speed
export const getDashboardData = async (): Promise<DashboardData> => {
    
    // 1. Static Data (Instant, no API cost/time)
    const staticLeading: StockPreview[] = [
        { symbol: '2330', name: '台積電', price: '1080', changePercent: 0, reason: '權值龍頭' },
        { symbol: '2317', name: '鴻海', price: '210', changePercent: 0, reason: '權值股' },
        { symbol: '2454', name: '聯發科', price: '1250', changePercent: 0, reason: 'IC設計龍頭' },
        { symbol: '2308', name: '台達電', price: '380', changePercent: 0, reason: '權值股' },
        { symbol: '2881', name: '富邦金', price: '90', changePercent: 0, reason: '金融權值' }
    ];

    // 2. Define Prompts for Parallel Execution
    
    // Request A: Standard Lists (Yahoo/CMoney)
    const listsPrompt = `
        Act as a TWSE Expert. Use Google Search to fetch data from:
        - Yahoo Rank: https://tw.stock.yahoo.com/rank/
        - CMoney Institutional: https://www.cmoney.tw/finance/f00062.aspx
        
        TASK: Return 4 arrays of stocks (3-5 items each).
        1. "trending": Yahoo Popular Volume (熱門成交).
        2. "technical": Yahoo Top Gainers (強勢漲幅).
        3. "chips": CMoney Institutional Buying (法人買超).
        4. "fundamental": High Revenue Growth (營收成長).

        LANGUAGE REQUIREMENT:
        - **ALL TEXT OUTPUT MUST BE IN TRADITIONAL CHINESE (繁體中文).**
        - Do not use English for names or reasons.

        Output JSON: { "trending": [...], "technical": [...], "chips": [...], "fundamental": [...] }
        Each item example: { "symbol": "2330", "name": "台積電", "price": "1000", "changePercent": 1.5, "reason": "外資連買三日 (繁體中文)" }
    `;

    // Request B: Dynamic Strategies (Hot Topics)
    const strategiesPrompt = `
        Act as a TWSE Expert. Search for "台股 熱門族群", "主流 概念股".
        Identify 3 CURRENT HOT THEMES (e.g. CoWoS, Robot, Energy, Military).
        
        LANGUAGE REQUIREMENT:
        - **ALL TEXT OUTPUT MUST BE IN TRADITIONAL CHINESE (繁體中文).**
        
        Output JSON: { 
          "strategies": [
            { 
              "id": "s1", "name": "題材名稱(繁體中文)", "description": "熱門原因(繁體中文)", "source": "新聞來源",
              "stocks": [{ "symbol": "...", "name": "...", "price": "...", "changePercent": 0, "reason": "..." }] 
            } 
          ]
        }
    `;

    try {
        // Execute both requests in parallel using FLASH model for speed
        const [listsResponse, strategiesResponse] = await Promise.all([
            ai.models.generateContent({
                model: "gemini-3-flash-preview", // Flash is 5x faster
                contents: listsPrompt,
                config: { tools: [{googleSearch: {}}], responseMimeType: "application/json" }
            }),
            ai.models.generateContent({
                model: "gemini-3-flash-preview", // Flash is 5x faster
                contents: strategiesPrompt,
                config: { tools: [{googleSearch: {}}], responseMimeType: "application/json" }
            })
        ]);

        const listsData = listsResponse.text ? JSON.parse(listsResponse.text) : {};
        const strategiesData = strategiesResponse.text ? JSON.parse(strategiesResponse.text) : {};

        const safeList = (list: any[]) => Array.isArray(list) ? list : [];

        return {
            trending: safeList(listsData.trending),
            fundamental: safeList(listsData.fundamental),
            technical: safeList(listsData.technical),
            chips: safeList(listsData.chips),
            leading: staticLeading, // Instant return
            strategies: safeList(strategiesData.strategies)
        };

    } catch (e) {
        console.error("Dashboard fetch failed", e);
        return {
            trending: [{ symbol: '2330', name: '台積電', price: '-', changePercent: 0, reason: '載入失敗' }],
            fundamental: [],
            technical: [],
            chips: [],
            leading: staticLeading,
            strategies: []
        };
    }
}