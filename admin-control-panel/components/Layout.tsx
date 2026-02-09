import React, { useState, useEffect } from 'react';
import { Menu, X, Bell, User as UserIcon, LogOut, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Screen } from '../types';
import { NAV_ITEMS } from '../constants';

interface LayoutProps {
  children: React.ReactNode;
  activeScreen: Screen;
  onNavigate: (screen: Screen) => void;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeScreen, onNavigate, onLogout }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const handleResize = () => {
      // Logic for mobile resizing: close sidebar if screen becomes small
      if (window.innerWidth < 1024 && isSidebarOpen) {
        setSidebarOpen(false);
      } else if (window.innerWidth >= 1024 && !isSidebarOpen) {
        // On desktop, we default to open (expanded), but user choice should persist ideally. 
        // For simplicity, let's keep it expanded on resize up.
        setSidebarOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isSidebarOpen]);

  // Sidebar width logic
  // Mobile: w-64 fixed
  // Desktop: w-64 (Open) vs w-20 (Closed)

  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

  return (
    <div className="flex min-h-screen bg-[#f8fafc] overflow-x-hidden selection:bg-indigo-100 selection:text-indigo-900">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-[#0f172a] text-white transform transition-all duration-300 ease-in-out shadow-2xl overflow-hidden
          ${isSidebarOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full lg:translate-x-0 lg:w-20'}`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className={`flex items-center ${isSidebarOpen ? 'justify-between px-6' : 'justify-center px-0'} py-5 border-b border-slate-800/50 transition-all duration-300`}>
            <div className={`flex items-center ${isSidebarOpen ? 'space-x-3' : 'justify-center w-full'}`}>
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-lg shadow-lg shadow-indigo-500/20 ring-1 ring-white/10 shrink-0">A</div>
              <span className={`text-lg font-bold tracking-tight whitespace-nowrap overflow-hidden transition-all duration-300 ${isSidebarOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>
                Admin CP
              </span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className={`p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors lg:hidden ${!isSidebarOpen && 'hidden'}`}
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className={`flex-1 ${isSidebarOpen ? 'px-3' : 'px-2'} py-6 space-y-1 overflow-y-auto custom-scrollbar transition-all duration-300`}>
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  if (window.innerWidth < 1024) setSidebarOpen(false);
                }}
                className={`w-full flex items-center ${isSidebarOpen ? 'justify-start space-x-3 px-3' : 'justify-center px-0'} py-2.5 rounded-lg transition-all duration-200 group relative ${activeScreen === item.id
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                  }`}
                title={!isSidebarOpen ? item.label : ''}
              >
                <span className={`transition-transform duration-200 shrink-0 ${activeScreen === item.id ? 'scale-110' : 'group-hover:scale-110'}`}>
                  {React.cloneElement(item.icon as React.ReactElement<any>, { size: 22 })}
                </span>
                <span className={`font-semibold text-sm tracking-wide whitespace-nowrap overflow-hidden transition-all duration-300 ${isSidebarOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0 hidden'}`}>
                  {item.label}
                </span>
                {/* Tooltip for collapsed state */}
                {!isSidebarOpen && (
                  <div className="absolute left-14 bg-slate-800 text-white text-xs font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none whitespace-nowrap lg:block hidden">
                    {item.label}
                  </div>
                )}
              </button>
            ))}
          </nav>

          {/* Footer */}
          <div className={`border-t border-slate-800/50 bg-[#0f172a]/50 ${isSidebarOpen ? 'p-3' : 'p-2'} transition-all duration-300`}>
            <button
              onClick={onLogout}
              className={`w-full flex items-center ${isSidebarOpen ? 'justify-start space-x-3 px-3' : 'justify-center px-0'} py-2.5 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 rounded-lg transition-all font-medium text-sm group relative`}
              title={!isSidebarOpen ? "Logout Session" : ''}
            >
              <LogOut size={18} className="shrink-0" />
              <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${isSidebarOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0 hidden'}`}>
                Logout Session
              </span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out 
          ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-20 ml-0'}`}
      >
        {/* Header */}
        <header className="h-14 sm:h-16 bg-white/80 border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-40 backdrop-blur-md">
          <div className="flex items-center gap-4 lg:gap-6">
            <button
              onClick={toggleSidebar}
              className={`p-2 rounded-lg transition-all ${!isSidebarOpen ? 'bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100 shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              {isSidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
            </button>
            <div className="flex flex-col">
              <h1 className="text-lg font-bold text-slate-800 tracking-tight leading-none">
                {NAV_ITEMS.find(i => i.id === activeScreen)?.label || 'Overview'}
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-6">
            <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all relative group">
              <Bell size={22} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="h-8 w-[1px] bg-slate-200 mx-2 hidden sm:block"></div>
            <div className="flex items-center space-x-3 group cursor-pointer bg-slate-50 hover:bg-white border border-transparent hover:border-slate-200 px-1 sm:px-3 py-1 sm:py-1.5 rounded-full transition-all">
              <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold overflow-hidden shadow-md">
                <UserIcon size={16} />
              </div>
              <div className="text-left hidden lg:block">
                <p className="text-xs font-bold text-slate-800 leading-none">Admin User</p>
                <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Super Control</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 p-4 sm:p-8 lg:p-10 animate-in fade-in duration-500 overflow-x-hidden w-full">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Sidebar Overlay - Mobile only */}
      {isSidebarOpen && window.innerWidth < 1024 && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-40 lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
};

export default Layout;