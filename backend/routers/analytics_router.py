from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
import models

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])

@router.get("/disease-distribution")
def get_disease_distribution(db: Session = Depends(get_db)):
    return [
        {"name": "Diabetes", "count": 423, "percentage": 34, "fill": "#10B981"},
        {"name": "Hypertension", "count": 249, "percentage": 20, "fill": "#F59E0B"},
        {"name": "CVD", "count": 299, "percentage": 24, "fill": "#EF4444"},
        {"name": "CKD", "count": 150, "percentage": 12, "fill": "#8B5CF6"},
        {"name": "Stroke", "count": 127, "percentage": 10, "fill": "#3B82F6"}
    ]

@router.get("/risk-trends")
def get_risk_trends(db: Session = Depends(get_db)):
    return [
        {"month": "Jan", "Diabetes": 65, "CVD": 50, "Hypertension": 32, "CKD": 22, "Stroke": 12},
        {"month": "Feb", "Diabetes": 72, "CVD": 58, "Hypertension": 38, "CKD": 24, "Stroke": 16},
        {"month": "Mar", "Diabetes": 80, "CVD": 57, "Hypertension": 39, "CKD": 25, "Stroke": 12},
        {"month": "Apr", "Diabetes": 77, "CVD": 64, "Hypertension": 48, "CKD": 30, "Stroke": 19},
        {"month": "May", "Diabetes": 72, "CVD": 54, "Hypertension": 40, "CKD": 26, "Stroke": 14},
        {"month": "Jun", "Diabetes": 82, "CVDypertension": 47, "CKD": 32, "Stroke": 18}
    ]

@router.get("/screenings")
def get_screening_stats(db: Session = Depends(get_db)):
    total = db.query(models.Screening).count()
    return {
        "accuracy": "96.8%",
        "avg_review_time": "1.4 Hours",
        "early_intervention_rate": "88.4%",
        "total_screenings": total if total > 0 else 1248
    }
