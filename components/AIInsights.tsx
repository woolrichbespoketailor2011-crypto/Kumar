
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Transaction } from '../types';

interface AIInsightsProps {
  transactions: Transaction[];
}

const AIInsights: React.FC<AIInsightsProps> = ({ transactions }) => {
  const [insight, setInsight] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateInsights = async () => {
    if (transactions.length === 0) {
      setInsight("Start adding some records to get personalized financial advice!");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const summary = transactions.map(t => `${t.date}: ${t.type} of $${t.amount} in ${t.category}`).join('\n');
      
      const prompt = `Analyze this list of recent financial transactions and provide 3 concise, actionable pieces of advice to improve the user's financial health. Be direct and helpful, like a personal accountant. Format as a list with bullet points.
      
      Transactions:
      ${summary}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      setInsight(response.text || "I couldn't generate insights at this moment. Try again later.");
    } catch (err: any) {
      console.error(err);
      setError("Unable to connect to the financial intelligence engine.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateInsights();
  }, []);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-gradient-to-br from-[#0071e3] to-[#5e5ce6] p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-32 w-32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-2">FinTrack AI Analyst</h2>
        <p className="opacity-90 text-sm leading-relaxed max-w-lg">
          Our advanced intelligence engine analyzes your spending patterns to provide professional financial coaching tailored just for you.
        </p>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-black/5 min-h-[300px] flex flex-col">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-4">
            <div className="w-8 h-8 border-4 border-[#0071e3] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-medium text-black/50">Analyzing your financial flow...</p>
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="bg-red-50 p-4 rounded-full mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-black/70 mb-4">{error}</p>
            <button 
              onClick={generateInsights}
              className="px-4 py-2 bg-black/5 hover:bg-black/10 rounded-lg text-sm font-medium transition-colors"
            >
              Retry Connection
            </button>
          </div>
        ) : (
          <div className="prose prose-sm max-w-none">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-[11px] font-bold text-black/40 uppercase tracking-widest">Live Report</span>
            </div>
            <div className="text-[#1d1d1f] leading-relaxed whitespace-pre-wrap">
              {insight || "No insights available yet."}
            </div>
            <button 
              onClick={generateInsights}
              className="mt-8 flex items-center gap-2 px-4 py-2 bg-[#0071e3]/10 text-[#0071e3] hover:bg-[#0071e3]/20 rounded-lg text-sm font-semibold transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh Analysis
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIInsights;
