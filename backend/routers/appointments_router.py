import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import auth, models, schemas

router = APIRouter(prefix="/api/appointments", tags=["Appointments"])

@router.get("")
def get_appointments(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    apts = db.query(models.Appointment).all()
    results = []
    for a in apts:
        patient = db.query(models.Patient).filter(models.Patient.patient_id == a.patient_id).first()
        results.append({
            "id": a.id,
            "patient_id": a.patient_id,
            "patient_name": patient.name if patient else "Unknown Patient",
            "appointment_date": a.appointment_date,
            "status": a.status
        })
    return results

@router.post("")
def book_appointment(apt_data: schemas.AppointmentCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    try:
        dt = datetime.datetime.fromisoformat(apt_data.appointment_date)
    except Exception:
        dt = datetime.datetime.utcnow() + datetime.timedelta(days=3)

    new_apt = models.Appointment(
        patient_id=apt_data.patient_id,
        doctor_id=apt_data.doctor_id,
        appointment_date=dt,
        status=apt_data.status or "Confirmed"
    )
    db.add(new_apt)
    db.commit()
    db.refresh(new_apt)
    return new_apt

@router.put("/{id}")
def update_appointment(id: int, update_data: dict, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    apt = db.query(models.Appointment).filter(models.Appointment.id == id).first()
    if not apt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    if "status" in update_data:
        apt.status = update_data["status"]
    
    db.commit()
    db.refresh(apt)
    return apt
