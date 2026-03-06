import React from 'react';
import { BrainCircuit, TrendingUp, Zap, ShieldCheck, ArrowRight, BarChart3, Activity, Globe, Cpu } from 'lucide-react';

interface LandingPageProps {
  onEnter: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onEnter }) => {
  return (
    <div className="min-h-screen bg-[#050b14] text-white overflow-hidden relative selection:bg-cyan-500 selection:text-black font-sans">
      <style>{`
        @keyframes grid-move {
          0% { transform: translateY(0); }
          100% { transform: translateY(40px); }
        }
        .perspective-grid {
          background-image: 
            linear-gradient(to right, rgba(6, 182, 212, 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(6, 182, 212, 0.1) 1px, transparent 1px);
          background-size: 40px 40px;
          transform: perspective(500px) rotateX(60deg);
          animation: grid-move 2s linear infinite;
          mask-image: linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 20%, rgba(0,0,0,1) 60%, rgba(0,0,0,0) 100%);
        }
        @keyframes scanline {
          0% { top: -100%; }
          100% { top: 100%; }
        }
        .scan-line {
          background: linear-gradient(to bottom, transparent, rgba(6, 182, 212, 0.5), transparent);
          animation: scanline 3s linear infinite;
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        .animate-float {
          animation: float-slow 6s ease-in-out infinite;
        }
      `}</style>

      {/* Cyber Grid Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-[#050b14] to-[#050b14]"></div>
        <div className="absolute bottom-[-20%] left-[-50%] right-[-50%] h-[80%] perspective-grid opacity-30"></div>
        
        {/* Floating Particles/Orbs */}
        <div className="absolute top-[10%] left-[10%] w-64 h-64 bg-cyan-500/10 rounded-full blur-[100px] animate-pulse-slow"></div>
        <div className="absolute bottom-[10%] right-[10%] w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Navbar */}
      <nav className="relative z-20 flex justify-between items-center px-6 py-6 max-w-7xl mx-auto border-b border-white/5 bg-[#050b14]/50 backdrop-blur-sm">
        <div className="flex items-center gap-3 group cursor-pointer" onClick={onEnter}>
          <div className="relative">
            <div className="absolute inset-0 bg-cyan-500 blur-md opacity-50 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative bg-black border border-cyan-500/50 p-1.5 rounded-lg">
              <BarChart3 className="h-6 w-6 text-cyan-400" />
            </div>
          </div>
          <span className="font-bold text-xl tracking-wider font-mono">
            STOCK<span className="text-cyan-400">WINNER</span>
            <span className="text-xs ml-1 px-1.5 py-0.5 rounded bg-cyan-900/30 text-cyan-300 border border-cyan-500/30">AI_CORE_V2.0</span>
          </span>
        </div>
        <div className="hidden sm:flex gap-6 text-sm font-mono text-cyan-200/60">
            <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                SYSTEM ONLINE
            </div>
            <div className="flex items-center gap-2">
                <Activity className="w-4 h-4" />
                MARKET DATA: LIVE
            </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-12 pb-20 lg:pt-24">
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
          
          {/* Left Column: Text */}
          <div className="flex-1 text-center lg:text-left relative">
            {/* Decorative HUD lines */}
            <div className="absolute -left-8 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-cyan-500/30 to-transparent hidden lg:block"></div>
            <div className="absolute -left-8 top-[20%] w-4 h-[1px] bg-cyan-500/50 hidden lg:block"></div>
            <div className="absolute -left-8 bottom-[20%] w-4 h-[1px] bg-cyan-500/50 hidden lg:block"></div>

            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-950/30 border border-cyan-500/30 text-cyan-300 text-xs font-mono mb-8 backdrop-blur-md shadow-[0_0_15px_rgba(6,182,212,0.2)]">
              <Cpu className="w-3 h-3" />
              <span>NEURAL NETWORK INITIALIZED</span>
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-bold tracking-tight mb-6 leading-tight font-sans">
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400">
                預見市場的
              </span>
              <span className="relative inline-block">
                <span className="absolute -inset-1 bg-cyan-500/20 blur-xl"></span>
                <span className="relative text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500">
                  未來維度
                </span>
              </span>
            </h1>
            
            <p className="text-lg text-slate-400 mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-light">
              透過 <span className="text-cyan-300 font-medium">Gemini Pro</span> 的量子級運算能力，解析海量金融數據。
              我們不只是分析過去，更是為您運算未來的獲利機率。
            </p>
            
            <div className="flex flex-col sm:flex-row items-center gap-6 justify-center lg:justify-start">
              <button 
                onClick={onEnter}
                className="group relative px-8 py-4 bg-cyan-600/10 hover:bg-cyan-600/20 text-cyan-300 border border-cyan-500/50 hover:border-cyan-400 rounded-lg font-bold text-lg transition-all overflow-hidden"
              >
                <div className="absolute inset-0 bg-cyan-400/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                <div className="relative flex items-center gap-3">
                    <span>啟動分析終端</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </div>
                {/* Corner Accents */}
                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-400"></div>
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyan-400"></div>
              </button>
              
              <div className="flex items-center gap-4 text-sm font-mono text-slate-500">
                <div className="h-px w-8 bg-slate-700"></div>
                <span>v2.4.0 STABLE</span>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-3 gap-8 border-t border-white/5 pt-8">
                <div>
                    <div className="text-3xl font-bold text-white font-mono">98<span className="text-cyan-500 text-lg">%</span></div>
                    <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">運算準確率</div>
                </div>
                <div>
                    <div className="text-3xl font-bold text-white font-mono">0.2<span className="text-purple-500 text-lg">s</span></div>
                    <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">分析延遲</div>
                </div>
                <div>
                    <div className="text-3xl font-bold text-white font-mono">24<span className="text-emerald-500 text-lg">/7</span></div>
                    <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">全天候監控</div>
                </div>
            </div>
          </div>

          {/* Right Column: Holographic Interface */}
          <div className="flex-1 w-full max-w-lg lg:max-w-none relative animate-float">
            
            {/* Hologram Base Glow */}
            <div className="absolute inset-0 bg-cyan-500/5 blur-[80px] rounded-full"></div>

            {/* Main Holographic Card */}
            <div className="relative z-10 bg-[#0a1120]/80 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-1 shadow-[0_0_50px_rgba(6,182,212,0.15)] overflow-hidden group">
                
                {/* Scan Line Effect */}
                <div className="absolute inset-0 w-full h-[20%] bg-gradient-to-b from-transparent via-cyan-400/10 to-transparent scan-line pointer-events-none z-20"></div>

                <div className="bg-[#050b14]/90 rounded-xl p-6 relative overflow-hidden">
                    {/* Grid Pattern inside card */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:20px_20px]"></div>

                    {/* Header */}
                    <div className="flex items-center justify-between mb-8 relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-900 to-blue-900 border border-cyan-500/30 flex items-center justify-center relative overflow-hidden">
                                <div className="absolute inset-0 bg-cyan-400/20 animate-pulse"></div>
                                <BrainCircuit className="w-6 h-6 text-cyan-300 relative z-10" />
                            </div>
                            <div>
                                <div className="font-bold text-xl text-white tracking-wide font-mono">TSMC <span className="text-slate-500">2330</span></div>
                                <div className="flex items-center gap-2 text-xs text-cyan-400 font-mono mt-1">
                                    <span className="relative flex h-2 w-2">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                                    </span>
                                    AI PROCESSING...
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-bold text-white font-mono">1,080</div>
                            <div className="text-xs font-bold text-emerald-400 bg-emerald-900/20 px-2 py-0.5 rounded border border-emerald-500/20">+12.5%</div>
                        </div>
                    </div>

                    {/* Chart Visualization (Abstract) */}
                    <div className="h-48 w-full relative mb-6 border-b border-cyan-500/20">
                        <div className="absolute inset-0 flex items-end justify-between px-2 gap-1 opacity-50">
                            {[40, 65, 45, 70, 55, 85, 75, 90, 60, 80, 95, 100].map((h, i) => (
                                <div key={i} className="w-full bg-cyan-500/20 hover:bg-cyan-400/50 transition-colors rounded-t-sm relative group/bar" style={{ height: `${h}%` }}>
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black border border-cyan-500 text-cyan-300 text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap z-30">
                                        VOL: {h * 1240}
                                    </div>
                                </div>
                            ))}
                        </div>
                        {/* Line Overlay */}
                        <svg className="absolute inset-0 w-full h-full z-10 pointer-events-none" preserveAspectRatio="none">
                            <path d="M0,100 C30,90 60,110 90,70 C120,30 150,50 180,20 C210,10 240,30 270,10 L300,5" stroke="#22d3ee" strokeWidth="2" fill="none" filter="url(#glow)" />
                            <defs>
                                <filter id="glow">
                                    <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                                    <feMerge>
                                        <feMergeNode in="coloredBlur"/>
                                        <feMergeNode in="SourceGraphic"/>
                                    </feMerge>
                                </filter>
                            </defs>
                        </svg>
                    </div>

                    {/* Analysis Modules */}
                    <div className="grid grid-cols-2 gap-3 relative z-10">
                        <div className="bg-slate-900/50 p-3 rounded border border-slate-700/50 hover:border-cyan-500/50 transition-colors group/item">
                            <div className="flex justify-between items-start mb-2">
                                <Globe className="w-4 h-4 text-slate-400 group-hover/item:text-cyan-400 transition-colors" />
                                <span className="text-[10px] text-emerald-400 font-mono">BULLISH</span>
                            </div>
                            <div className="text-xs text-slate-300">全球市場情緒</div>
                            <div className="w-full h-1 bg-slate-700 mt-2 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 w-[85%]"></div>
                            </div>
                        </div>
                        <div className="bg-slate-900/50 p-3 rounded border border-slate-700/50 hover:border-purple-500/50 transition-colors group/item">
                            <div className="flex justify-between items-start mb-2">
                                <Zap className="w-4 h-4 text-slate-400 group-hover/item:text-purple-400 transition-colors" />
                                <span className="text-[10px] text-purple-400 font-mono">HIGH</span>
                            </div>
                            <div className="text-xs text-slate-300">主力籌碼動能</div>
                            <div className="w-full h-1 bg-slate-700 mt-2 rounded-full overflow-hidden">
                                <div className="h-full bg-purple-500 w-[72%]"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Floating Data Widgets */}
            <div className="absolute -right-8 top-10 z-20 bg-black/80 backdrop-blur border border-cyan-500/30 p-3 rounded-lg shadow-lg animate-float" style={{ animationDelay: '1s' }}>
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
                    <div className="font-mono text-xs text-cyan-300">
                        <div>DETECTED</div>
                        <div className="text-white font-bold">外資大量買超</div>
                    </div>
                </div>
            </div>

            <div className="absolute -left-4 bottom-20 z-20 bg-black/80 backdrop-blur border border-purple-500/30 p-3 rounded-lg shadow-lg animate-float" style={{ animationDelay: '2.5s' }}>
                 <div className="flex items-center gap-3">
                    <Cpu className="w-4 h-4 text-purple-400" />
                    <div className="font-mono text-xs">
                        <div className="text-purple-300">AI CONFIDENCE</div>
                        <div className="text-white font-bold">92.4%</div>
                    </div>
                </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default LandingPage;
