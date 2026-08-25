export const INITIAL_PATIENTS = [
  {
    id: "PT-1256",
    name: "Ramesh Verma",
    age: 58,
    gender: "Male",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
    email: "ramesh.verma@example.com",
    phone: "+91 98765 43210",
    address: "Mumbai, Maharashtra",
    mrn: "MRN-125600",
    bloodGroup: "B+",
    height: 168,
    weight: 82,
    bmi: 29.1,
    bpSystolic: 146,
    bpDiastolic: 92,
    heartRate: 80,
    spo2: 96,
    primaryRisk: "Diabetes",
    overallRiskScore: 78,
    riskCategory: "High Risk", // >70% High Risk
    screeningDate: "24 May 2025, 10:30 AM",
    nurseName: "Nurse Sarah Jenkins",
    nurseNotes: "Patient reported frequent nighttime urination and chronic fatigue. Family history of Type 2 Diabetes.",
    doctorReviewStatus: "Escalated",
    assignedDoctor: "Dr. Arjun Mehta (Endocrinologist)",
    assignedSpecialty: "Endocrinologist",
    medicalHistory: ["Hypertension (5 yrs)", "Borderline HbA1c (7.1%)"],
    symptoms: ["Fatigue", "Frequent Urination"],
    dotSummary: ["bg-emerald-500", "bg-rose-500", "bg-amber-500", "bg-rose-500", "bg-emerald-500"]
  },
  {
    id: "PT-1257",
    name: "Sunita Sharma",
    age: 62,
    gender: "Female",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80",
    email: "sunita.sharma@example.com",
    phone: "+91 98765 12345",
    address: "New Delhi, Delhi",
    mrn: "MRN-125700",
    bloodGroup: "A+",
    height: 160,
    weight: 76,
    bmi: 29.7,
    bpSystolic: 154,
    bpDiastolic: 96,
    heartRate: 84,
    spo2: 95,
    primaryRisk: "Heart Disease",
    overallRiskScore: 84,
    riskCategory: "High Risk", // >70% High Risk
    screeningDate: "24 May 2025, 10:15 AM",
    nurseName: "Nurse Sarah Jenkins",
    nurseNotes: "Shortness of breath on exertion and mild tightness in chest. Elevated Stage 2 BP.",
    doctorReviewStatus: "Reviewed",
    assignedDoctor: "Dr. Rajesh Gupta (Cardiologist)",
    assignedSpecialty: "Cardiologist",
    medicalHistory: ["Hyperlipidemia", "Paternal Heart Attack"],
    symptoms: ["Chest Tightness", "Shortness of Breath"],
    dotSummary: ["bg-rose-500", "bg-emerald-500", "bg-rose-500", "bg-emerald-500", "bg-emerald-500"]
  },
  {
    id: "PT-1258",
    name: "Amit Kumar",
    age: 45,
    gender: "Male",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
    email: "amit.kumar@example.com",
    phone: "+91 98123 45678",
    address: "Bangalore, Karnataka",
    mrn: "MRN-125800",
    bloodGroup: "O+",
    height: 174,
    weight: 78,
    bmi: 25.8,
    bpSystolic: 136,
    bpDiastolic: 86,
    heartRate: 74,
    spo2: 98,
    primaryRisk: "Hypertension",
    overallRiskScore: 48,
    riskCategory: "Moderate Risk", // 41-70% Moderate
    screeningDate: "24 May 2025, 09:45 AM",
    nurseName: "Nurse Sarah Jenkins",
    nurseNotes: "Mild stress related headaches. Advised sodium restriction and 30-day follow-up.",
    doctorReviewStatus: "Pending",
    assignedDoctor: "Nurse Sarah (General Health)",
    assignedSpecialty: "General Medicine",
    medicalHistory: ["High Stress Desk Job", "Mild Obesity"],
    symptoms: ["Morning Headaches"],
    dotSummary: ["bg-emerald-500", "bg-emerald-500", "bg-amber-500", "bg-emerald-500", "bg-emerald-500"]
  },
  {
    id: "PT-1259",
    name: "Neha Patel",
    age: 37,
    gender: "Female",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
    email: "neha.patel@example.com",
    phone: "+91 97654 32109",
    address: "Ahmedabad, Gujarat",
    mrn: "MRN-125900",
    bloodGroup: "O-",
    height: 162,
    weight: 71,
    bmi: 27.1,
    bpSystolic: 142,
    bpDiastolic: 90,
    heartRate: 78,
    spo2: 97,
    primaryRisk: "CKD",
    overallRiskScore: 72,
    riskCategory: "High Risk", // >70% High Risk
    screeningDate: "24 May 2025, 09:30 AM",
    nurseName: "Nurse Sarah Jenkins",
    nurseNotes: "History of Gestational Diabetes. Bilateral ankle edema noted during vitals check.",
    doctorReviewStatus: "Escalated",
    assignedDoctor: "Dr. Alistair Vance (Nephrologist)",
    assignedSpecialty: "Nephrologist",
    medicalHistory: ["Gestational Diabetes", "Elevated Serum Creatinine"],
    symptoms: ["Swollen Ankles", "Fatigue"],
    dotSummary: ["bg-rose-500", "bg-rose-500", "bg-emerald-500", "bg-rose-500", "bg-emerald-500"]
  },
  {
    id: "PT-1260",
    name: "Sanjay Singh",
    age: 63,
    gender: "Male",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80",
    email: "sanjay.singh@example.com",
    phone: "+91 99887 76655",
    address: "Kolkata, West Bengal",
    mrn: "MRN-126000",
    bloodGroup: "AB+",
    height: 172,
    weight: 80,
    bmi: 27.0,
    bpSystolic: 138,
    bpDiastolic: 88,
    heartRate: 76,
    spo2: 96,
    primaryRisk: "Stroke",
    overallRiskScore: 52,
    riskCategory: "Moderate Risk",
    screeningDate: "24 May 2025, 09:10 AM",
    nurseName: "Nurse Sarah Jenkins",
    nurseNotes: "Long-term smoking history. Recommended smoking cessation support group.",
    doctorReviewStatus: "Reviewed",
    assignedDoctor: "Dr. Robert Chen (Neurologist)",
    assignedSpecialty: "Neurologist",
    medicalHistory: ["Smoking History (15 yrs)", "Hypercholesterolemia"],
    symptoms: ["Dizziness", "Occasional Numbness"],
    dotSummary: ["bg-emerald-500", "bg-amber-500", "bg-emerald-500", "bg-amber-500", "bg-emerald-500"]
  }
];

