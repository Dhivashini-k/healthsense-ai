"""
HealthSense AI Chatbot Service — RAG-powered with Gemini API enhancement.

Provides intelligent health responses by:
1. Detecting user intent (diet, exercise, risk explanation, etc.)
2. Retrieving relevant knowledge base chunks via RAG semantic search
3. Optionally synthesizing with Gemini API for natural language fluency
4. Falling back to keyword-based clinical responses if RAG unavailable
"""

import os
import re
import sys
import requests

# Ensure backend dir is on path for rag imports
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# ── RAG availability check ───────────────────────────────────────────────
_RAG_READY = False
_rag_retrieve = None
_rag_ingest = None

def _init_rag():
    """Attempt to initialize the RAG pipeline."""
    global _RAG_READY, _rag_retrieve, _rag_ingest
    try:
        from rag import retrieve, ingest, _RAG_AVAILABLE
        if _RAG_AVAILABLE and retrieve is not None:
            _rag_retrieve = retrieve
            _rag_ingest = ingest
            _RAG_READY = True
            print("[chatbot] RAG pipeline available")
        else:
            print("[chatbot] RAG module loaded but retriever not available")
    except Exception as e:
        print(f"[chatbot] RAG not available, using fallback: {e}")

_init_rag()

_RAG_INGESTED = False

def ensure_rag_ingested():
    """Run RAG ingestion once if not already done."""
    global _RAG_INGESTED
    if _RAG_READY and not _RAG_INGESTED and _rag_ingest:
        try:
            print("[chatbot] Running RAG knowledge base ingestion...")
            _rag_ingest()
            _RAG_INGESTED = True
            print("[chatbot] RAG ingestion complete")
        except Exception as e:
            print(f"[chatbot] RAG ingestion failed: {e}")


# ── Intent Detection ─────────────────────────────────────────────────────

def detect_intent(message: str) -> str:
    """Detect the user's intent from their message."""
    msg = message.lower()
    
    if re.search(r'eat|food|diet|meal|sodium|nutrition|snack|cook|recipe|fruit|vegetable', msg):
        return 'diet_guidance'
    if re.search(r'exercise|walk|run|gym|active|sport|yoga|swim|workout|fitness', msg):
        return 'exercise_guidance'
    if re.search(r'sleep|insomnia|rest|nap|tired|fatigue', msg):
        return 'sleep_guidance'
    if re.search(r'smok|tobacco|cigarette|nicotine|vape', msg):
        return 'smoking_cessation'
    if re.search(r'weight|obes|bmi|overweight|fat|slim|thin', msg):
        return 'weight_management'
    if re.search(r'stress|anxiety|mental|depress|relax|meditat', msg):
        return 'stress_management'
    if re.search(r'risk|score|predict|chance|percent|result|screen', msg):
        return 'risk_explanation'
    if re.search(r'appointment|book|schedule|visit|doctor|specialist', msg):
        return 'appointment_booking'
    if re.search(r'kidney|ckd|renal|creatinine|egfr', msg):
        return 'ckd_guidance'
    if re.search(r'heart|cardio|cvd|chest|cholesterol|lipid', msg):
        return 'cvd_guidance'
    if re.search(r'stroke|brain|paralysis|fast|tia', msg):
        return 'stroke_guidance'
    if re.search(r'diabetes|sugar|glucose|insulin|hba1c|a1c', msg):
        return 'diabetes_guidance'
    if re.search(r'pressure|hypertension|bp|systolic|diastolic', msg):
        return 'hypertension_guidance'
    
    return 'general_health'


# ── RAG-Powered Response Generation ──────────────────────────────────────

