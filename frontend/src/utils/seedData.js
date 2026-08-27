import { uid, todayStr } from './helpers';
import { DISEASES, SPECIALIST_MAP } from './constants';
import { computeRisk } from './riskCalculator';

export function seedDB() {
  const patients = [
    { id: uid("pt"), name: "Aarav Sharma", age: 52, gender: "Male", phone: "9840012345", address: "Koramangala, Bangalore", medicalHistory: "Pre-diabetic", previousConditions: "Nil", createdAt: todayStr() },
    { id: uid("pt"), name: "Meera Iyer", age: 61, gender: "Female", phone: "9841122334", address: "Indiranagar, Bangalore", medicalHistory: "None", previousConditions: "Nil", createdAt: todayStr() },
    { id: uid("pt"), name: "Arjun Menon", age: 58, gender: "Male", phone: "9884433221", address: "Jayanagar, Bangalore", medicalHistory: "Former smoker", previousConditions: "Nil", createdAt: todayStr() },
    { id: uid("pt"), name: "Kavya Nair", age: 66, gender: "Female", phone: "9003344556", address: "Whitefield, Bangalore", medicalHistory: "Hypertension", previousConditions: "Nil", createdAt: todayStr() },
    { id: uid("pt"), name: "Rohan Kapoor", age: 64, gender: "Male", phone: "9976543210", address: "Malleswaram, Bangalore", medicalHistory: "Type 2 diabetes", previousConditions: "Nil", createdAt: todayStr() },
  ];
  const screenings = [];
  const referrals = [];
  const notifications = [];

  const mkScreening = (patient, overrides, daysAgo = 0) => {
    const s = {
      id: uid("scr"),
      patientId: patient.id,
      date: new Date(Date.now() - daysAgo * 86400000).toISOString().slice(0, 10),
      personal: { height: 170, weight: 70 },
      lifestyle: { smoking: "None", alcohol: "None", activity: "Moderate", diet: "Average", sleep: 7, stress: "Moderate" },
      family: { diabetes: false, hypertension: false, heartDisease: false, stroke: false, ckd: false },
      vitals: { systolic: 120, diastolic: 80, bmi: 24.2, heartRate: 75 },
      files: { ecg: null, retinal: null },
      symptoms: [],
      notes: "",
      ...overrides,
    };
    if (s.personal.height && s.personal.weight) {
      s.vitals.bmi = +(s.personal.weight / ((s.personal.height / 100) * (s.personal.height / 100))).toFixed(1);
    }
    s.riskScores = computeRisk(s, patient);
    screenings.push(s);
    return s;
  };

  // Shyam Pandey -> Diabetes risk
  const s1 = mkScreening(patients[0], {
    personal: { height: 165, weight: 85 }, // BMI 31.2
    lifestyle: { smoking: "None", alcohol: "Occasional", activity: "Low", diet: "Poor", sleep: 6, stress: "High" },
    family: { diabetes: true, hypertension: false, heartDisease: false, stroke: false, ckd: false },
    vitals: { systolic: 135, diastolic: 85, heartRate: 82 },
    symptoms: ["Frequent Urination", "Fatigue", "Vision Problems"],
    files: { ecgStatus: "Normal Sinus Rhythm", retinalStatus: "Diabetic Retinopathy (Mild/Moderate)", ecgNotes: "", retinalNotes: "Microaneurysms detected" }
  }, 0);
  
  // Tara Priyadarshan -> Hypertension risk
  const s2 = mkScreening(patients[1], {
    personal: { height: 160, weight: 72 }, // BMI 28.1
    lifestyle: { smoking: "None", alcohol: "None", activity: "Low", diet: "Average", sleep: 5, stress: "High" },
    family: { diabetes: false, hypertension: true, heartDisease: false, stroke: false, ckd: false },
    vitals: { systolic: 158, diastolic: 96, heartRate: 88 },
    symptoms: ["Headache", "Fatigue"],
    files: { ecgStatus: "Normal Sinus Rhythm", retinalStatus: "Hypertensive Retinopathy", ecgNotes: "", retinalNotes: "AV nicking observed" }
  }, 1);
  
  // Akash Sharma -> CVD risk
  const s3 = mkScreening(patients[2], {
    personal: { height: 175, weight: 92 }, // BMI 30.0
    lifestyle: { smoking: "Regular", alcohol: "Regular", activity: "Low", diet: "Poor", sleep: 6, stress: "High" },
    family: { diabetes: false, hypertension: true, heartDisease: true, stroke: false, ckd: false },
    vitals: { systolic: 145, diastolic: 92, heartRate: 95 },
    symptoms: ["Chest Pain", "Breathlessness", "Fatigue"],
    files: { ecgStatus: "ST Segment Elevation", retinalStatus: "Normal Retina", ecgNotes: "Ischemic changes noted in V4-V6", retinalNotes: "" }
  }, 2);
  
  // Virat Kohli -> Stroke risk
  const s4 = mkScreening(patients[3], {
    personal: { height: 172, weight: 80 }, // BMI 27.0
    lifestyle: { smoking: "Regular", alcohol: "Occasional", activity: "Low", diet: "Poor", sleep: 5, stress: "High" },
    family: { diabetes: false, hypertension: true, heartDisease: false, stroke: true, ckd: false },
    vitals: { systolic: 165, diastolic: 100, heartRate: 90 },
    symptoms: ["Headache", "Vision Problems", "Fatigue"],
    files: { ecgStatus: "Abnormal / Arrhythmia", retinalStatus: "Hypertensive Retinopathy", ecgNotes: "Atrial fibrillation suspected", retinalNotes: "Cotton wool spots" }
  }, 0);

  // Sachin Rao -> CKD risk
  const s5 = mkScreening(patients[4], {
    personal: { height: 168, weight: 78 }, // BMI 27.6
    lifestyle: { smoking: "None", alcohol: "None", activity: "Moderate", diet: "Average", sleep: 7, stress: "Moderate" },
    family: { diabetes: true, hypertension: true, heartDisease: false, stroke: false, ckd: true },
    vitals: { systolic: 150, diastolic: 90, heartRate: 80 },
    symptoms: ["Fatigue", "Frequent Urination"],
    files: { ecgStatus: "Normal Sinus Rhythm", retinalStatus: "Diabetic Retinopathy (Mild/Moderate)", ecgNotes: "", retinalNotes: "" }
  }, 0);

  [s1, s2, s3, s4, s5].forEach((s) => {
    const patient = patients.find((p) => p.id === s.patientId);
    DISEASES.forEach((d) => {
      const score = s.riskScores[d];
      const level = score >= 71 ? "High" : score >= 41 ? "Moderate" : "Low";
      if (level !== "Low") {
        referrals.push({
          id: uid("ref"),
          screeningId: s.id,
          patientId: patient.id,
          disease: d,
          riskPercent: score,
          riskLevel: level,
          specialistRole: SPECIALIST_MAP[d],
          status: "Draft",
          labTests: [],
          notes: "",
          createdAt: s.date,
          signedAt: null,
          isSeen: false,
          emergencyReminderCount: 0
        });
        const isEmergency = level === "High";
        notifications.push({
          id: uid("nt"),
          role: SPECIALIST_MAP[d],
          message: isEmergency 
            ? `THIS IS EMERGENCY: High Risk ${d} (${score}%) for ${patient.name} requires immediate review!`
            : `New ${level} risk ${d} referral for ${patient.name} (${score}%)`,
          createdAt: s.date,
          read: false,
          isEmergency,
          patientName: patient.name,
          disease: d,
          riskScore: score
        });
      }
    });
  });
  
  if (referrals[0]) referrals[0].status = "Viewed";

  return { seedVersion: 2, patients, screenings, referrals, notifications };
}
