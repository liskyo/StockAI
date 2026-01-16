import React, { useState } from 'react';
import { Search, Cpu, BarChart3, Github } from 'lucide-react';
import Dashboard from './components/Dashboard';
import StockDetail from './components/StockDetail';
import { analyzeStock } from './services/geminiService';
import { AIAnalysisResult, AnalysisStatus } from './types';

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [status, setStatus] = useState<AnalysisStatus>(AnalysisStatus.IDLE);
  const [analysisData, setAnalysisData] = useState<AIAnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

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
      const data = await analyzeStock(query);
      setAnalysisData(data);
      setStatus(AnalysisStatus.SUCCESS);
    } catch (err) {
      setErrorMsg("AI Analysis failed. Please try again or check your API key.");
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
            
            <div className="flex-1 max-w-lg mx-4">
              <form onSubmit={handleSearch} className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-500 group-focus-within:text-neon-blue transition-colors" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-slate-700 rounded-full leading-5 bg-slate-800/50 text-gray-300 placeholder-gray-500 focus:outline-none focus:bg-slate-800 focus:border-neon-blue focus:ring-1 focus:ring-neon-blue sm:text-sm transition-all"
                  placeholder="輸入股票代號或名稱 (e.g., 2330, NVDA)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </form>
            </div>

            <div className="hidden md:flex items-center gap-4">
               <span className="text-xs font-mono text-neon-green px-2 py-1 bg-neon-green/10 rounded border border-neon-green/20">
                  SYSTEM ONLINE
               </span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {status === AnalysisStatus.IDLE && (
          <Dashboard onSelectStock={performAnalysis} />
        )}

        {status === AnalysisStatus.LOADING && (
          <div className="flex flex-col items-center justify-center h-[60vh]">
            <div className="relative">
                <div className="w-24 h-24 border-t-4 border-b-4 border-neon-blue rounded-full animate-spin"></div>
                <div className="absolute top-0 left-0 w-24 h-24 border-r-4 border-l-4 border-neon-purple rounded-full animate-spin reverse" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <Cpu className="w-8 h-8 text-white animate-pulse" />
                </div>
            </div>
            <h2 className="mt-8 text-2xl font-bold text-white animate-pulse">AI Analysing Market Data...</h2>
            <p className="text-gray-400 mt-2">Computing 4-Pillar Strategy (Fundamental, Technical, Chips, Financial)</p>
            <div className="mt-6 flex gap-2">
                <span className="w-2 h-2 bg-neon-blue rounded-full animate-bounce" style={{ animationDelay: '0s'}}></span>
                <span className="w-2 h-2 bg-neon-blue rounded-full animate-bounce" style={{ animationDelay: '0.2s'}}></span>
                <span className="w-2 h-2 bg-neon-blue rounded-full animate-bounce" style={{ animationDelay: '0.4s'}}></span>
            </div>
          </div>
        )}

        {status === AnalysisStatus.ERROR && (
          <div className="flex flex-col items-center justify-center h-[50vh] text-center">
            <div className="bg-red-500/10 p-6 rounded-full mb-4">
                <Search className="w-12 h-12 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Analysis Failed</h3>
            <p className="text-gray-400 max-w-md mb-6">{errorMsg}</p>
            <button 
                onClick={handleBack}
                className="px-6 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors"
            >
                Return Home
            </button>
          </div>
        )}

        {status === AnalysisStatus.SUCCESS && analysisData && (
          <StockDetail data={analysisData} onBack={handleBack} />
        )}

      </main>

      <footer className="border-t border-slate-800 bg-slate-900 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center">
           <p className="text-gray-600 text-sm">© {new Date().getFullYear()} StockWinner AI. Data simulated for demonstration.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;