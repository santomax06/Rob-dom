
import React, { useState, useEffect, useRef } from 'react';
import { Challenge, ChallengeTheme, ChallengeDifficulty, LogicStep } from './types';
import { generateChallenge } from './services/geminiService';
import TrackVisualizer from './components/TrackVisualizer';
import Timer from './components/Timer';

const WedoRobotSVG = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="25" y="45" width="50" height="35" rx="5" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="2"/>
    <circle cx="35" cy="80" r="10" fill="#334155"/>
    <circle cx="65" cy="80" r="10" fill="#334155"/>
    <rect x="40" y="30" width="20" height="15" rx="2" fill="#93C5FD"/>
    <path d="M50 30V20M45 20H55" stroke="#64748B" strokeWidth="2" strokeLinecap="round"/>
    <rect x="75" y="55" width="10" height="15" rx="2" fill="#22C55E"/>
  </svg>
);

const LogicIcon = ({ type }: { type: LogicStep['icon'] }) => {
  switch (type) {
    case 'start': return <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center text-white font-bold">▶</div>;
    case 'motor': return <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold">⚙</div>;
    case 'sensor': return <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center text-white font-bold">👁</div>;
    case 'wait': return <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold">⏳</div>;
    case 'stop': return <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center text-white font-bold">✖</div>;
    case 'loop': return <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center text-white font-bold">⟳</div>;
    default: return null;
  }
};

