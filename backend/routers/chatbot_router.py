from fastapi import APIRouter
import schemas
from services.chatbot import generate_chatbot_response

router = APIRouter(prefix="/api/chatbot", tags=["AI Chatbot"])

@router.post("", response_model=schemas.ChatResponse)
def chatbot_endpoint(chat_msg: schemas.ChatMessage):
    reply = generate_chatbot_response(chat_msg.message)
    return {"response": reply}
