
import React, { useState, useEffect } from 'react';
import { POPULAR_CURRENCIES } from '../types';

const CurrencyExchange: React.FC = () => {
  const [baseCurrency, setBaseCurrency] = useState('USD');
  const [targetCurrency, setTargetCurrency] = useState('EUR');
  const [amount, setAmount] = useState('1000');
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null);
  const [rates, setRates] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  const fetchRates = async (base: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`https://api.frankfurter.app/latest?from=${base}`);
      if (!res.ok) throw new Error('Failed to fetch real-time rates');
      const data = await res.json();
      setRates(data.rates);
      setLastUpdate(new Date().toLocaleTimeString());
    } catch (err) {
      setError('Could not update rates. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates(baseCurrency);
  }, [baseCurrency]);

  useEffect(() => {
    if (rates[targetCurrency]) {
      setConvertedAmount(parseFloat(amount) * rates[targetCurrency]);
    } else if (baseCurrency === targetCurrency) {
      setConvertedAmount(parseFloat(amount));
    } else {
      setConvertedAmount(null);
    }
  }, [amount, targetCurrency, rates, baseCurrency]);

  const swapCurrencies = () => {
    const temp = baseCurrency;
    setBaseCurrency(targetCurrency);
    setTargetCurrency(temp);
  };

  const getCurrencySymbol = (code: string) => {
    return POPULAR_CURRENCIES.find(c => c.code === code)?.symbol || '';
  };

  const currentRate = rates[targetCurrency] || 1;
  const fee = parseFloat(amount) * 0.005; // Dummy 0.5% fee like Wise
  const amountToConvert = parseFloat(amount) - fee;
  const finalRecipientAmount = amountToConvert * currentRate;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Wise Hero Header */}
      <div className="bg-[#1d1d1f] text-white p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
         <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="max-w-md">
               <div className="inline-flex items-center gap-2 bg-[#34c759] text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                  </span>
                  Live Exchange
               </div>
               <h2 className="text-4xl font-extrabold tracking-tight mb-3">The world’s most accurate converter.</h2>
               <p className="text-lg text-white/60 leading-relaxed font-medium">
                  Get the real exchange rate with Wise. No hidden fees, just pure market data.
               </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-xl p-4 rounded-2xl border border-white/10 min-w-[200px]">
               <p className="text-[10px] font-bold text-white/40 uppercase mb-2">Last Market Sync</p>
               <div className="flex items-center justify-between">
                  <span className="text-xl font-mono font-bold">{lastUpdate || '--:--'}</span>
                  <button 
                    onClick={() => fetchRates(baseCurrency)}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
               </div>
            </div>
         </div>
         
         {/* Abstract background shapes */}
         <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-blue-600 rounded-full blur-[100px] opacity-20"></div>
         <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-green-600 rounded-full blur-[100px] opacity-20"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Calculator */}
        <div className="lg:col-span-2 bg-white p-8 md:p-10 rounded-[2rem] shadow-sm border border-black/5">
            <div className="space-y-6">
                {/* Send Input */}
                <div className="relative group">
                    <div className="absolute left-5 top-4 flex items-center gap-2 z-10">
                        <span className="text-[11px] font-black text-black/30 uppercase tracking-tighter">You send</span>
                    </div>
                    <div className="flex items-stretch h-24">
                        <div className="relative flex-1">
                          <span className="absolute left-5 bottom-4 text-3xl font-bold text-black/20 pointer-events-none">
                            {getCurrencySymbol(baseCurrency)}
                          </span>
                          <input 
                              type="number"
                              value={amount}
                              onChange={(e) => setAmount(e.target.value)}
                              className="w-full pl-12 pr-4 pt-8 pb-4 bg-[#f5f5f7] border-l border-t border-b border-black/5 rounded-l-2xl text-3xl font-bold outline-none focus:bg-white focus:ring-2 focus:ring-[#0071e3] transition-all"
                          />
                        </div>
                        <div className="flex items-center px-4 bg-[#f5f5f7] border border-black/5 rounded-r-2xl min-w-[140px]">
                           <select 
                                value={baseCurrency}
                                onChange={(e) => setBaseCurrency(e.target.value)}
                                className="bg-transparent font-black text-lg outline-none cursor-pointer w-full"
                            >
                                {POPULAR_CURRENCIES.map(c => (
                                    <option key={c.code} value={c.code}>{c.code} {c.symbol}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Calculation Details (The Wise "Vertical Line" effect) */}
                <div className="pl-8 relative border-l-2 border-dashed border-black/10 space-y-4 py-2 ml-5">
                   <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-black/10"></div>
                   <div className="absolute -left-[9px] bottom-0 w-4 h-4 rounded-full bg-white border-2 border-black/10"></div>
                   
                   <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                         <span className="w-5 h-5 flex items-center justify-center bg-black/5 rounded-full text-[10px] font-bold text-black/40">−</span>
                         <span className="text-black/50 font-medium">{getCurrencySymbol(baseCurrency)}{fee.toFixed(2)}</span>
                      </div>
                      <span className="text-[11px] font-bold text-black/30 uppercase">Fee (0.5%)</span>
                   </div>

                   <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                         <span className="w-5 h-5 flex items-center justify-center bg-[#34c759]/10 rounded-full text-[10px] font-bold text-[#34c759]">×</span>
                         <span className="text-black font-bold">{currentRate.toFixed(5)}</span>
                      </div>
                      <span className="text-[11px] font-bold text-[#34c759] uppercase">Guaranteed Rate</span>
                   </div>
                </div>

                {/* Recipient Input */}
                <div className="relative group">
                    <div className="absolute left-5 top-4 flex items-center gap-2 z-10">
                        <span className="text-[11px] font-black text-black/30 uppercase tracking-tighter">Recipient gets</span>
                    </div>
                    <div className="flex items-stretch h-24">
                        <div className="flex-1 pl-5 pr-4 pt-8 pb-4 bg-white border-l border-t border-b border-black/5 rounded-l-2xl text-3xl font-bold text-[#34c759] flex items-center gap-2">
                            <span>{getCurrencySymbol(targetCurrency)}</span>
                            {finalRecipientAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="flex items-center px-4 bg-[#f5f5f7] border border-black/5 rounded-r-2xl min-w-[140px]">
                            <select 
                                value={targetCurrency}
                                onChange={(e) => setTargetCurrency(e.target.value)}
                                className="bg-transparent font-black text-lg outline-none cursor-pointer w-full"
                            >
                                {POPULAR_CURRENCIES.map(c => (
                                    <option key={c.code} value={c.code}>{c.code} {c.symbol}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-10 pt-8 border-t border-black/5 flex flex-col sm:flex-row items-center justify-between gap-4">
               <div>
                  <p className="text-xs font-bold text-black/30 uppercase mb-1">Savings with FinTrack</p>
                  <p className="text-sm font-medium text-black/60">You save up to <span className="text-[#34c759] font-bold">{getCurrencySymbol(baseCurrency)}42.50</span> compared to local banks.</p>
               </div>
               <button 
                  onClick={swapCurrencies}
                  className="px-6 py-3 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-2xl text-sm font-bold shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center gap-2"
               >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                  Switch Direction
               </button>
            </div>
        </div>

        {/* Side Stats */}
        <div className="space-y-6">
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-black/5">
                <h3 className="text-sm font-black uppercase tracking-wider text-black/30 mb-6">Market Trends</h3>
                <div className="space-y-4">
                    {POPULAR_CURRENCIES.filter(c => c.code !== baseCurrency).slice(0, 5).map(curr => {
                       const rate = rates[curr.code] || 0;
                       return (
                          <div key={curr.code} className="flex items-center justify-between group cursor-pointer" onClick={() => setTargetCurrency(curr.code)}>
                              <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 rounded-full bg-[#f5f5f7] flex items-center justify-center font-bold text-xs">
                                    {curr.symbol}
                                 </div>
                                 <span className="text-sm font-bold text-black/80">{curr.name}</span>
                              </div>
                              <span className="text-sm font-mono font-bold text-black/40 group-hover:text-[#0071e3] transition-colors">{rate.toFixed(4)}</span>
                          </div>
                       );
                    })}
                </div>
            </div>

            <div className="bg-[#34c759]/10 p-8 rounded-[2rem] border border-[#34c759]/20">
                <div className="flex items-center gap-3 mb-4">
                   <div className="p-2 bg-[#34c759] text-white rounded-xl">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                   </div>
                   <h4 className="font-bold text-[#1d1d1f]">Verified Rate</h4>
                </div>
                <p className="text-xs text-[#1d1d1f]/60 leading-relaxed font-medium">
                   We use the same real-time data providers as major financial institutions to ensure your reports are always accurate to the minute.
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default CurrencyExchange;
