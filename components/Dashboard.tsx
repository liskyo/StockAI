import React, { useEffect, useState } from 'react';
import { getDashboardData } from '../services/geminiService';
import { DashboardData, StockPreview } from '../types';
import { 
  Flame, 
  Activity, 
  DollarSign, 
  BarChart2, 
  Users,
  ArrowRight,
  ListFilter,
  Globe,
  Lightbulb,
  Sparkles,
  Percent,
  History,
  Info,
  Gem
} from 'lucide-react';

interface DashboardProps {
  onSelectStock: (symbol: string) => void;
}

// Combine standard tabs with string for dynamic strategy IDs
type TabType = 'trending' | 'fundamental' | 'technical' | 'chips' | 'dividend' | 'history' | 'strategies' | string;

const Dashboard: React.FC<DashboardProps> = ({ onSelectStock }) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('history'); // Default to history tab
  const [searchHistory, setSearchHistory] = useState<StockPreview[]>([]);

  useEffect(() => {
    const loadMarket = async () => {
        try {
            const dashboardData = await getDashboardData();
            setData(dashboardData);
        } catch(e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };
    
    // Load search history from localStorage
    const savedHistory = localStorage.getItem('search_history_v1');
    if (savedHistory) {
      setSearchHistory(JSON.parse(savedHistory));
    }

    loadMarket();
  }, []);

  const standardTabs: { id: TabType; label: string; icon: React.ReactElement; color: string }[] = [
    { id: 'history', label: '搜尋紀錄', icon: <History className="w-4 h-4" />, color: 'text-neon-blue' },
    { id: 'strategies', label: '尋寶策略', icon: <Gem className="w-4 h-4" />, color: 'text-yellow-400' },
    { id: 'trending', label: '熱門 (Yahoo)', icon: <Flame className="w-4 h-4" />, color: 'text-orange-500' },
    { id: 'fundamental', label: '績優 (CMoney)', icon: <DollarSign className="w-4 h-4" />, color: 'text-emerald-500' },
    { id: 'technical', label: '強勢 (Yahoo)', icon: <BarChart2 className="w-4 h-4" />, color: 'text-blue-500' },
    { id: 'chips', label: '法人 (CMoney)', icon: <Users className="w-4 h-4" />, color: 'text-purple-500' },
    { id: 'dividend', label: '高殖利 (Yahoo)', icon: <Percent className="w-4 h-4" />, color: 'text-yellow-500' },
  ];

  // Helper to determine what list to show
  const getCurrentList = (): StockPreview[] => {
      if (activeTab === 'history') return searchHistory;
      if (activeTab === 'strategies') return []; // Handled separately in render
      if (!data) return [];
      
      // Check standard tabs
      if (activeTab === 'trending') return data.trending;
      if (activeTab === 'fundamental') return data.fundamental;
      if (activeTab === 'technical') return data.technical;
      if (activeTab === 'chips') return data.chips;
      if (activeTab === 'dividend') return data.dividend;

      // Check dynamic strategies
      const strategy = data.strategies.find(s => s.id === activeTab);
      return strategy ? strategy.stocks : [];
  };

  const getTabTitle = (id: TabType) => {
    if (id === 'history') return '您的搜尋紀錄';
    if (id === 'strategies') return 'AI 智能選股策略';
    const t = standardTabs.find(x => x.id === id);
    if (t) return t.label;
    
    // Check strategies
    const s = data?.strategies.find(x => x.id === id);
    if (s) return `${s.name} (熱門題材)`;
    
    return '列表';
  };

  const currentList = getCurrentList();
  const isStrategyTab = activeTab === 'strategies';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-fade-in">
      {/* Sidebar Navigation */}
      <div className="lg:col-span-1 space-y-4">
        <div className="glass-panel p-4 rounded-2xl">
           <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-3 px-2">市場掃描</h3>
           <div className="space-y-1">
             {standardTabs.map(tab => (
               <button
                 key={tab.id}
                 onClick={() => setActiveTab(tab.id)}
                 className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                   activeTab === tab.id 
                     ? 'bg-slate-700/80 text-white shadow-lg border border-slate-600' 
                     : 'text-gray-400 hover:bg-slate-800/50 hover:text-white'
                 }`}
               >
                 <div className={`p-1.5 rounded-lg bg-slate-800 ${tab.color.replace('text-', 'bg-').replace('500', '500/20').replace('400', '400/20')}`}>
                    {React.cloneElement(tab.icon as React.ReactElement<any>, { className: `w-4 h-4 ${tab.color}` })}
                 </div>
                 {tab.label}
               </button>
             ))}
           </div>
        </div>

        {/* Dynamic Strategy List Sidebar Items */}
        {data && data.strategies.length > 0 && (
             <div className="glass-panel p-4 rounded-2xl">
                <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-3 px-2 flex items-center gap-2">
                    <Sparkles size={12} className="text-yellow-400" />
                    本週熱門題材
                </h3>
                <div className="space-y-1">
                    {data.strategies.map(strat => (
                        <button
                            key={strat.id}
                            onClick={() => setActiveTab(strat.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left ${
                                activeTab === strat.id 
                                ? 'bg-slate-700/80 text-white border border-slate-600' 
                                : 'text-gray-400 hover:bg-slate-800/50 hover:text-white'
                            }`}
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 shrink-0"></span>
                            <span className="truncate">{strat.name}</span>
                        </button>
                    ))}
                </div>
             </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="lg:col-span-3">
         <div className="glass-panel p-6 rounded-2xl min-h-[500px]">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        {getTabTitle(activeTab)}
                    </h2>
                    {!loading && <p className="text-gray-400 text-sm mt-1">
                        {isStrategyTab ? 'AI 自動挖掘市場當前最強勢的題材概念股' : '點擊個股以查看 AI 深度分析報告'}
                    </p>}
                </div>
                {loading && (
                    <div className="flex items-center gap-2 text-neon-blue text-sm animate-pulse">
                        <Activity className="w-4 h-4" />
                        正在更新市場數據...
                    </div>
                )}
            </div>

            {loading && !data ? (
                <div className="flex flex-col items-center justify-center h-64 space-y-4">
                    <div className="w-10 h-10 border-4 border-slate-600 border-t-neon-blue rounded-full animate-spin"></div>
                    <p className="text-gray-500 text-sm">正在從 Yahoo/CMoney 彙整數據...</p>
                </div>
            ) : (
                <>
                    {/* Strategy Overview Mode */}
                    {isStrategyTab && data && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {data.strategies.map(strat => (
                                <div 
                                    key={strat.id}
                                    onClick={() => setActiveTab(strat.id)}
                                    className="bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 hover:border-neon-blue/50 p-5 rounded-xl cursor-pointer transition-all group"
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="bg-yellow-500/10 p-2 rounded-lg">
                                            <Lightbulb className="w-6 h-6 text-yellow-400" />
                                        </div>
                                        <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-neon-blue group-hover:translate-x-1 transition-all" />
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-1 group-hover:text-neon-blue transition-colors">{strat.name}</h3>
                                    <p className="text-sm text-gray-400 line-clamp-2 mb-3">{strat.description}</p>
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <Globe size={12} />
                                        來源: {strat.source}
                                    </div>
                                </div>
                            ))}
                            {data.strategies.length === 0 && (
                                <div className="col-span-full text-center py-10 text-gray-500">
                                    暫無策略數據
                                </div>
                            )}
                        </div>
                    )}

                    {/* Stock List Mode */}
                    {!isStrategyTab && (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {currentList.map((stock, idx) => (
                                <div 
                                    key={`${stock.symbol}-${idx}`}
                                    onClick={() => onSelectStock(stock.symbol)}
                                    className="bg-slate-800/30 hover:bg-slate-700/50 border border-slate-700/50 hover:border-neon-blue/50 p-4 rounded-xl cursor-pointer transition-all group relative overflow-hidden"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <span className="text-2xl font-black text-white group-hover:text-neon-blue transition-colors tracking-tight">{stock.symbol}</span>
                                            <h4 className="text-sm text-gray-400 font-medium truncate max-w-[120px]">{stock.name}</h4>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-lg font-bold text-white">{stock.price}</div>
                                            <div className={`text-xs font-bold px-1.5 py-0.5 rounded ${stock.changePercent >= 0 ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                                                {stock.changePercent > 0 ? '+' : ''}{stock.changePercent}%
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-3 pt-3 border-t border-slate-700/50 flex items-start gap-2">
                                        <Info className="w-3 h-3 text-gray-500 mt-0.5 shrink-0" />
                                        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                                            {stock.reason}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            {currentList.length === 0 && (
                                <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-500">
                                    <ListFilter className="w-12 h-12 mb-4 opacity-20" />
                                    <p>此列表目前沒有資料</p>
                                    {activeTab === 'history' && <p className="text-xs mt-2">試著搜尋一些股票來建立紀錄</p>}
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
         </div>
      </div>
    </div>
  );
};

export default Dashboard;