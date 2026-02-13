
import React, { useState } from 'react';
import { BotConfig, CodeReviewResult } from '../types';
import { performCodeReview } from '../services/geminiService';

export const DevOpsBot: React.FC = () => {
  const [config, setConfig] = useState<BotConfig>({
    repoName: 'my-org/awesome-project',
    reviewStrictness: 'balanced',
    focusAreas: ['Security', 'Maintainability'],
  });
  
  const [diffInput, setDiffInput] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [result, setResult] = useState<CodeReviewResult | null>(null);

  const masterPrompt = `You are an expert GitHub Code Review Bot for the repository ${config.repoName}. 
  Strictness Level: ${config.reviewStrictness}. 
  Focus Areas: ${config.focusAreas.join(', ')}. 
  Analyze the provided diff for logic errors, security vulnerabilities, and performance bottlenecks. 
  Provide a score from 0 to 100 where 100 is production-ready code.`;

  const handleSimulate = async () => {
    if (!diffInput) return;
    setIsSimulating(true);
    try {
      const review = await performCodeReview(masterPrompt, diffInput);
      setResult(review);
    } catch (e) {
      alert("Simulation error: " + e);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in">
      {/* Configuration Sidebar */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 shadow-xl">
          <h3 className="text-xl font-black mb-6 flex items-center gap-2">
            <div className="p-1.5 bg-indigo-500 rounded-lg"><svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg></div>
            Bot Configuration
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Target Repository</label>
              <input 
                type="text" 
                value={config.repoName} 
                onChange={e => setConfig({...config, repoName: e.target.value})}
                className="w-full bg-slate-900 border-none rounded-xl p-3 text-sm font-bold outline-none ring-2 ring-transparent focus:ring-indigo-500 transition-all"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Review Strictness</label>
              <div className="grid grid-cols-3 gap-2">
                {['lenient', 'balanced', 'strict'].map(s => (
                  <button 
                    key={s}
                    onClick={() => setConfig({...config, reviewStrictness: s as any})}
                    className={`p-2 rounded-lg text-[10px] font-black uppercase transition-all ${config.reviewStrictness === s ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-500 hover:bg-slate-700'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Focus Domains</label>
              <div className="flex flex-wrap gap-2">
                {['Security', 'Performance', 'Clean Code', 'Bugs'].map(area => (
                  <button 
                    key={area}
                    onClick={() => setConfig({
                      ...config, 
                      focusAreas: config.focusAreas.includes(area) ? config.focusAreas.filter(a => a !== area) : [...config.focusAreas, area]
                    })}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase border transition-all ${config.focusAreas.includes(area) ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400' : 'bg-slate-900 border-slate-700 text-slate-500'}`}
                  >
                    {area}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-3">Master Prompt (Generated)</label>
          <div className="bg-slate-900 p-4 rounded-xl text-[10px] font-mono leading-relaxed text-slate-400 break-words whitespace-pre-wrap h-48 overflow-y-auto">
            {masterPrompt}
          </div>
          <button onClick={() => navigator.clipboard.writeText(masterPrompt)} className="w-full mt-4 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Copy System Payload</button>
        </div>
      </div>

      {/* Simulator Playground */}
      <div className="lg:col-span-8 space-y-8">
        <div className="bg-slate-800 p-8 rounded-[2.5rem] border border-slate-700 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8">
             <div className="px-3 py-1 bg-cyan-500/10 rounded-full border border-cyan-500/20 text-cyan-400 text-[9px] font-black uppercase tracking-widest">Live Playground</div>
          </div>
          <h3 className="text-2xl font-black mb-6">Review Simulator</h3>
          <p className="text-slate-400 text-sm mb-6">Paste your pull request diff below to simulate the bot's reaction and get automated feedback.</p>
          
          <textarea 
            value={diffInput}
            onChange={e => setDiffInput(e.target.value)}
            placeholder="diff --git a/src/main.ts b/src/main.ts..."
            className="w-full h-64 bg-slate-900/50 border border-slate-700 rounded-3xl p-6 font-mono text-xs outline-none focus:ring-2 ring-cyan-500/50 transition-all mb-6"
          />

          <button 
            disabled={isSimulating || !diffInput}
            onClick={handleSimulate}
            className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl transition-all ${isSimulating ? 'bg-slate-700 opacity-50' : 'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] shadow-indigo-500/20'}`}
          >
            {isSimulating ? (
              <><div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> Analyzing Diff...</>
            ) : 'Analyze Code with Gemini-3 Pro'}
          </button>
        </div>

        {result && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in">
            <div className="bg-slate-800 p-8 rounded-[2rem] border border-slate-700">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Analysis Summary</h4>
                <div className="text-3xl font-black text-cyan-400">{result.score}%</div>
              </div>
              <p className="text-sm font-bold leading-relaxed">{result.summary}</p>
            </div>

            <div className="bg-slate-800 p-8 rounded-[2rem] border border-slate-700 space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Security & Logic Bugs</h4>
              <div className="space-y-3">
                {result.bugs.map((bug, i) => (
                  <div key={i} className="p-3 bg-red-500/10 rounded-xl border border-red-500/20 flex gap-3">
                    <div className="text-red-500 font-black text-xs">!</div>
                    <div>
                      <div className="text-[10px] font-black text-red-400 uppercase">{bug.file}:{bug.line}</div>
                      <div className="text-xs font-bold text-slate-200">{bug.message}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
