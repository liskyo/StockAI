
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
  dividend: StockPreview[];    // Yahoo 高殖利率
  strategies: StrategyGroup[]; // Dynamic Strategies from current market
}

export interface AnalysisSection {
  score: number; // 0-100
  summary: string;
  details: string[];
}

export interface TimeframeStrategy {
  action: 'BUY' | 'SELL' | 'HOLD' | 'OBSERVE';
  priceTarget: string; // e.g., "100-105"
  suggestion: string; // Brief advice
}

// New professional institutional engine types
export interface InstitutionalEngine {
  phase: 'LAYOUT' | 'TRIAL' | 'RETREAT'; // 佈局, 試單, 撤退
  leadingActor: string; // e.g., "外資", "投信", "自營商"
  continuityScore: number; // 連續性 0-100
  confidence: number; // 狀態信心值 0-100
  warningSignals: string[]; // 翻臉預警
  description: string; // 聽誰的話
  
  // New specific strategies
  shortTermStrategy: TimeframeStrategy;  // 1-3 Days
  mediumTermStrategy: TimeframeStrategy; // 1-3 Weeks
  longTermStrategy: TimeframeStrategy;   // 1-3 Months
}

export interface TradeSetup {
  action: 'BUY' | 'SELL' | 'HOLD';
  entryPriceLow: number;
  entryPriceHigh: number;
  targetPrice: number;
  stopLoss: number;
  probability: number; // 0-100%
  timeframe: string; // e.g., "2-4 Weeks"
}

export interface Source {
  title: string;
  uri: string;
}

export interface AIAnalysisResult {
  symbol: string;
  name: string;
  timestamp: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  overallScore: number;
  trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  
  fundamental: AnalysisSection;
  technical: AnalysisSection;
  chips: AnalysisSection;
  
  // Advanced Engine
  institutionalEngine: InstitutionalEngine;
  
  marketSentiment: AnalysisSection;
  retail: AnalysisSection;
  
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