export const INITIAL_SCREENINGS = [
  {
    id: "SCR-2025-1256",
    patientId: "PT-1256",
    patientName: "Ramesh Verma",
    age: 58,
    gender: "Male",
    date: "24 May 2025, 10:30 AM",
    predictedDisease: "Type 2 Diabetes Mellitus",
    overallRiskScore: 78,
    riskCategory: "High Risk",
    doctorReviewStatus: "Escalated",
    riskBreakdown: {
      diabetes: 78,
      heartDisease: 64,
      hypertension: 58,
      ckd: 42,
      stroke: 35
    },
    vitals: {
      bp: "146/92 mmHg",
      heartRate: 80,
      spo2: 96,
      bmi: 29.1
    },
    doctorNotes: "Automated Escalation to Endocrinologist (Dr. Arjun Mehta)",
    labTestsRequested: ["HbA1c & Fasting Blood Sugar"]
  }
];

export const MOCK_LAB_TEST_ORDERS = [
  {
    id: "LAB-801",
    patientId: "PT-1256",
    patientName: "Ramesh Verma",
    diseaseType: "Diabetes",
    testName: "HbA1c & Fasting Blood Sugar",
    doctorName: "Dr. Arjun Mehta (Endocrinologist)",
    orderDate: "2025-05-24",
    status: "Pending", // Ordered, Pending, Completed
    resultSummary: "Sample collected, pending lab analysis"
  },
  {
    id: "LAB-802",
    patientId: "PT-1257",
    patientName: "Sunita Sharma",
    diseaseType: "Heart Disease",
    testName: "12-Lead ECG & Lipid Profile",
    doctorName: "Dr. Rajesh Gupta (Cardiologist)",
    orderDate: "2025-05-24",
    status: "Completed",
    resultSummary: "ST Elevation in V2-V4, LDL 168 mg/dL (Elevated)"
  },
  {
    id: "LAB-803",
    patientId: "PT-1259",
    patientName: "Neha Patel",
    diseaseType: "CKD",
    testName: "Serum Creatinine & Urine Albumin",
    doctorName: "Dr. Alistair Vance (Nephrologist)",
    orderDate: "2025-05-24",
    status: "Ordered",
    resultSummary: "Requisition sent to outpatient lab"
  }
];

