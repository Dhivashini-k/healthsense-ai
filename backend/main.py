from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from seed import seed_database

from routers import (
    auth_router,
    dashboard_router,
    patients_router,
    screenings_router,
    analytics_router,
    reviews_router,
    appointments_router,
    chatbot_router,
    reports_router,
    ckd_router,
    ncd_ml_router
)

app = FastAPI(
    title="HealthSense AI Backend API & Machine Learning Suite",
    description="FastAPI Backend for Non-Communicable Disease (NCD) Early Screening & Trained ML Risk Models (Stroke, Diabetes, Hypertension, CVD, CKD)",
    version="1.0.0"
)

# Enable CORS for React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include All Routers
app.include_router(auth_router.router)
app.include_router(dashboard_router.router)
app.include_router(patients_router.router)
app.include_router(screenings_router.router)
app.include_router(analytics_router.router)
app.include_router(reviews_router.router)
app.include_router(appointments_router.router)
app.include_router(chatbot_router.router)
app.include_router(reports_router.router)
app.include_router(ckd_router.router)
app.include_router(ncd_ml_router.router)

@app.on_event("startup")
def startup_event():
    seed_database()

@app.get("/")
def root():
    return {
        "message": "HealthSense AI Backend API & ML Models Suite are operational",
        "docs_url": "/docs",
        "models": ["Stroke XGBoost", "Hypertension CatBoost/XGB", "CKD Classifier", "Diabetes Retinopathy"],
        "status": "Healthy"
    }
