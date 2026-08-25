from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from database import get_db
import auth, models
from services.pdf_generator import generate_pdf_report

router = APIRouter(prefix="/api/reports", tags=["PDF Reports"])

@router.get("/{patient_id}")
def get_pdf_report(patient_id: str, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    patient = db.query(models.Patient).filter((models.Patient.patient_id == patient_id) | (models.Patient.id == patient_id)).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    screening = db.query(models.Screening).filter(models.Screening.patient_id == patient.patient_id).first()
    risk_pred = db.query(models.RiskPrediction).filter(models.RiskPrediction.patient_id == patient.patient_id).first()
    review = db.query(models.DoctorReview).filter(models.DoctorReview.patient_id == patient.patient_id).first()

    pdf_bytes = generate_pdf_report(patient, screening, risk_pred, review)
    
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename=HealthSense_Report_{patient.patient_id}.pdf"}
    )