const App: React.FC = () => {
  const [currentChallenge, setCurrentChallenge] = useState<Challenge | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [difficulty, setDifficulty] = useState<ChallengeDifficulty>(ChallengeDifficulty.EASY);
  const [activeTheme, setActiveTheme] = useState<ChallengeTheme>(ChallengeTheme.SPACE);
  const [isFullView, setIsFullView] = useState(false);
  
  // Simulation States
  const [isSimulating, setIsSimulating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [simProgress, setSimProgress] = useState(0);
  const simInterval = useRef<number | null>(null);

  const handleGenerate = async (theme: ChallengeTheme) => {
    setIsLoading(true);
    setSelectedElementId(null);
    setScore(0);
    setSimProgress(0);
    setIsSimulating(false);
    setActiveTheme(theme);
    try {
      const challenge = await generateChallenge(theme, difficulty);
      setCurrentChallenge(challenge);
    } catch (error) {
      console.error("Erro ao gerar desafio:", error);
      alert("Falha ao gerar o desafio.");
    } finally {
      setIsLoading(false);
    }
  };

  const startSimulation = () => {
    if (isSimulating) {
      setIsSimulating(false);
      setIsPaused(false);
      if (simInterval.current) clearInterval(simInterval.current);
      return;
    }

    setSimProgress(0);
    setScore(0);
    setIsSimulating(true);
    setIsPaused(false);
  };

  useEffect(() => {
    if (isSimulating && !isPaused) {
      const stepSize = 0.003; 
      simInterval.current = window.setInterval(() => {
        setSimProgress(prev => {
          if (prev >= 1) {
            clearInterval(simInterval.current!);
            setIsSimulating(false);
            return 1;
          }
          return prev + stepSize;
        });
      }, 30);
    } else {
      if (simInterval.current) clearInterval(simInterval.current);
    }
    return () => { if (simInterval.current) clearInterval(simInterval.current); };
  }, [isSimulating, isPaused]);

  const handleScoreTrigger = (points: number) => {
    setScore(s => s + points);
    setIsPaused(true);
    setTimeout(() => {
      setIsPaused(false);
    }, 1500); 
  };

  const getDifficultyColor = (diff: string) => {
    if (diff === ChallengeDifficulty.EASY) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    if (diff === ChallengeDifficulty.MEDIUM) return 'bg-green-100 text-green-700 border-green-200';
    if (diff === ChallengeDifficulty.HARD) return 'bg-red-100 text-red-700 border-red-200';
    return 'bg-slate-100';
  };

  const getDifficultyButtonActiveColor = (diff: string) => {
    if (diff === ChallengeDifficulty.EASY) return 'bg-yellow-400 text-black';
    if (diff === ChallengeDifficulty.MEDIUM) return 'bg-green-500 text-white';
    if (diff === ChallengeDifficulty.HARD) return 'bg-red-500 text-white';
    return 'bg-white text-indigo-700';
  };

  return (
    <div className={`min-h-screen bg-slate-100 pb-40 ${isFullView ? 'overflow-hidden' : ''}`}>
      <header className="bg-indigo-600 text-white py-6 shadow-2xl border-b-8 border-indigo-800 mb-8 relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-xl rotate-3">
              <WedoRobotSVG className="w-12 h-12" />
            </div>
            <div>
              <h1 className="text-4xl font-black uppercase tracking-tighter italic leading-none">DESAFIO DOM</h1>
              <p className="text-indigo-200 text-xs font-black uppercase tracking-[0.2em] mt-1">WeDo 2.0 Simulator</p>
            </div>
          </div>
          
          <div className="flex flex-col items-center md:items-end gap-3">
            <div className="flex bg-indigo-900/40 p-1 rounded-2xl border border-indigo-400/30 backdrop-blur-sm">
              {Object.values(ChallengeDifficulty).map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${
                    difficulty === d 
                    ? `${getDifficultyButtonActiveColor(d)} shadow-lg` 
                    : 'text-indigo-200 hover:text-white'
                  }`}
                >
                  {d.toUpperCase()}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {Object.values(ChallengeTheme).map((theme) => (
                <button
                  key={theme}
                  onClick={() => handleGenerate(theme)}
                  disabled={isLoading}
                  className="px-5 py-2.5 bg-indigo-700 hover:bg-indigo-800 disabled:opacity-50 text-white rounded-2xl text-xs font-black shadow-lg transition-all active:scale-95 border-b-4 border-indigo-900 uppercase"
                >
                  {theme}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4">
        {!currentChallenge && !isLoading && (
          <div className="text-center py-20 bg-white rounded-[3rem] border-4 border-dashed border-indigo-200 flex flex-col items-center shadow-sm">
            <WedoRobotSVG className="w-48 h-48 mb-8 opacity-20 animate-pulse" />
            <h2 className="text-3xl font-black text-slate-300 mb-2 uppercase italic">Aguardando Missão</h2>
            <p className="text-slate-400 font-bold text-sm tracking-wide uppercase tracking-widest">Selecione o desafio do seu Milo</p>
          </div>
        )}

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-24 space-y-8">
            <div className="relative">
              <div className="w-24 h-24 border-[12px] border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
              <WedoRobotSVG className="w-10 h-10 absolute inset-0 m-auto animate-bounce" />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-black text-indigo-600 uppercase tracking-tighter">Preparando Campo...</h2>
              <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">Ajustando Nível: {difficulty}</p>
            </div>
          </div>
        )}

        {currentChallenge && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-200 relative overflow-hidden">
                <button 
                  onClick={startSimulation}
                  className={`w-full mb-6 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-3 ${
                    isSimulating 
                    ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
                    : 'bg-green-500 hover:bg-green-600 text-white'
                  }`}
                >
                  {isSimulating ? (
                    <>{isPaused ? '⏳ PAUSADO...' : '⬛ PARAR SIMULAÇÃO'}</>
                  ) : (
                    <><span>▶</span> VER SIMULAÇÃO</>
                  )}
                </button>

                <div className="flex gap-2 mb-4">
                  <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase border-2 ${getDifficultyColor(currentChallenge.difficulty)}`}>
                    {currentChallenge.difficulty}
                  </span>
                </div>
                <h2 className="text-2xl font-black text-slate-800 mb-3 leading-tight uppercase italic">{currentChallenge.name}</h2>
                <p className="text-slate-500 text-xs leading-relaxed mb-6 font-medium">
                  {currentChallenge.description}
                </p>
                <Timer initialSeconds={currentChallenge.estimatedTimeSeconds} />
              </div>

              <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                <div className="absolute -right-8 -top-8 w-32 h-32 bg-indigo-600/20 rounded-full blur-3xl group-hover:bg-indigo-600/40 transition-all"></div>
                <h3 className="text-lg font-black mb-6 uppercase italic flex items-center gap-3">
                  <span className="w-2 h-6 bg-indigo-500 rounded-full"></span>
                  Passo a Passo
                </h3>
                <div className="space-y-4 relative z-10">
                  {currentChallenge.logicSteps.map((step, idx) => (
                    <div key={idx} className="flex items-center gap-4 bg-white/5 p-3 rounded-2xl hover:bg-white/10 transition-all border border-white/5">
                      <LogicIcon type={step.icon} />
                      <p className="text-xs font-medium text-slate-200 leading-tight">{step.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-8 space-y-6">
              <div className="bg-white p-4 md:p-8 rounded-[3rem] shadow-xl border border-slate-200 relative">
                {isSimulating && (
                  <div className="absolute top-0 left-0 w-full h-2 bg-slate-100 rounded-t-[3rem] overflow-hidden z-20">
                    <div 
                      className="h-full bg-green-500 transition-all duration-100 ease-linear shadow-[0_0_10px_rgba(16,185,129,0.5)]" 
                      style={{ width: `${simProgress * 100}%` }}
                    />
                  </div>
                )}

                <div className="flex justify-between items-center mb-6 px-4">
                  <h3 className="text-xl font-black text-slate-800 uppercase italic tracking-tighter flex items-center gap-2">
                    Campo Virtual {activeTheme}
                  </h3>
                  <button 
                    onClick={() => setIsFullView(true)}
                    className="p-2 hover:bg-slate-100 rounded-xl transition-all group border border-slate-100 shadow-sm"
                    title="Ver Simulador Full"
                  >
                    <svg className="w-6 h-6 text-indigo-600 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                  </button>
                </div>
                
                <TrackVisualizer 
                  elements={currentChallenge.elements}
                  activeElementId={selectedElementId}
                  onSelectElement={setSelectedElementId}
                  simulationProgress={simProgress}
                  isSimulating={isSimulating}
                  theme={activeTheme}
                  onScoreTrigger={handleScoreTrigger}
                />

                <div className="mt-8">
                  {selectedElementId ? (
                    <div className="p-8 bg-indigo-600 text-white rounded-[2.5rem] shadow-2xl animate-in zoom-in slide-in-from-top-4 duration-300 relative overflow-hidden">
                      <div className="absolute -right-4 -bottom-4 text-white opacity-10 text-9xl font-black select-none pointer-events-none">
                        {currentChallenge.elements.find(e => e.id === selectedElementId)?.label[0]}
                      </div>
                      <div className="flex items-center justify-between mb-2 relative z-10">
                        <h4 className="font-black uppercase text-2xl tracking-tighter">
                          {currentChallenge.elements.find(e => e.id === selectedElementId)?.label}
                        </h4>
                        <button onClick={() => setSelectedElementId(null)} className="p-2 hover:bg-white/10 rounded-full transition-all">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                      </div>
                      <p className="text-indigo-100 font-medium text-lg relative z-10">
                        {currentChallenge.elements.find(e => e.id === selectedElementId)?.description}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                       {currentChallenge.rules.slice(0, 4).map(rule => (
                         <div key={rule.id} className="bg-slate-50 border-2 border-slate-100 p-5 rounded-3xl hover:border-indigo-200 transition-all text-center group">
                            <span className="text-[10px] font-black text-indigo-500 mb-2 block uppercase tracking-widest">{rule.title}</span>
                            <span className="text-2xl font-black text-slate-800 group-hover:scale-110 block transition-transform">+{rule.points}</span>
                         </div>
                       ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {!isFullView && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-xl px-4 z-50">
          <div className="bg-white/95 backdrop-blur-2xl p-5 rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] border border-white flex justify-between items-center">
            <div className="flex items-center gap-5 pl-4">
              <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100 group overflow-hidden">
                 <WedoRobotSVG className="w-10 h-10 group-hover:scale-110 transition-transform" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">XP ACUMULADO</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-indigo-700 leading-none">{score}</span>
                  <span className="text-xs font-black text-indigo-300 uppercase">Pontos</span>
                </div>
              </div>
            </div>
            <div className="flex gap-3 pr-2">
              <button 
                onClick={() => setScore(0)}
                className="px-6 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black hover:bg-black active:scale-95 transition-all uppercase tracking-widest border-b-4 border-slate-950"
              >
                LIMPAR
              </button>
            </div>
          </div>
        </div>
      )}

      {isFullView && currentChallenge && (
        <div className="fixed inset-0 z-[100] bg-slate-900 flex flex-col items-center justify-center p-4 md:p-8 animate-in fade-in zoom-in duration-300">
          <div className="absolute top-8 right-8 z-[110] flex gap-4">
             <button 
              onClick={startSimulation}
              className={`px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-2xl flex items-center gap-3 ${
                isSimulating 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              {isSimulating ? (isPaused ? 'PONTUANDO...' : 'PARAR') : 'SIMULAR AGORA'}
            </button>
            <button 
              onClick={() => setIsFullView(false)}
              className="w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-2xl flex items-center justify-center backdrop-blur-md transition-all border border-white/20"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>

          <div className="w-full h-full max-w-7xl flex flex-col gap-6">
             <div className="flex flex-col md:flex-row justify-between items-end gap-4 px-4">
                <div>
                  <h2 className="text-4xl md:text-5xl font-black text-white italic uppercase tracking-tighter leading-none mb-2">MODO FULL SIMULATOR</h2>
                  <p className="text-indigo-400 font-black text-xs uppercase tracking-[0.3em]">{currentChallenge.name} • {activeTheme}</p>
                </div>
                <div className="flex items-center gap-8 bg-white/5 p-6 rounded-[2rem] border border-white/10 backdrop-blur-xl">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">PROGRESSO</span>
                      <div className="w-32 h-2 bg-white/10 rounded-full mt-2 overflow-hidden">
                        <div className="h-full bg-green-500 transition-all duration-300" style={{ width: `${simProgress * 100}%` }} />
                      </div>
                    </div>
                    <div className="w-[2px] h-10 bg-white/10"></div>
                    <div className="flex flex-col text-right">
                      <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">SCORE</span>
                      <span className="text-3xl font-black text-white leading-none">{score} <span className="text-[10px] opacity-50">PTS</span></span>
                    </div>
                </div>
             </div>

             <div className="flex-1 bg-white rounded-[4rem] p-4 md:p-12 relative shadow-[0_0_100px_rgba(99,102,241,0.2)]">
                <TrackVisualizer 
                  elements={currentChallenge.elements}
                  activeElementId={null}
                  onSelectElement={() => {}}
                  simulationProgress={simProgress}
                  isSimulating={isSimulating}
                  theme={activeTheme}
                  onScoreTrigger={handleScoreTrigger}
                />
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