def _format_rag_response(question: str, intent: str, chunks: list) -> str:
    """Format RAG-retrieved chunks into a coherent clinical response."""
    if not chunks:
        return _get_fallback_response(question)
    
    # Group chunks by condition
    condition_texts = {}
    for chunk in chunks[:5]:  # Use top 5 chunks
        condition = chunk.metadata.get("condition", "general")
        section = chunk.metadata.get("section_title", "")
        if condition not in condition_texts:
            condition_texts[condition] = []
        condition_texts[condition].append({
            "section": section,
            "text": chunk.text,
            "score": chunk.boosted_score
        })
    
    # Build response
    parts = []
    
    # Add topic header based on intent
    intent_headers = {
        'diet_guidance': "**Dietary Guidance & Clinical Nutrition Protocol:**",
        'exercise_guidance': "**Exercise & Physical Activity Recommendations:**",
        'sleep_guidance': "**Sleep & Recovery Guidelines:**",
        'smoking_cessation': "**Smoking Cessation & Tobacco Risk:**",
        'weight_management': "**Weight Management Protocol:**",
        'risk_explanation': "**NCD Risk Profile & Clinical Assessment:**",
        'diabetes_guidance': "**Diabetes Risk Management:**",
        'hypertension_guidance': "**Blood Pressure & Hypertension Management:**",
        'cvd_guidance': "**Cardiovascular Disease Prevention:**",
        'stroke_guidance': "**Stroke Risk Prevention & F.A.S.T. Protocol:**",
        'ckd_guidance': "**Chronic Kidney Disease Management:**",
        'stress_management': "**Stress Management & Mental Wellness:**",
    }
    header = intent_headers.get(intent, "**Health Guidance based on Clinical Knowledge Base:**")
    parts.append(header)
    parts.append("")
    
    # Add key points from retrieved chunks
    for condition, items in condition_texts.items():
        cond_label = condition.upper() if condition != "general" else "GENERAL HEALTH"
        for item in items[:2]:
            # Clean and truncate text
            text = item["text"].strip()
            # Split into bullet points if text contains list items
            lines = text.split("\n")
            for line in lines[:3]:
                line = line.strip().lstrip("- •")
                if line and len(line) > 10:
                    parts.append(f"• **[{cond_label}]** {line}")
    
    # Add safety disclaimer
    parts.append("")
    parts.append("_This guidance is based on WHO, AHA, and clinical NCD management guidelines. Always consult your healthcare provider for personalized medical advice._")
    
    # Add source attribution
    source_conditions = list(condition_texts.keys())
    if source_conditions:
        sources_str = ", ".join(c.upper() for c in source_conditions[:3])
        parts.append(f"\n📚 *Sources: {sources_str} knowledge base*")
    
    return "\n".join(parts)


def _synthesize_with_gemini(question: str, rag_context: str) -> str | None:
    """Use Gemini API to synthesize a natural response from RAG context."""
    if not GEMINI_API_KEY:
        return None
    
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"
        
        system_prompt = (
            "You are Health Hero, a friendly and expert clinical AI assistant for "
            "Non-Communicable Diseases (Diabetes, Heart Disease, Hypertension, Stroke, CKD). "
            "Use ONLY the provided knowledge base context to answer the user's question. "
            "Be conversational, concise (2-3 sentences), clinically accurate, and helpful. "
            "Always recommend consulting a healthcare provider for personalized advice. "
            "Format key points with bullet points (•) and do NOT output raw citations or RAG jargon. "
            "Just provide the helpful answer naturally."
        )
        
        payload = {
            "contents": [{
                "parts": [{
                    "text": f"{system_prompt}\n\n--- KNOWLEDGE BASE CONTEXT ---\n{rag_context}\n--- END CONTEXT ---\n\nUser Question: {question}"
                }]
            }]
        }
        res = requests.post(url, json=payload, timeout=8)
        if res.status_code == 200:
            data = res.json()
            text = data["candidates"][0]["content"]["parts"][0]["text"]
            return text.strip()
    except Exception:
        pass
    return None


# ── Fallback Response Matrix ─────────────────────────────────────────────

