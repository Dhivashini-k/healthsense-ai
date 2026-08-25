from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import auth, models, schemas
from services.ai_model import predict_ncd_risks, calculate_bmi

router = APIRouter(prefix="/api", tags=["Screenings & AI Prediction"])

@router.post("/screenings")
def create_screening(screening_data: schemas.ScreeningCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    patient = db.query(models.Patient).filter(models.Patient.patient_id == screening_data.patient_id).first()
    if not patient:
        # Create default patient if not found
        patient = models.Patient(
            patient_id=screening_data.patient_id,
            name="New Screening Patient",
            age=45,
            gender="Male",
            height=170.0,
            weight=75.0,
            phone="+91 98765 00000"
        )
        db.add(patient)
        db.commit()
        db.refresh(patient)

    computed_bmi = screening_data.bmi or calculate_bmi(patient.height, patient.weight)

    # 1. Save Screening Record
    new_screening = models.Screening(
        patient_id=patient.patient_id,
        blood_pressure=screening_data.blood_pressure,
        heart_rate=screening_data.heart_rate,
        oxygen_level=screening_data.oxygen_level,
        bmi=computed_bmi,
        smoking=screening_data.smoking,
        alcohol=screening_data.alcohol,
        exercise=screening_data.exercise,
        sleep=screening_data.sleep,
        stress=screening_data.stress,
        family_history=screening_data.family_history,
        symptoms=screening_data.symptoms
    )
    db.add(new_screening)
    db.commit()

    # 2. Automatically Trigger AI Prediction Engine
    risks = predict_ncd_risks(
        age=patient.age,
        gender=patient.gender,
        height=patient.height,
        weight=patient.weight,
        bp_str=screening_data.blood_pressure,
        heart_rate=screening_data.heart_rate,
        oxygen_level=screening_data.oxygen_level,
        smoking=screening_data.smoking or "never",
        alcohol=screening_data.alcohol or "none",
        exercise=screening_data.exercise or "moderate",
        sleep=screening_data.sleep or 7,
        stress=screening_data.stress or 5,
        family_history=screening_data.family_history,
        symptoms=screening_data.symptoms
    )

    # 3. Store or Update Risk Prediction in DB
    existing_pred = db.query(models.RiskPrediction).filter(models.RiskPrediction.patient_id == patient.patient_id).first()
    if existing_pred:
        existing_pred.diabetes_risk = risks["diabetes_risk"]
        existing_pred.cvd_risk = risks["cvd_risk"]
        existing_pred.stroke_risk = risks["stroke_risk"]
        existing_pred.hypertension_risk = risks["hypertension_risk"]
        existing_pred.ckd_risk = risks["ckd_risk"]
        existing_pred.overall_risk = risks["overall_risk"]
        existing_pred.risk_level = risks["risk_level"]
        existing_pred.assigned_specialist = risks.get("assigned_specialist")
        existing_pred.assigned_doctor = risks.get("assigned_doctor")
    else:
        new_pred = models.RiskPrediction(
            patient_id=patient.patient_id,
            diabetes_risk=risks["diabetes_risk"],
            cvd_risk=risks["cvd_risk"],
            stroke_risk=risks["stroke_risk"],
            hypertension_risk=risks["hypertension_risk"],
            ckd_risk=risks["ckd_risk"],
            overall_risk=risks["overall_risk"],
            risk_level=risks["risk_level"],
            assigned_specialist=risks.get("assigned_specialist"),
            assigned_doctor=risks.get("assigned_doctor")
        )
        db.add(new_pred)

    db.commit()

    return {
        "message": "Screening and AI Risk Prediction saved successfully",
        "patient_id": patient.patient_id,
        "prediction": risks
    }

@router.post("/predict-risk")
def predict_risk_endpoint(payload: dict):
    # Standalone risk prediction
    age = payload.get("age", 45)
    gender = payload.get("gender", "Male")
    height = payload.get("height", 170.0)
    weight = payload.get("weight", 75.0)
    bp = payload.get("blood_pressure", "120/80")
    hr = payload.get("heart_rate", 72)
    spo2 = payload.get("oxygen_level", 98.0)

    risks = predict_ncd_risks(
        age=age,
        gender=gender,
        height=height,
        weight=weight,
        bp_str=bp,
        heart_rate=hr,
        oxygen_level=spo2,
        smoking=payload.get("smoking", "never"),
        alcohol=payload.get("alcohol", "none"),
        exercise=payload.get("exercise", "moderate"),
        sleep=payload.get("sleep", 7),
        stress=payload.get("stress", 5),
        family_history=payload.get("family_history", []),
        symptoms=payload.get("symptoms", [])
    )

    return {
        "diabetes_risk": risks["diabetes_risk"],
        "cvd_risk": risks["cvd_risk"],
        "stroke_risk": risks["stroke_risk"],
        "hypertension_risk": risks["hypertension_risk"],
        "ckd_risk": risks["ckd_risk"],
        "overall_risk": risks["overall_risk"],
        "risk_level": risks["risk_level"],
        "assigned_specialist": risks.get("assigned_specialist"),
        "assigned_doctor": risks.get("assigned_doctor")
    }
