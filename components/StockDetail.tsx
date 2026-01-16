import React from 'react';
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
  User
} from 'lucide-react';

interface StockDetailProps {
  data: AIAnalysisResult;
  onBack: () => void;
}

const StockDetail: React.FC<StockDetailProps> = ({ data, onBack }) => {
  const isBullish = data.trend === 'BULLISH';
  const isBearish = data.trend === 'BEARISH';
  const themeColor = isBullish ? 'text-neon-green' : isBearish ? 'text-neon-red' : 'text-gray-400';
  const borderColor = isBullish ? 'border-neon-green' : isBearish ? 'border-neon-red' : 'border-gray-500';

  const isPositive = (data.change || 0) > 0;
  const isNegative = (data.change || 0) < 0;
  const priceColor = isPositive ? 'text-neon-red' : isNegative ? 'text-neon-green' : 'text-white'; // TW market: Red is Up, Green is Down

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
            <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                分析時間: {data.timestamp}
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
                <p className="text-gray-400 text-sm">AI 綜合評分</p>
                <div className={`text-5xl font-bold ${themeColor} drop-shadow-lg`}>
                    {data.overallScore}
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Trade Setup Card - The most important part */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="md:col-span-2 glass-panel rounded-2xl p-6 border-t-2 border-neon-blue">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-neon-blue" />
            <h3 className="text-lg font-bold text-white">智能交易策略 (Trade Setup)</h3>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-800/50 p-4 rounded-xl">
              <span className="text-xs text-gray-400 block mb-1">建議動作</span>
              <span className={`text-xl font-bold ${data.tradeSetup?.action === 'BUY' ? 'text-neon-green' : data.tradeSetup?.action === 'SELL' ? 'text-neon-red' : 'text-yellow-400'}`}>
                {data.tradeSetup?.action === 'BUY' ? '買進' : data.tradeSetup?.action === 'SELL' ? '賣出' : '觀望'}
              </span>
            </div>
            <div className="bg-slate-800/50 p-4 rounded-xl">
               <span className="text-xs text-gray-400 block mb-1">進場區間</span>
               <span className="text-lg font-semibold text-white">
                 {data.tradeSetup?.entryPriceLow} - {data.tradeSetup?.entryPriceHigh}
               </span>
            </div>
            <div className="bg-slate-800/50 p-4 rounded-xl">
               <span className="text-xs text-gray-400 block mb-1">目標價</span>
               <span className="text-lg font-semibold text-neon-green">
                 {data.tradeSetup?.targetPrice}
               </span>
            </div>
            <div className="bg-slate-800/50 p-4 rounded-xl">
               <span className="text-xs text-gray-400 block mb-1">停損點</span>
               <span className="text-lg font-semibold text-neon-red">
                 {data.tradeSetup?.stopLoss}
               </span>
            </div>
          </div>

          <div className="mt-6">
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
            <p className="text-xs text-gray-500 mt-2 text-right">預期時間: {data.tradeSetup?.timeframe}</p>
          </div>
        </div>

        {/* Risk Analysis */}
        <div className="glass-panel rounded-2xl p-6">
             <div className="flex items-center gap-2 mb-4">
                <ShieldAlert className="w-5 h-5 text-orange-400" />
                <h3 className="text-lg font-bold text-white">風險評估</h3>
             </div>
             <p className="text-gray-300 text-sm leading-relaxed">
                {data.riskAnalysis}
             </p>
        </div>
      </div>

      {/* 3 Pillars Analysis Grid (Row 1) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        
        {/* Fundamental */}
        <div className="glass-panel rounded-2xl p-5 hover:bg-slate-800/80 transition-colors">
          <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-3">
             <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white">基本面</h3>
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

        {/* Technical */}
        <div className="glass-panel rounded-2xl p-5 hover:bg-slate-800/80 transition-colors">
          <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-3">
             <div className="flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-white">技術面</h3>
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

        {/* Chips */}
        <div className="glass-panel rounded-2xl p-5 hover:bg-slate-800/80 transition-colors">
          <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-3">
             <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-400" />
                <h3 className="font-bold text-white">籌碼面 (法人)</h3>
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
      </div>

      {/* New Dimensions: Market Sentiment & Retail Indicators (Row 2) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        
        {/* Market Sentiment */}
        <div className="glass-panel rounded-2xl p-5 hover:bg-slate-800/80 transition-colors border border-slate-700/50">
          <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-3">
             <div className="flex items-center gap-2">
                <MessageCircleHeart className="w-5 h-5 text-pink-400" />
                <h3 className="font-bold text-white">市場情緒 (新聞/社群)</h3>
             </div>
             <div className="h-16 w-16">
                 {/* Pink/Red for sentiment */}
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

        {/* Retail Indicators */}
        <div className="glass-panel rounded-2xl p-5 hover:bg-slate-800/80 transition-colors border border-slate-700/50">
          <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-3">
             <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-orange-400" />
                <h3 className="font-bold text-white">散戶指標 (融資券)</h3>
             </div>
             <div className="h-16 w-16">
                 {/* Orange for retail/caution */}
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