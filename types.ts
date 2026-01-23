export interface StockMetadata {
  symbol: string;
  name: string;
  sector?: string;
  price?: number;
  changePercent?: number;
}

export interface StockPreview {
  symbol: string;
  name: string;
  price: string;
  changePercent: number;
  reason: string; // Why it is in this list
}

export interface StrategyGroup {
  id: string;          // e.g., "strategy_1"
  name: string;        // e.g., "重電綠能", "CoWoS概念"
  description: string; // e.g., "受惠台電強韌電網計畫..."
  source: string;      // e.g., "Yahoo 類股"
  stocks: StockPreview[];
}

export interface DashboardData {
  trending: StockPreview[];    // Yahoo 熱門
  fundamental: StockPreview[]; // CMoney 績優
  technical: StockPreview[];   // Yahoo 強勢
  chips: StockPreview[];       // CMoney 法人
  dividend: StockPreview[];    // Yahoo 高殖利率 (Replaced Leading)
  strategies: StrategyGroup[]; // Dynamic Strategies from current market
}

export interface AnalysisSection {
  score: number; // 0-100
  summary: string;
  details: string[];
}

export interface TradeSetup {
  action: 'BUY' | 'SELL' | 'HOLD';
  entryPriceLow: number;
  entryPriceHigh: number;
  targetPrice: number;
  stopLoss: number;
  probability: number; // 0-100%
  timeframe: string; // e.g., "2-4 Weeks"
  riskRewardRatio: string; // e.g. "1:3"
}

export interface Source {
  title: string;
  uri: string;
}

export interface AIAnalysisResult {
  symbol: string;
  name: string;
  timestamp: string;
  
  // Real-time market data
  currentPrice: number;
  change: number;
  changePercent: number;

  overallScore: number; // 0-100
  trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  
  // Critical Warning Flags (New)
  warningFlags: string[]; // e.g. ["⚠️ 處置股票", "🐋 隔日沖進駐", "📉 融資過高"]

  fundamental: AnalysisSection;
  technical: AnalysisSection;
  chips: AnalysisSection; // Institutional holdings/flow
  
  // New Dimensions
  industry: AnalysisSection;        // Industry trends & Macro environment
  marketSentiment: AnalysisSection; // News, Social Media, Fear/Greed
  retail: AnalysisSection;          // Financing, Short Selling, Retail participation
  
  tradeSetup: TradeSetup;
  riskAnalysis: string;
  sources?: Source[];
}

export enum AnalysisStatus {
  IDLE,
  LOADING,
  SUCCESS,
  ERROR
}