export const C = {
  primary: "#0E7C5A",
  primaryDark: "#0A5C43",
  primaryDeep: "#083F2E",
  primaryLight: "#E7F4EE",
  primaryLighter: "#F2F9F6",
  accent: "#12A886",
  bg: "#F5F8F7",
  card: "#FFFFFF",
  text: "#122420",
  textMuted: "#5C7069",
  textFaint: "#8CA098",
  border: "#DEE9E4",
  low: "#1E9E5A",
  lowBg: "#E9F8EF",
  moderate: "#C67C0E",
  moderateBg: "#FDF3E0",
  high: "#D64545",
  highBg: "#FBE9E9",
  diabetes: "#0E7C5A",
  hypertension: "#C6470E",
  cvd: "#B23A5B",
  stroke: "#6E4EC6",
  ckd: "#1C7FC6",
};

export const DISEASES = ["Diabetes", "Hypertension", "CVD", "Stroke", "CKD"];

export const DISEASE_COLOR = {
  Diabetes: C.diabetes,
  Hypertension: C.hypertension,
  CVD: C.cvd,
  Stroke: C.stroke,
  CKD: C.ckd,
};

export const SPECIALIST_MAP = {
  Diabetes: "Endocrinologist",
  Hypertension: "Cardiologist",
  CVD: "Cardiologist",
  Stroke: "Neurologist",
  CKD: "Nephrologist",
};

export const LAB_TESTS_MAP = {
  Diabetes: ["HbA1c", "Fasting Blood Sugar", "PPBS"],
  Hypertension: ["ECG", "Lipid Profile", "Echocardiogram"],
  CVD: ["ECG", "Troponin", "Lipid Profile"],
  Stroke: ["MRI", "CT Scan"],
  CKD: ["Creatinine", "Urine Albumin", "eGFR"],
};

export const ROLES = ["Nurse", "Endocrinologist", "Cardiologist", "Neurologist", "Nephrologist", "Super Admin"];

export const ROLE_DISEASES = {
  Endocrinologist: ["Diabetes"],
  Cardiologist: ["Hypertension", "CVD"],
  Neurologist: ["Stroke"],
  Nephrologist: ["CKD"],
};

export const ROLE_ICON = {
  Nurse: 'Stethoscope',
  Endocrinologist: 'Droplets',
  Cardiologist: 'HeartPulse',
  Neurologist: 'Brain',
  Nephrologist: 'Activity',
  "Super Admin": 'ShieldCheck',
};

export const SYMPTOM_LIST = ["Chest Pain", "Frequent Urination", "Fatigue", "Breathlessness", "Headache", "Vision Problems"];

export const STEPS = [
  "Select Patient",
  "Personal Details",
  "Lifestyle History",
  "Family History",
  "Clinical Vitals",
  "ECG & Retinal Scans",
  "Symptoms Checklist",
  "Screen & Report"
];

export const DISEASE_PLANS = {
  Diabetes: {
    diet: [
      "Low Glycemic Index (GI) diet: Whole grains, oats, brown rice, legumes",
      "Strict avoidance of refined sugars, fruit juices, and carbonated beverages",
      "High fiber intake (30-35g daily): Green leafy vegetables, chia seeds, lentils"
    ],
    exercise: [
      "150 minutes per week of moderate-intensity aerobic exercise (brisk walking)",
      "Resistance & strength training 3 sessions per week to boost insulin sensitivity"
    ],
    lifestyle: [
      "Daily self-monitoring of blood glucose (Fasting target: < 100 mg/dL)",
      "Aim for 7-8 hours of uninterrupted sleep every night",
      "Annual dilated eye exam and foot sensation checks"
    ]
  },
  Hypertension: {
    diet: [
      "DASH Diet protocol: Low sodium (< 1,500 mg per day)",
      "Increase potassium & magnesium rich foods: Bananas, spinach, almonds, sweet potatoes",
      "Eliminate processed canned foods, pickles, and salty snacks"
    ],
    exercise: [
      "30-45 minutes of daily brisk walking, cycling, or swimming",
      "Avoid isometric heavy lifting; focus on dynamic aerobic workouts"
    ],
    lifestyle: [
      "Daily morning and evening blood pressure log (Target < 120/80 mmHg)",
      "Mindfulness & stress management techniques (20 mins daily yoga/meditation)",
      "Strict limitation or cessation of alcohol and caffeine"
    ]
  },
  CVD: {
    diet: [
      "Heart-Healthy Mediterranean Diet: Extra virgin olive oil, nuts, avocados",
      "High Omega-3 fatty acid intake: Salmon, walnuts, flaxseeds",
      "Zero trans-fats and limit saturated fats to < 6% of daily energy"
    ],
    exercise: [
      "Supervised moderate aerobic walking (30 mins 5 days/week)",
      "Gradual progressive conditioning with heart rate monitoring"
    ],
    lifestyle: [
      "Complete tobacco & smoking cessation (enrol in nicotine support if required)",
      "Monitor resting heart rate & maintain healthy body weight (BMI 18.5 - 24.9)",
      "Regular lipid profile & cardiac wellness checkups"
    ]
  },
  Stroke: {
    diet: [
      "Antioxidant-rich diet: Blueberries, dark leafy greens, green tea, beetroot",
      "Sodium restriction to reduce arterial wall pressure (< 2,000 mg/day)",
      "Hydration: 2.5 - 3 Liters of clean water daily"
    ],
    exercise: [
      "Low-impact aerobic movement (stationary cycling, swimming, gentle walking)",
      "Balance, proprioception & flexibility exercises"
    ],
    lifestyle: [
      "Strict carotid & arterial blood pressure management",
      "Zero smoking and alcohol intake",
      "Immediate medical evaluation if experiencing sudden numbness or slurred speech"
    ]
  },
  CKD: {
    diet: [
      "Controlled protein diet (0.6 - 0.8 g/kg body weight/day under renal guidance)",
      "Monitor & restrict high-potassium & high-phosphorus intake if advised",
      "Sodium restriction (< 2,000 mg/day)"
    ],
    exercise: [
      "Moderate-intensity walking 30 minutes 4 days/week",
      "Avoid over-exertion or extreme heavy endurance workouts"
    ],
    lifestyle: [
      "Avoid OTC NSAID pain relievers (Ibuprofen, Naproxen)",
      "Monitor daily fluid intake and urine output volume",
      "Quarterly Serum Creatinine & Urine Albumin screening"
    ]
  }
};
