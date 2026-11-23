from fastapi import APIRouter
from app.api.v1.endpoints import auth, health, documents, agent


api_router = APIRouter()

api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(documents.router)
api_router.include_router(agent.router)


