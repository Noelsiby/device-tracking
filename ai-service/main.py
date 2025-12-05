from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PredictInput(BaseModel):
    device_id: int
    usage_hours: float
    last_maintenance_days: int
    failure_history_count: int

@app.get("/health")
async def health():
    return {"ok": True}

@app.post("/damage-detect")
async def damage_detect(photo: UploadFile = File(...)):
    # Placeholder ML: In production, run model inference here
    filename = photo.filename
    # Simulated detections
    detections = [
        {"type": "scratch", "confidence": 0.78},
        {"type": "crack", "confidence": 0.32}
    ]
    return {"file": filename, "detections": detections}

@app.post("/predict-maintenance")
async def predict_maintenance(payload: PredictInput):
    # Placeholder ML: Use scikit-learn model predictions
    score = 0.2 * payload.usage_hours + 0.1 * payload.last_maintenance_days + 0.3 * payload.failure_history_count
    days_until_maintenance = max(1, int(30 - score))
    return {"device_id": payload.device_id, "days_until_maintenance": days_until_maintenance, "health_score": max(0, 100 - score)}
