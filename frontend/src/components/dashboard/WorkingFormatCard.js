import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { attendanceAPI } from '../../services/api';

const WorkingFormatCard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total_days: 0,
    office_pct: 0,
    hybrid_pct: 0,
    remote_pct: 0,
    counts: { office: 0, hybrid: 0, remote: 0 }
  });
  
  const [hoveredData, setHoveredData] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await attendanceAPI.getWorkingFormatStats();
        if (response.data) {
          setStats(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch working format stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const data = [
    { name: 'Office', value: stats.office_pct || 0, count: stats.counts.office, color1: '#A855F7', color2: '#6366F1' },
    { name: 'Hybrid', value: stats.hybrid_pct || 0, count: stats.counts.hybrid, color1: '#6366F1', color2: '#3B82F6' },
    { name: 'Remote', value: stats.remote_pct || 0, count: stats.counts.remote, color1: '#3B82F6', color2: '#06B6D4' },
  ];

  // If all values are 0, show a placeholder distribution or empty state
  const hasData = stats.office_pct > 0 || stats.hybrid_pct > 0 || stats.remote_pct > 0;
  const displayData = hasData ? data : [
    { name: 'Office', value: 100, count: 0, color1: '#1e293b', color2: '#0f172a' }
  ];

  const onPieEnter = (_, index) => {
    if (hasData) {
      setHoveredData(displayData[index]);
    }
  };

  const onPieLeave = () => {
    setHoveredData(null);
  };

  return (
    <div className="bg-[#0b1221] rounded-3xl p-5 shadow-2xl relative overflow-hidden group border border-white/10 hover:border-black/10 dark:border-white/10 transition-all duration-300 min-h-[300px] card-hover-lift smooth-transition">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-purple-500/10 blur-[100px] rounded-full pointer-events-none" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-bold text-white tracking-tight">Working format</h3>
          <button 
            onClick={() => navigate('/attendance')}
            className="text-xs font-medium text-slate-400 hover:text-indigo-400 transition-colors"
          >
            Details
          </button>
        </div>

        <div className="h-[180px] w-full relative">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180} minWidth={0} minHeight={0}>
                <PieChart>
                  <defs>
                    {data.map((entry, index) => (
                      <linearGradient key={`gradient-${index}`} id={`gradient-${index}`} x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor={entry.color1} />
                        <stop offset="100%" stopColor={entry.color2} />
                      </linearGradient>
                    ))}
                    {/* Glow filter */}
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>
                  <Pie
                    data={displayData}
                    cx="50%"
                    cy="85%"
                    startAngle={180}
                    endAngle={0}
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={hasData ? 5 : 0}
                    dataKey="value"
                    stroke="none"
                    animationDuration={1500}
                    animationBegin={200}
                    onMouseEnter={onPieEnter}
                    onMouseLeave={onPieLeave}
                  >
                    {displayData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={hasData ? `url(#gradient-${index})` : '#1e293b'}
                        filter={hasData ? "url(#glow)" : "none"}
                        style={{ outline: 'none', cursor: hasData ? 'pointer' : 'default' }}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* Center Text */}
              <div className="absolute bottom-[10%] left-1/2 -translate-x-1/2 text-center pointer-events-none">
                <div className="text-3xl font-black text-white leading-none transition-all duration-300">
                  {hoveredData ? hoveredData.count : stats.total_days}
                </div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 transition-all duration-300">
                  {hoveredData ? hoveredData.name : 'Days'}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Legend */}
        {!loading && (
          <div className="grid grid-cols-3 gap-2 mt-2">
            {data.map((entry, index) => (
              <div 
                key={index} 
                className={`text-center transition-all duration-300 ${hoveredData?.name === entry.name ? 'scale-110' : 'opacity-80'}`}
                onMouseEnter={() => hasData && setHoveredData(entry)}
                onMouseLeave={() => setHoveredData(null)}
              >
                <div className="flex items-center justify-center space-x-1 mb-1">
                  <div 
                    className="w-1.5 h-1.5 rounded-full" 
                    style={{ background: entry.color1, boxShadow: `0 0 10px ${entry.color1}40` }}
                  />
                  <span className="text-base font-black text-white">{entry.value}%</span>
                </div>
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
                  {entry.name}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .recharts-responsive-container {
          filter: drop-shadow(0 10px 15px rgba(0,0,0,0.3));
        }
      `}</style>
    </div>
  );
};

export default WorkingFormatCard;
