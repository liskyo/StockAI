import React, { useState, useEffect } from 'react';
import { Search, BarChart3, Zap, BrainCircuit, Info, ChevronRight } from 'lucide-react';
import Dashboard from './components/Dashboard';
import StockDetail from './components/StockDetail';
import { analyzeStock } from './services/geminiService';
import { AIAnalysisResult, AnalysisStatus, StockPreview } from './types';

// 內建熱門台股清單，用於快速搜尋建議
const POPULAR_STOCKS = [
  { symbol: '2330', name: '台積電' },
  { symbol: '2317', name: '鴻海' },
  { symbol: '2454', name: '聯發科' },
  { symbol: '2303', name: '聯電' },
  { symbol: '2308', name: '台達電' },
  { symbol: '2382', name: '廣達' },
  { symbol: '3231', name: '緯創' },
  { symbol: '2376', name: '技嘉' },
  { symbol: '2356', name: '英業達' },
  { symbol: '2881', name: '富邦金' },
  { symbol: '2882', name: '國泰金' },
  { symbol: '2891', name: '中信金' },
  { symbol: '2886', name: '兆豐金' },
  { symbol: '2884', name: '玉山金' },
  { symbol: '1101', name: '台泥' },
  { symbol: '1102', name: '亞泥' },
  { symbol: '1802', name: '台玻' },
  { symbol: '2002', name: '中鋼' },
  { symbol: '1301', name: '台塑' },
  { symbol: '1303', name: '南亞' },
  { symbol: '1326', name: '台化' },
  { symbol: '6505', name: '台塑化' },
  { symbol: '2603', name: '長榮' },
  { symbol: '2609', name: '陽明' },
  { symbol: '2615', name: '萬海' },
  { symbol: '2618', name: '長榮航' },
  { symbol: '2610', name: '華航' },
  { symbol: '3008', name: '大立光' },
  { symbol: '6669', name: '緯穎' },
  { symbol: '3037', name: '欣興' },
  { symbol: '3034', name: '聯詠' },
  { symbol: '3711', name: '日月光投控' },
  { symbol: '1513', name: '中興電' },
  { symbol: '1519', name: '華城' },
  { symbol: '0050', name: '元大台灣50' },
  { symbol: '0056', name: '元大高股息' },
  { symbol: '00878', name: '國泰永續高股息' },
  { symbol: '00929', name: '復華台灣科技優息' },
  { symbol: '00940', name: '元大台灣價值高息' },
  { symbol: '00919', name: '群益台灣精選高息' },
];

