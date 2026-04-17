'use client';

import { useEffect, useState } from 'react';
import { getRecentTraffic } from '@/lib/firebase/analytics';
import { db, auth } from '@/lib/firebase/client'; 
import { collection, query, where, getDocs, DocumentData } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Eye, Ticket, Activity } from 'lucide-react';

export default function TrafficWidget() {
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const abortController = new AbortController();

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      try {
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error("Widget completely timed out")), 5000);
        });

        const fetchPromise = async () => {
          let reversedTraffic: any[] = [];
          let ticketCounts: Record<string, number> = {};

          if (user) {
            try {
              const traffic = await getRecentTraffic(7);
              reversedTraffic = Array.isArray(traffic) ? [...traffic].reverse() : [];
            } catch (e) {
              console.error("🚨 PERMISSION DENIED ON: getRecentTraffic", e);
            }

            try {
              const today = new Date();
              const sevenDaysAgo = new Date();
              sevenDaysAgo.setDate(today.getDate() - 6);
              const minDateString = sevenDaysAgo.toISOString().split('T')[0];

              const q = query(
                collection(db, "supportTickets"),
                where("dateString", ">=", minDateString)
              );
              
              const snapshot = await getDocs(q);
              snapshot.forEach((doc: DocumentData) => {
                const date = doc.data().dateString;
                if (date) {
                  ticketCounts[date] = (ticketCounts[date] || 0) + 1;
                }
              });
            } catch (e) {
              console.error("🚨 PERMISSION DENIED ON: supportTickets query", e);
            }
          }

          return reversedTraffic.map(day => ({
            ...day,
            tickets: ticketCounts[day.date] || 0
          }));
        };

        const mergedData = await Promise.race([fetchPromise(), timeoutPromise]) as any[];
        
        if (!abortController.signal.aborted) {
          setChartData(mergedData);
        }
      } catch (error) {
        if (!abortController.signal.aborted) {
          console.error("TrafficWidget Master Error:", error);
          setChartData([]); 
        }
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false); 
        }
      }
    });

    return () => {
      abortController.abort();
      unsubscribeAuth(); 
    };
  }, [isMounted]);

  if (!isMounted || loading) {
    return (
      <div className="w-full flex flex-col gap-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-32 bg-stone-100 dark:bg-stone-800 rounded-2xl"></div>)}
        </div>
        <div className="h-80 bg-stone-100 dark:bg-stone-800 rounded-2xl w-full"></div>
      </div>
    );
  }

  // --- SAFE CALCULATIONS ---
  const totalViews = chartData.reduce((sum, day) => sum + (day.views || 0), 0);
  const totalTickets = chartData.reduce((sum, day) => sum + (day.tickets || 0), 0);
  const supportRate = totalViews > 0 ? ((totalTickets / totalViews) * 100).toFixed(1) : "0.0";

  const rawMaxViews = Math.max(...chartData.map(d => d.views || 0), 0);
  const safeMaxViews = rawMaxViews > 0 ? rawMaxViews : 10; // Default scale if no data
  const rawMaxTickets = Math.max(...chartData.map(d => d.tickets || 0), 0);
  const safeMaxTickets = rawMaxTickets > 0 ? rawMaxTickets : 1;

  return (
    <div className="w-full flex flex-col gap-8 pb-10">
      
      {/* 1. KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-kalahari/10 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between transition-colors">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-widest">Total Views</span>
            <div className="p-2 bg-stone-50 dark:bg-stone-800 rounded-lg"><Eye className="h-4 w-4 text-stone-400 dark:text-stone-300" /></div>
          </div>
          <div className="text-4xl font-black font-headline text-stone-900 dark:text-off-white tracking-tighter">{totalViews.toLocaleString()}</div>
        </div>

        <div className="bg-white dark:bg-kalahari/10 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between transition-colors">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-widest">Support Tickets</span>
            <div className="p-2 bg-red-50 dark:bg-red-500/10 rounded-lg"><Ticket className="h-4 w-4 text-red-400 dark:text-red-400" /></div>
          </div>
          <div className="text-4xl font-black font-headline text-red-500 dark:text-red-400 tracking-tighter">{totalTickets.toLocaleString()}</div>
        </div>

        <div className="bg-white dark:bg-kalahari/10 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between transition-colors">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-widest">Issue Rate</span>
            <div className="p-2 bg-stone-50 dark:bg-stone-800 rounded-lg"><Activity className="h-4 w-4 text-stone-400 dark:text-stone-300" /></div>
          </div>
          <div className="text-4xl font-black font-headline text-stone-900 dark:text-off-white tracking-tighter">{supportRate}%</div>
        </div>
      </div>

      {/* 2. MAIN CHART */}
      <div className="bg-white dark:bg-kalahari/10 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 md:p-8 shadow-sm transition-colors">
        <h3 className="text-sm font-bold text-stone-900 dark:text-off-white mb-8 uppercase tracking-widest">Traffic vs. Issues (7 Days)</h3>
        
        <div className="relative h-64 w-full flex items-end gap-2 md:gap-4 mt-8">
          {/* Y-Axis Grid Lines */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-6 z-0">
            {[1, 0.75, 0.5, 0.25, 0].map((tick, i) => (
              <div key={i} className="w-full border-b border-stone-100 dark:border-stone-800 flex items-end h-0 relative">
                <span className="absolute -left-2 -translate-x-full text-[10px] text-stone-400 dark:text-stone-500 font-bold bottom-0 translate-y-1/2">
                  {String(Math.round(safeMaxViews * tick))}
                </span>
              </div>
            ))}
          </div>

          {chartData.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <p className="text-sm text-stone-400 dark:text-stone-500 italic">No traffic data available.</p>
            </div>
          ) : (
            chartData.map((day, idx) => {
              const viewHeight = day.views ? Math.max((day.views / safeMaxViews) * 100, 2) : 2;
              const ticketHeight = day.tickets > 0 ? Math.max((day.tickets / safeMaxTickets) * 100, 10) : 0; 
              
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-3 group relative h-full justify-end z-10">
                  {/* Tooltip */}
                  <div className="absolute -top-12 bg-stone-900 dark:bg-off-white text-white dark:text-stone-900 text-[10px] font-bold px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl z-20 border dark:border-stone-200">
                    {day.views || 0} VIEWS | <span className="text-red-400 dark:text-red-600">{day.tickets || 0} TICKETS</span>
                  </div>
                  
                  {/* Bars */}
                  <div className="w-full max-w-[48px] relative flex items-end justify-center h-[calc(100%-24px)] group-hover:-translate-y-1 transition-transform">
                    <div 
                      className="absolute bottom-0 w-full bg-stone-200 dark:bg-stone-700 group-hover:bg-stone-300 dark:group-hover:bg-stone-600 transition-colors rounded-t-md"
                      style={{ height: `${viewHeight}%` }}
                    ></div>
                    {day.tickets > 0 && (
                      <div 
                        className="absolute bottom-0 w-1/2 min-w-[8px] bg-red-500 dark:bg-red-500 rounded-t-md z-10 shadow-sm"
                        style={{ height: `${ticketHeight}%` }}
                      ></div>
                    )}
                  </div>
                  
                  <span className="text-[10px] text-stone-500 dark:text-stone-400 font-black uppercase tracking-wider h-4">
                    {day.date ? day.date.slice(5).replace('-', '/') : ''}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 3. DATA TABLE */}
      <div className="bg-white dark:bg-kalahari/10 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-sm overflow-hidden transition-colors">
        <div className="px-6 py-5 border-b border-stone-100 dark:border-stone-800">
          <h3 className="text-sm font-bold text-stone-900 dark:text-off-white uppercase tracking-widest">Raw Data Audit</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-stone-50 dark:bg-stone-800/50 text-stone-500 dark:text-stone-400 text-xs uppercase tracking-widest font-black">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Page Views</th>
                <th className="px-6 py-4">Support Tickets</th>
                <th className="px-6 py-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800 text-stone-900 dark:text-stone-300 font-bold">
              {chartData.map((day, idx) => (
                <tr key={idx} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/30 transition-colors">
                  <td className="px-6 py-4 font-mono">{day.date || 'Unknown'}</td>
                  <td className="px-6 py-4">{day.views || 0}</td>
                  <td className="px-6 py-4">
                    {day.tickets > 0 ? (
                      <span className="text-red-500 dark:text-red-400 font-black">{day.tickets}</span>
                    ) : (
                      <span className="text-stone-300 dark:text-stone-700">0</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {day.tickets > 0 ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-[10px] uppercase font-black tracking-widest">
                        Attention Required
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 text-[10px] uppercase font-black tracking-widest">
                        Optimal
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}