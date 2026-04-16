import React from 'react';
import {
  XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
const PerformanceTrends = ({ data }) => {

  // Custom tooltips to match the UI style
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/5 dark:bg-slate-900/90 backdrop-blur-md border border-white/10 dark:border-white/10 p-3 rounded-xl shadow-2xl">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
          <p className="text-sm font-black text-white">
            {payload[0].value} {payload[0].name === 'hours' ? 'hours' : ''}
          </p>
          {payload[0].payload.status && (
            <p className={`text-[9px] font-bold uppercase mt-1 ${payload[0].payload.status === 'PRESENT' ? 'text-emerald-400' :
                payload[0].payload.status === 'LATE' ? 'text-amber-400' : 'text-slate-500'
              }`}>
              {payload[0].payload.status}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6">

        {/* Weekly Work Hours (Line Chart) */}
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-2xl relative overflow-hidden group">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">Weekly Work Hours</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Daily hours logged (Last 7 Days)</p>
            </div>
            <div className="p-2 bg-indigo-500/10 rounded-xl">
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            </div>
          </div>

          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }} />
                <Area
                  type="monotone"
                  dataKey="hours"
                  stroke="#6366f1"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorHours)"
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PerformanceTrends;
