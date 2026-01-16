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

export interface DashboardData {
  trending: StockPreview[];
  fundamental: StockPreview[];
  technical: StockPreview[];
  chips: StockPreview[];
  leading: StockPreview[];
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
  
  fundamental: AnalysisSection;
  technical: AnalysisSection;
  chips: AnalysisSection; // Institutional holdings/flow
  
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