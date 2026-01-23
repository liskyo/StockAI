import React, { useEffect } from 'react';
import { AIAnalysisResult } from '../types';
import RadialChart from './RadialChart';
import { 
  Target, 
  ShieldAlert, 
  DollarSign, 
  BarChart2, 
  Users,
  ExternalLink,
  ArrowUp,
  ArrowDown,
  MessageCircleHeart,
  User,
  Scale,
  Globe,
  RefreshCw,
  AlertTriangle,
  Siren,
  HelpCircle
} from 'lucide-react';

interface StockDetailProps {
  data: AIAnalysisResult;
  onBack: () => void;
  onRefresh: (symbol: string) => void;
}

const StockDetail: React.FC<StockDetailProps> = ({ data, onBack, onRefresh }) => {
  const isBullish = data.trend === 'BULLISH';
  const isBearish = data.trend === 'BEARISH';
  const themeColor = isBullish ? 'text-neon-green' : isBearish ? 'text-neon-red' : 'text-gray-400';
  const borderColor = isBullish ? 'border-neon-green' : isBearish ? 'border-neon-red' : 'border-gray-500';

  const isPositive = (data.change || 0) > 0;
  const isNegative = (data.change || 0) < 0;
  const priceColor = isPositive ? 'text-neon-red' : isNegative ? 'text-neon-green' : 'text-white'; // TW market

  // Calculate Risk/Reward Visualization Data
  const entryPrice = (data.tradeSetup?.entryPriceHigh + data.tradeSetup?.entryPriceLow) / 2;
  const stopLoss = data.tradeSetup?.stopLoss;
  const targetPrice = data.tradeSetup?.targetPrice;
  
  // Calculate distances
  const riskDistance = Math.abs(entryPrice - stopLoss);
  const rewardDistance = Math.abs(targetPrice - entryPrice);
  const totalDistance = riskDistance + rewardDistance;
  
  // Calculate percentages for the bar width
  const riskPercent = (riskDistance / totalDistance) * 100;
  const rewardPercent = (rewardDistance / totalDistance) * 100;

  // Auto-refresh every minute. 
  // Dependency on data.timestamp ensures timer resets if manual refresh occurs (data updates).
  useEffect(() => {
    const timer = setInterval(() => {
      onRefresh(data.symbol);
    }, 60000); // 60 seconds
    return () => clearInterval(timer);
  }, [data.symbol, onRefresh, data.timestamp]);

  return (
    <div className="animate-fade-in pb-10">
      <button 
        onClick={onBack}
        className="mb-6 text-sm text-gray-400 hover:text-white flex items-center gap-2 transition-colors"
      >
        ← 返回搜尋
      </button>

      {/* Header Section */}
      <div className="glass-panel rounded-2xl p-6 mb-6 relative overflow-hidden">
        <div className={`absolute top-0 left-0 w-1 h-full ${isBullish ? 'bg-neon-green' : isBearish ? 'bg-neon-red' : 'bg-gray-500'}`}></div>
        
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          {/* Left: Identity */}
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-black text-white tracking-tight">{data.symbol}</h1>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${borderColor} ${themeColor} bg-opacity-10`}>
                {data.trend === 'BULLISH' ? '看多' : data.trend === 'BEARISH' ? '看空' : '盤整'}
              </span>
            </div>
            <h2 className="text-xl text-gray-300 mt-1">{data.name}</h2>
            <p className="text-xs text-gray-500 mt-2 flex items-center gap-2">
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-800/80 border border-slate-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse"></span>
                  LIVE
                </span>
                <button 
                  onClick={() => onRefresh(data.symbol)}
                  className="flex items-center gap-1 hover:text-neon-blue transition-colors cursor-pointer"
                  title="點擊立即更新"
                >
                   <RefreshCw size={10} className="animate-spin" />
                   更新: {data.timestamp}
                </button>
            </p>
          </div>

          {/* Center: Real-time Price */}
          <div className="flex-1 lg:text-center border-l border-r border-slate-700/50 px-6 mx-2 min-w-[200px]">
             <div className="text-gray-400 text-sm mb-1">即時股價 (TWD)</div>
             <div className={`text-5xl font-black ${priceColor} tracking-tighter flex items-center justify-start lg:justify-center gap-2`}>
                {data.currentPrice}
                {isPositive && <ArrowUp className="w-8 h-8" />}
                {isNegative && <ArrowDown className="w-8 h-8" />}
             </div>
             <div className={`text-lg font-bold flex items-center justify-start lg:justify-center gap-3 mt-1 ${priceColor}`}>
                 <span>{data.change > 0 ? '+' : ''}{data.change}</span>
                 <span className="bg-slate-800 px-2 rounded">
                    {data.changePercent > 0 ? '+' : ''}{data.changePercent}%
                 </span>
             </div>
          </div>
          
          {/* Right: Score */}
          <div className="flex items-center gap-6">
             <div className="text-right">
                <div className="flex items-center justify-end gap-1 text-gray-400 text-sm mb-1">
                    <Scale size={12} />
                    <span>AI 權重評分</span>
                </div>
                <div className={`text-5xl font-bold ${themeColor} drop-shadow-lg`}>
                    {data.overallScore}
                </div>
                <div className="text-[10px] text-gray-500 mt-1 bg-slate-800/50 px-2 py-1 rounded border border-slate-700">
                   籌碼(30%) > 基本(20%) > 技術(15%)
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* WARNING FLAGS (New Section) */}
      {data.warningFlags && data.warningFlags.length > 0 && (
          <div className="mb-6 bg-red-500/10 border border-red-500/50 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 animate-pulse-slow">
              <div className="bg-red-500 p-2 rounded-lg flex-shrink-0">
                  <Siren className="text-white w-6 h-6" />
              </div>
              <div>
                  <h3 className="text-red-400 font-bold text-sm mb-1">投資風險警示 (Risk Alert)</h3>
                  <div className="flex flex-wrap gap-2">
                      {data.warningFlags.map((flag, idx) => (
                          <span key={idx} className="bg-red-900/40 text-red-200 px-2 py-1 rounded text-xs border border-red-800 font-medium">
                              {flag}
                          </span>
                      ))}
                  </div>
              </div>
          </div>
      )}

      {/* Trade Setup Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="md:col-span-2 glass-panel rounded-2xl p-6 border-t-2 border-neon-blue">
          <div className="flex items-center justify-between mb-6">
             <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-neon-blue" />
                <h3 className="text-lg font-bold text-white">智能交易策略 (Smart Setup)</h3>
             </div>
             <div className="px-3 py-1 bg-slate-800 rounded-full text-xs text-neon-blue border border-blue-500/30 font-mono">
                AI 戰術建議
             </div>
          </div>
          
          {/* Main Price Levels Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
              <span className="text-xs text-gray-400 block mb-1">建議動作</span>
              <span className={`text-xl font-bold ${data.tradeSetup?.action === 'BUY' ? 'text-neon-green' : data.tradeSetup?.action === 'SELL' ? 'text-neon-red' : 'text-yellow-400'}`}>
                {data.tradeSetup?.action === 'BUY' ? '買進' : data.tradeSetup?.action === 'SELL' ? '賣出' : '觀望'}
              </span>
            </div>
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
               <span className="text-xs text-gray-400 block mb-1">停損 (Stop)</span>
               <span className="text-lg font-semibold text-neon-red">
                 {data.tradeSetup?.stopLoss}
               </span>
            </div>
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 bg-blue-500/10 border-blue-500/30">
               <span className="text-xs text-blue-300 block mb-1">進場 (Entry)</span>
               <span className="text-lg font-semibold text-white">
                 {Math.round(entryPrice * 100) / 100}
               </span>
            </div>
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
               <span className="text-xs text-gray-400 block mb-1">目標 (Target)</span>
               <span className="text-lg font-semibold text-neon-green">
                 {data.tradeSetup?.targetPrice}
               </span>
            </div>
          </div>

          {/* Risk/Reward Visualization */}
          <div className="mb-6 bg-slate-900/50 p-4 rounded-xl border border-slate-700">
             <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-gray-300 flex items-center gap-1">
                   損益比 (Risk/Reward)
                   <span className="text-neon-purple font-mono ml-1 text-lg">{data.tradeSetup?.riskRewardRatio}</span>
                </span>
                <div className="flex items-center gap-1 text-[10px] text-gray-500">
                    <HelpCircle size={10} />
                    <span>長條比例代表虧損與獲利空間</span>
                </div>
             </div>
             
             {/* The Visual Bar */}
             <div className="relative h-6 w-full rounded-full overflow-hidden flex shadow-inner bg-slate-800">
                {/* Risk Part */}
                <div 
                    style={{ width: `${riskPercent}%` }} 
                    className="h-full bg-gradient-to-r from-red-900 to-neon-red relative group"
                >
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        風險
                    </span>
                </div>
                
                {/* Entry Divider */}
                <div className="w-1 h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)] z-10"></div>
                
                {/* Reward Part */}
                <div 
                    style={{ width: `${rewardPercent}%` }} 
                    className="h-full bg-gradient-to-r from-neon-green to-emerald-800 relative group"
                >
                     <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-black opacity-0 group-hover:opacity-100 transition-opacity">
                        獲利
                    </span>
                </div>
             </div>

             <div className="flex justify-between mt-2 text-xs">
                 <div className="text-neon-red">
                    <span className="block font-bold">-{riskDistance.toFixed(1)}</span>
                    <span className="text-gray-500">潛在虧損 (1單位)</span>
                 </div>
                 <div className="text-neon-green text-right">
                    <span className="block font-bold">+{rewardDistance.toFixed(1)}</span>
                    <span className="text-gray-500">潛在獲利 ({(rewardDistance/riskDistance).toFixed(1)}單位)</span>
                 </div>
             </div>
             <p className="mt-2 text-[10px] text-gray-500 border-t border-slate-800 pt-2">
                 💡 觀察說明：綠色條如果是紅色條的 2 倍以上 (1:2)，通常被視為優質交易機會。這表示您願意承擔 1 元的風險來換取 2 元以上的獲利。
             </p>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-300">成功機率預測</span>
              <span className="text-xl font-bold text-neon-purple">{data.tradeSetup?.probability || 0}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-blue-600 to-neon-purple h-full rounded-full transition-all duration-1000"
                style={{ width: `${data.tradeSetup?.probability || 0}%` }}
              ></div>
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>預期時間: {data.tradeSetup?.timeframe}</span>
            </div>
          </div>
        </div>

        {/* Risk Analysis */}
        <div className="glass-panel rounded-2xl p-6">
             <div className="flex items-center gap-2 mb-4">
                <ShieldAlert className="w-5 h-5 text-orange-400" />
                <h3 className="text-lg font-bold text-white">風險評估 (Vetaran's View)</h3>
             </div>
             <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">
                {data.riskAnalysis}
             </p>
        </div>
      </div>

      {/* 6 Dimensions Analysis Grid (2 Rows x 3 Cols) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        
        {/* 1. Chips (Crucial for Veteran Mode) - Moved to first spot */}
        <div className="glass-panel rounded-2xl p-5 hover:bg-slate-800/80 transition-colors border border-purple-500/30 shadow-[0_0_10px_rgba(139,92,246,0.1)]">
          <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-3">
             <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-400" />
                <h3 className="font-bold text-white">主力籌碼 (30%)</h3>
             </div>
             <div className="h-16 w-16">
                 <RadialChart score={data.chips?.score || 0} label="" color="#8b5cf6" />
             </div>
          </div>
          <p className="text-sm text-white mb-3 font-medium">{data.chips?.summary}</p>
          <ul className="space-y-2">
            {(data.chips?.details || []).map((detail, i) => (
                <li key={i} className="text-xs text-gray-400 flex items-start">
                    <span className="mr-2 text-purple-500">•</span>
                    {detail}
                </li>
            ))}
          </ul>
        </div>

        {/* 2. Fundamental */}
        <div className="glass-panel rounded-2xl p-5 hover:bg-slate-800/80 transition-colors">
          <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-3">
             <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white">基本面 (20%)</h3>
             </div>
             <div className="h-16 w-16">
                 <RadialChart score={data.fundamental?.score || 0} label="" color="#10b981" />
             </div>
          </div>
          <p className="text-sm text-white mb-3 font-medium">{data.fundamental?.summary}</p>
          <ul className="space-y-2">
            {(data.fundamental?.details || []).map((detail, i) => (
                <li key={i} className="text-xs text-gray-400 flex items-start">
                    <span className="mr-2 text-emerald-500">•</span>
                    {detail}
                </li>
            ))}
          </ul>
        </div>

        {/* 3. Technical */}
        <div className="glass-panel rounded-2xl p-5 hover:bg-slate-800/80 transition-colors">
          <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-3">
             <div className="flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-white">技術面 (15%)</h3>
             </div>
             <div className="h-16 w-16">
                 <RadialChart score={data.technical?.score || 0} label="" color="#3b82f6" />
             </div>
          </div>
          <p className="text-sm text-white mb-3 font-medium">{data.technical?.summary}</p>
          <ul className="space-y-2">
            {(data.technical?.details || []).map((detail, i) => (
                <li key={i} className="text-xs text-gray-400 flex items-start">
                    <span className="mr-2 text-blue-500">•</span>
                    {detail}
                </li>
            ))}
          </ul>
        </div>

        {/* 4. Industry/Macro */}
        <div className="glass-panel rounded-2xl p-5 hover:bg-slate-800/80 transition-colors border border-slate-700/50">
          <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-3">
             <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-white">產業總經 (15%)</h3>
             </div>
             <div className="h-16 w-16">
                 <RadialChart score={data.industry?.score || 0} label="" color="#22d3ee" />
             </div>
          </div>
          <p className="text-sm text-white mb-3 font-medium">{data.industry?.summary}</p>
          <ul className="space-y-2">
            {(data.industry?.details || []).map((detail, i) => (
                <li key={i} className="text-xs text-gray-400 flex items-start">
                    <span className="mr-2 text-cyan-500">•</span>
                    {detail}
                </li>
            ))}
          </ul>
        </div>

        {/* 5. Retail Indicators */}
        <div className="glass-panel rounded-2xl p-5 hover:bg-slate-800/80 transition-colors border border-slate-700/50">
          <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-3">
             <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-orange-400" />
                <h3 className="font-bold text-white">散戶/融資 (10%)</h3>
             </div>
             <div className="h-16 w-16">
                 <RadialChart score={data.retail?.score || 0} label="" color="#fb923c" />
             </div>
          </div>
          <p className="text-sm text-white mb-3 font-medium">{data.retail?.summary}</p>
           <ul className="space-y-2">
            {(data.retail?.details || []).map((detail, i) => (
                <li key={i} className="text-xs text-gray-400 flex items-start">
                    <span className="mr-2 text-orange-500">•</span>
                    {detail}
                </li>
            ))}
          </ul>
        </div>

        {/* 6. Market Sentiment */}
        <div className="glass-panel rounded-2xl p-5 hover:bg-slate-800/80 transition-colors border border-slate-700/50">
          <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-3">
             <div className="flex items-center gap-2">
                <MessageCircleHeart className="w-5 h-5 text-pink-400" />
                <h3 className="font-bold text-white">市場情緒 (10%)</h3>
             </div>
             <div className="h-16 w-16">
                 <RadialChart score={data.marketSentiment?.score || 0} label="" color="#f472b6" />
             </div>
          </div>
          <p className="text-sm text-white mb-3 font-medium">{data.marketSentiment?.summary}</p>
          <ul className="space-y-2">
            {(data.marketSentiment?.details || []).map((detail, i) => (
                <li key={i} className="text-xs text-gray-400 flex items-start">
                    <span className="mr-2 text-pink-500">•</span>
                    {detail}
                </li>
            ))}
          </ul>
        </div>
      </div>

      {data.sources && data.sources.length > 0 && (
          <div className="mt-6 border-t border-slate-800 pt-4">
              <h4 className="text-sm text-gray-400 mb-2 flex items-center gap-2">
                  <ExternalLink size={14} /> 資料來源 (AI 實時檢索)
              </h4>
              <div className="flex flex-wrap gap-3">
                  {data.sources.map((source, i) => (
                      <a 
                        key={i} 
                        href={source.uri} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-xs text-neon-blue hover:text-white hover:underline truncate max-w-[200px]"
                      >
                          {source.title}
                      </a>
                  ))}
              </div>
          </div>
      )}

      <div className="mt-8 text-center">
        <p className="text-xs text-gray-600">
          免責聲明：本內容由 AI 根據實時搜索數據與模型生成。
          股市投資具有風險，本應用程式不構成任何投資建議。請用戶自行評估風險。
        </p>
      </div>
    </div>
  );
};

export default StockDetail;