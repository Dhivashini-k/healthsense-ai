import random
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import auth, models, schemas

router = APIRouter(prefix="/api/patients", tags=["Patients"])

@router.get("")
def get_all_patients(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    patients = db.query(models.Patient).all()
    result = []
    for p in patients:
        pred = db.query(models.RiskPrediction).filter(models.RiskPrediction.patient_id == p.patient_id).first()
        scr = db.query(models.Screening).filter(models.Screening.patient_id == p.patient_id).first()
        review = db.query(models.DoctorReview).filter(models.DoctorReview.patient_id == p.patient_id).first()

        result.append({
            "id": p.patient_id,
            "db_id": p.id,
            "name": p.name,
            "age": p.age,
            "gender": p.gender,
            "height": p.height,
            "weight": p.weight,
            "phone": p.phone or "+91 98765 43210",
            "address": p.address,
            "medical_history": p.medical_history or [],
            "created_at": p.created_at,
            "overall_risk": pred.overall_risk if pred else 50.0,
            "risk_level": pred.risk_level if pred else "Moderate Risk",
            "primary_risk": "Diabetes" if (pred and pred.diabetes_risk > 50) else "Heart Disease" if (pred and pred.cvd_risk > 50) else "Hypertension",
            "assigned_specialist": pred.assigned_specialist if pred else "Endocrinologist",
            "assigned_doctor": pred.assigned_doctor if pred else "Dr. Arjun Mehta (Endocrinologist)",
            "blood_pressure": scr.blood_pressure if scr else "120/80",
            "ecg_image_url": scr.ecg_image_url if scr else None,
            "retinal_scan_url": scr.retinal_scan_url if scr else None,
            "doctor_review_status": review.status if review else "Pending",
            "report_status": review.report_status if review else "Draft",
            "selected_lab_tests": review.selected_lab_tests if review else [],
            "risk_breakdown": {
                "diabetes": pred.diabetes_risk if pred else 34,
                "hypertension": pred.hypertension_risk if pred else 20,
                "cvd": pred.cvd_risk if pred else 24,
                "stroke": pred.stroke_risk if pred else 10,
                "ckd": pred.ckd_risk if pred else 12
            }
        })
    return result

@router.post("", response_model=schemas.PatientResponse)
def create_patient(patient_data: schemas.PatientCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    patient_id = patient_data.patient_id or f"PT-{random.randint(1200, 9999)}"
    db_patient = models.Patient(
        patient_id=patient_id,
        name=patient_data.name,
        age=patient_data.age,
        gender=patient_data.gender,
        height=patient_data.height,
        weight=patient_data.weight,
        phone=patient_data.phone,
        address=patient_data.address,
        medical_history=patient_data.medical_history
    )
    db.add(db_patient)
    db.commit()
    db.refresh(db_patient)
    return db_patient

@router.get("/{id}")
def get_patient(id: str, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    patient = db.query(models.Patient).filter((models.Patient.patient_id == id) | (models.Patient.id == id)).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    pred = db.query(models.RiskPrediction).filter(models.RiskPrediction.patient_id == patient.patient_id).first()
    scr = db.query(models.Screening).filter(models.Screening.patient_id == patient.patient_id).first()
    review = db.query(models.DoctorReview).filter(models.DoctorReview.patient_id == patient.patient_id).first()
    
    return {
        "patient": patient,
        "risk_prediction": pred,
        "screening": scr,
        "review": review
    }
