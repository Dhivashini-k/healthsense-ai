import datetime
import random
from database import engine, SessionLocal, Base
import models, auth

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Check if database is already seeded
    if db.query(models.User).filter(models.User.email == "nurse@healthsense.demo").first():
        db.close()
        return

    print("Seeding HealthSense AI Database — 6 Demo Roles + 18 Patients...")

    # ── 1. Create 6 Demo User Roles ──────────────────────────────────────
    users_to_create = [
        models.User(name="Nurse Sarah Jenkins", email="nurse@healthsense.demo",
                     password_hash=auth.get_password_hash("Nurse@123"), role="nurse"),
        models.User(name="Dr. Arjun Mehta (Endocrinologist)", email="diabetes@healthsense.demo",
                     password_hash=auth.get_password_hash("Diabetes@123"), role="endocrinologist"),
        models.User(name="Dr. Sarah Lee (Hypertension)", email="hypertension@healthsense.demo",
                     password_hash=auth.get_password_hash("Hypertension@123"), role="cardiologist"),
        models.User(name="Dr. Rajesh Gupta (Cardiologist)", email="cardio@healthsense.demo",
                     password_hash=auth.get_password_hash("Cardio@123"), role="cardiologist"),
        models.User(name="Dr. Robert Chen (Neurologist)", email="stroke@healthsense.demo",
                     password_hash=auth.get_password_hash("Stroke@123"), role="neurologist"),
        models.User(name="Dr. Alistair Vance (Nephrologist)", email="ckd@healthsense.demo",
                     password_hash=auth.get_password_hash("CKD@123"), role="nephrologist"),
    ]
    db.add_all(users_to_create)
    db.commit()

    # Also keep legacy users for backward compatibility
    legacy_users = [
        models.User(name="Nurse Sarah Jenkins", email="nurse@healthsense.ai",
                     password_hash=auth.get_password_hash("nurse123"), role="nurse"),
        models.User(name="Dr. Arjun Mehta (Endocrinologist)", email="endocrinologist@healthsense.ai",
                     password_hash=auth.get_password_hash("doc123"), role="endocrinologist"),
        models.User(name="Dr. Rajesh Gupta (Cardiologist)", email="cardiologist@healthsense.ai",
                     password_hash=auth.get_password_hash("doc123"), role="cardiologist"),
        models.User(name="Dr. Robert Chen (Neurologist)", email="neurologist@healthsense.ai",
                     password_hash=auth.get_password_hash("doc123"), role="neurologist"),
        models.User(name="Dr. Alistair Vance (Nephrologist)", email="nephrologist@healthsense.ai",
                     password_hash=auth.get_password_hash("doc123"), role="nephrologist"),
        models.User(name="Super Hospital Admin", email="admin@healthsense.ai",
                     password_hash=auth.get_password_hash("admin123"), role="super_admin"),
    ]
    for u in legacy_users:
        if not db.query(models.User).filter(models.User.email == u.email).first():
            db.add(u)
    db.commit()

    # ── 2. Clinically Consistent Synthetic Patients ──────────────────────
    now = datetime.datetime.utcnow()
    def days_ago(n):
        return (now - datetime.timedelta(days=n)).strftime("%Y-%m-%d")

    patients_data = [
        # ── HIGH RISK PATIENTS ──
        {
            "patient_id": "PT-1001", "name": "Ramesh Verma", "age": 58, "gender": "Male",
            "height": 168.0, "weight": 88.0, "phone": "+91 98765 43210", "address": "Mumbai, Maharashtra",
            "medical_history": ["Hypertension (5 yrs)", "Borderline HbA1c (7.1%)"],
            "bp": "148/94", "hr": 88, "spo2": 95.0, "bmi": 31.2,
            "smoking": "former", "alcohol": "occasional", "exercise": "sedentary",
            "sleep": 5, "stress": 8, "family_history": ["diabetes", "hypertension"],
            "symptoms": ["Frequent Urination", "Fatigue", "Headache"],
            "diabetes_risk": 72.0, "hypertension_risk": 68.0, "cvd_risk": 58.0,
            "stroke_risk": 35.0, "ckd_risk": 38.0, "overall_risk": 58.0,
            "risk_level": "High Risk", "assigned_specialist": "Endocrinologist",
            "assigned_doctor": "Dr. Arjun Mehta (Endocrinologist)",
            "follow_up": "Pending", "report_status": "Draft", "days_ago": 0,
            "selected_labs": ["HbA1c", "Fasting Blood Sugar", "Lipid Profile"]
        },
        {
            "patient_id": "PT-1002", "name": "Sunita Sharma", "age": 62, "gender": "Female",
            "height": 158.0, "weight": 78.0, "phone": "+91 98765 12345", "address": "New Delhi, Delhi",
            "medical_history": ["Hyperlipidemia", "Paternal Heart Attack"],
            "bp": "156/98", "hr": 84, "spo2": 95.0, "bmi": 31.2,
            "smoking": "never", "alcohol": "none", "exercise": "low",
            "sleep": 6, "stress": 7, "family_history": ["hypertension", "heart"],
            "symptoms": ["Chest Pain", "Breathlessness"],
            "diabetes_risk": 42.0, "hypertension_risk": 82.0, "cvd_risk": 76.0,
            "stroke_risk": 55.0, "ckd_risk": 40.0, "overall_risk": 62.0,
            "risk_level": "High Risk", "assigned_specialist": "Cardiologist",
            "assigned_doctor": "Dr. Rajesh Gupta (Cardiologist)",
            "follow_up": "Completed", "report_status": "Signed", "days_ago": 3,
            "selected_labs": ["ECG", "Lipid Profile", "Echocardiogram"]
        },
        {
            "patient_id": "PT-1003", "name": "Sanjay Singh", "age": 63, "gender": "Male",
            "height": 172.0, "weight": 82.0, "phone": "+91 99887 76655", "address": "Kolkata, West Bengal",
            "medical_history": ["Smoking History (15 yrs)", "Atrial Fibrillation"],
            "bp": "150/92", "hr": 96, "spo2": 94.0, "bmi": 27.7,
            "smoking": "current", "alcohol": "regular", "exercise": "sedentary",
            "sleep": 5, "stress": 8, "family_history": ["stroke", "hypertension"],
            "symptoms": ["Vision Problems", "Headache", "Fatigue"],
            "diabetes_risk": 38.0, "hypertension_risk": 72.0, "cvd_risk": 65.0,
            "stroke_risk": 78.0, "ckd_risk": 32.0, "overall_risk": 58.0,
            "risk_level": "High Risk", "assigned_specialist": "Neurologist",
            "assigned_doctor": "Dr. Robert Chen (Neurologist)",
            "follow_up": "Pending", "report_status": "Sent", "days_ago": 1,
            "selected_labs": ["MRI", "CT Scan", "Carotid Doppler"]
        },
        {
            "patient_id": "PT-1004", "name": "Neha Patel", "age": 45, "gender": "Female",
            "height": 162.0, "weight": 74.0, "phone": "+91 97654 32109", "address": "Ahmedabad, Gujarat",
            "medical_history": ["Gestational Diabetes", "Recurrent UTI"],
            "bp": "142/90", "hr": 78, "spo2": 97.0, "bmi": 28.2,
            "smoking": "never", "alcohol": "none", "exercise": "moderate",
            "sleep": 6, "stress": 6, "family_history": ["diabetes", "ckd"],
            "symptoms": ["Fatigue", "Frequent Urination"],
            "diabetes_risk": 62.0, "hypertension_risk": 52.0, "cvd_risk": 38.0,
            "stroke_risk": 22.0, "ckd_risk": 68.0, "overall_risk": 50.0,
            "risk_level": "High Risk", "assigned_specialist": "Nephrologist",
            "assigned_doctor": "Dr. Alistair Vance (Nephrologist)",
            "follow_up": "Pending", "report_status": "Sent", "days_ago": 5,
            "selected_labs": ["Creatinine", "Urine Albumin", "eGFR"]
        },

        # ── MODERATE RISK PATIENTS ──
        {
            "patient_id": "PT-1005", "name": "Amit Kumar", "age": 48, "gender": "Male",
            "height": 174.0, "weight": 80.0, "phone": "+91 98123 45678", "address": "Bangalore, Karnataka",
            "medical_history": ["High Stress Desk Job"],
            "bp": "136/86", "hr": 76, "spo2": 98.0, "bmi": 26.4,
            "smoking": "former", "alcohol": "occasional", "exercise": "moderate",
            "sleep": 6, "stress": 6, "family_history": ["diabetes"],
            "symptoms": ["Fatigue"],
            "diabetes_risk": 45.0, "hypertension_risk": 42.0, "cvd_risk": 38.0,
            "stroke_risk": 22.0, "ckd_risk": 20.0, "overall_risk": 36.0,
            "risk_level": "Moderate Risk", "assigned_specialist": "Endocrinologist",
            "assigned_doctor": "Dr. Arjun Mehta (Endocrinologist)",
            "follow_up": "Completed", "report_status": "Signed", "days_ago": 8,
            "selected_labs": ["HbA1c", "Fasting Blood Sugar"]
        },
        {
            "patient_id": "PT-1006", "name": "Meena Iyer", "age": 55, "gender": "Female",
            "height": 156.0, "weight": 68.0, "phone": "+91 94432 11223", "address": "Coimbatore, Tamil Nadu",
            "medical_history": ["Mild Osteoarthritis"],
            "bp": "134/84", "hr": 74, "spo2": 97.0, "bmi": 27.9,
            "smoking": "never", "alcohol": "none", "exercise": "low",
            "sleep": 7, "stress": 5, "family_history": ["hypertension"],
            "symptoms": ["Headache"],
            "diabetes_risk": 38.0, "hypertension_risk": 48.0, "cvd_risk": 42.0,
            "stroke_risk": 28.0, "ckd_risk": 22.0, "overall_risk": 37.0,
            "risk_level": "Moderate Risk", "assigned_specialist": "Cardiologist",
            "assigned_doctor": "Dr. Rajesh Gupta (Cardiologist)",
            "follow_up": "Completed", "report_status": "Signed", "days_ago": 12,
            "selected_labs": ["ECG", "Lipid Profile"]
        },
        {
            "patient_id": "PT-1007", "name": "Rajiv Menon", "age": 52, "gender": "Male",
            "height": 170.0, "weight": 76.0, "phone": "+91 90876 54321", "address": "Kochi, Kerala",
            "medical_history": ["Pre-diabetic (IFG)"],
            "bp": "130/82", "hr": 72, "spo2": 98.0, "bmi": 26.3,
            "smoking": "never", "alcohol": "occasional", "exercise": "moderate",
            "sleep": 7, "stress": 5, "family_history": ["diabetes", "heart"],
            "symptoms": [],
            "diabetes_risk": 52.0, "hypertension_risk": 35.0, "cvd_risk": 45.0,
            "stroke_risk": 25.0, "ckd_risk": 18.0, "overall_risk": 38.0,
            "risk_level": "Moderate Risk", "assigned_specialist": "Endocrinologist",
            "assigned_doctor": "Dr. Arjun Mehta (Endocrinologist)",
            "follow_up": "Pending", "report_status": "Draft", "days_ago": 15,
            "selected_labs": ["HbA1c", "OGTT"]
        },
        {
            "patient_id": "PT-1008", "name": "Farida Begum", "age": 60, "gender": "Female",
            "height": 154.0, "weight": 72.0, "phone": "+91 98321 44556", "address": "Hyderabad, Telangana",
            "medical_history": ["Hypothyroidism"],
            "bp": "140/88", "hr": 80, "spo2": 96.0, "bmi": 30.4,
            "smoking": "never", "alcohol": "none", "exercise": "low",
            "sleep": 6, "stress": 6, "family_history": ["hypertension", "stroke"],
            "symptoms": ["Headache", "Vision Problems"],
            "diabetes_risk": 35.0, "hypertension_risk": 55.0, "cvd_risk": 48.0,
            "stroke_risk": 52.0, "ckd_risk": 28.0, "overall_risk": 44.0,
            "risk_level": "Moderate Risk", "assigned_specialist": "Neurologist",
            "assigned_doctor": "Dr. Robert Chen (Neurologist)",
            "follow_up": "Completed", "report_status": "Signed", "days_ago": 20,
            "selected_labs": ["MRI", "Carotid Doppler"]
        },
        {
            "patient_id": "PT-1009", "name": "Vikram Rao", "age": 50, "gender": "Male",
            "height": 176.0, "weight": 84.0, "phone": "+91 99012 33445", "address": "Pune, Maharashtra",
            "medical_history": ["Kidney Stone (2023)"],
            "bp": "132/84", "hr": 76, "spo2": 97.0, "bmi": 27.1,
            "smoking": "former", "alcohol": "occasional", "exercise": "moderate",
            "sleep": 7, "stress": 5, "family_history": ["ckd"],
            "symptoms": [],
            "diabetes_risk": 28.0, "hypertension_risk": 38.0, "cvd_risk": 32.0,
            "stroke_risk": 20.0, "ckd_risk": 48.0, "overall_risk": 34.0,
            "risk_level": "Moderate Risk", "assigned_specialist": "Nephrologist",
            "assigned_doctor": "Dr. Alistair Vance (Nephrologist)",
            "follow_up": "Pending", "report_status": "Sent", "days_ago": 25,
            "selected_labs": ["Creatinine", "eGFR", "Urine Albumin"]
        },

        # ── LOW RISK / HEALTHY PATIENTS ──
        {
            "patient_id": "PT-1010", "name": "Suresh Babu", "age": 34, "gender": "Male",
            "height": 178.0, "weight": 72.0, "phone": "+91 98844 33221", "address": "Velachery, Chennai",
            "medical_history": [],
            "bp": "118/76", "hr": 68, "spo2": 99.0, "bmi": 22.7,
            "smoking": "never", "alcohol": "none", "exercise": "high",
            "sleep": 8, "stress": 3, "family_history": [],
            "symptoms": [],
            "diabetes_risk": 8.0, "hypertension_risk": 6.0, "cvd_risk": 7.0,
            "stroke_risk": 4.0, "ckd_risk": 5.0, "overall_risk": 6.0,
            "risk_level": "Low Risk", "assigned_specialist": "None",
            "assigned_doctor": "Nurse Sarah (General Practice)",
            "follow_up": "Routine", "report_status": "Signed", "days_ago": 30,
            "selected_labs": []
        },
        {
            "patient_id": "PT-1011", "name": "Priya Raman", "age": 28, "gender": "Female",
            "height": 164.0, "weight": 56.0, "phone": "+91 90033 44556", "address": "Adyar, Chennai",
            "medical_history": [],
            "bp": "112/72", "hr": 66, "spo2": 99.0, "bmi": 20.8,
            "smoking": "never", "alcohol": "none", "exercise": "high",
            "sleep": 8, "stress": 2, "family_history": [],
            "symptoms": [],
            "diabetes_risk": 5.0, "hypertension_risk": 4.0, "cvd_risk": 5.0,
            "stroke_risk": 3.0, "ckd_risk": 3.0, "overall_risk": 4.0,
            "risk_level": "Low Risk", "assigned_specialist": "None",
            "assigned_doctor": "Nurse Sarah (General Practice)",
            "follow_up": "Routine", "report_status": "Signed", "days_ago": 35,
            "selected_labs": []
        },
        {
            "patient_id": "PT-1012", "name": "Arun Krishnan", "age": 42, "gender": "Male",
            "height": 170.0, "weight": 68.0, "phone": "+91 98765 11234", "address": "T. Nagar, Chennai",
            "medical_history": [],
            "bp": "120/78", "hr": 72, "spo2": 98.0, "bmi": 23.5,
            "smoking": "never", "alcohol": "occasional", "exercise": "moderate",
            "sleep": 7, "stress": 4, "family_history": [],
            "symptoms": [],
            "diabetes_risk": 12.0, "hypertension_risk": 10.0, "cvd_risk": 14.0,
            "stroke_risk": 8.0, "ckd_risk": 6.0, "overall_risk": 10.0,
            "risk_level": "Low Risk", "assigned_specialist": "None",
            "assigned_doctor": "Nurse Sarah (General Practice)",
            "follow_up": "Routine", "report_status": "Signed", "days_ago": 40,
            "selected_labs": []
        },
        {
            "patient_id": "PT-1013", "name": "Lakshmi Narayanan", "age": 61, "gender": "Female",
            "height": 160.0, "weight": 65.0, "phone": "+91 98411 22334", "address": "Anna Nagar, Chennai",
            "medical_history": ["Hypothyroidism (controlled)"],
            "bp": "128/82", "hr": 74, "spo2": 97.0, "bmi": 25.4,
            "smoking": "never", "alcohol": "none", "exercise": "moderate",
            "sleep": 7, "stress": 4, "family_history": ["diabetes"],
            "symptoms": [],
            "diabetes_risk": 32.0, "hypertension_risk": 28.0, "cvd_risk": 30.0,
            "stroke_risk": 22.0, "ckd_risk": 15.0, "overall_risk": 26.0,
            "risk_level": "Low Risk", "assigned_specialist": "None",
            "assigned_doctor": "Nurse Sarah (General Practice)",
            "follow_up": "Routine", "report_status": "Signed", "days_ago": 45,
            "selected_labs": []
        },
        {
            "patient_id": "PT-1014", "name": "Mohammed Ashraf", "age": 66, "gender": "Male",
            "height": 172.0, "weight": 79.0, "phone": "+91 99765 43210", "address": "Mylapore, Chennai",
            "medical_history": ["Former Smoker (quit 8 yrs)"],
            "bp": "144/90", "hr": 82, "spo2": 96.0, "bmi": 26.7,
            "smoking": "former", "alcohol": "none", "exercise": "low",
            "sleep": 6, "stress": 5, "family_history": ["hypertension", "heart"],
            "symptoms": ["Breathlessness"],
            "diabetes_risk": 35.0, "hypertension_risk": 58.0, "cvd_risk": 55.0,
            "stroke_risk": 42.0, "ckd_risk": 30.0, "overall_risk": 45.0,
            "risk_level": "Moderate Risk", "assigned_specialist": "Cardiologist",
            "assigned_doctor": "Dr. Rajesh Gupta (Cardiologist)",
            "follow_up": "Completed", "report_status": "Signed", "days_ago": 50,
            "selected_labs": ["ECG", "Lipid Profile", "Stress Test"]
        },
        {
            "patient_id": "PT-1015", "name": "Kavitha Devi", "age": 38, "gender": "Female",
            "height": 160.0, "weight": 62.0, "phone": "+91 94432 88990", "address": "Madurai, Tamil Nadu",
            "medical_history": [],
            "bp": "116/74", "hr": 70, "spo2": 99.0, "bmi": 24.2,
            "smoking": "never", "alcohol": "none", "exercise": "high",
            "sleep": 8, "stress": 3, "family_history": [],
            "symptoms": [],
            "diabetes_risk": 8.0, "hypertension_risk": 5.0, "cvd_risk": 6.0,
            "stroke_risk": 4.0, "ckd_risk": 4.0, "overall_risk": 5.0,
            "risk_level": "Low Risk", "assigned_specialist": "None",
            "assigned_doctor": "Nurse Sarah (General Practice)",
            "follow_up": "Routine", "report_status": "Signed", "days_ago": 55,
            "selected_labs": []
        },
        {
            "patient_id": "PT-1016", "name": "Prakash Reddy", "age": 57, "gender": "Male",
            "height": 166.0, "weight": 90.0, "phone": "+91 98321 55667", "address": "Vizag, Andhra Pradesh",
            "medical_history": ["Obesity", "Sleep Apnea"],
            "bp": "146/92", "hr": 86, "spo2": 95.0, "bmi": 32.6,
            "smoking": "never", "alcohol": "regular", "exercise": "sedentary",
            "sleep": 5, "stress": 7, "family_history": ["diabetes", "hypertension", "heart"],
            "symptoms": ["Fatigue", "Breathlessness", "Chest Pain"],
            "diabetes_risk": 68.0, "hypertension_risk": 72.0, "cvd_risk": 70.0,
            "stroke_risk": 45.0, "ckd_risk": 35.0, "overall_risk": 60.0,
            "risk_level": "High Risk", "assigned_specialist": "Cardiologist",
            "assigned_doctor": "Dr. Rajesh Gupta (Cardiologist)",
            "follow_up": "Pending", "report_status": "Draft", "days_ago": 2,
            "selected_labs": ["ECG", "Lipid Profile", "HbA1c", "Echocardiogram"]
        },
        {
            "patient_id": "PT-1017", "name": "Anita Joshi", "age": 44, "gender": "Female",
            "height": 158.0, "weight": 66.0, "phone": "+91 90123 44556", "address": "Jaipur, Rajasthan",
            "medical_history": ["PCOS"],
            "bp": "124/80", "hr": 74, "spo2": 98.0, "bmi": 26.4,
            "smoking": "never", "alcohol": "none", "exercise": "moderate",
            "sleep": 7, "stress": 5, "family_history": ["diabetes"],
            "symptoms": [],
            "diabetes_risk": 42.0, "hypertension_risk": 22.0, "cvd_risk": 20.0,
            "stroke_risk": 12.0, "ckd_risk": 14.0, "overall_risk": 24.0,
            "risk_level": "Moderate Risk", "assigned_specialist": "Endocrinologist",
            "assigned_doctor": "Dr. Arjun Mehta (Endocrinologist)",
            "follow_up": "Completed", "report_status": "Signed", "days_ago": 18,
            "selected_labs": ["HbA1c", "Fasting Blood Sugar", "OGTT"]
        },
        {
            "patient_id": "PT-1018", "name": "Ravi Kumar", "age": 54, "gender": "Male",
            "height": 168.0, "weight": 74.0, "phone": "+91 98400 12345", "address": "T. Nagar, Chennai",
            "medical_history": ["Mild Dyslipidemia"],
            "bp": "138/86", "hr": 78, "spo2": 97.0, "bmi": 26.2,
            "smoking": "never", "alcohol": "occasional", "exercise": "moderate",
            "sleep": 7, "stress": 5, "family_history": ["hypertension"],
            "symptoms": [],
            "diabetes_risk": 30.0, "hypertension_risk": 44.0, "cvd_risk": 40.0,
            "stroke_risk": 22.0, "ckd_risk": 16.0, "overall_risk": 32.0,
            "risk_level": "Moderate Risk", "assigned_specialist": "Cardiologist",
            "assigned_doctor": "Dr. Rajesh Gupta (Cardiologist)",
            "follow_up": "Completed", "report_status": "Signed", "days_ago": 28,
            "selected_labs": ["Lipid Profile", "ECG"]
        },
    ]

    for pd_item in patients_data:
        patient = models.Patient(
            patient_id=pd_item["patient_id"],
            name=pd_item["name"],
            age=pd_item["age"],
            gender=pd_item["gender"],
            height=pd_item["height"],
            weight=pd_item["weight"],
            phone=pd_item["phone"],
            address=pd_item["address"],
            medical_history=pd_item["medical_history"]
        )
        db.add(patient)
        db.commit()

        screening_date = now - datetime.timedelta(days=pd_item["days_ago"])

        screening = models.Screening(
            patient_id=pd_item["patient_id"],
            blood_pressure=pd_item["bp"],
            heart_rate=pd_item["hr"],
            oxygen_level=pd_item["spo2"],
            bmi=pd_item["bmi"],
            smoking=pd_item["smoking"],
            alcohol=pd_item.get("alcohol", "none"),
            exercise=pd_item.get("exercise", "moderate"),
            sleep=pd_item.get("sleep", 7),
            stress=pd_item.get("stress", 5),
            family_history=pd_item.get("family_history", []),
            symptoms=pd_item.get("symptoms", []),
            screening_date=screening_date,
            follow_up_status=pd_item.get("follow_up", "Pending")
        )

        risk_pred = models.RiskPrediction(
            patient_id=pd_item["patient_id"],
            diabetes_risk=pd_item["diabetes_risk"],
            hypertension_risk=pd_item["hypertension_risk"],
            cvd_risk=pd_item["cvd_risk"],
            stroke_risk=pd_item["stroke_risk"],
            ckd_risk=pd_item["ckd_risk"],
            overall_risk=pd_item["overall_risk"],
            risk_level=pd_item["risk_level"],
            assigned_specialist=pd_item["assigned_specialist"],
            assigned_doctor=pd_item["assigned_doctor"],
            model_version="1.0",
            model_name="HealthSense NCD Screening v1.0",
            model_explanations={
                "Diabetes": [
                    {"name": "BMI", "value": pd_item["bmi"], "contribution": min(30, max(0, (pd_item["bmi"] - 22) * 4))},
                    {"name": "Age", "value": pd_item["age"], "contribution": min(25, max(0, (pd_item["age"] - 30) * 0.8))},
                    {"name": "Blood Pressure", "value": pd_item["bp"], "contribution": min(20, max(0, float(pd_item["bp"].split("/")[0]) - 120) * 0.8)},
                ],
                "Hypertension": [
                    {"name": "Systolic BP", "value": float(pd_item["bp"].split("/")[0]), "contribution": min(40, max(0, (float(pd_item["bp"].split("/")[0]) - 110) * 1.2))},
                    {"name": "Diastolic BP", "value": float(pd_item["bp"].split("/")[1]), "contribution": min(30, max(0, (float(pd_item["bp"].split("/")[1]) - 70) * 1.5))},
                    {"name": "Heart Rate", "value": pd_item["hr"], "contribution": min(15, max(0, (pd_item["hr"] - 70) * 0.8))},
                ],
                "CVD": [
                    {"name": "Age", "value": pd_item["age"], "contribution": min(25, max(0, (pd_item["age"] - 35) * 0.9))},
                    {"name": "Systolic BP", "value": float(pd_item["bp"].split("/")[0]), "contribution": min(30, max(0, (float(pd_item["bp"].split("/")[0]) - 120) * 1.0))},
                    {"name": "BMI", "value": pd_item["bmi"], "contribution": min(20, max(0, (pd_item["bmi"] - 24) * 3))},
                ],
                "Stroke": [
                    {"name": "Age", "value": pd_item["age"], "contribution": min(30, max(0, (pd_item["age"] - 40) * 1.0))},
                    {"name": "Systolic BP", "value": float(pd_item["bp"].split("/")[0]), "contribution": min(35, max(0, (float(pd_item["bp"].split("/")[0]) - 120) * 1.2))},
                    {"name": "Heart Rate", "value": pd_item["hr"], "contribution": min(15, max(0, (pd_item["hr"] - 72) * 0.6))},
                ],
                "CKD": [
                    {"name": "Age", "value": pd_item["age"], "contribution": min(25, max(0, (pd_item["age"] - 40) * 0.7))},
                    {"name": "Systolic BP", "value": float(pd_item["bp"].split("/")[0]), "contribution": min(25, max(0, (float(pd_item["bp"].split("/")[0]) - 120) * 0.9))},
                    {"name": "BMI", "value": pd_item["bmi"], "contribution": min(20, max(0, (pd_item["bmi"] - 24) * 2.5))},
                ],
            }
        )

        review_status = "Reviewed" if pd_item["report_status"] in ["Signed", "Sent"] else "Pending"
        review = models.DoctorReview(
            patient_id=pd_item["patient_id"],
            remarks="Clinical screening reviewed. Diagnostic lab test requisition issued." if review_status == "Reviewed" else "",
            selected_lab_tests=pd_item["selected_labs"],
            status=review_status,
            report_status=pd_item["report_status"],
            review_date=screening_date
        )

        db.add_all([screening, risk_pred, review])

    db.commit()
    db.close()
    print(f"Database seeding completed! ({len(patients_data)} patients)")

if __name__ == "__main__":
    seed_database()
