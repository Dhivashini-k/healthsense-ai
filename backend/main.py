import sys
import os
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

# Ensure backend dir is on sys.path for rag imports
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

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
    # Attempt RAG ingestion on startup (non-blocking)
    try:
        from services.chatbot import ensure_rag_ingested
        ensure_rag_ingested()
        print("[startup] RAG knowledge base ingestion triggered")
    except Exception as e:
        print(f"[startup] RAG ingestion skipped: {e}")

@app.get("/")
def root():
    return {
        "message": "HealthSense AI Backend API & ML Models Suite are operational",
        "docs_url": "/docs",
        "models": ["Stroke XGBoost", "Hypertension CatBoost/XGB", "CKD Classifier", "Diabetes Clinical", "CVD Framingham"],
        "status": "Healthy"
    }

@app.get("/health")
def health_check():
    """Health check endpoint for the chatbot frontend."""
    rag_status = "unknown"
    try:
        from services.chatbot import _RAG_READY, _RAG_INGESTED
        if _RAG_READY and _RAG_INGESTED:
            rag_status = "active"
        elif _RAG_READY:
            rag_status = "ready"
        else:
            rag_status = "fallback"
    except Exception:
        rag_status = "unavailable"

    return {
        "status": "healthy",
        "service": "HealthSense AI",
        "rag_status": rag_status,
        "models": ["CKD", "Stroke", "Hypertension", "Diabetes", "CVD"]
    }

# ── Assistant Chat Endpoint (for Chatbot.jsx frontend) ────────────────────
from pydantic import BaseModel
from typing import Optional, List

class AssistantChatRequest(BaseModel):
    role: Optional[str] = "Nurse"
    messages: Optional[List[dict]] = []
    system_context: Optional[str] = ""
    risk_profile: Optional[dict] = {}

@app.post("/assistant/chat")
def assistant_chat(req: AssistantChatRequest):
    """
    RAG-powered assistant chat endpoint.
    Matches the frontend Chatbot.jsx expected API format.
    """
    from services.chatbot import generate_chatbot_response, get_rag_chunks

    # Extract the last user message and the preceding user query for follow-up context
    user_msg = ""
    last_user_query = ""
    
    for m in reversed(req.messages):
        if m.get("role") == "user":
            if not user_msg:
                user_msg = m.get("text", m.get("content", ""))
            else:
                last_user_query = m.get("text", m.get("content", ""))
                break
    
    if not user_msg:
        user_msg = "Hello"

    # Use combined search term if it is a short follow-up query (e.g. "Why?")
    search_query = user_msg
    is_follow_up = last_user_query and (len(user_msg) <= 15 or any(kw in user_msg.lower() for kw in ["why", "how", "what", "which", "factor", "explain"]))
    if is_follow_up:
        search_query = f"{last_user_query} {user_msg}"

    # Compile the last 8 messages as conversation history context
    history_context = ""
    for m in req.messages[-8:]:
        role_label = "User" if m.get("role") == "user" else "Health Hero"
        text = m.get("text", m.get("content", ""))
        history_context += f"{role_label}: {text}\n"

    response_text = generate_chatbot_response(user_msg, risk_profile=req.risk_profile, history_context=history_context)
    chunks = get_rag_chunks(search_query, risk_profile=req.risk_profile)

    return {
        "text": response_text,
        "response": response_text,
        "chunks": chunks,
        "rag_active": len(chunks) > 0,
        "role": "assistant"
    }
