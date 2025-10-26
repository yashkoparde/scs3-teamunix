
import React from 'react';
import { CrowdData, RiskLevel } from '../types';
import { ChartBarIcon, LineChartIcon } from './index';

const StatCard: React.FC<{ title: string; value: string | number; color: string; }> = ({ title, value, color }) => (
    <div className="bg-slate-800/70 p-4 rounded-lg border-l-4" style={{ borderColor: color }}>
        <p className="text-sm text-slate-400">{title}</p>
        <p className="text-3xl font-bold text-white">{value}</p>
    </div>
);

const HeadcountChart: React.FC<{ data: CrowdData[] }> = ({ data }) => {
    const chartHeight = 120;
    const chartWidth = 500;
    
    if (data.length < 2) {
        return <div className="flex items-center justify-center h-[120px] text-slate-500">Awaiting more data for trend chart...</div>;
    }

    const maxCount = Math.max(10, ...data.map(d => d.totalCount));
    const points = data.map((d, i) => {
        const x = (i / (data.length - 1)) * chartWidth;
        const y = chartHeight - (d.totalCount / maxCount) * chartHeight;
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full" preserveAspectRatio="none">
            <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style={{ stopColor: 'rgba(20, 184, 166, 0.4)' }} />
                    <stop offset="100%" style={{ stopColor: 'rgba(20, 184, 166, 0)' }} />
                </linearGradient>
            </defs>
            <polyline
                fill="url(#gradient)"
                stroke="#14b8a6"
                strokeWidth="2"
                points={`0,${chartHeight} ${points} ${chartWidth},${chartHeight}`}
            />
        </svg>
    );
};

interface AdminDashboardProps {
  historicalData: CrowdData[];
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ historicalData }) => {
  const latestData = historicalData.length > 0 ? historicalData[0] : null;
  
  const getRiskColor = (level?: RiskLevel) => {
    switch (level) {
      case RiskLevel.SAFE: return '#4ade80';
      case RiskLevel.MODERATE: return '#facc15';
      case RiskLevel.HIGH: return '#f87171';
      default: return '#64748b';
    }
  };

  return (
    <div className="space-y-6">
       <div className="p-4 bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-slate-700">
        <h2 className="text-2xl font-bold text-white">Administrative Dashboard</h2>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
            <div className="bg-slate-800/50 p-6 rounded-xl shadow-lg border border-slate-700">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><ChartBarIcon className="w-6 h-6 text-teal-400" />Latest Crowd Statistics</h3>
                 <p className="text-xs text-slate-400 mb-4">Data is updated automatically. Last updated: {latestData ? new Date(latestData.timestamp).toLocaleTimeString() : 'N/A'}</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <StatCard title="Headcount" value={latestData?.totalCount ?? 'N/A'} color="#38bdf8" />
                    <StatCard title="Density" value={latestData?.density.toFixed(2) ?? 'N/A'} color="#a78bfa" />
                    <StatCard title="Risk Level" value={latestData?.riskLevel ?? 'N/A'} color={getRiskColor(latestData?.riskLevel)} />
                </div>
            </div>

            <div className="bg-slate-800/50 p-6 rounded-xl shadow-lg border border-slate-700">
                <h3 className="text-xl font-bold mb-2 flex items-center gap-2"><LineChartIcon className="w-6 h-6 text-teal-400"/>Headcount Trend</h3>
                <div className="h-[120px]">
                    <HeadcountChart data={[...historicalData].reverse()} />
                </div>
            </div>
        </div>

        <div className="bg-slate-800/50 p-4 rounded-xl shadow-lg border border-slate-700 flex flex-col">
            <h3 className="text-lg font-bold mb-3">Full Crowd Event Log</h3>
            <div className="flex-grow overflow-y-auto pr-2">
                <ul className="space-y-2 text-sm">
                    {historicalData.length > 0 ? historicalData.map(log => (
                        <li key={log.timestamp} className="flex justify-between items-center bg-slate-700/40 p-2 rounded-md hover:bg-slate-700">
                           <span>{new Date(log.timestamp).toLocaleTimeString()} - Count: {log.totalCount}</span>
                           <span className="font-semibold" style={{ color: getRiskColor(log.riskLevel) }}>{log.riskLevel}</span>
                        </li>
                    )) : <p className="text-slate-500 text-center pt-10">No data logged. Start the feed on the main dashboard to begin logging.</p>}
                </ul>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;