const STORAGE_KEYS = {
  HISTORY: 'sw_history_v1',
  LAST_SESSION: 'sw_last_session_v1'
};

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [status, setStatus] = useState<AnalysisStatus>(AnalysisStatus.IDLE);
  const [analysisData, setAnalysisData] = useState<AIAnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [analysisMode, setAnalysisMode] = useState<'flash' | 'pro'>('flash');
  
  // History State
  const [history, setHistory] = useState<StockPreview[]>([]);
  
  // Autocomplete state
  const [suggestions, setSuggestions] = useState<typeof POPULAR_STOCKS>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // 初始化：載入歷史紀錄與上次的 Session
  useEffect(() => {
    // Load History
    const savedHistory = localStorage.getItem(STORAGE_KEYS.HISTORY);
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }

    // Load Last Session (Persistence)
    const savedSession = localStorage.getItem(STORAGE_KEYS.LAST_SESSION);
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession);
        // Only restore if valid data exists and we are not in an error state
        if (session.data && session.status === AnalysisStatus.SUCCESS) {
          setAnalysisData(session.data);
          setStatus(AnalysisStatus.SUCCESS);
          setSearchQuery(session.data.symbol);
          if (session.mode) setAnalysisMode(session.mode);
        }
      } catch (e) {
        console.error("Failed to restore session", e);
      }
    }
  }, []);

  // 當分析狀態改變時，更新 LocalStorage
  useEffect(() => {
    if (status === AnalysisStatus.SUCCESS && analysisData) {
      localStorage.setItem(STORAGE_KEYS.LAST_SESSION, JSON.stringify({
        status,
        data: analysisData,
        mode: analysisMode
      }));
    } else if (status === AnalysisStatus.IDLE) {
      // 如果回到首頁，清除當前分析的 Session，但保留 Dashboard 狀態(由 Dashboard 自己管理)
      localStorage.removeItem(STORAGE_KEYS.LAST_SESSION);
    }
  }, [status, analysisData, analysisMode]);

  const updateHistory = (data: AIAnalysisResult) => {
    setHistory(prev => {
      // Remove duplicates based on symbol
      const filtered = prev.filter(item => item.symbol !== data.symbol);
      
      const newItem: StockPreview = {
        symbol: data.symbol,
        name: data.name,
        price: data.currentPrice.toString(),
        changePercent: data.changePercent,
        reason: `查詢時間: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` 
      };

      const newHistory = [newItem, ...filtered].slice(0, 20); // Limit to 20 items
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(newHistory));
      return newHistory;
    });
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    setShowSuggestions(false);
    performAnalysis(searchQuery);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (value.trim()) {
      const filtered = POPULAR_STOCKS.filter(stock => 
        stock.symbol.includes(value) || 
        stock.name.includes(value)
      );
      setSuggestions(filtered.slice(0, 10)); 
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = (stock: typeof POPULAR_STOCKS[0]) => {
    const query = `${stock.symbol} ${stock.name}`;
    setSearchQuery(query);
    setShowSuggestions(false);
    performAnalysis(query);
  };

  const handleBlur = () => {
    setTimeout(() => setShowSuggestions(false), 200);
  };

  const handleFocus = () => {
    if (searchQuery.trim() && suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const performAnalysis = async (query: string, isBackground = false) => {
    // If NOT a background refresh, show loading screen and clear data
    if (!isBackground) {
        setStatus(AnalysisStatus.LOADING);
        setAnalysisData(null);
        setErrorMsg('');
    }
    
    setSearchQuery(query);

    try {
      // In background mode, we might want to consider using 'flash' if 'pro' is too heavy?
      // For now, respect the user's selected mode to maintain consistency of analysis depth.
      const data = await analyzeStock(query, analysisMode);
      setAnalysisData(data);
      
      // If NOT background, set success status (background refresh keeps existing Success status)
      if (!isBackground) {
          setStatus(AnalysisStatus.SUCCESS);
      }
      
      updateHistory(data); 
    } catch (err) {
      if (!isBackground) {
          setErrorMsg("AI 分析失敗，請稍後重試。如果是 Pro 模式，可能需要較長的處理時間。");
          setStatus(AnalysisStatus.ERROR);
      } else {
          console.error("Auto-refresh failed silently", err);
      }
    }
  };

  const handleBack = () => {
    setStatus(AnalysisStatus.IDLE);
    setAnalysisData(null);
    setSearchQuery('');
    setSuggestions([]);
  };

  return (
    <div className="min-h-screen bg-tech-dark text-slate-200 font-sans selection:bg-neon-blue selection:text-white">
      
      {/* Navbar */}
      <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2 cursor-pointer" onClick={handleBack}>
              <div className="bg-neon-blue p-1.5 rounded-lg">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <span className="font-bold text-xl tracking-tight text-white hidden sm:block">StockWinner<span className="text-neon-blue">.AI</span></span>
            </div>
            
            <div className="flex-1 max-w-lg mx-2 sm:mx-4 relative z-50">
              <form onSubmit={handleSearch} className="flex gap-2 relative">
                <div className="relative flex-1 group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-500 group-focus-within:text-neon-blue transition-colors" />
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-slate-700 rounded-full leading-5 bg-slate-800/50 text-gray-300 placeholder-gray-500 focus:outline-none focus:bg-slate-800 focus:border-neon-blue focus:ring-1 focus:ring-neon-blue sm:text-sm transition-all"
                    placeholder="輸入股票代號或名稱 (台積電)..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    autoComplete="off"
                  />
                  
                  {/* Suggestions Dropdown */}
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800/95 backdrop-blur-xl border border-slate-700 rounded-xl shadow-2xl overflow-hidden max-h-80 overflow-y-auto scrollbar-hide z-50 animate-fade-in">
                       {suggestions.map((stock) => (
                         <div
                           key={stock.symbol}
                           onClick={() => handleSelectSuggestion(stock)}
                           className="px-4 py-3 hover:bg-slate-700/80 cursor-pointer border-b border-slate-700/50 last:border-0 flex justify-between items-center group transition-colors"
                         >
                           <div className="flex items-center gap-3">
                              <span className="font-mono text-neon-blue font-bold bg-blue-500/10 px-2 py-0.5 rounded text-sm">{stock.symbol}</span>
                              <span className="text-gray-200 font-medium group-hover:text-white">{stock.name}</span>
                           </div>
                           <ChevronRight size={14} className="text-gray-600 group-hover:text-neon-blue transition-colors" />
                         </div>
                       ))}
                    </div>
                  )}
                </div>
                <button
                  type="submit"
                  className="bg-neon-blue hover:bg-blue-600 text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg shadow-blue-500/20 transition-all hover:scale-105 active:scale-95 whitespace-nowrap flex items-center gap-1"
                >
                  <Search size={16} />
                  尋寶
                </button>
              </form>
            </div>

            <div className="hidden lg:flex items-center gap-2">
                <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
                    <button 
                        onClick={() => setAnalysisMode('flash')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${analysisMode === 'flash' ? 'bg-neon-blue text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        <Zap size={14} /> 快速分析
                    </button>
                    <button 
                        onClick={() => setAnalysisMode('pro')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${analysisMode === 'pro' ? 'bg-neon-purple text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        <BrainCircuit size={14} /> 深度分析
                    </button>
                </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {status === AnalysisStatus.IDLE && (
          <div className="flex flex-col gap-4">
             {/* Mobile Mode Selector */}
             <div className="lg:hidden flex justify-center mb-4">
                <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700 w-full max-w-xs">
                    <button 
                        onClick={() => setAnalysisMode('flash')}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${analysisMode === 'flash' ? 'bg-neon-blue text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        <Zap size={14} /> 快速
                    </button>
                    <button 
                        onClick={() => setAnalysisMode('pro')}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${analysisMode === 'pro' ? 'bg-neon-purple text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        <BrainCircuit size={14} /> 準確
                    </button>
                </div>
             </div>
             <Dashboard onSelectStock={(q) => performAnalysis(q)} history={history} />
          </div>
        )}

        {status === AnalysisStatus.LOADING && (
          <div className="flex flex-col items-center justify-center h-[60vh]">
            <div className="relative">
                <div className={`w-24 h-24 border-t-4 border-b-4 ${analysisMode === 'pro' ? 'border-neon-purple' : 'border-neon-blue'} rounded-full animate-spin`}></div>
                <div className="absolute top-0 left-0 w-24 h-24 border-r-4 border-l-4 border-white/20 rounded-full animate-spin reverse" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    {analysisMode === 'pro' ? <BrainCircuit className="w-8 h-8 text-neon-purple animate-pulse" /> : <Zap className="w-8 h-8 text-neon-blue animate-pulse" />}
                </div>
            </div>
            <h2 className="mt-8 text-2xl font-bold text-white animate-pulse">
                {analysisMode === 'pro' ? '正在進行深度推理分析...' : '正在快速掃描市場數據...'}
            </h2>
            <p className="text-gray-400 mt-2 max-w-sm text-center">
                {analysisMode === 'pro' 
                    ? 'Pro 模式正在模擬專家思維，綜合多方數據進行邏輯推理，預計需要 15-30 秒。' 
                    : 'Flash 模式追求效率，正在為您即時抓取最新資訊。'}
            </p>
          </div>
        )}

        {status === AnalysisStatus.ERROR && (
          <div className="flex flex-col items-center justify-center h-[50vh] text-center">
            <div className="bg-red-500/10 p-6 rounded-full mb-4">
                <Search className="w-12 h-12 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">分析失敗</h3>
            <p className="text-gray-400 max-w-md mb-6">{errorMsg}</p>
            <button 
                onClick={handleBack}
                className="px-6 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors"
            >
                返回首頁
            </button>
          </div>
        )}

        {status === AnalysisStatus.SUCCESS && analysisData && (
          <StockDetail 
            data={analysisData} 
            onBack={handleBack} 
            onRefresh={(query) => performAnalysis(query, true)} 
          />
        )}

      </main>

      <footer className="border-t border-slate-800 bg-slate-900 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center">
           <div className="flex items-center justify-center gap-2 mb-2 text-xs text-gray-500">
              <Info size={14} />
              <span>當前模式：{analysisMode === 'pro' ? 'Gemini 3 Pro (高精度)' : 'Gemini 3 Flash (極速)'}</span>
           </div>
           <p className="text-gray-600 text-[10px]">© {new Date().getFullYear()} StockWinner AI. 僅供教學與技術展示，非投資建議。</p>
        </div>
      </footer>
    </div>
  );
}

export default App;