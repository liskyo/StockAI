import React, { useEffect, useState } from 'react';
import { getDashboardData } from '../services/geminiService';
import { DashboardData, StockPreview, StrategyGroup } from '../types';
import { 
  TrendingUp, 
  Flame, 
  Activity, 
  DollarSign, 
  BarChart2, 
  Users,
  Search,
  ArrowRight,
  ListFilter,
  Globe,
  Lightbulb,
  Sparkles,
  Percent,
  History,
  Clock
} from 'lucide-react';

interface DashboardProps {
  onSelectStock: (symbol: string) => void;
}

// Combine standard tabs with string for dynamic strategy IDs
type TabType = 'trending' | 'fundamental' | 'technical' | 'chips' | 'dividend' | 'history' | string;

const Dashboard: React.FC<DashboardProps> = ({ onSelectStock }) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('history'); // Default to history tab
  const [localSearch, setLocalSearch] = useState('');
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

  const handleLocalSearch = () => {
    if (localSearch.trim()) {
        onSelectStock(localSearch.trim());
        setLocalSearch('');
    }
  };

  const standardTabs: { id: TabType; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'history', label: '搜尋紀錄', icon: <History className="w-4 h-4" />, color: 'text-neon-blue' }, // Now first
    { id: 'trending', label: '熱門 (Yahoo)', icon: <Flame className="w-4 h-4" />, color: 'text-orange-500' },
    { id: 'fundamental', label: '績優 (CMoney)', icon: <DollarSign className="w-4 h-4" />, color: 'text-emerald-500' },
    { id: 'technical', label: '強勢 (Yahoo)', icon: <BarChart2 className="w-4 h-4" />, color: 'text-blue-500' },
    { id: 'chips', label: '法人 (CMoney)', icon: <Users className="w-4 h-4" />, color: 'text-purple-500' },
    { id: 'dividend', label: '高殖利 (Yahoo)', icon: <Percent className="w-4 h-4" />, color: 'text-yellow-500' },
  ];

  // Helper to determine what list to show
  const getCurrentList = (): StockPreview[] => {
      if (activeTab === 'history') return searchHistory;
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
    const t = standardTabs.find(x => x.id === id);
    if (t) return t.label;
    
    // Check strategies
    const s = data?.strategies.find(x => x.id === id);
    if (s) return `${s.name} (熱門題材)`;
    
    return '列表';
  };

  const currentList = getCurrentList();

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <div className="mb-8 text-center py-8">
         <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-neon-blue via-neon-purple to-neon-red mb-4 tracking-tighter drop-shadow-lg uppercase">
            TW STOCK WINNER
         </h1>
         <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            台股 AI 智能決策系統：智能緩存技術，分析結果 30 分鐘內即時回溯。
         </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Ranking Panel (Left 2/3) */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 min-h-[600px] flex flex-col">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b border-slate-700 pb-4 gap-4">
             {/* Standard Tabs Navigation */}
            <div className="flex flex-nowrap gap-2 overflow-x-auto w-full md:w-auto scrollbar-hide pb-1">
                {standardTabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-bold transition-all duration-300 whitespace-nowrap ${
                    activeTab === tab.id 
                        ? 'bg-slate-700 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)] border border-slate-600' 
                        : 'text-gray-400 hover:text-white hover:bg-slate-800'
                    }`}
                >
                    <span className={activeTab === tab.id ? tab.color : 'text-gray-500'}>{tab.icon}</span>
                    {tab.label}
                </button>
                ))}
            </div>
          </div>
          
          {/* List Content */}
          <div className="flex-1">
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <ListFilter className="w-5 h-5 text-neon-blue" />
                    {getTabTitle(activeTab)}
                </h3>
                {activeTab !== 'history' && (
                    <span className="text-[10px] text-gray-400 bg-slate-900 px-2 py-1 rounded border border-slate-700 flex items-center gap-1">
                        <Globe size={10} className="text-neon-green"/>
                        AI 即時聯網搜尋中
                    </span>
                 )}
                 {activeTab === 'history' && (
                    <span className="text-[10px] text-gray-400 bg-slate-900 px-2 py-1 rounded border border-slate-700 flex items-center gap-1">
                        <Clock size={10} className="text-neon-blue"/>
                        分析效期 30 分鐘
                    </span>
                 )}
             </div>

            {loading && activeTab !== 'history' ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center py-10 text-neon-blue animate-pulse">
                     正在連結 Yahoo/CMoney 數據庫分析熱門題材...
                  </div>
                  {[1,2,3,4,5].map(i => <div key={i} className="h-20 bg-slate-800/50 animate-pulse rounded-xl"></div>)}
                </div>
            ) : (
                <div className="space-y-3">
                {currentList?.length === 0 && (
                    <div className="text-gray-500 text-center py-20 border border-dashed border-slate-700 rounded-xl flex flex-col items-center gap-3">
                        <History size={40} className="text-slate-700" />
                        <p>{activeTab === 'history' ? '尚無搜尋紀錄，快去診斷您的第一支股票吧！' : 'AI 暫時無法獲取此列表資訊。'}</p>
                    </div>
                )}
                {currentList?.map((stock, index) => (
                    <div 
                    key={`${stock.symbol}-${index}`}
                    onClick={() => onSelectStock(stock.symbol)}
                    className="flex items-center justify-between p-4 bg-slate-800/30 hover:bg-slate-700/80 rounded-xl cursor-pointer transition-all border border-transparent hover:border-neon-blue group relative overflow-hidden"
                    >
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-slate-600 to-transparent group-hover:via-neon-blue transition-all"></div>
                    
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col items-center justify-center w-8 h-8 rounded-full bg-slate-900 text-xs font-mono text-gray-500 border border-slate-700">
                            {index + 1}
                        </div>
                        <div>
                        <div className="flex items-center gap-2">
                            <span className="text-white font-bold text-lg group-hover:text-neon-blue transition-colors">{stock.symbol}</span>
                            <span className="text-gray-400 text-sm">{stock.name}</span>
                        </div>
                        <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-500 group-hover:bg-neon-blue"></span>
                            {stock.reason}
                        </div>
                        </div>
                    </div>

                    <div className="text-right pl-4">
                        <div className="text-white font-mono text-lg">{stock.price}</div>
                        <div className={`text-sm font-bold ${stock.changePercent >= 0 ? 'text-neon-green' : 'text-neon-red'}`}>
                        {stock.changePercent > 0 ? '+' : ''}{Math.abs(stock.changePercent)}%
                        </div>
                    </div>
                    </div>
                ))}
                </div>
            )}
          </div>
        </div>

        {/* Side Strategies (Right 1/3) */}
        <div className="flex flex-col gap-6">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-1 border border-slate-700 shadow-xl">
                <div className="bg-slate-900/90 rounded-xl p-6 h-full relative overflow-hidden">
                    {/* Background decoration */}
                    <div className="absolute -right-4 -top-4 text-slate-800 opacity-50">
                        <Sparkles size={80} />
                    </div>

                    <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2 relative z-10">
                        <Search className="text-neon-blue" />
                        本日動態選股策略
                    </h3>
                    <p className="text-xs text-gray-500 mb-4 relative z-10">
                        AI 根據 Yahoo/CMoney 即時榜單自動生成的熱門題材。
                    </p>
                    
                    <div className="space-y-3 relative z-10">
                        {loading ? (
                            // Skeleton loading for strategies
                            [1, 2, 3].map(i => (
                                <div key={i} className="h-20 bg-slate-800 animate-pulse rounded-lg"></div>
                            ))
                        ) : (
                            data?.strategies.map((strategy, idx) => {
                                const colors = [
                                    'border-neon-green text-neon-green hover:bg-slate-700',
                                    'border-yellow-400 text-yellow-400 hover:bg-slate-700',
                                    'border-neon-purple text-neon-purple hover:bg-slate-700'
                                ];
                                const colorClass = colors[idx % colors.length];
                                const isActive = activeTab === strategy.id;

                                return (
                                    <div 
                                        key={strategy.id}
                                        className={`p-4 rounded-lg bg-slate-800 cursor-pointer transition-all duration-300 group border ${isActive ? colorClass.replace('hover:bg-slate-700', 'bg-slate-700') : 'border-slate-700 hover:border-white'}`}
                                        onClick={() => setActiveTab(strategy.id)}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className={`font-bold text-sm ${isActive ? '' : 'text-gray-200 group-hover:text-white'}`}>
                                                {strategy.name}
                                            </span>
                                            <Lightbulb className={`w-4 h-4 ${isActive ? '' : 'text-gray-500'}`} />
                                        </div>
                                        <p className="text-gray-400 text-xs mb-1 line-clamp-2">
                                            {strategy.description}
                                        </p>
                                        <div className="text-[10px] text-slate-500 text-right">
                                            來源: {strategy.source}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        
                        {!loading && (!data?.strategies || data.strategies.length === 0) && (
                             <div className="text-gray-500 text-xs text-center py-4">
                                無法偵測到熱門題材
                             </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="glass-panel rounded-2xl p-6 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-10">
                    <TrendingUp size={100} />
                </div>
                <h3 className="text-white font-bold mb-2">AI 台股診斷</h3>
                <p className="text-gray-400 text-sm mb-4">輸入股票代號 (如 2330)，讓 AI 為您即時分析。</p>
                
                <div className="flex gap-2 mb-4 relative z-10">
                    <input 
                        type="text" 
                        value={localSearch}
                        onChange={(e) => setLocalSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleLocalSearch()}
                        placeholder="股票代號..."
                        className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue transition-all"
                    />
                    <button 
                        onClick={handleLocalSearch}
                        className="bg-neon-blue hover:bg-blue-600 text-white p-2 rounded-lg transition-colors flex-shrink-0"
                    >
                        <ArrowRight size={18} />
                    </button>
                </div>

                <div className="text-xs text-slate-500 border-t border-slate-700 pt-4 mt-2">
                    資料來源：Google Search (Yahoo/CMoney)
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;