import React, { useState } from 'react';
import { Search, Cpu, BarChart3, Zap, BrainCircuit, Info } from 'lucide-react';
import Dashboard from './components/Dashboard';
import StockDetail from './components/StockDetail';
import { analyzeStock } from './services/geminiService';
import { AIAnalysisResult, AnalysisStatus } from './types';

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [status, setStatus] = useState<AnalysisStatus>(AnalysisStatus.IDLE);
  const [analysisData, setAnalysisData] = useState<AIAnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [analysisMode, setAnalysisMode] = useState<'flash' | 'pro'>('flash');

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    performAnalysis(searchQuery);
  };

  const performAnalysis = async (query: string) => {
    setStatus(AnalysisStatus.LOADING);
    setAnalysisData(null);
    setErrorMsg('');
    setSearchQuery(query);

    try {
      const data = await analyzeStock(query, analysisMode);
      setAnalysisData(data);
      setStatus(AnalysisStatus.SUCCESS);
    } catch (err) {
      setErrorMsg("AI 分析失敗，請稍後重試。如果是 Pro 模式，可能需要較長的處理時間。");
      setStatus(AnalysisStatus.ERROR);
    }
  };

  const handleBack = () => {
    setStatus(AnalysisStatus.IDLE);
    setAnalysisData(null);
    setSearchQuery('');
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
            
            <div className="flex-1 max-w-lg mx-4 flex flex-col gap-2">
              <form onSubmit={handleSearch} className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-500 group-focus-within:text-neon-blue transition-colors" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-slate-700 rounded-full leading-5 bg-slate-800/50 text-gray-300 placeholder-gray-500 focus:outline-none focus:bg-slate-800 focus:border-neon-blue focus:ring-1 focus:ring-neon-blue sm:text-sm transition-all"
                  placeholder="輸入股票代號 (2330)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
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
             <Dashboard onSelectStock={performAnalysis} />
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
          <StockDetail data={analysisData} onBack={handleBack} />
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