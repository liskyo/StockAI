
import React from 'react';
import { AIAnalysisResult, TimeframeStrategy } from '../types';
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
  Zap,
  Activity,
  AlertTriangle,
  Radar,
  Clock,
  Calendar,
  Anchor
} from 'lucide-react';

interface StockDetailProps {
  data: AIAnalysisResult;
  onBack: () => void;
}

const StrategyCard = ({ strategy, type }: { strategy: TimeframeStrategy, type: 'short' | 'medium' | 'long' }) => {
  if (!strategy) return null;

  const config = {
    short: { title: '短線操作 (1-3天)', icon: <Zap size={16} />, color: 'text-cyan-400', border: 'border-cyan-400/30' },
    medium: { title: '波段策略 (1-3週)', icon: <Calendar size={16} />, color: 'text-yellow-400', border: 'border-yellow-400/30' },
    long: { title: '長線佈局 (1-3月)', icon: <Anchor size={16} />, color: 'text-purple-400', border: 'border-purple-400/30' },
  }[type];

  const actionColor = 
    strategy.action === 'BUY' ? 'bg-neon-red text-white' : 
    strategy.action === 'SELL' ? 'bg-neon-green text-white' : 
    strategy.action === 'OBSERVE' ? 'bg-gray-600 text-gray-200' :
    'bg-yellow-500 text-black'; // HOLD

  const actionText = 
    strategy.action === 'BUY' ? '偏多操作' : 
    strategy.action === 'SELL' ? '偏空操作' : 
    strategy.action === 'OBSERVE' ? '觀望' : '續抱';

  return (
    <div className={`bg-slate-900/60 p-4 rounded-xl border ${config.border} flex flex-col h-full`}>
       <div className={`flex items-center gap-2 mb-2 font-bold ${config.color} text-sm`}>
          {config.icon}
          {config.title}
       </div>
       <div className="flex justify-between items-center mb-3">
          <span className={`px-2 py-0.5 rounded text-xs font-bold ${actionColor}`}>
             {actionText}
          </span>
          <span className="text-white text-sm font-mono">{strategy.priceTarget}</span>
       </div>
       <p className="text-xs text-gray-400 leading-relaxed flex-1">
          {strategy.suggestion}
       </p>
    </div>
  );
};

