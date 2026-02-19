
import React, { useState, useEffect } from 'react';
import { Transaction, TransactionType, ViewType, CategoryState, DEFAULT_CATEGORIES } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import TransactionList from './components/TransactionList';
import AIInsights from './components/AIInsights';
import AddTransactionModal from './components/AddTransactionModal';
import CategoryManager from './components/CategoryManager';
import CurrencyExchange from './components/CurrencyExchange';
import { apiFetch } from './utils/api';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [driveFileId, setDriveFileId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<CategoryState>(DEFAULT_CATEGORIES);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Initial Load
  useEffect(() => {
    const fetchUser = async () => {
      try {
        console.log("Checking for logged-in user...");
        const res = await apiFetch('/api/auth/user');
        const data = await res.json();
        console.log("User fetch result:", data.user ? data.user.email : "no user");
        if (data.user) {
          setUser(data.user);
          loadFromDrive();
        } else {
          // Fallback to local storage if not logged in
          const savedT = localStorage.getItem('fintrack_transactions');
          const savedC = localStorage.getItem('fintrack_categories');
          if (savedT) setTransactions(JSON.parse(savedT));
          if (savedC) setCategories(JSON.parse(savedC));
        }
      } catch (e) {
        console.error("Failed to fetch user", e);
      }
    };
    fetchUser();
  }, []);

  const loadFromDrive = async () => {
    setIsSyncing(true);
    try {
      const res = await apiFetch('/api/drive/file');
      const data = await res.json();
      if (data.content) {
        setTransactions(data.content.transactions || []);
        setCategories(data.content.categories || DEFAULT_CATEGORIES);
        setDriveFileId(data.fileId);
      }
    } catch (e) {
      console.error("Failed to load from Drive", e);
    } finally {
      setIsSyncing(false);
    }
  };

  const saveToDrive = async (currentTransactions: Transaction[], currentCategories: CategoryState) => {
    if (!user) {
      localStorage.setItem('fintrack_transactions', JSON.stringify(currentTransactions));
      localStorage.setItem('fintrack_categories', JSON.stringify(currentCategories));
      return;
    }

    setIsSyncing(true);
    try {
      const res = await apiFetch('/api/drive/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: { transactions: currentTransactions, categories: currentCategories },
          fileId: driveFileId
        })
      });
      const data = await res.json();
      if (data.fileId) setDriveFileId(data.fileId);
    } catch (e) {
      console.error("Failed to save to Drive", e);
    } finally {
      setIsSyncing(false);
    }
  };

  const addTransaction = (t: Omit<Transaction, 'id'>) => {
    const newTransaction = { ...t, id: crypto.randomUUID() };
    const newTransactions = [newTransaction, ...transactions];
    setTransactions(newTransactions);
    saveToDrive(newTransactions, categories);
    setIsModalOpen(false);
  };

  const deleteTransaction = (id: string) => {
    const newTransactions = transactions.filter(t => t.id !== id);
    setTransactions(newTransactions);
    saveToDrive(newTransactions, categories);
  };

  const updateTransaction = (updated: Transaction) => {
    const newTransactions = transactions.map(t => t.id === updated.id ? updated : t);
    setTransactions(newTransactions);
    saveToDrive(newTransactions, categories);
  };

  const updateCategories = (newCategories: CategoryState) => {
    setCategories(newCategories);
    saveToDrive(transactions, newCategories);
  };

  const handleViewChange = (view: ViewType) => {
    setActiveView(view);
    setIsSidebarOpen(false);
  };

  return (
    <div className="flex h-screen w-full bg-[#f5f5f7] text-[#1d1d1f] overflow-hidden">
      <Sidebar 
        activeView={activeView} 
        onViewChange={handleViewChange} 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        user={user}
        onUserUpdate={setUser}
        isSyncing={isSyncing}
      />

      <main className="flex-1 flex flex-col h-screen relative min-w-0 overflow-hidden">
        <header className="h-14 md:h-12 flex items-center justify-between px-4 md:px-6 bg-white/70 backdrop-blur-md border-b border-black/5 z-20">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 hover:bg-black/5 rounded-lg transition-colors"
              aria-label="Toggle Menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-[14px] md:text-[13px] font-semibold text-[#1d1d1f] opacity-80 capitalize truncate max-w-[120px] sm:max-w-none">
              {activeView === 'currency' ? 'Currency Exchange' : activeView.replace('-', ' ')}
            </h1>
          </div>
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 md:py-1 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-md text-sm font-medium transition-colors shadow-sm whitespace-nowrap"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden xs:inline">Add Record</span>
            <span className="xs:hidden">Add</span>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
          {activeView === 'dashboard' && <Dashboard transactions={transactions} />}
          {activeView === 'transactions' && (
            <TransactionList 
              transactions={transactions} 
              onDelete={deleteTransaction} 
              onUpdate={updateTransaction}
              categories={categories}
            />
          )}
          {activeView === 'ai-insights' && <AIInsights transactions={transactions} />}
          {activeView === 'categories' && <CategoryManager categories={categories} onUpdate={updateCategories} />}
          {activeView === 'currency' && <CurrencyExchange />}
        </div>
      </main>

      {isModalOpen && (
        <AddTransactionModal 
          categories={categories}
          onClose={() => setIsModalOpen(false)} 
          onSubmit={addTransaction} 
        />
      )}
    </div>
  );
};

export default App;
