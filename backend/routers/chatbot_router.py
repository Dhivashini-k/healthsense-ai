from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List
import schemas
from services.chatbot import generate_chatbot_response, get_rag_chunks

router = APIRouter(prefix="/api/chatbot", tags=["AI Chatbot"])


class AssistantChatRequest(BaseModel):
    role: Optional[str] = "Nurse"
    messages: Optional[List[dict]] = []
    system_context: Optional[str] = ""
    risk_profile: Optional[dict] = {}


@router.post("", response_model=schemas.ChatResponse)
def chatbot_endpoint(chat_msg: schemas.ChatMessage):
    """Standard chatbot endpoint — returns a text response."""
    reply = generate_chatbot_response(chat_msg.message)
    return {"response": reply}


@router.post("/rag")
def chatbot_rag_endpoint(chat_msg: schemas.ChatMessage):
    """RAG chatbot endpoint — returns response + retrieved chunks."""
    reply = generate_chatbot_response(chat_msg.message)
    chunks = get_rag_chunks(chat_msg.message)
    return {
        "response": reply,
        "chunks": chunks,
        "rag_active": len(chunks) > 0
    }
