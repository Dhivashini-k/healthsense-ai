import React, { useState, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

export default function DiseaseRiskTrendChart({ screenings = [] }) {
  const [diseaseFilter, setDiseaseFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("30D");
  const [riskFilter, setRiskFilter] = useState("All");

  const chartData = useMemo(() => {
    // Filter screenings based on criteria
    const now = new Date();
    let filtered = screenings;

    // Date Filter
    if (dateFilter !== "AllTime") {
      const msPerDay = 24 * 60 * 60 * 1000;
      filtered = filtered.filter(s => {
        const sDate = new Date(s.date);
        const diffDays = (now - sDate) / msPerDay;
        if (dateFilter === "Today") return diffDays <= 1;
        if (dateFilter === "7D") return diffDays <= 7;
        if (dateFilter === "30D") return diffDays <= 30;
        if (dateFilter === "3M") return diffDays <= 90;
        return true;
      });
    }

    // Process by month/day depending on range, for simplicity group by YYYY-MM
    // or YYYY-MM-DD if short. Let's group by YYYY-MM-DD for up to 30 days, else YYYY-MM
    const groupBy = (dateFilter === "Today" || dateFilter === "7D" || dateFilter === "30D") ? 
        (d) => d.toISOString().slice(0, 10) : 
        (d) => d.toISOString().slice(0, 7);

    const grouped = {};
    filtered.forEach(s => {
      const sDate = new Date(s.date);
      if (isNaN(sDate.getTime())) return;
      const key = groupBy(sDate);
      if (!grouped[key]) grouped[key] = { date: key, Diabetes: 0, Hypertension: 0, CVD: 0, Stroke: 0, CKD: 0, HighRisk: 0, Normal: 0 };
      
      let highestRisk = 0;
      let highestDisease = "";
      
      if (s.riskScores) {
        Object.entries(s.riskScores).forEach(([d, risk]) => {
          if (risk > highestRisk) { highestRisk = risk; highestDisease = d; }
          // Apply Disease Filter
          if (diseaseFilter === "All" || diseaseFilter === d) {
             // Apply Risk Filter
             const isHigh = risk >= 60;
             if (riskFilter === "All" || (riskFilter === "High" && isHigh) || (riskFilter === "Normal" && !isHigh)) {
               if (d === "Diabetes") grouped[key].Diabetes += 1;
               if (d === "Hypertension") grouped[key].Hypertension += 1;
               if (d === "CVD") grouped[key].CVD += 1;
               if (d === "Stroke") grouped[key].Stroke += 1;
               if (d === "CKD") grouped[key].CKD += 1;
             }
          }
        });
      }

      if (highestRisk >= 60) grouped[key].HighRisk += 1;
      else grouped[key].Normal += 1;
    });

    const result = Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
    return result;
  }, [screenings, diseaseFilter, dateFilter, riskFilter]);

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-black text-slate-800">Disease Risk Trend</h3>
      </div>
      
      <div className="flex flex-wrap gap-3 mb-6">
        <select 
          value={diseaseFilter}
          onChange={(e) => setDiseaseFilter(e.target.value)}
          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700"
        >
          <option value="All">All Diseases</option>
          <option value="Diabetes">Diabetes</option>
          <option value="Hypertension">Hypertension</option>
          <option value="CVD">Cardiovascular Disease</option>
          <option value="Stroke">Stroke</option>
          <option value="CKD">Chronic Kidney Disease</option>
        </select>

        <select 
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700"
        >
          <option value="Today">Today</option>
          <option value="7D">Last 7 Days</option>
          <option value="30D">Last 30 Days</option>
          <option value="3M">Last 3 Months</option>
          <option value="AllTime">All Time</option>
        </select>

        <select 
          value={riskFilter}
          onChange={(e) => setRiskFilter(e.target.value)}
          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700"
        >
          <option value="All">All Risks</option>
          <option value="Normal">Normal / Low Risk</option>
          <option value="High">High Risk</option>
        </select>
      </div>

      <div className="flex-1 w-full min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
            
            {(diseaseFilter === "All" || diseaseFilter === "Diabetes") && <Line type="monotone" name="Diabetes" dataKey="Diabetes" stroke="#f43f5e" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} />}
            {(diseaseFilter === "All" || diseaseFilter === "Hypertension") && <Line type="monotone" name="Hypertension" dataKey="Hypertension" stroke="#10b981" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} />}
            {(diseaseFilter === "All" || diseaseFilter === "CVD") && <Line type="monotone" name="Cardiovascular" dataKey="CVD" stroke="#3b82f6" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} />}
            {(diseaseFilter === "All" || diseaseFilter === "Stroke") && <Line type="monotone" name="Stroke" dataKey="Stroke" stroke="#8b5cf6" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} />}
            {(diseaseFilter === "All" || diseaseFilter === "CKD") && <Line type="monotone" name="CKD" dataKey="CKD" stroke="#f59e0b" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} />}
            
            {diseaseFilter === "All" && riskFilter === "All" && (
              <>
                <Line type="dashed" name="Overall High Risk" dataKey="HighRisk" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" />
                <Line type="dashed" name="Overall Normal" dataKey="Normal" stroke="#22c55e" strokeWidth={2} strokeDasharray="5 5" />
              </>
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
