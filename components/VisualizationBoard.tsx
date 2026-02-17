
import React, { useEffect, useState } from 'react';

interface VisualizationBoardProps {
  status: string;
  contentSnippet?: string;
  isProcessing: boolean;
  type: 'extraction' | 'evaluation';
}

const VisualizationBoard: React.FC<VisualizationBoardProps> = ({ status, contentSnippet, isProcessing, type }) => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  if (!isProcessing) return null;

  return (
    <div className="w-full bg-slate-900 rounded-2xl p-6 text-indigo-300 font-mono text-sm shadow-2xl border border-indigo-500/30 overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500/20">
        <div className="h-full bg-indigo-500 animate-pulse w-1/3"></div>
      </div>
      
      <div className="flex items-center space-x-2 mb-4">
        <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>
        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
        <div className="w-3 h-3 rounded-full bg-green-500"></div>
        <span className="ml-4 text-xs text-indigo-400 opacity-70 uppercase tracking-widest">AI Intelligence Link Active</span>
      </div>

      <div className="space-y-3">
        <div className="flex items-start">
          <span className="text-indigo-500 mr-2">❯</span>
          <p className="text-white font-bold">{status}{dots}</p>
        </div>

        {contentSnippet && (
          <div className="mt-4 p-4 bg-indigo-950/50 rounded-lg border border-indigo-800/50 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <span className="text-[10px] text-indigo-400 block mb-2 uppercase tracking-tighter">Live Stream Data:</span>
            <p className="text-indigo-200 line-clamp-4 leading-relaxed">
              {contentSnippet}
            </p>
          </div>
        )}

        <div className="flex items-center space-x-2 pt-4 opacity-50">
          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-ping"></div>
          <span className="text-[10px]">Processing via Gemini 3 Flash Pipeline...</span>
        </div>
      </div>

      <div className="absolute bottom-0 right-0 p-4 opacity-10">
        <svg className="w-24 h-24 text-indigo-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
        </svg>
      </div>
    </div>
  );
};

export default VisualizationBoard;
