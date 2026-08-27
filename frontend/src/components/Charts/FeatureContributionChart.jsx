import React from 'react';

export default function FeatureContributionChart({ disease, formData, modelExplanations }) {
  const getContributions = () => {
    // Attempt to use real explanations if provided
    if (modelExplanations && modelExplanations[disease]) {
      return [...modelExplanations[disease]].sort((a, b) => b.value - a.value);
    }
    
    // Fallback to heuristic-based feature contributions
    let base = [];
    if (disease === "Diabetes") {
      base = [
        { name: "BMI", value: formData.weight / Math.pow(formData.height/100, 2) > 25 ? 35 : 15 },
        { name: "Family History", value: formData.familyHistory.includes("diabetes") ? 25 : 5 },
        { name: "Age", value: formData.age > 45 ? 20 : 10 },
        { name: "Physical Activity", value: formData.exercise === "sedentary" ? 15 : 5 },
      ];
    } else if (disease === "Hypertension") {
      base = [
        { name: "Systolic BP", value: formData.bpSystolic > 130 ? 40 : 15 },
        { name: "Diastolic BP", value: formData.bpDiastolic > 85 ? 30 : 15 },
        { name: "Age", value: formData.age > 50 ? 20 : 10 },
        { name: "Smoking", value: formData.smoking === "current" ? 10 : 0 },
      ];
    } else {
      base = [
        { name: "Age", value: formData.age > 50 ? 25 : 10 },
        { name: "BMI", value: formData.weight / Math.pow(formData.height/100, 2) > 25 ? 20 : 10 },
        { name: "Blood Pressure", value: formData.bpSystolic > 130 ? 25 : 10 },
        { name: "Smoking", value: formData.smoking === "current" ? 15 : 5 },
      ];
    }
    
    // Sort descending
    return base.sort((a, b) => b.value - a.value);
  };

  const data = getContributions();
  const maxVal = Math.max(...data.map(d => d.value));

  return (
    <div className="mt-4 p-3 bg-white border border-slate-200 rounded-xl">
      <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">Key Risk Factors for {disease}</h5>
      <div className="space-y-2">
        {data.map((item, idx) => (
          <div key={idx} className="flex items-center text-xs">
            <span className="w-24 truncate text-slate-700 font-semibold">{item.name}</span>
            <div className="flex-1 ml-2 bg-slate-100 h-2 rounded-full overflow-hidden">
              <div 
                className="h-full bg-rose-400 rounded-full" 
                style={{ width: `${(item.value / maxVal) * 100}%` }}
              />
            </div>
            <span className="ml-2 w-8 text-right text-slate-500 font-bold">{item.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