def _get_fallback_response(message: str) -> str:
    """Keyword-based clinical fallback when RAG is unavailable."""
    msg = message.lower()
    
    if re.search(r'eat|food|diet|meal|sodium|nutrition', msg):
        if re.search(r'pressure|hypertension|bp', msg):
            return ("**DASH Low Sodium Protocol (Hypertension):**\n\n"
                    "• Restrict daily sodium intake to under 1,500mg\n"
                    "• Increase potassium-rich foods: bananas, spinach, sweet potatoes\n"
                    "• Include whole grains, lean proteins, and low-fat dairy\n"
                    "• Limit processed meats, canned soups, and salty snacks\n\n"
                    "_Source: AHA/WHO Hypertension Dietary Guidelines_")
        elif re.search(r'diabetes|sugar|glucose', msg):
            return ("**Low GI Fiber Protocol (Diabetes):**\n\n"
                    "• Focus on low glycemic index foods: oats, brown rice, lentils\n"
                    "• Aim for 30-35g fiber daily to stabilize postprandial glucose\n"
                    "• Choose non-starchy vegetables and lean proteins\n"
                    "• Limit refined carbohydrates and sugar-sweetened beverages\n\n"
                    "_Source: IDF/ADA Diabetes Nutrition Guidelines_")
        else:
            return ("**Dietary Guidance & Clinical Nutrition Protocol:**\n\n"
                    "• **DASH Protocol:** Restrict sodium < 1,500 mg/day for arterial health\n"
                    "• **Low GI Fiber:** Consume oats, legumes, leafy greens (30-35g fiber/day)\n"
                    "• **Heart-Healthy Fats:** Extra virgin olive oil, walnuts, omega-3 fatty fish\n"
                    "• **Mediterranean Diet:** Shown to reduce CVD risk by up to 30%\n\n"
                    "_Source: WHO/AHA Clinical Nutrition Guidelines_")
    
    elif re.search(r'exercise|walk|run|gym|active|workout', msg):
        return ("**Safe Exercise & Physical Activity Plan:**\n\n"
                "• **Aerobic Workouts:** 150 minutes per week of brisk walking or cycling\n"
                "• **Blood Pressure Benefit:** 30-45 min daily cardio lowers systolic BP by 5-8 mmHg\n"
                "• **Strength Training:** 2 sessions/week with moderate resistance\n"
                "• **Precaution:** Avoid heavy static weightlifting if BP > 140/90 mmHg\n\n"
                "_Source: WHO Physical Activity Guidelines 2020_")
    
    elif re.search(r'diabetes|sugar|glucose|insulin', msg):
        return ("**Diabetes Risk Management:**\n\n"
                "• Fasting glucose > 126 mg/dL or HbA1c > 6.5% indicates diabetes risk\n"
                "• Recommended: Low-GI Mediterranean diet, 150 min/week aerobic exercise\n"
                "• Monitor HbA1c every 3 months if elevated risk detected\n"
                "• Family history and BMI > 25 are significant risk factors\n\n"
                "_Source: IDF Diabetes Atlas / ADA Standards of Care_")
    
    elif re.search(r'heart|cardio|cvd|chest', msg):
        return ("**Cardiovascular Disease Prevention:**\n\n"
                "• Framingham risk score integrates BP, lipid profile, and smoking history\n"
                "• Limit saturated fats to < 7% of daily calories\n"
                "• Target LDL cholesterol < 100 mg/dL for high-risk patients\n"
                "• Regular cardio workouts and stress management are essential\n\n"
                "_Source: AHA/ACC Cardiovascular Guidelines_")
    
    elif re.search(r'pressure|hypertension|bp', msg):
        return ("**Hypertension Management:**\n\n"
                "• Target blood pressure: < 130/80 mmHg (< 120/80 optimal)\n"
                "• Restrict daily sodium intake to < 1,500 mg\n"
                "• DASH diet, stress management, and daily BP logging recommended\n"
                "• Uncontrolled hypertension increases stroke risk 4-6x\n\n"
                "_Source: WHO/AHA Hypertension Guidelines_")
    
    elif re.search(r'stroke|brain|paralysis', msg):
        return ("**Stroke Risk Prevention & F.A.S.T. Protocol:**\n\n"
                "• Primary risk factors: uncontrolled hypertension (> 140 mmHg), smoking\n"
                "• F.A.S.T. warning signs: Face drooping, Arm weakness, Speech difficulty, Time to call emergency\n"
                "• Strict BP control reduces stroke risk by 35-40%\n"
                "• Atrial fibrillation screening recommended for ages 65+\n\n"
                "_Source: WHO Stroke Prevention Guidelines_")
    
    elif re.search(r'kidney|ckd|renal', msg):
        return ("**Chronic Kidney Disease Management:**\n\n"
                "• Unmanaged diabetes and hypertension are the leading CKD causes\n"
                "• Protein intake: moderate to 0.6-0.8 g/kg/day under specialist supervision\n"
                "• Maintain hydration: 2.0-2.5L water daily\n"
                "• Monitor eGFR, creatinine, and urine albumin regularly\n\n"
                "_Source: KDIGO CKD Clinical Practice Guidelines_")
    
    elif re.search(r'appointment|book|schedule|doctor', msg):
        return ("I can help you schedule your specialist screening consultation! "
                "Navigate to the **Appointments** module to pick a date with your assigned specialist. "
                "High-risk patients are prioritized for early appointment slots.")
    
    elif re.search(r'sleep|insomnia|tired|fatigue', msg):
        return ("**Sleep & Recovery Guidelines:**\n\n"
                "• Aim for 7-9 hours of quality sleep per night\n"
                "• Poor sleep quality increases hypertension and diabetes risk\n"
                "• Maintain consistent sleep-wake schedule\n"
                "• Avoid screen time 1 hour before bed\n\n"
                "_Source: WHO Health & Sleep Guidelines_")
    
    elif re.search(r'smok|tobacco|cigarette', msg):
        return ("**Smoking Cessation:**\n\n"
                "• Smoking increases CVD risk by 2-4x and stroke risk by 2-3x\n"
                "• Quitting reduces heart disease risk by 50% within 1 year\n"
                "• Nicotine replacement therapy (NRT) doubles quit success rates\n"
                "• Seek professional cessation support programs\n\n"
                "_Source: WHO FCTC / AHA Tobacco Guidelines_")
    
    else:
        return ("Thank you for reaching out to **Health Hero**! 🏥\n\n"
                "I'm your clinical NCD screening assistant. I can help with:\n"
                "• **Diet & Nutrition** guidance for NCDs\n"
                "• **Exercise** plans safe for your risk profile\n"
                "• **Risk explanations** for Diabetes, BP, Heart, Stroke, CKD\n"
                "• **Lifestyle** recommendations from clinical guidelines\n\n"
                "Ask me anything about managing your health risks!")


