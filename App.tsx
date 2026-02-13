
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Bill, SummaryStats, SUPPORTED_CURRENCIES, BillStatus, Customer } from './types';
import { CameraScanner } from './components/CameraScanner';
import { BillForm } from './components/BillForm';
import { analyzeBillImage } from './services/geminiService';
import { DevOpsBot } from './components/DevOpsBot';

const ITEMS_PER_PAGE = 5;

const formatCurrency = (amount: number, currencyCode: string = 'INR') => {
  const currency = SUPPORTED_CURRENCIES.find(c => c.code === currencyCode) || SUPPORTED_CURRENCIES[0];
  return `${currency.symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

type SortKey = 'customerName' | 'date' | 'dueDate' | 'totalAmount' | 'status';
type MainModule = 'financials' | 'devops';

const App: React.FC = () => {
  const [activeModule, setActiveModule] = useState<MainModule>('financials');
  const [bills, setBills] = useState<Bill[]>([]);
  const [view, setView] = useState<'dashboard' | 'add' | 'camera' | 'customers'>('dashboard');
  const [currentBill, setCurrentBill] = useState<Partial<Bill> | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<{ key: SortKey, direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' });
  const [highAccuracy, setHighAccuracy] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(false);
  
  const [preferredCurrency, setPreferredCurrency] = useState(() => {
    return localStorage.getItem('smartbill_pref_currency') || 'INR';
  });

  const [darkMode, setDarkMode] = useState(true);

  // Persistence logic
  useEffect(() => {
    const saved = localStorage.getItem('smartbill_data');
    if (saved) setBills(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('smartbill_data', JSON.stringify(bills));
  }, [bills]);

  const stats = useMemo<SummaryStats>(() => {
    const totalRevenue = bills.reduce((sum, b) => sum + b.totalAmount, 0);
    return {
      totalRevenue,
      billCount: bills.length,
      averageBillValue: bills.length > 0 ? totalRevenue / bills.length : 0
    };
  }, [bills]);

  const customerProfiles = useMemo<Customer[]>(() => {
    const map = new Map<string, Customer>();
    bills.forEach(bill => {
      const name = bill.customerName.trim();
      const existing = map.get(name) || { name, totalSpent: 0, billCount: 0, lastActive: bill.date, tags: [] };
      existing.totalSpent += bill.totalAmount;
      existing.billCount += 1;
      existing.tags = Array.from(new Set([...existing.tags, ...bill.tags]));
      if (new Date(bill.date) > new Date(existing.lastActive)) existing.lastActive = bill.date;
      map.set(name, existing);
    });
    return Array.from(map.values()).sort((a, b) => b.totalSpent - a.totalSpent);
  }, [bills]);

  const filteredBills = useMemo(() => {
    let result = bills.filter(b => 
      b.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    result.sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      if (aVal! < bVal!) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal! > bVal!) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return result;
  }, [bills, searchQuery, sortConfig]);

  const paginatedBills = filteredBills.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const totalPages = Math.ceil(filteredBills.length / ITEMS_PER_PAGE);

  const handleCapture = async (base64: string) => {
    setIsAnalyzing(true);
    try {
      const data = await analyzeBillImage(base64, highAccuracy);
      const newBill: Bill = {
        ...data as any,
        id: crypto.randomUUID(),
        currency: data.currency || preferredCurrency,
        tags: [],
        lastModified: new Date().toISOString(),
        isNew: true
      };
      if (autoSaveEnabled) setBills(prev => [newBill, ...prev]);
      else {
        setCurrentBill(newBill);
        setView('add');
      }
    } catch (e: any) { setAnalysisError(e.message); }
    finally { setIsAnalyzing(false); }
  };

  // Fixed the missing handleSaveBill function
  const handleSaveBill = (bill: Bill) => {
    setBills(prev => {
      const exists = prev.some(b => b.id === bill.id);
      if (exists) {
        // Update existing bill and clear isNew flag
        return prev.map(b => b.id === bill.id ? { ...bill, isNew: false } : b);
      }
      // Add new bill to the beginning of the list
      return [bill, ...prev];
    });
    setView('dashboard');
    setCurrentBill(null);
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'} transition-all duration-300 font-sans`}>
      {/* Module Navigation Sidebar */}
      <nav className="fixed left-0 top-0 bottom-0 w-20 bg-slate-800 border-r border-slate-700 flex flex-col items-center py-8 gap-8 z-50 no-print">
        <button 
          onClick={() => setActiveModule('financials')}
          className={`p-4 rounded-2xl transition-all ${activeModule === 'financials' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          title="Financial Ledger"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
        </button>
        <button 
          onClick={() => setActiveModule('devops')}
          className={`p-4 rounded-2xl transition-all ${activeModule === 'devops' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          title="GitHub Bot Center"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
        </button>
      </nav>

      <div className="pl-20">
        <header className="h-20 px-8 flex items-center justify-between border-b border-slate-800/50 bg-slate-900/50 backdrop-blur-md sticky top-0 z-40 no-print">
          <div className="flex items-center gap-4">
             <h1 className="text-xl font-black uppercase tracking-widest">{activeModule === 'financials' ? 'Financials' : 'DevOps Lab'}</h1>
             {isAnalyzing && <div className="flex items-center gap-2 px-3 py-1 bg-indigo-500/10 text-indigo-400 rounded-full text-[10px] font-black animate-pulse">Gemini Analysis Active</div>}
          </div>
          <div className="flex items-center gap-4">
            {activeModule === 'financials' && (
              <button onClick={() => setView('camera')} className="px-6 py-2.5 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20">Scan Invoice</button>
            )}
            <button onClick={() => setDarkMode(!darkMode)} className="p-3 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors">
              {darkMode ? '🌙' : '☀️'}
            </button>
          </div>
        </header>

        <main className="p-8 max-w-7xl mx-auto">
          {activeModule === 'financials' ? (
            view === 'dashboard' ? (
              <div className="space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 no-print">
                  <div className="bg-slate-800 p-8 rounded-[2rem] border border-slate-700 shadow-xl">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Total Exposure</p>
                    <h3 className="text-4xl font-black">{formatCurrency(stats.totalRevenue, preferredCurrency)}</h3>
                  </div>
                  <div className="bg-slate-800 p-8 rounded-[2rem] border border-slate-700 shadow-xl">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Active Invoices</p>
                    <h3 className="text-4xl font-black">{stats.billCount}</h3>
                  </div>
                  <div className="bg-slate-800 p-8 rounded-[2rem] border border-slate-700 shadow-xl">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Client Profiles</p>
                    <h3 className="text-4xl font-black">{customerProfiles.length}</h3>
                  </div>
                </div>

                <div className="bg-slate-800 rounded-[2.5rem] border border-slate-700 overflow-hidden shadow-2xl">
                   <div className="p-8 border-b border-slate-700 flex flex-wrap items-center justify-between gap-4 no-print">
                      <div className="flex-1 min-w-[300px] relative">
                        <input 
                          type="text" 
                          placeholder="Search records by vendor, tag, or note..." 
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          className="w-full bg-slate-900 border-none rounded-2xl py-4 pl-12 pr-6 font-bold text-sm outline-none focus:ring-2 ring-indigo-500"
                        />
                        <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => window.print()} className="px-5 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest">PDF Export</button>
                        <button onClick={() => setView('customers')} className="px-5 py-3 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest">Profiles</button>
                      </div>
                   </div>

                   <div className="overflow-x-auto">
                     <table className="w-full text-left">
                       <thead className="bg-slate-900/50">
                         <tr>
                           {['customerName', 'date', 'dueDate', 'totalAmount', 'status'].map(k => (
                             <th 
                               key={k} 
                               onClick={() => setSortConfig({key: k as any, direction: sortConfig.direction === 'asc' ? 'desc' : 'asc'})}
                               className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest cursor-pointer hover:text-indigo-400"
                             >
                               {k.replace(/([A-Z])/g, ' $1')}
                             </th>
                           ))}
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-700/50">
                         {paginatedBills.map(bill => (
                           <tr key={bill.id} onClick={() => {setCurrentBill(bill); setView('add');}} className="group cursor-pointer hover:bg-slate-700/30 transition-all">
                             <td className="px-8 py-6">
                               <div className="flex items-center gap-2">
                                 <span className="font-black text-sm">{bill.customerName}</span>
                                 {bill.isNew && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />}
                               </div>
                               <div className="flex gap-1 mt-1">
                                 {bill.tags.map(t => <span key={t} className="text-[8px] font-black text-slate-500 uppercase border border-slate-700 px-1.5 rounded">{t}</span>)}
                               </div>
                             </td>
                             <td className="px-8 py-6 text-xs font-bold text-slate-400">{bill.date}</td>
                             <td className="px-8 py-6 text-xs font-bold text-slate-400">{bill.dueDate}</td>
                             <td className="px-8 py-6 text-sm font-black text-indigo-400">{formatCurrency(bill.totalAmount, bill.currency)}</td>
                             <td className="px-8 py-6">
                               <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${bill.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                 {bill.status}
                               </span>
                             </td>
                           </tr>
                         ))}
                       </tbody>
                     </table>
                   </div>
                </div>
              </div>
            ) : view === 'add' ? (
              <BillForm 
                initialData={currentBill || undefined} 
                onSubmit={handleSaveBill} 
                onCancel={() => {setView('dashboard'); setCurrentBill(null);}} 
                preferredCurrency={preferredCurrency} 
              />
            ) : view === 'camera' ? (
              <CameraScanner onCapture={handleCapture} onClose={() => setView('dashboard')} />
            ) : null
          ) : (
            <DevOpsBot />
          )}
        </main>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          .pl-20 { padding-left: 0 !important; }
          nav { display: none !important; }
          main { padding: 0 !important; }
          body { background: white !important; color: black !important; }
          .bg-slate-800, .bg-slate-900 { background: white !important; border: 1px solid #ddd !important; color: black !important; }
          .text-indigo-400 { color: black !important; font-weight: bold !important; }
        }
      `}</style>
    </div>
  );
};

export default App;