const StockDetail: React.FC<StockDetailProps> = ({ data, onBack }) => {
  const isBullish = data.trend === 'BULLISH';
  const isBearish = data.trend === 'BEARISH';
  const themeColor = isBullish ? 'text-neon-green' : isBearish ? 'text-neon-red' : 'text-gray-400';
  const borderColor = isBullish ? 'border-neon-green' : isBearish ? 'border-neon-red' : 'border-gray-500';

  const isPositive = (data.change || 0) > 0;
  const isNegative = (data.change || 0) < 0;
  const priceColor = isPositive ? 'text-neon-red' : isNegative ? 'text-neon-green' : 'text-white';

  const engine = data.institutionalEngine;
  const phaseConfig = {
    LAYOUT: { label: '佈局期', color: 'bg-neon-green', text: 'text-neon-green', icon: <Activity className="w-5 h-5" /> },
    TRIAL: { label: '試單期', color: 'bg-yellow-400', text: 'text-yellow-400', icon: <Zap className="w-5 h-5" /> },
    RETREAT: { label: '撤退期', color: 'bg-neon-red', text: 'text-neon-red', icon: <AlertTriangle className="w-5 h-5" /> }
  }[engine.phase || 'TRIAL'];

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

      {/* NEW: Institutional Engine Dashboard (狀態機分析) */}
      <div className="glass-panel rounded-2xl p-6 mb-6 border-l-4 border-neon-purple overflow-hidden relative">
          <div className="absolute -right-8 -top-8 text-white/5 pointer-events-none">
              <Radar size={160} />
          </div>
          
          <div className="flex flex-col md:flex-row gap-8 items-start">
              {/* Left: Phase Indicator */}
              <div className="flex flex-col items-center gap-3 min-w-[140px] pt-4">
                  <span className="text-xs text-gray-500 uppercase tracking-widest font-bold">法人行為階段</span>
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center border-4 ${phaseConfig.color.replace('bg-', 'border-')}/30 animate-pulse-slow`}>
                      <div className={`w-14 h-14 rounded-full ${phaseConfig.color} flex items-center justify-center text-white shadow-lg shadow-white/10`}>
                          {phaseConfig.icon}
                      </div>
                  </div>
                  <span className={`text-xl font-black ${phaseConfig.text}`}>{phaseConfig.label}</span>
              </div>

              {/* Middle & Right: Key Insights & Strategies */}
              <div className="flex-1 w-full space-y-6">
                  {/* Top Row: Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
                            <div className="text-xs text-gray-500 mb-1">主控法人</div>
                            <div className="text-lg font-bold text-white flex items-center gap-2">
                                <Users className="text-neon-purple w-4 h-4" />
                                {engine.leadingActor}
                            </div>
                        </div>
                        <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
                            <div className="text-xs text-gray-500 mb-1">狀態信心值</div>
                            <div className="flex items-end gap-2">
                                <span className="text-2xl font-black text-neon-blue">{engine.confidence}%</span>
                                <div className="flex-1 h-1.5 bg-slate-700 rounded-full mb-2 overflow-hidden">
                                    <div className="h-full bg-neon-blue" style={{ width: `${engine.confidence}%` }}></div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 sm:col-span-2 lg:col-span-1">
                            <div className="text-xs text-gray-500 mb-2">翻臉雷達</div>
                            <div className="flex flex-wrap gap-2">
                                {engine.warningSignals.map((sig, i) => (
                                    <span key={i} className="bg-neon-red/10 text-neon-red text-[10px] px-2 py-1 rounded border border-neon-red/20 font-bold">
                                        ⚠️ {sig}
                                    </span>
                                ))}
                                {engine.warningSignals.length === 0 && <span className="text-xs text-neon-green">✅ 目前無翻臉跡象</span>}
                            </div>
                        </div>
                  </div>

                  <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700 relative">
                     <div className="absolute top-4 right-4 text-[10px] text-gray-500">
                        連續性評分: {engine.continuityScore}/100
                     </div>
                     <h4 className="text-xs text-gray-400 mb-2 font-bold flex items-center gap-2">
                        <Zap size={14} className="text-yellow-400" /> 法人行為解讀
                     </h4>
                     <p className="text-sm text-gray-300 leading-relaxed italic pr-12">
                        "{engine.description}"
                     </p>
                  </div>

                  {/* Multi-Timeframe Strategies */}
                  <div className="pt-2 border-t border-slate-700/50">
                      <h4 className="text-xs text-gray-400 mb-3 font-bold uppercase tracking-wider">分時操作策略建議</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <StrategyCard strategy={engine.shortTermStrategy} type="short" />
                          <StrategyCard strategy={engine.mediumTermStrategy} type="medium" />
                          <StrategyCard strategy={engine.longTermStrategy} type="long" />
                      </div>
                  </div>
              </div>
          </div>
      </div>

      {/* Trade Setup Card */}
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

        <div className="glass-panel rounded-2xl p-5 hover:bg-slate-800/80 transition-colors">
          <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-3">
             <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-400" />
                <h3 className="font-bold text-white">籌碼面 (數據)</h3>
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
        <div className="glass-panel rounded-2xl p-5 hover:bg-slate-800/80 transition-colors border border-slate-700/50">
          <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-3">
             <div className="flex items-center gap-2">
                <MessageCircleHeart className="w-5 h-5 text-pink-400" />
                <h3 className="font-bold text-white">市場情緒 (新聞/社群)</h3>
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

        <div className="glass-panel rounded-2xl p-5 hover:bg-slate-800/80 transition-colors border border-slate-700/50">
          <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-3">
             <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-orange-400" />
                <h3 className="font-bold text-white">散戶指標 (融資券)</h3>
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