# ── Public API ───────────────────────────────────────────────────────────

def generate_chatbot_response(user_message: str, risk_profile: dict = None) -> str:
    """
    Generate a chatbot response using RAG + optional Gemini synthesis.
    
    Args:
        user_message: The user's question/message
        risk_profile: Optional dict mapping disease -> risk level
        
    Returns:
        A clinical response string
    """
    intent = detect_intent(user_message)
    
    # Try RAG-powered response first
    if _RAG_READY and _rag_retrieve:
        try:
            ensure_rag_ingested()
            
            result = _rag_retrieve(
                question=user_message,
                intent=intent,
                risk_profile=risk_profile or {},
                top_k=5,
                initial_fetch=12,
            )
            
            if result.chunks:
                # Build context from retrieved chunks
                rag_context = "\n\n".join(
                    f"[{c.metadata.get('condition', 'general').upper()}] "
                    f"{c.metadata.get('section_title', '')}: {c.text}"
                    for c in result.chunks[:5]
                )
                
                # Try Gemini synthesis with RAG context
                gemini_response = _synthesize_with_gemini(user_message, rag_context)
                if gemini_response:
                    return gemini_response
                
                # Otherwise format RAG chunks directly
                return _format_rag_response(user_message, intent, result.chunks)
        except Exception as e:
            print(f"[chatbot] RAG retrieval error: {e}")
    
    # Try Gemini API without RAG context
    if GEMINI_API_KEY:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"
            payload = {
                "contents": [{
                    "parts": [{
                        "text": (
                            "You are Health Hero AI Assistant, a friendly and expert clinical AI for "
                            "Non-Communicable Diseases (Diabetes, Heart Disease, Hypertension, "
                            "Stroke, CKD). Respond conversationally and concisely (2-3 sentences) "
                            "with bullet points to the user's health question. Do NOT include raw citations:\n"
                            f"User: {user_message}"
                        )
                    }]
                }]
            }
            res = requests.post(url, json=payload, timeout=5)
            if res.status_code == 200:
                data = res.json()
                text = data["candidates"][0]["content"]["parts"][0]["text"]
                return text.strip()
        except Exception:
            pass
    
    # Final fallback: keyword-based clinical responses
    return _get_fallback_response(user_message)


def get_rag_chunks(user_message: str, risk_profile: dict = None) -> list[dict]:
    """
    Retrieve RAG chunks for a question (for the frontend chunks drawer).
    
    Returns a list of chunk dicts with scoring details.
    """
    if not _RAG_READY or not _rag_retrieve:
        return []
    
    try:
        ensure_rag_ingested()
        
        intent = detect_intent(user_message)
        result = _rag_retrieve(
            question=user_message,
            intent=intent,
            risk_profile=risk_profile or {},
            top_k=8,
            initial_fetch=15,
        )
        
        return [
            {
                "condition": c.metadata.get("condition", "general").upper(),
                "title": c.metadata.get("section_title", "Knowledge Base"),
                "text": c.text[:300],
                "score": c.boosted_score,
                "boost": f"+{round(c.boosted_score - c.similarity_score, 2)} risk boost" if c.boosted_score > c.similarity_score else "no boost",
                "source_file": c.source_file,
                "sources": c.source_details[:2] if c.source_details else [],
            }
            for c in result.chunks
        ]
    except Exception as e:
        print(f"[chatbot] RAG chunk retrieval error: {e}")
        return []
