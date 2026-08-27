import React, { useState } from "react";
import { z } from "zod";
import { useApp } from "../../context/AppContext";
import { calculateNcdRisk } from "../../services/aiRiskEngine";
import RiskGauge from "../charts/RiskGauge";
import FeatureContributionChart from "../charts/FeatureContributionChart";
import {
  User,
  Activity,
  Heart,
  FileCheck2,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  Stethoscope,
  FileText,
  Sparkles,
  Upload,
  Eye,
  FileImage
} from "lucide-react";

export default function MultiStepScreeningForm() {
  const { addScreening, setActiveTab, setActiveReportScreening, openDoctorReview } = useApp();

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "Ramesh Verma",
    email: "ramesh.verma@example.com",
    phone: "+91 98765 43210",
    address: "Mumbai, Maharashtra",
    age: 58,
    gender: "Male",
    height: 168,
    weight: 82,
    smoking: "former",
    alcohol: "none",
    exercise: "light",
    diet: "average",
    sleep: 6,
    stress: 7,
    familyHistory: ["diabetes", "hypertension"],
    bpSystolic: 146,
    bpDiastolic: 92,
    heartRate: 80,
    spo2: 96,
    symptoms: ["fatigue", "frequentUrination", "visionProblems"],
    ecgImageUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=300&q=80",
    retinalScanUrl: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=300&q=80"
  });

  const [screeningCompleted, setScreeningCompleted] = useState(null);
  const [errors, setErrors] = useState({});

  // Zod Validation Schema
  const step1Schema = z.object({
    name: z.string().min(2, "Please enter a valid full name."),
    age: z.coerce.number().min(18, "Age must be at least 18.").max(120, "Please verify the age."),
    height: z.coerce.number().min(50, "Please enter a valid height.").max(300, "Please enter a valid height."),
    weight: z.coerce.number().min(20, "Please enter a valid weight.").max(500, "Please enter a valid weight.")
  });

  const step2Schema = z.object({
    sleep: z.coerce.number().min(0, "Sleep cannot be less than 0.").max(24, "Sleep cannot exceed 24 hours."),
    stress: z.coerce.number().min(1, "Stress level must be at least 1.").max(10, "Stress level cannot exceed 10.")
  });

  const step4Schema = z.object({
    bpSystolic: z.coerce.number().min(50, "Systolic BP must be at least 50.").max(250, "Systolic BP is too high."),
    bpDiastolic: z.coerce.number().min(30, "Diastolic BP must be at least 30.").max(150, "Diastolic BP is too high."),
    heartRate: z.coerce.number().min(30, "Heart rate seems too low.").max(200, "Heart rate seems too high."),
    spo2: z.coerce.number().min(50, "SpO2 must be at least 50.").max(100, "SpO2 cannot exceed 100.")
  }).refine((data) => data.bpSystolic > data.bpDiastolic, {
    message: "Systolic BP must be greater than Diastolic BP.",
    path: ["bpSystolic"] // Set path to field to show error on UI
  });

  const validateStep = (step) => {
    try {
      if (step === 1) step1Schema.parse(formData);
      if (step === 2) step2Schema.parse(formData);
      if (step === 4) step4Schema.parse(formData);
      setErrors({});
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors = {};
        err.errors.forEach(e => { fieldErrors[e.path[0]] = e.message; });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 5));
    }
  };

  // Auto BMI calculation
  const heightM = (formData.height || 170) / 100;
  const computedBmi = heightM > 0 ? (formData.weight / (heightM * heightM)).toFixed(1) : 24.2;

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCheckboxToggle = (field, item) => {
    setFormData((prev) => {
      const list = prev[field] || [];
      if (list.includes(item)) {
        return { ...prev, [field]: list.filter((i) => i !== item) };
      } else {
        return { ...prev, [field]: [...list, item] };
      }
    });
  };

  const handleSubmitScreening = async (e) => {
    e.preventDefault();
    try {
      const result = await calculateNcdRisk(formData);
      const newScreening = await addScreening(result, formData);
      setScreeningCompleted(newScreening || {
        id: "SCR-2025-1256",
        patientName: formData.name,
        overallRiskScore: result.compositeScore || 78,
        riskCategory: result.riskCategory || "High Risk",
        assignedSpecialist: result.assignedSpecialist || "Endocrinologist",
        riskBreakdown: result.riskBreakdown || { diabetes: 78, hypertension: 58, cvd: 64, stroke: 35, ckd: 42 },
        model_explanations: result.model_explanations || {}
      });
    } catch (err) {
      console.error("Failed to submit screening", err);
    }
  };

  const STEPS = [
    { number: 1, title: "Personal Details", subtitle: "Demographics & Body Metrics" },
    { number: 2, title: "Lifestyle History", subtitle: "Smoking, Activity & Stress" },
    { number: 3, title: "Family History", subtitle: "Hereditary NCD Check" },
    { number: 4, title: "Clinical Vitals & Diagnostics", subtitle: "BP, ECG & Retinal Scan Upload" },
    { number: 5, title: "Symptom Checklist", subtitle: "Current Physical Indicators" }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-[#033B2C] to-[#0D9488] p-6 rounded-3xl text-white shadow-lg flex items-center justify-between">
        <div>
          <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-extrabold uppercase tracking-wider">
            Clinical Assessment Engine
          </span>
          <h2 className="text-2xl font-black tracking-tight mt-2">AI Early NCD Risk Screening</h2>
          <p className="text-xs text-emerald-100 mt-1 max-w-xl">
            Input patient biometrics, upload ECG & Retinal scans to run machine-learning risk predictions across Diabetes, Hypertension, CVD, Stroke, and CKD.
          </p>
        </div>
        <div className="p-3 bg-white/10 rounded-2xl border border-white/20 hidden md:block">
          <Sparkles className="w-8 h-8 text-emerald-300 animate-pulse" />
        </div>
      </div>

      {/* Screening Completed Results View */}
      {screeningCompleted ? (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-600 text-white rounded-2xl">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">AI Risk Report Generated</h3>
                <p className="text-xs text-slate-600">Patient: <span className="font-bold">{screeningCompleted.patientName}</span> • Assigned: <span className="font-bold text-emerald-700">{screeningCompleted.assignedSpecialist || "Endocrinologist"}</span></p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setActiveReportScreening(screeningCompleted);
                  setActiveTab("reports");
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-xs transition"
              >
                <FileText className="w-4 h-4" /> View Report
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-[#033B2C] text-white flex flex-col justify-between items-center text-center">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider w-full text-left">Overall Composite Risk</span>
              <div className="my-4">
                <RiskGauge score={screeningCompleted.overallRiskScore} />
              </div>
              <span className="text-[11px] text-emerald-300 font-bold w-full text-left">Auto-Assigned: {screeningCompleted.assignedSpecialist}</span>
            </div>

            <div className="md:col-span-2 p-5 rounded-2xl bg-slate-50 border border-slate-200">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">5 NCD Risk Scores</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.entries(screeningCompleted.riskBreakdown || {}).map(([key, val]) => (
                  <div key={key} className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                    <span className="text-[11px] font-bold text-slate-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                    <div className="flex items-center justify-between mt-2">
                      <div className="w-20 bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${val >= 71 ? 'bg-brand-high-bg' : val >= 41 ? 'bg-brand-moderate-bg' : 'bg-brand-low-bg'}`}
                          style={{ width: `${val}%` }}
                        />
                      </div>
                      <span className="text-xs font-black text-slate-900">{val}%</span>
                    </div>
                  </div>
                ))}
              </div>
              <FeatureContributionChart disease={screeningCompleted.primaryDisease?.split(' (')[0] || screeningCompleted.primary_disease || "General"} formData={formData} modelExplanations={screeningCompleted.model_explanations} />
            </div>
          </div>

          <div className="text-center pt-2">
            <button
              onClick={() => {
                setScreeningCompleted(null);
                setCurrentStep(1);
              }}
              className="text-xs font-bold text-emerald-600 hover:underline"
            >
              ← Screen Another Patient
            </button>
          </div>
        </div>
      ) : (
        /* Wizard Form */
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
          <div className="mb-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              {STEPS.map((step) => {
                const isCurrent = currentStep === step.number;
                const isPassed = currentStep > step.number;

                return (
                  <div key={step.number} className="flex flex-col items-center text-center flex-1">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                        isCurrent
                          ? "bg-emerald-600 text-white ring-4 ring-emerald-100 shadow-md"
                          : isPassed
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {isPassed ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : step.number}
                    </div>
                    <span className={`text-[11px] font-bold mt-1.5 hidden sm:block ${isCurrent ? "text-slate-900" : "text-slate-400"}`}>
                      {step.title}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="text-center">
              <h3 className="text-base font-extrabold text-slate-900">Step {currentStep}: {STEPS[currentStep - 1].title}</h3>
              <p className="text-xs text-slate-500">{STEPS[currentStep - 1].subtitle}</p>
            </div>
          </div>

          <form onSubmit={handleSubmitScreening} className="space-y-6">
            {/* Step 1: Personal Details */}
            {currentStep === 1 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Full Patient Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    required
                    className={`w-full px-3.5 py-2 bg-slate-50 border ${errors.name ? 'border-rose-400' : 'border-slate-200'} rounded-xl`}
                  />
                  {errors.name && <p className="text-[10px] text-rose-500 font-bold mt-1">{errors.name}</p>}
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mobile Number</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Age (Years)</label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => handleInputChange("age", e.target.value)}
                    required
                    min={18}
                    className={`w-full px-3.5 py-2 bg-slate-50 border ${errors.age ? 'border-rose-400' : 'border-slate-200'} rounded-xl`}
                  />
                  {errors.age && <p className="text-[10px] text-rose-500 font-bold mt-1">{errors.age}</p>}
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => handleInputChange("gender", e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Height (cm)</label>
                  <input
                    type="number"
                    value={formData.height}
                    onChange={(e) => handleInputChange("height", e.target.value)}
                    className={`w-full px-3.5 py-2 bg-slate-50 border ${errors.height ? 'border-rose-400' : 'border-slate-200'} rounded-xl`}
                  />
                  {errors.height && <p className="text-[10px] text-rose-500 font-bold mt-1">{errors.height}</p>}
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    value={formData.weight}
                    onChange={(e) => handleInputChange("weight", e.target.value)}
                    className={`w-full px-3.5 py-2 bg-slate-50 border ${errors.weight ? 'border-rose-400' : 'border-slate-200'} rounded-xl`}
                  />
                  {errors.weight && <p className="text-[10px] text-rose-500 font-bold mt-1">{errors.weight}</p>}
                </div>
                <div className="sm:col-span-2 p-3 rounded-xl bg-slate-100 flex items-center justify-between font-bold text-slate-700">
                  <span>Computed BMI: <span className="text-emerald-700 font-extrabold">{computedBmi} kg/m²</span></span>
                  <span className="text-[11px] text-slate-500 font-normal">
                    {computedBmi >= 30 ? "Obese Category" : computedBmi >= 25 ? "Overweight Category" : "Normal Weight"}
                  </span>
                </div>
              </div>
            )}

            {/* Step 2: Lifestyle History */}
            {currentStep === 2 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Smoking History</label>
                  <select
                    value={formData.smoking}
                    onChange={(e) => handleInputChange("smoking", e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="never">Never Smoked</option>
                    <option value="former">Former Smoker (Quit)</option>
                    <option value="current">Active Smoker</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Alcohol Consumption</label>
                  <select
                    value={formData.alcohol}
                    onChange={(e) => handleInputChange("alcohol", e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="none">None / Rare</option>
                    <option value="moderate">Moderate</option>
                    <option value="heavy">Heavy</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Physical Activity</label>
                  <select
                    value={formData.exercise}
                    onChange={(e) => handleInputChange("exercise", e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="sedentary">Sedentary (&lt;30 mins/week)</option>
                    <option value="light">Light Activity (1-2 days/wk)</option>
                    <option value="moderate">Moderate Activity (3-4 days/wk)</option>
                    <option value="active">Active (5+ days/wk)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Diet Pattern</label>
                  <select
                    value={formData.diet}
                    onChange={(e) => handleInputChange("diet", e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="healthy">Healthy Whole-Food</option>
                    <option value="average">Average Mixed Diet</option>
                    <option value="poor">High Processed / Sugar</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sleep Duration (Hours)</label>
                  <input
                    type="number"
                    value={formData.sleep}
                    onChange={(e) => handleInputChange("sleep", e.target.value)}
                    className={`w-full px-3.5 py-2 bg-slate-50 border ${errors.sleep ? 'border-rose-400' : 'border-slate-200'} rounded-xl`}
                  />
                  {errors.sleep && <p className="text-[10px] text-rose-500 font-bold mt-1">{errors.sleep}</p>}
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Stress Level (1-10): {formData.stress}</label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={formData.stress}
                    onChange={(e) => handleInputChange("stress", e.target.value)}
                    className="w-full accent-emerald-600"
                  />
                  {errors.stress && <p className="text-[10px] text-rose-500 font-bold mt-1">{errors.stress}</p>}
                </div>
              </div>
            )}

            {/* Step 3: Family History */}
            {currentStep === 3 && (
              <div className="space-y-3 text-xs">
                <p className="font-semibold text-slate-600">Select family history of 5 core NCD diseases (Parents / Siblings):</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { id: "diabetes", label: "Type 2 Diabetes Mellitus" },
                    { id: "hypertension", label: "Hypertension / High BP" },
                    { id: "heart", label: "Cardiovascular Disease (CVD)" },
                    { id: "stroke", label: "Stroke / Cerebrovascular Attack" },
                    { id: "ckd", label: "Chronic Kidney Disease (CKD)" }
                  ].map((fam) => (
                    <label
                      key={fam.id}
                      className={`p-3.5 rounded-xl border flex items-center gap-3 cursor-pointer transition ${
                        formData.familyHistory.includes(fam.id)
                          ? "bg-emerald-50 border-emerald-300 text-emerald-900 font-bold"
                          : "bg-slate-50 border-slate-200 text-slate-700"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.familyHistory.includes(fam.id)}
                        onChange={() => handleCheckboxToggle("familyHistory", fam.id)}
                        className="accent-emerald-600 w-4 h-4"
                      />
                      <span>{fam.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Clinical Vitals & Image Uploads */}
            {currentStep === 4 && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Blood Pressure (mmHg)</label>
                    <input
                      type="text"
                      value={`${formData.bpSystolic}/${formData.bpDiastolic}`}
                      onChange={(e) => {
                        const parts = e.target.value.split("/");
                        setFormData({
                          ...formData,
                          bpSystolic: Number(parts[0]) || 120,
                          bpDiastolic: Number(parts[1]) || 80
                        });
                      }}
                      className={`w-full px-3 py-2 bg-slate-50 border ${errors.bpSystolic || errors.bpDiastolic ? 'border-rose-400' : 'border-slate-200'} rounded-xl`}
                    />
                    {(errors.bpSystolic || errors.bpDiastolic) && (
                      <p className="text-[10px] text-rose-500 font-bold mt-1">
                        {errors.bpSystolic || errors.bpDiastolic}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Heart Rate (BPM)</label>
                    <input
                      type="number"
                      value={formData.heartRate}
                      onChange={(e) => handleInputChange("heartRate", e.target.value)}
                      className={`w-full px-3 py-2 bg-slate-50 border ${errors.heartRate ? 'border-rose-400' : 'border-slate-200'} rounded-xl`}
                    />
                    {errors.heartRate && <p className="text-[10px] text-rose-500 font-bold mt-1">{errors.heartRate}</p>}
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Oxygen SpO2 (%)</label>
                    <input
                      type="number"
                      value={formData.spo2}
                      onChange={(e) => handleInputChange("spo2", e.target.value)}
                      className={`w-full px-3 py-2 bg-slate-50 border ${errors.spo2 ? 'border-rose-400' : 'border-slate-200'} rounded-xl`}
                    />
                    {errors.spo2 && <p className="text-[10px] text-rose-500 font-bold mt-1">{errors.spo2}</p>}
                  </div>
                </div>

                {/* ECG & Retinal Scan Image Upload Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center text-center">
                    <FileImage className="w-8 h-8 text-emerald-600 mb-2" />
                    <span className="font-bold text-slate-800">ECG Image / PDF Upload</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">Upload 12-lead ECG tracing file</span>
                    <button
                      type="button"
                      className="mt-3 px-3 py-1.5 bg-emerald-600 text-white font-bold rounded-xl text-[11px] flex items-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5" /> Select ECG File
                    </button>
                  </div>

                  <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center text-center">
                    <Eye className="w-8 h-8 text-teal-600 mb-2" />
                    <span className="font-bold text-slate-800">Retinal Scanner Upload</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">Upload fundus retinal image</span>
                    <button
                      type="button"
                      className="mt-3 px-3 py-1.5 bg-teal-600 text-white font-bold rounded-xl text-[11px] flex items-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5" /> Select Retinal Scan
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Symptom Checklist */}
            {currentStep === 5 && (
              <div className="space-y-3 text-xs">
                <p className="font-semibold text-slate-600">Check all symptoms experienced by patient in the last 30 days:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { id: "chestPain", label: "Chest Pain / Tightness / Pressure" },
                    { id: "frequentUrination", label: "Frequent Urination / Excessive Thirst" },
                    { id: "fatigue", label: "Chronic Unexplained Fatigue" },
                    { id: "breathlessness", label: "Breathlessness on mild exertion" },
                    { id: "headache", label: "Persistent Morning Headaches" },
                    { id: "visionProblems", label: "Vision Problems / Blurred Vision" }
                  ].map((sym) => (
                    <label
                      key={sym.id}
                      className={`p-3.5 rounded-xl border flex items-center gap-3 cursor-pointer transition ${
                        formData.symptoms.includes(sym.id)
                          ? "bg-rose-50 border-rose-300 text-rose-900 font-bold"
                          : "bg-slate-50 border-slate-200 text-slate-700"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.symptoms.includes(sym.id)}
                        onChange={() => handleCheckboxToggle("symptoms", sym.id)}
                        className="accent-rose-600 w-4 h-4"
                      />
                      <span>{sym.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => Math.max(prev - 1, 1))}
                disabled={currentStep === 1}
                className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4 inline" /> Previous
              </button>

              {currentStep < 5 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs"
                >
                  Next Step <ChevronRight className="w-4 h-4 inline" />
                </button>
              ) : (
                <button
                  type="submit"
                  className="px-6 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl shadow-md flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-emerald-200" /> Screen & Generate Report
                </button>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
