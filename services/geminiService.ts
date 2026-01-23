import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AIAnalysisResult, DashboardData, Source, StockPreview } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const CACHE_KEY = 'stock_winner_dashboard_cache_v3';

// Helper to determine the "data period"
const getCachePeriodId = (timestamp: number): string => {
  const date = new Date(timestamp);
  date.setHours(date.getHours() - 12);
  return date.toDateString();
};

// --- Retry Helper ---
const retryWithBackoff = async <T>(fn: () => Promise<T>, retries = 5, delay = 4000): Promise<T> => {
    try {
        return await fn();
    } catch (err: any) {
        const isRateLimit = 
            err?.status === 429 || 
            err?.code === 429 || 
            err?.statusText === 'RESOURCE_EXHAUSTED' ||
            (err?.message && (err.message.includes('429') || err.message.includes('quota'))) ||
            err?.error?.code === 429 || 
            err?.error?.status === 'RESOURCE_EXHAUSTED';
            
        if (retries > 0 && isRateLimit) {
            console.warn(`Quota exceeded. Retrying in ${delay}ms... (${retries} retries left)`);
            await new Promise(r => setTimeout(r, delay));
            return retryWithBackoff(fn, retries - 1, delay * 2);
        }
        throw err;
    }
}

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
    warningFlags: { type: Type.ARRAY, items: { type: Type.STRING } },
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
        timeframe: { type: Type.STRING },
        riskRewardRatio: { type: Type.STRING }
      },
      required: ["action", "entryPriceLow", "entryPriceHigh", "targetPrice", "stopLoss", "probability", "timeframe", "riskRewardRatio"]
    },
    riskAnalysis: { type: Type.STRING }
  },
  required: ["symbol", "name", "currentPrice", "change", "changePercent", "overallScore", "trend", "warningFlags", "fundamental", "technical", "chips", "industry", "marketSentiment", "retail", "tradeSetup", "riskAnalysis"]
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
    const dateObj = new Date();
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    const seconds = String(dateObj.getSeconds()).padStart(2, '0');
    
    const now = `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;

    // Refined prompt to force Yahoo Finance / Google Finance specific searches
    const prompt = `
      Current System Time (Taiwan): ${now}
      Target Stock: "${query}"

      **ROLE**: You are a VETERAN Taiwan Stock Market Analyst (20+ years experience).

      **CRITICAL SEARCH INSTRUCTIONS (EXECUTE IN ORDER)**:
      1. **REAL-TIME PRICE (HIGHEST PRIORITY)**: 
         - Perform a search specifically for: "${query} 股價 Yahoo 奇摩股市".
         - ALSO search for: "${query} stock price Google Finance".
         - **EXTRACTION RULE**: Look for the large, bold numbers in the search result snippets. 
         - If Taiwan Market is OPEN (09:00-13:30 GMT+8), find the "成交 (Last/Match)" price. 
         - If Taiwan Market is CLOSED, find the "收盤 (Close)" price.
         - **Do not** use prices from news articles older than 1 hour. Use the financial data snippet.

      2. **CHIP INSIDER**: Search "${query} 隔日沖 券商", "${query} 主力籌碼", "${query} 凱基台北". 
      3. **REGULATORY**: Search "${query} 處置股", "${query} 注意股".
      4. **RETAIL**: Search "${query} 融資餘額".

      **SCORING LOGIC (UPDATED)**:
      Calculate 'overallScore' based on the following weighted formula. 
      **IMPORTANT: Risk Alerts must strictly penalize specific categories.**

      1. **Chips (Institutional) (30%)**: 
         - **PENALTY RULE**: If "Day Trading Whales" (隔日沖) or "Institutional Selling" is detected, this score MUST be < 40.
      
      2. **Fundamentals (20%)**: EPS, Revenue Growth.
      
      3. **Technicals (15%)**: 
         - **PENALTY RULE**: If "Disposition Stock" (處置/注意股), volume is fake. Score MUST be < 50.
      
      4. **Industry (15%)**: Sector trend.

      5. **Retail / Counter-Indicator (10%)**: 
         - **PENALTY RULE**: If Margin Debt (融資) is high/increasing while price drops, score MUST be < 30.

      6. **Market Sentiment (10%)**: 
         - News impact, PTT/Forum discussion heat. 
         - Good news = High score, Bad news = Low score.

      **KILLER FLAGS (Populate 'warningFlags' array)**:
      - If Disposition Stock -> Add "⚠️ 處置股票 (流動性風險)"
      - If Day Trading Whales detected -> Add "🐋 隔日沖進駐 (短線賣壓)"
      - If Margin Debt High -> Add "📉 融資過高 (多殺多風險)"

      **STRATEGY: LONG-ONLY (做多策略)**:
      - This user ONLY plays LONG positions (Buy Low, Sell High). Do NOT suggest Shorting.
      - **If TREND IS BEARISH**:
        - Focus on **"Where is the Structural Support?"** (跌深反彈點/攤平點).
        - Set 'entryPriceLow' and 'entryPriceHigh' to the major SUPPORT level below current price where users should "Average Down" (攤平).
        - Set 'action' to **"HOLD"** (Meaning: Wait for price to drop to this level).
        - **DO NOT** suggest 'SELL' unless the company is going bankrupt. If it's just a downtrend, suggest "Wait for Support".
      - **If TREND IS BULLISH**:
        - Focus on **"Breakout or Pullback Entry"**.
        - Set 'action' to **"BUY"** (Enter Now).
      
      **OUTPUT REQUIREMENTS**:
      - **currentPrice**: Must be the exact number found in Step 1.
      - **tradeSetup**: 
         - **action**: 'BUY' (Aggressive Entry), 'HOLD' (Wait for Dip/Support), 'SELL' (Take Profit).
         - **entryPriceLow/High**: The ideal price to start buying or averaging down.
      - **Language**: Traditional Chinese (繁體中文).
    `;

    const config: any = {
      tools: [{googleSearch: {}}],
      responseMimeType: "application/json",
      responseSchema: analysisSchema,
    };

    if (mode === 'pro') {
      config.thinkingConfig = { thinkingBudget: 16384 };
    }

    const response = await retryWithBackoff(() => 
      ai.models.generateContent({
        model: mode === 'pro' ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview',
        contents: prompt,
        config: config
      })
    );

    if (!response.text) throw new Error("No response");

    const data = JSON.parse(response.text) as AIAnalysisResult;
    data.timestamp = now;

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

    // Force Yahoo Finance search for trending lists to get better price data accuracy in dashboard
    const listsPrompt = `Fetch standard market ranking lists for TWSE (Taiwan Stock Exchange) from Yahoo Finance Taiwan (Yahoo 奇摩股市). 
    I need: 
    1. Trending/Volume Leaders (熱門)
    2. Top Gainers (強勢)
    3. High Dividend (高殖利率)
    
    For Fundamental and Chips, use general financial news knowledge.
    Output in Traditional Chinese.`;
    
    const strategiesPrompt = `Identify 3 current hot market themes/concepts for TWSE. Traditional Chinese.`;

    try {
        const listsResponse = await retryWithBackoff(() => 
            ai.models.generateContent({
                model: "gemini-3-flash-preview",
                contents: listsPrompt,
                config: { tools: [{googleSearch: {}}], responseMimeType: "application/json", responseSchema: dashboardListsSchema }
            })
        );

        await new Promise(r => setTimeout(r, 1000));

        const strategiesResponse = await retryWithBackoff(() => 
            ai.models.generateContent({
                model: "gemini-3-flash-preview",
                contents: strategiesPrompt,
                config: { tools: [{googleSearch: {}}], responseMimeType: "application/json", responseSchema: strategiesSchema }
            })
        );

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