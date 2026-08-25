from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import auth, models, schemas

router = APIRouter(prefix="/api/reviews", tags=["Doctor Reviews"])

@router.get("/pending")
def get_pending_reviews(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    reviews = db.query(models.DoctorReview).all()
    results = []
    for r in reviews:
        patient = db.query(models.Patient).filter(models.Patient.patient_id == r.patient_id).first()
        pred = db.query(models.RiskPrediction).filter(models.RiskPrediction.patient_id == r.patient_id).first()
        results.append({
            "review_id": r.id,
            "patient_id": r.patient_id,
            "patient_name": patient.name if patient else "Unknown",
            "remarks": r.remarks,
            "selected_lab_tests": r.selected_lab_tests or [],
            "status": r.status,
            "report_status": r.report_status or "Draft",
            "review_date": r.review_date,
            "overall_risk": pred.overall_risk if pred else 75.0,
            "risk_level": pred.risk_level if pred else "High Risk",
            "assigned_specialist": pred.assigned_specialist if pred else "Endocrinologist"
        })
    return results

@router.post("")
def add_doctor_review(review_data: schemas.DoctorReviewCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_review = db.query(models.DoctorReview).filter(models.DoctorReview.patient_id == review_data.patient_id).first()
    if db_review:
        db_review.remarks = review_data.remarks
        db_review.selected_lab_tests = review_data.selected_lab_tests
        db_review.status = review_data.status or "Reviewed"
        db_review.report_status = review_data.report_status or "Signed"
    else:
        db_review = models.DoctorReview(
            patient_id=review_data.patient_id,
            doctor_id=review_data.doctor_id,
            remarks=review_data.remarks,
            selected_lab_tests=review_data.selected_lab_tests,
            status=review_data.status or "Reviewed",
            report_status=review_data.report_status or "Signed"
        )
        db.add(db_review)
    
    db.commit()
    db.refresh(db_review)
    return db_review

@router.put("/{patient_id}/sign")
def sign_report(patient_id: str, payload: dict, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    review = db.query(models.DoctorReview).filter(models.DoctorReview.patient_id == patient_id).first()
    if not review:
        review = models.DoctorReview(
            patient_id=patient_id,
            remarks=payload.get("remarks", "Approved & Signed by Specialist Doctor."),
            selected_lab_tests=payload.get("selected_lab_tests", []),
            status="Reviewed",
            report_status="Signed"
        )
        db.add(review)
    else:
        review.report_status = "Signed"
        review.status = "Reviewed"
        if "remarks" in payload:
            review.remarks = payload["remarks"]
        if "selected_lab_tests" in payload:
            review.selected_lab_tests = payload["selected_lab_tests"]

    db.commit()
    return {"message": "Report approved and signed successfully", "patient_id": patient_id, "report_status": "Signed"}

@router.post("/{patient_id}/reminder")
def send_doctor_reminder(patient_id: str, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    review = db.query(models.DoctorReview).filter(models.DoctorReview.patient_id == patient_id).first()
    if review and review.report_status == "Draft":
        review.report_status = "Sent"
        db.commit()
    return {"message": "Reminder notification sent to Specialist Doctor", "patient_id": patient_id}
