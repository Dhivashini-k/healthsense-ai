import datetime
from database import engine, SessionLocal, Base
import models, auth

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Check if database is already seeded
    if db.query(models.User).filter(models.User.email == "endocrinologist@healthsense.ai").first():
        db.close()
        return

    print("Seeding HealthSense AI Database for 6 Roles...")

    # 1. Create 6 User Roles
    users_to_create = [
        models.User(name="Nurse Sarah Jenkins", email="nurse@healthsense.ai", password_hash=auth.get_password_hash("nurse123"), role="nurse"),
        models.User(name="Dr. Arjun Mehta (Endocrinologist)", email="endocrinologist@healthsense.ai", password_hash=auth.get_password_hash("doc123"), role="endocrinologist"),
        models.User(name="Dr. Rajesh Gupta (Cardiologist)", email="cardiologist@healthsense.ai", password_hash=auth.get_password_hash("doc123"), role="cardiologist"),
        models.User(name="Dr. Robert Chen (Neurologist)", email="neurologist@healthsense.ai", password_hash=auth.get_password_hash("doc123"), role="neurologist"),
        models.User(name="Dr. Alistair Vance (Nephrologist)", email="nephrologist@healthsense.ai", password_hash=auth.get_password_hash("doc123"), role="nephrologist"),
        models.User(name="Super Hospital Admin", email="admin@healthsense.ai", password_hash=auth.get_password_hash("admin123"), role="super_admin"),
    ]
    db.add_all(users_to_create)
    db.commit()

    # 2. Patients & Clinical Screening Records
    patients_data = [
        {
            "patient_id": "PT-1256",
            "name": "Ramesh Verma",
            "age": 58,
            "gender": "Male",
            "height": 168.0,
            "weight": 82.0,
            "phone": "+91 98765 43210",
            "address": "Mumbai, Maharashtra",
            "medical_history": ["Hypertension (5 yrs)", "Borderline HbA1c (7.1%)"],
            "diabetes_risk": 78.0,
            "hypertension_risk": 58.0,
            "cvd_risk": 64.0,
            "stroke_risk": 35.0,
            "ckd_risk": 42.0,
            "overall_risk": 78.0,
            "risk_level": "High Risk",
            "assigned_specialist": "Endocrinologist",
            "assigned_doctor": "Dr. Arjun Mehta (Endocrinologist)",
            "bp": "146/92",
            "hr": 80,
            "spo2": 96.0,
            "bmi": 29.1,
            "report_status": "Draft",
            "selected_labs": ["HbA1c", "Fasting Blood Sugar"]
        },
        {
            "patient_id": "PT-1257",
            "name": "Sunita Sharma",
            "age": 62,
            "gender": "Female",
            "height": 160.0,
            "weight": 76.0,
            "phone": "+91 98765 12345",
            "address": "New Delhi, Delhi",
            "medical_history": ["Hyperlipidemia", "Paternal Heart Attack"],
            "diabetes_risk": 45.0,
            "hypertension_risk": 88.0,
            "cvd_risk": 84.0,
            "stroke_risk": 72.0,
            "ckd_risk": 50.0,
            "overall_risk": 84.0,
            "risk_level": "High Risk",
            "assigned_specialist": "Cardiologist",
            "assigned_doctor": "Dr. Rajesh Gupta (Cardiologist)",
            "bp": "154/96",
            "hr": 84,
            "spo2": 95.0,
            "bmi": 29.7,
            "report_status": "Signed",
            "selected_labs": ["ECG", "Lipid Profile", "Echocardiogram"]
        },
        {
            "patient_id": "PT-1258",
            "name": "Amit Kumar",
            "age": 45,
            "gender": "Male",
            "height": 174.0,
            "weight": 78.0,
            "phone": "+91 98123 45678",
            "address": "Bangalore, Karnataka",
            "medical_history": ["High Stress Desk Job"],
            "diabetes_risk": 32.0,
            "hypertension_risk": 48.0,
            "cvd_risk": 42.0,
            "stroke_risk": 24.0,
            "ckd_risk": 28.0,
            "overall_risk": 48.0,
            "risk_level": "Moderate Risk",
            "assigned_specialist": "Cardiologist",
            "assigned_doctor": "Dr. Rajesh Gupta (Cardiologist)",
            "bp": "136/86",
            "hr": 74,
            "spo2": 98.0,
            "bmi": 25.8,
            "report_status": "Sent",
            "selected_labs": ["ECG"]
        },
        {
            "patient_id": "PT-1259",
            "name": "Neha Patel",
            "age": 37,
            "gender": "Female",
            "height": 162.0,
            "weight": 71.0,
            "phone": "+91 97654 32109",
            "address": "Ahmedabad, Gujarat",
            "medical_history": ["Gestational Diabetes"],
            "diabetes_risk": 68.0,
            "hypertension_risk": 64.0,
            "cvd_risk": 52.0,
            "stroke_risk": 30.0,
            "ckd_risk": 72.0,
            "overall_risk": 72.0,
            "risk_level": "High Risk",
            "assigned_specialist": "Nephrologist",
            "assigned_doctor": "Dr. Alistair Vance (Nephrologist)",
            "bp": "142/90",
            "hr": 78,
            "spo2": 97.0,
            "bmi": 27.1,
            "report_status": "Sent",
            "selected_labs": ["Creatinine", "Urine Albumin", "eGFR"]
        },
        {
            "patient_id": "PT-1260",
            "name": "Sanjay Singh",
            "age": 63,
            "gender": "Male",
            "height": 172.0,
            "weight": 80.0,
            "phone": "+91 99887 76655",
            "address": "Kolkata, West Bengal",
            "medical_history": ["Smoking History (15 yrs)"],
            "diabetes_risk": 40.0,
            "hypertension_risk": 60.0,
            "cvd_risk": 54.0,
            "stroke_risk": 52.0,
            "ckd_risk": 34.0,
            "overall_risk": 52.0,
            "risk_level": "Moderate Risk",
            "assigned_specialist": "Neurologist",
            "assigned_doctor": "Dr. Robert Chen (Neurologist)",
            "bp": "138/88",
            "hr": 76,
            "spo2": 96.0,
            "bmi": 27.0,
            "report_status": "Signed",
            "selected_labs": ["MRI", "CT Scan"]
        }
    ]

    for pd in patients_data:
        patient = models.Patient(
            patient_id=pd["patient_id"],
            name=pd["name"],
            age=pd["age"],
            gender=pd["gender"],
            height=pd["height"],
            weight=pd["weight"],
            phone=pd["phone"],
            address=pd["address"],
            medical_history=pd["medical_history"]
        )
        db.add(patient)
        db.commit()

        screening = models.Screening(
            patient_id=pd["patient_id"],
            blood_pressure=pd["bp"],
            heart_rate=pd["hr"],
            oxygen_level=pd["spo2"],
            bmi=pd["bmi"],
            smoking="former" if pd["age"] > 50 else "never",
            alcohol="none",
            exercise="moderate",
            sleep=7,
            stress=6,
            family_history=["diabetes"],
            symptoms=["Fatigue", "Frequent Urination", "Chest Pain"],
            ecg_image_url="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=300&q=80",
            retinal_scan_url="https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=300&q=80"
        )

        risk_pred = models.RiskPrediction(
            patient_id=pd["patient_id"],
            diabetes_risk=pd["diabetes_risk"],
            hypertension_risk=pd["hypertension_risk"],
            cvd_risk=pd["cvd_risk"],
            stroke_risk=pd["stroke_risk"],
            ckd_risk=pd["ckd_risk"],
            overall_risk=pd["overall_risk"],
            risk_level=pd["risk_level"],
            assigned_specialist=pd["assigned_specialist"],
            assigned_doctor=pd["assigned_doctor"]
        )

        review = models.DoctorReview(
            patient_id=pd["patient_id"],
            remarks="Clinical screening reviewed. Diagnostic lab test requisition issued.",
            selected_lab_tests=pd["selected_labs"],
            status="Reviewed" if pd["report_status"] == "Signed" else "Pending",
            report_status=pd["report_status"]
        )

        db.add_all([screening, risk_pred, review])

    db.commit()
    db.close()
    print("Database seeding completed!")

if __name__ == "__main__":
    seed_database()
