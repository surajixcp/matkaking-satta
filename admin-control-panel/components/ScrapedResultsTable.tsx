import React, { useEffect, useState } from 'react';
import { RefreshCw, Globe, Clock, Copy, AlignLeft } from 'lucide-react';
import { scraperService } from '../services/api';

const ScrapedResultsTable: React.FC = () => {
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedGame, setSelectedGame] = useState<string | null>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await scraperService.getRecent();
            setResults(data);
        } catch (error) {
            console.error("Failed to load scraper results", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 30000); // Auto-refresh every 30s
        return () => clearInterval(interval);
    }, []);

    // Filter to show distinct latest result per game? Or just raw log?
    // User asked for "Real fetch result", likely raw log or latest status.
    // Let's show raw log for now, maybe filtered by unique game if list is too long.
    // Actually, raw log is better to see "when" it was fetched.

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-full flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><Globe size={16} /></div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-900">Live Provider Feed</h3>
                        <p className="text-[10px] text-slate-500 font-medium">Real-time data from DPBoss</p>
                    </div>
                </div>
                <button
                    onClick={loadData}
                    disabled={loading}
                    className={`p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all ${loading ? 'animate-spin' : ''}`}
                >
                    <RefreshCw size={16} />
                </button>
            </div>

            <div className="overflow-y-auto flex-1 custom-scrollbar">
                {results.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                        <Globe size={24} className="mb-2 opacity-50" />
                        <span className="text-xs">No data fetched yet</span>
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 bg-slate-50 z-10">
                            <tr className="text-slate-500 text-[10px] uppercase font-bold tracking-wider border-b border-slate-100">
                                <th className="px-4 py-2">Game</th>
                                <th className="px-4 py-2">Number</th>
                                <th className="px-4 py-2 text-right">Time</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {results.map((item, idx) => (
                                <tr key={item.id || idx} className="hover:bg-slate-50/50 transition-colors text-xs">
                                    <td className="px-4 py-2.5 font-bold text-slate-700">
                                        {item.game}
                                    </td>
                                    <td className="px-4 py-2.5">
                                        <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                                            {item.number}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2.5 text-right text-slate-400 font-medium">
                                        {new Date(item.fetchedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default ScrapedResultsTable;