export const MOCK_RECOMMENDATIONS_DATABASE = {
  Diabetes: {
    diet: [
      "Low glycemic index Mediterranean diet rich in whole grains and fiber",
      "Strict restriction of refined sugars, fructose, and sweetened beverages",
      "Incorporate 35g+ daily dietary fiber (beans, lentils, chia seeds)"
    ],
    exercise: [
      "150 minutes of moderate aerobic exercise (brisk walking, swimming) per week",
      "Resistance & strength training 3 sessions per week to increase muscle glucose uptake"
    ],
    lifestyle: [
      "Maintain continuous glucose monitoring (CGM) or capillary blood glucose log",
      "Target weight reduction of 7-10% of total body weight"
    ],
    checkups: ["HbA1c test every 3 months", "Annual dilated eye exam"],
    specialist: "Endocrinologist (Dr. Arjun Mehta)"
  },
  HeartDisease: {
    diet: [
      "DASH / Heart-Healthy Low Sodium Diet (<2,000 mg Na/day)",
      "High Omega-3 intake (fatty fish like salmon, walnuts, flaxseed)",
      "Eliminate industrial trans-fats and limit saturated fats to <7% of daily calories"
    ],
    exercise: [
      "Supervised cardiac rehabilitation or progressive moderate aerobic workouts",
      "Daily structured 30-minute walking sessions"
    ],
    lifestyle: [
      "Complete smoking cessation (enroll in nicotine replacement therapy if needed)",
      "Daily blood pressure and resting heart rate monitoring"
    ],
    checkups: ["Echocardiogram within 30 days", "Comprehensive Lipid Panel & High-Sensitivity CRP"],
    specialist: "Cardiologist (Dr. Rajesh Gupta)"
  },
  Hypertension: {
    diet: [
      "Strict Sodium restriction (<1,500 mg/day for High Risk stage)",
      "Potassium-rich foods (bananas, avocados, spinach, sweet potatoes) if kidney function is normal"
    ],
    exercise: [
      "30-45 minutes of aerobic activity 5 days/week (lowers SBP by 5-8 mmHg)"
    ],
    lifestyle: [
      "24-hour ambulatory blood pressure monitoring",
      "Stress reduction techniques (box breathing, yoga)"
    ],
    checkups: ["Weekly BP tracking log submission", "Renal function & Serum Electrolyte panel"],
    specialist: "Hypertension & Internal Medicine Specialist"
  },
  Stroke: {
    diet: [
      "Antioxidant-rich berries, leafy greens, dark chocolate, and extra virgin olive oil",
      "Strict salt limitation and low saturated fat intake"
    ],
    exercise: [
      "Regular low-impact aerobic activity (stationary cycling, swimming)",
      "Balance and proprioception training"
    ],
    lifestyle: [
      "Strict blood pressure control (Target < 130/80 mmHg)",
      "Immediate cessation of tobacco and vaping products"
    ],
    checkups: ["Carotid artery ultrasound", "Brain MRI/CT angiography as advised by neurologist"],
    specialist: "Neurologist (Dr. Robert Chen)"
  },
  CKD: {
    diet: [
      "Controlled protein intake (0.6 - 0.8 g/kg body weight/day under renal dietitian supervision)",
      "Monitor and restrict Serum Phosphorus and Potassium as indicated"
    ],
    exercise: [
      "Moderate-intensity walking or low-impact cycling 3-4 days/week"
    ],
    lifestyle: [
      "Strict avoidance of NSAID analgesics (Ibuprofen, Naproxen)",
      "Rigid glycemic and blood pressure control"
    ],
    checkups: ["eGFR and Urine Albumin-to-Creatinine Ratio (UACR) every 3 months"],
    specialist: "Nephrologist (Dr. Alistair Vance)"
  }
};

export const MOCK_DISEASE_DISTRIBUTION = [
  { name: "Diabetes", count: 423, percentage: 34, fill: "#10B981" },
  { name: "Heart Disease", count: 299, percentage: 24, fill: "#EF4444" },
  { name: "Hypertension", count: 249, percentage: 20, fill: "#F59E0B" },
  { name: "CKD", count: 150, percentage: 12, fill: "#8B5CF6" },
  { name: "Stroke", count: 127, percentage: 10, fill: "#3B82F6" }
];

export const MOCK_MONTHLY_TRENDS = [
  { month: "Jan", Diabetes: 65, HeartDisease: 50, Hypertension: 32, CKD: 22, Stroke: 12 },
  { month: "Feb", Diabetes: 72, HeartDisease: 58, Hypertension: 38, CKD: 24, Stroke: 16 },
  { month: "Mar", Diabetes: 80, HeartDisease: 57, Hypertension: 39, CKD: 25, Stroke: 12 },
  { month: "Apr", Diabetes: 77, HeartDisease: 64, Hypertension: 48, CKD: 30, Stroke: 19 },
  { month: "May", Diabetes: 72, HeartDisease: 54, Hypertension: 40, CKD: 26, Stroke: 14 },
  { month: "Jun", Diabetes: 82, HeartDisease: 64, Hypertension: 47, CKD: 32, Stroke: 18 }
];
