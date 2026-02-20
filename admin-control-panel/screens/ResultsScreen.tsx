import React, { useState, useEffect, useRef } from 'react';
import {
  Send, History, AlertCircle, CheckCircle,
  Trash2, RefreshCw, Trophy, ShieldAlert
} from 'lucide-react';
import { DeclaredResult } from '../types';
import { marketService, resultService } from '../services/api';
import ScrapedResultsTable from '../components/ScrapedResultsTable';

const ResultsScreen: React.FC = () => {
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const data = await resultService.getHistory();
      setHistory(data);
    } catch (error) {
      console.error('Failed to load result history:', error);
    }
  };



  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300 h-[calc(100vh-100px)]">
      {/* Left Column: Declare Form + Live Feed */}
      <div className="lg:col-span-1 flex flex-col gap-6 h-full overflow-hidden">
        {/* Live Scraper Feed */}
        <div className="flex-1 min-h-0">
          <ScrapedResultsTable />
        </div>
      </div>

      {/* Right Column: Result History */}
      <div className="lg:col-span-2 h-full overflow-hidden">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm h-full flex flex-col">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-slate-100 text-slate-500 rounded-lg"><History size={16} /></div>
              <h3 className="text-sm font-bold text-slate-900">Result History</h3>
            </div>
            <button onClick={loadHistory} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"><RefreshCw size={16} /></button>
          </div>
          <div className="overflow-auto flex-1">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-slate-50">
                <tr className="text-slate-500 text-xs font-semibold border-b border-slate-100">
                  <th className="px-6 py-3">Market Details</th>
                  <th className="px-6 py-3">Result</th>
                  <th className="px-6 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm">
                {history.map((item: any) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 group transition-colors">
                    <td className="px-6 py-3.5">
                      <p className="font-bold text-slate-800">{item.market?.name || 'Unknown Market'}</p>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide mt-0.5">
                        {item.open_declare && item.close_declare ? 'Completed' : (item.open_declare ? 'Open Declared' : 'Pending')}
                      </p>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2 font-mono">
                        <span className="font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded text-xs">
                          {item.open_declare || 'XXX-X'}
                        </span>
                        <span className="text-slate-300">-</span>
                        <span className="font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded text-xs">
                          {item.close_declare || 'XXX-X'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <p className="text-xs font-medium text-slate-400">{item.date}</p>
                    </td>
                  </tr>
                ))}
                {history.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-400">No results declared yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsScreen;