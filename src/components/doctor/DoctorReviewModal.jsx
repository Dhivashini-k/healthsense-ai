import React, { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import {
  X,
  CheckCircle2,
  Stethoscope,
  FlaskConical,
  FileText,
  AlertTriangle,
  FileImage,
  Eye,
  Send
} from "lucide-react";

export default function DoctorReviewModal() {
  const {
    isDoctorReviewModalOpen,
    setIsDoctorReviewModalOpen,
    selectedReviewScreening,
    signReport,
    userRole
  } = useApp();

  const [selectedLabs, setSelectedLabs] = useState([]);
  const [remarks, setRemarks] = useState(
    "High-risk NCD clinical indicators confirmed. Stage 2 Blood Pressure & elevated risk profile require diagnostic lab verification."
  );

  const scr = selectedReviewScreening;

  // Disease-Specific Lab Checklists
  const LAB_TEST_CHECKLISTS = {
    Diabetes: [
      { id: "HbA1c", label: "HbA1c (Glycated Hemoglobin)" },
      { id: "Fasting Blood Sugar", label: "Fasting Blood Sugar (FBS)" },
      { id: "PPBS", label: "Postprandial Blood Sugar (PPBS)" }
    ],
    Hypertension: [
      { id: "ECG", label: "12-Lead ECG" },
      { id: "Lipid Profile", label: "Comprehensive Lipid Profile" },
      { id: "Echocardiogram", label: "2D Echocardiogram" }
    ],
    CVD: [
      { id: "ECG", label: "12-Lead ECG" },
      { id: "Troponin", label: "High-Sensitivity Cardiac Troponin-I" },
      { id: "Lipid Profile", label: "Comprehensive Lipid Profile" }
    ],
    Stroke: [
      { id: "MRI", label: "Brain Magnetic Resonance Imaging (MRI)" },
      { id: "CT Scan", label: "Non-Contrast Brain Computed Tomography (CT)" }
    ],
    CKD: [
      { id: "Creatinine", label: "Serum Creatinine Test" },
      { id: "Urine Albumin", label: "Urine Albumin-to-Creatinine Ratio (UACR)" },
      { id: "eGFR", label: "Estimated Glomerular Filtration Rate (eGFR)" }
    ]
  };

  const disease = scr?.predictedDisease || "Diabetes";
  const labOptions = LAB_TEST_CHECKLISTS[disease] || LAB_TEST_CHECKLISTS.Diabetes;

  useEffect(() => {
    if (scr?.selectedLabTests?.length > 0) {
      setSelectedLabs(scr.selectedLabTests);
    } else {
      setSelectedLabs([labOptions[0]?.id || "HbA1c"]);
    }
  }, [scr]);

  if (!isDoctorReviewModalOpen || !scr) return null;

  const toggleLab = (id) => {
    if (selectedLabs.includes(id)) {
      setSelectedLabs(selectedLabs.filter((l) => l !== id));
    } else {
      setSelectedLabs([...selectedLabs, id]);
    }
  };

  const handleApproveAndSign = async () => {
    await signReport(scr.patientId || scr.id, remarks, selectedLabs);
    setIsDoctorReviewModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 border border-slate-200 shadow-2xl animate-fadeIn space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#033B2C] text-emerald-400 flex items-center justify-center font-bold">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">High Risk Patient Specialist Review</h3>
              <p className="text-xs text-slate-500">
                Patient: <span className="font-bold text-slate-800">{scr.patientName}</span> ({scr.patientId}) • Assigned Specialty: <span className="font-bold text-emerald-700">{scr.assignedSpecialist || "Endocrinologist"}</span>
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsDoctorReviewModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Demographics & Vitals */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Age / Gender</span>
            <p className="font-extrabold text-slate-900">{scr.age} yrs / {scr.gender}</p>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Blood Pressure</span>
            <p className="font-extrabold text-rose-600">{scr.vitals?.bp}</p>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Heart Rate / SpO2</span>
            <p className="font-extrabold text-slate-900">{scr.vitals?.heartRate} BPM / {scr.vitals?.spo2}%</p>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">BMI</span>
            <p className="font-extrabold text-slate-900">{scr.vitals?.bmi} kg/m²</p>
          </div>
        </div>

        {/* Diagnostic Scans (ECG & Retinal Scan Previews) */}
        <div>
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Uploaded Clinical Diagnostic Scans</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-3">
              <img
                src={scr.ecgImageUrl || "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=300&q=80"}
                alt="ECG Scan"
                className="w-16 h-16 rounded-xl object-cover border border-slate-300"
              />
              <div>
                <span className="font-bold text-slate-900 flex items-center gap-1">
                  <FileImage className="w-4 h-4 text-emerald-600" /> 12-Lead ECG Trace
                </span>
                <p className="text-[10px] text-slate-500 mt-0.5">Sinus rhythm with ST depression</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-3">
              <img
                src={scr.retinalScanUrl || "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=300&q=80"}
                alt="Retinal Scan"
                className="w-16 h-16 rounded-xl object-cover border border-slate-300"
              />
              <div>
                <span className="font-bold text-slate-900 flex items-center gap-1">
                  <Eye className="w-4 h-4 text-teal-600" /> Retinal Scan Analysis
                </span>
                <p className="text-[10px] text-slate-500 mt-0.5">Mild hypertensive retinopathy Grade 1</p>
              </div>
            </div>
          </div>
        </div>

        {/* Disease-Specific Lab Test Selection (Checklist) */}
        <div>
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <FlaskConical className="w-4 h-4 text-emerald-600" /> Disease-Specific Confirmatory Lab Test Checklist ({disease})
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            {labOptions.map((opt) => {
              const isChecked = selectedLabs.includes(opt.id);
              return (
                <label
                  key={opt.id}
                  onClick={() => toggleLab(opt.id)}
                  className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition ${
                    isChecked
                      ? "bg-emerald-50 border-emerald-300 text-emerald-900 font-bold"
                      : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}}
                    className="accent-emerald-600 w-4 h-4"
                  />
                  <span>{opt.label}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Doctor Clinical Remarks */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Specialist Diagnostic Summary & Instructions</label>
          <textarea
            rows={3}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        {/* Actions */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-semibold">
            Status: <span className="font-bold text-amber-600">{scr.reportStatus || "Draft"}</span>
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsDoctorReviewModalOpen(false)}
              className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl text-xs"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApproveAndSign}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl text-xs shadow-md flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-200" /> Approve & Sign Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
