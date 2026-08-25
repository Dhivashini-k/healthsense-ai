import os
import requests

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

def generate_chatbot_response(user_message: str) -> str:
    # If Gemini API key is configured, call Gemini API
    if GEMINI_API_KEY:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"
            payload = {
                "contents": [{
                    "parts": [{
                        "text": f"You are Health Hero AI Assistant, an expert medical AI for Non-Communicable Diseases (Diabetes, Heart Disease, Hypertension, Stroke, CKD). Respond helpfully and concisely (2-4 sentences) to the user's health question:\nUser: {user_message}"
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

    # Intelligent Clinical Fallback Matrix
    msg_lower = user_message.lower()
    if "diabetes" in msg_lower:
        return "Diabetes Risk (34% population share): Fasting glucose > 126 mg/dL or HbA1c > 6.5%. Recommended protocol includes a low-GI Mediterranean diet, 150 minutes of weekly aerobic exercise, and HbA1c testing every 3 months."
    elif "heart" in msg_lower or "cardio" in msg_lower:
        return "Heart Disease Risk (24% share): Framingham risk score integrates Systolic BP, lipid profile, and smoking history. Key steps include limiting saturated fats, regular cardio workouts, and consulting Dr. Arjun Mehta."
    elif "pressure" in msg_lower or "hypertension" in msg_lower:
        return "Hypertension (20% share): Target BP is < 130/80 mmHg. Daily sodium intake should be restricted to <1,500 mg alongside stress management and regular blood pressure logging."
    elif "stroke" in msg_lower:
        return "Stroke Risk (10% share): Primary risk factors include uncontrolled hypertension (>140 mmHg) and smoking. Remember the F.A.S.T. warning signs and maintain strict BP control."
    elif "appointment" in msg_lower or "book" in msg_lower:
        return "I can help you schedule your specialist screening consultation! You can navigate to the 'Appointments' module to pick a date with Dr. Arjun Mehta."
    else:
        return "Thank you for reaching out to Health Hero AI. Regular Non-Communicable Disease screening, balanced nutrition, daily exercise, and routine vital tracking are the keys to long-term preventive health."
