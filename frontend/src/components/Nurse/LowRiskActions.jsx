import React, { useState } from 'react';
import { Download, FileText, Apple, Activity, Heart, Calendar } from 'lucide-react';
import { Card } from '../Common/Card';
import { Button } from '../Common/Button';
import { Modal } from '../Common/Modal';
import { C, DISEASE_PLANS, DISEASES } from '../../utils/constants';
import { printPDFReport, fmtDate } from '../../utils/helpers';

export function LowRiskActions({ patient, screening }) {
  const [showReport, setShowReport] = useState(false);

  const handleDownload = () => {
    const plansHTML = DISEASES.map((d) => {
      const plan = DISEASE_PLANS[d];
      return `
        <div class="section">
          <div class="section-title">🌿 ${d} Lifestyle & Preventive Plan</div>
          <p style="font-size:12px; margin: 0 0 6px 0; color:#5C7069;"><b>Diet Plan:</b></p>
          <ul>${plan.diet.map((item) => `<li>${item}</li>`).join('')}</ul>
          <p style="font-size:12px; margin: 10px 0 6px 0; color:#5C7069;"><b>Exercise Plan:</b></p>
          <ul>${plan.exercise.map((item) => `<li>${item}</li>`).join('')}</ul>
          <p style="font-size:12px; margin: 10px 0 6px 0; color:#5C7069;"><b>Lifestyle Guidance:</b></p>
          <ul>${plan.lifestyle.map((item) => `<li>${item}</li>`).join('')}</ul>
        </div>
      `;
    }).join('');

    const html = `
      <div class="section">
        <div class="section-title">Patient Demographics</div>
        <p style="font-size:13px; margin:3px 0;"><b>Patient Name:</b> ${patient?.name || 'N/A'}</p>
        <p style="font-size:13px; margin:3px 0;"><b>Age / Gender:</b> ${patient?.age} yrs / ${patient?.gender}</p>
        <p style="font-size:13px; margin:3px 0;"><b>Contact / Address:</b> ${patient?.phone} | ${patient?.address}</p>
        <p style="font-size:13px; margin:3px 0;"><b>Screening Date:</b> ${screening?.date ? fmtDate(screening.date) : fmtDate(new Date())}</p>
      </div>

      <div class="section" style="background-color: #E9F8EF; border-color: #1E9E5A;">
        <div class="section-title" style="color: #1E9E5A;">Risk Summary: LOW RISK</div>
        <p style="font-size:13px; color: #122420; margin:0;">
          All non-communicable disease markers (Diabetes, Hypertension, CVD, Stroke, CKD) are within optimal baseline levels. No specialist referral required at this time.
        </p>
      </div>

      <h3 style="color:#0E7C5A; margin-top:20px; font-size:16px;">Personalized Wellness & Prevention Directives</h3>
      ${plansHTML}
    `;

    printPDFReport(`Low_Risk_Report_${patient?.name || 'Patient'}`, html);
  };

  return (
    <>
      <Card className="p-5" style={{ backgroundColor: C.lowBg }}>
        <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
          <div className="font-bold text-sm" style={{ color: C.low }}>Low Risk Prevention & Lifestyle Directives</div>
          <span className="text-xs px-2.5 py-0.5 rounded-full font-bold" style={{ backgroundColor: "#1E9E5A", color: "#fff" }}>LOW RISK</span>
        </div>
        <p className="text-xs mb-3" style={{ color: C.textMuted }}>
          Patient <b>{patient?.name}</b> is screened as Low Risk across all NCD markers. Follow the personalized diet and exercise directives below.
        </p>

        <div className="grid md:grid-cols-3 gap-3 my-3">
          <div className="p-3 bg-white rounded-xl border border-emerald-100 text-xs">
            <div className="font-bold flex items-center gap-1 mb-1 text-emerald-800"><Apple size={14} /> Diet Plan</div>
            <div className="text-slate-600 space-y-1">
              <div>• Low salt & reduced refined sugar</div>
              <div>• Fiber-rich whole grains & veggies</div>
            </div>
          </div>
          <div className="p-3 bg-white rounded-xl border border-emerald-100 text-xs">
            <div className="font-bold flex items-center gap-1 mb-1 text-emerald-800"><Activity size={14} /> Exercise Plan</div>
            <div className="text-slate-600 space-y-1">
              <div>• 150 mins brisk walking / week</div>
              <div>• Moderate resistance training</div>
            </div>
          </div>
          <div className="p-3 bg-white rounded-xl border border-emerald-100 text-xs">
            <div className="font-bold flex items-center gap-1 mb-1 text-emerald-800"><Calendar size={14} /> Re-Screening</div>
            <div className="text-slate-600 space-y-1">
              <div>• Annual preventative screening</div>
              <div>• Regular blood pressure check</div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-3">
          <Button onClick={() => setShowReport(true)} className="text-xs"><FileText size={14} /> View Detailed Diet & Exercise Plan</Button>
          <Button variant="outline" onClick={handleDownload} className="text-xs"><Download size={14} /> Download PDF Report</Button>
        </div>
      </Card>

      {showReport && (
        <Modal title={`Low Risk Wellness Report — ${patient?.name}`} onClose={() => setShowReport(false)} wide>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50 text-xs text-emerald-900">
              <b>Patient Status:</b> All NCD parameters evaluated are within low risk thresholds.
            </div>

            {DISEASES.map((d) => {
              const plan = DISEASE_PLANS[d];
              return (
                <div key={d} className="p-4 rounded-xl border" style={{ borderColor: C.border }}>
                  <div className="font-bold text-sm mb-2 flex items-center gap-1.5" style={{ color: C.primary }}>
                    <Heart size={16} /> {d} Prevention & Lifestyle Plan
                  </div>
                  <div className="grid md:grid-cols-3 gap-3 text-xs">
                    <div>
                      <div className="font-semibold mb-1" style={{ color: C.text }}>🥗 Diet Recommendations</div>
                      <ul className="list-disc pl-4 space-y-1" style={{ color: C.textMuted }}>
                        {plan.diet.map((item, idx) => <li key={idx}>{item}</li>)}
                      </ul>
                    </div>
                    <div>
                      <div className="font-semibold mb-1" style={{ color: C.text }}>🚴 Exercise Workout</div>
                      <ul className="list-disc pl-4 space-y-1" style={{ color: C.textMuted }}>
                        {plan.exercise.map((item, idx) => <li key={idx}>{item}</li>)}
                      </ul>
                    </div>
                    <div>
                      <div className="font-semibold mb-1" style={{ color: C.text }}>⏱️ Lifestyle Care</div>
                      <ul className="list-disc pl-4 space-y-1" style={{ color: C.textMuted }}>
                        {plan.lifestyle.map((item, idx) => <li key={idx}>{item}</li>)}
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowReport(false)}>Close</Button>
              <Button onClick={handleDownload}><Download size={15} /> Print / Download PDF</Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
