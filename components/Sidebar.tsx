
import React from 'react';
import { ViewType } from '../types';
import { apiFetch } from '../utils/api';

interface SidebarProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onUserUpdate: (user: any) => void;
  isSyncing: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  activeView, 
  onViewChange, 
  isOpen, 
  onClose, 
  user, 
  onUserUpdate,
  isSyncing
}) => {
  const menuItems = [
    { 
      id: 'dashboard', 
      label: 'Overview', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
          <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
        </svg>
      )
    },
    { 
      id: 'transactions', 
      label: 'All Records', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
        </svg>
      )
    },
    {
      id: 'categories',
      label: 'Categories',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A1 .5 0 015 8V4a1 1 0 011-1h4a1 1 0 01.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
        </svg>
      )
    },
    {
      id: 'currency',
      label: 'Exchange',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
        </svg>
      )
    },
    { 
      id: 'ai-insights', 
      label: 'AI Analyst', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
        </svg>
      )
    }
  ];

  const handleLogin = async () => {
    try {
      console.log("Initiating login flow...");
      const res = await apiFetch('/api/auth/url');
      const { url } = await res.json();
      console.log("Auth URL received, opening popup...");
      
      // Open popup
      const authWindow = window.open(url, 'google_auth', 'width=500,height=600');
      
      const handleMessage = (event: MessageEvent) => {
        // Only accept messages from the same origin
        if (event.origin !== window.location.origin) return;
        
        console.log("Received message from popup:", event.data);
        if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
          console.log("Auth success! Storing session ID and reloading...");
          if (event.data.sessionId) {
            localStorage.setItem('fintrack_sid', event.data.sessionId);
          }
          window.removeEventListener('message', handleMessage);
          window.location.reload(); 
        }
      };
      
      window.addEventListener('message', handleMessage);
      
      // Cleanup listener if window is closed without success
      const checkClosed = setInterval(() => {
        if (authWindow?.closed) {
          clearInterval(checkClosed);
          setTimeout(() => window.removeEventListener('message', handleMessage), 1000);
        }
      }, 1000);

    } catch (e) {
      console.error("Login failed", e);
    }
  };

  const handleLogout = async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
      localStorage.removeItem('fintrack_sid');
      onUserUpdate(null);
      window.location.reload();
    } catch (e) {
      console.error("Logout failed", e);
    }
  };

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed md:static inset-y-0 left-0 w-[240px] h-full 
        bg-[#ececec]/90 backdrop-blur-xl border-r border-black/5 
        flex flex-col p-4 z-50 transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex items-center justify-between mb-8 px-2">
          <div className="flex gap-2">
            <div className="w-3.5 h-3.5 rounded-full bg-[#ff5f57] border border-[#e0443e]"></div>
            <div className="w-3.5 h-3.5 rounded-full bg-[#ffbd2e] border border-[#dea123]"></div>
            <div className="w-3.5 h-3.5 rounded-full bg-[#28c840] border border-[#1aab29]"></div>
          </div>
          <button onClick={onClose} className="md:hidden p-1.5 hover:bg-black/5 rounded-full opacity-40">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>

        <div className="flex-1 space-y-1">
          <p className="px-2 mb-2 text-[11px] font-bold text-black/40 uppercase tracking-wider">Main Menu</p>
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id as ViewType)}
              className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeView === item.id 
                ? 'bg-[#0071e3] text-white shadow-sm' 
                : 'text-[#1d1d1f] hover:bg-black/5'
              }`}
            >
              <span className={activeView === item.id ? 'text-white' : 'text-blue-500'}>
                {item.icon}
              </span>
              {item.label}
            </button>
          ))}
        </div>

        <div className="mt-auto border-t border-black/5 pt-4 px-2 space-y-3">
          {user ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 overflow-hidden">
                <img 
                  src={user.picture || "https://picsum.photos/40/40?seed=user"} 
                  className="w-9 h-9 rounded-full ring-1 ring-black/10" 
                  alt="Avatar" 
                  referrerPolicy="no-referrer" 
                />
                <div className="flex flex-col overflow-hidden">
                  <span className="text-xs font-semibold truncate">{user.name}</span>
                  <span className="text-[10px] text-black/50 truncate">{user.email}</span>
                </div>
              </div>
              <button 
                onClick={handleLogout}
                className="p-2 hover:bg-black/5 rounded-lg text-black/40 hover:text-red-500 transition-colors"
                title="Logout"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          ) : (
            <button 
              onClick={handleLogin}
              className="w-full flex items-center justify-center gap-2 py-2 bg-white border border-black/10 rounded-xl text-xs font-semibold hover:bg-black/5 transition-all shadow-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
            </button>
          )}

          {!user && (
            <div className="px-2 py-1 bg-black/[0.03] rounded-lg border border-black/5">
              <p className="text-[9px] text-black/30 font-mono break-all leading-tight">
                URL: {window.location.origin}
              </p>
            </div>
          )}
          
          {isSyncing && (
            <div className="flex items-center justify-center gap-2 text-[10px] text-black/30 font-medium animate-pulse">
              <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Syncing with Drive...
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
