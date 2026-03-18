from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import numpy as np

app = FastAPI(title="Student Productivity VA API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PredictionRequest(BaseModel):
    study_hours: float
    sleep_hours: float
    smartphone_hours: float
    stress_level: float

class PredictionResponse(BaseModel):
    productivity_score: float
    risk_level: str
    contributions: dict[str, float]

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/predict", response_model=PredictionResponse)
def predict(payload: PredictionRequest):
    # placeholder model logic for now
    score = (
        12 * payload.study_hours
        + 8 * payload.sleep_hours
        - 7 * payload.smartphone_hours
        - 5 * payload.stress_level
        + 40
    )

    score = float(np.clip(score, 0, 100))

    if score >= 75:
        risk = "Low"
    elif score >= 50:
        risk = "Medium"
    else:
        risk = "High"

    contributions = {
        "study_hours": round(12 * payload.study_hours, 2),
        "sleep_hours": round(8 * payload.sleep_hours, 2),
        "smartphone_hours": round(-7 * payload.smartphone_hours, 2),
        "stress_level": round(-5 * payload.stress_level, 2),
    }

    return PredictionResponse(
        productivity_score=round(score, 2),
        risk_level=risk,
        contributions=contributions,
    )