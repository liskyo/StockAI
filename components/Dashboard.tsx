import React, { useEffect, useState } from 'react';
import { getDashboardData } from '../services/geminiService';
import { DashboardData, StockPreview } from '../types';
import { 
  TrendingUp, 
  Flame, 
  Zap, 
  Activity, 
  DollarSign, 
  BarChart2, 
  Users,
  Search,
  ArrowRight
} from 'lucide-react';

interface DashboardProps {
  onSelectStock: (symbol: string) => void;
}

type TabType = 'trending' | 'fundamental' | 'technical' | 'chips' | 'leading';

const Dashboard: React.FC<DashboardProps> = ({ onSelectStock }) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('trending');
  const [localSearch, setLocalSearch] = useState('');

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
    loadMarket();
  }, []);

  const handleLocalSearch = () => {
    if (localSearch.trim()) {
        onSelectStock(localSearch.trim());
        setLocalSearch('');
    }
  };

  const tabs: { id: TabType; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'trending', label: '熱門焦點', icon: <Flame className="w-4 h-4" />, color: 'text-orange-500' },
    { id: 'fundamental', label: '基本面優選', icon: <DollarSign className="w-4 h-4" />, color: 'text-emerald-500' },
    { id: 'technical', label: '技術面強勢', icon: <BarChart2 className="w-4 h-4" />, color: 'text-blue-500' },
    { id: 'chips', label: '籌碼集中', icon: <Users className="w-4 h-4" />, color: 'text-purple-500' },
    { id: 'leading', label: '領先指標', icon: <Activity className="w-4 h-4" />, color: 'text-yellow-500' },
  ];

  const currentList = data ? data[activeTab] : [];

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <div className="mb-8 text-center py-8">
         <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-neon-blue via-neon-purple to-neon-red mb-4 tracking-tighter drop-shadow-lg">
            TW STOCK WINNER
         </h1>
         <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            台股 AI 智能決策系統：鎖定台股精選標的，從基本面到籌碼面，全方位解析真實數據。
         </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Ranking Panel (Left 2/3) */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 min-h-[500px]">
          
          <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-4">
             {/* Tabs Navigation */}
            <div className="flex flex-wrap gap-2">
                {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 ${
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
          {loading ? (
             <div className="space-y-4">
               {[1,2,3,4,5].map(i => <div key={i} className="h-20 bg-slate-800/50 animate-pulse rounded-xl"></div>)}
             </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-end mb-2">
                 <span className="text-[10px] text-gray-500 bg-slate-800 px-2 py-1 rounded border border-slate-700">
                    * 列表報價為 AI 估算參考值，即時報價請點擊詳情
                 </span>
              </div>
              {currentList?.length === 0 && <div className="text-gray-500 text-center py-10">暫無數據</div>}
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
                      {stock.changePercent > 0 ? '+' : ''}{stock.changePercent}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Side Strategies (Right 1/3) */}
        <div className="flex flex-col gap-6">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-1 border border-slate-700">
                <div className="bg-slate-900/90 rounded-xl p-6 h-full">
                    <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                        <Search className="text-neon-blue" />
                        快速選股策略
                    </h3>
                    <div className="space-y-4">
                        <div 
                            className="p-4 rounded-lg bg-slate-800 hover:bg-slate-700 cursor-pointer transition-colors group border border-slate-700 hover:border-neon-green"
                            onClick={() => onSelectStock("2330")}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className="text-neon-green font-bold text-sm">權值股領軍</span>
                                <TrendingUp className="w-4 h-4 text-neon-green" />
                            </div>
                            <p className="text-gray-400 text-xs">台積電、鴻海等大型權值股，適合穩健佈局。</p>
                        </div>

                        <div 
                            className="p-4 rounded-lg bg-slate-800 hover:bg-slate-700 cursor-pointer transition-colors group border border-slate-700 hover:border-yellow-400"
                            onClick={() => onSelectStock("3231")}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className="text-yellow-400 font-bold text-sm">AI 伺服器概念</span>
                                <Zap className="w-4 h-4 text-yellow-400" />
                            </div>
                            <p className="text-gray-400 text-xs">緯創、廣達等熱門題材，波動大機會多。</p>
                        </div>

                        <div 
                            className="p-4 rounded-lg bg-slate-800 hover:bg-slate-700 cursor-pointer transition-colors group border border-slate-700 hover:border-neon-purple"
                            onClick={() => onSelectStock("2603")}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className="text-neon-purple font-bold text-sm">高殖利率傳產</span>
                                <Activity className="w-4 h-4 text-neon-purple" />
                            </div>
                            <p className="text-gray-400 text-xs">航運、鋼鐵等循環股，留意配息政策。</p>
                        </div>
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
                    支援 上市 / 上櫃 股票
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;