import { uid, todayStr } from './helpers';
import { DISEASES, SPECIALIST_MAP } from './constants';
import { computeRisk } from './riskCalculator';

export function seedDB() {
  const patients = [
    { id: uid("pt"), name: "Ravi Kumar", age: 54, gender: "Male", phone: "9840012345", address: "T. Nagar, Chennai", medicalHistory: "None significant", previousConditions: "Nil", createdAt: todayStr() },
    { id: uid("pt"), name: "Lakshmi Narayanan", age: 61, gender: "Female", phone: "9841122334", address: "Anna Nagar, Chennai", medicalHistory: "Hypothyroidism", previousConditions: "Nil", createdAt: todayStr() },
    { id: uid("pt"), name: "Suresh Babu", age: 47, gender: "Male", phone: "9884433221", address: "Velachery, Chennai", medicalHistory: "None", previousConditions: "Nil", createdAt: todayStr() },
    { id: uid("pt"), name: "Priya Raman", age: 39, gender: "Female", phone: "9003344556", address: "Adyar, Chennai", medicalHistory: "None", previousConditions: "Nil", createdAt: todayStr() },
    { id: uid("pt"), name: "Mohammed Ashraf", age: 66, gender: "Male", phone: "9976543210", address: "Mylapore, Chennai", medicalHistory: "Smoker (former)", previousConditions: "Nil", createdAt: todayStr() },
  ];
  const screenings = [];
  const referrals = [];
  const notifications = [];

  const mkScreening = (patient, overrides, daysAgo = 0) => {
    const s = {
      id: uid("scr"),
      patientId: patient.id,
      date: new Date(Date.now() - daysAgo * 86400000).toISOString().slice(0, 10),
      personal: { height: 168, weight: 74 },
      lifestyle: { smoking: "None", alcohol: "None", activity: "Moderate", diet: "Average", sleep: 7, stress: "Moderate" },
      family: { diabetes: false, hypertension: false, heartDisease: false, stroke: false, ckd: false },
      vitals: { systolic: 122, diastolic: 80, bmi: 24, heartRate: 78 },
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

  const s1 = mkScreening(patients[0], {
    lifestyle: { smoking: "Regular", alcohol: "Occasional", activity: "Low", diet: "Poor", sleep: 5, stress: "High" },
    family: { diabetes: true, hypertension: true, heartDisease: false, stroke: false, ckd: false },
    vitals: { systolic: 148, diastolic: 96, bmi: 26.5, heartRate: 92 },
    symptoms: ["Frequent Urination", "Fatigue", "Headache"],
  }, 0);
  
  const s2 = mkScreening(patients[1], {
    lifestyle: { smoking: "None", alcohol: "None", activity: "Moderate", diet: "Average", sleep: 6, stress: "Moderate" },
    family: { diabetes: false, hypertension: false, heartDisease: false, stroke: true, ckd: false },
    vitals: { systolic: 130, diastolic: 84, bmi: 24.5, heartRate: 80 },
    symptoms: ["Vision Problems"],
  }, 1);
  
  const s3 = mkScreening(patients[2], {
    lifestyle: { smoking: "None", alcohol: "None", activity: "High", diet: "Good", sleep: 8, stress: "Low" },
    family: { diabetes: false, hypertension: false, heartDisease: false, stroke: false, ckd: false },
    vitals: { systolic: 116, diastolic: 76, bmi: 22.5, heartRate: 70 },
    symptoms: [],
  }, 2);
  
  const s4 = mkScreening(patients[4], {
    lifestyle: { smoking: "Regular", alcohol: "Regular", activity: "Low", diet: "Poor", sleep: 5, stress: "High" },
    family: { diabetes: false, hypertension: true, heartDisease: true, stroke: false, ckd: true },
    vitals: { systolic: 152, diastolic: 98, bmi: 28.5, heartRate: 96 },
    symptoms: ["Chest Pain", "Breathlessness", "Fatigue"],
  }, 0);

  [s1, s2, s3, s4].forEach((s) => {
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
        });
        notifications.push({
          id: uid("nt"),
          role: SPECIALIST_MAP[d],
          message: `New ${level} risk ${d} referral for ${patient.name} (${score}%)`,
          createdAt: s.date,
          read: false
        });
      }
    });
  });
  
  if (referrals[0]) referrals[0].status = "Viewed";

  return { patients, screenings, referrals, notifications };
}
