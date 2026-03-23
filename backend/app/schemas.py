from typing import Any, Dict, List, Literal
from pydantic import BaseModel


class PredictionInput(BaseModel):
    age: int = 21
    gender: str = "Female"
    academic_level: str = "Undergraduate"
    study_hours: float = 4.0
    self_study_hours: float = 2.0
    online_classes_hours: float = 2.0
    social_media_hours: float = 2.5
    gaming_hours: float = 1.0
    sleep_hours: float = 7.0
    screen_time_hours: float = 6.0
    exercise_minutes: int = 45
    caffeine_intake_mg: int = 120
    part_time_job: int = 0
    upcoming_deadline: int = 1
    internet_quality: str = "Good"
    mental_health_score: float = 7.0
    focus_index: float = 70.0

class PredictRequest(BaseModel):
    target: Literal["burnout_level", "productivity_score", "exam_score"]
    inputs: PredictionInput


class PredictionResponse(BaseModel):
    target: Literal["burnout_level", "productivity_score", "exam_score"]
    predicted_value: float
    confidence: float
    used_placeholder_model: bool = True


class LocalExplanationResponse(BaseModel):
    target: Literal["burnout_level", "productivity_score", "exam_score"]
    contributions: Dict[str, float]
    used_placeholder_model: bool = True


class CounterfactualSuggestion(BaseModel):
    feature: str
    current_value: Any
    suggested_value: Any
    expected_effect: str


class CounterfactualResponse(BaseModel):
    target: Literal["burnout_level", "productivity_score", "exam_score"]
    original_prediction: PredictionResponse
    suggestions: List[CounterfactualSuggestion]
    used_placeholder_model: bool = True


class FeatureImportanceItem(BaseModel):
    feature: str
    importance: float


class FeatureImportanceResponse(BaseModel):
    global_importance: List[FeatureImportanceItem]
    used_placeholder_model: bool = True


class UmapPoint(BaseModel):
    id: int
    x: float
    y: float
    cluster: int

    burnout_level: float
    productivity_score: float
    exam_score: float

    age: int
    gender: str
    academic_level: str
    study_hours: float
    self_study_hours: float
    online_classes_hours: float
    social_media_hours: float
    gaming_hours: float
    sleep_hours: float
    screen_time_hours: float
    exercise_minutes: float
    caffeine_intake_mg: float
    part_time_job: int
    upcoming_deadline: int
    internet_quality: str
    mental_health_score: float
    focus_index: float


class UmapResponse(BaseModel):
    points: List[UmapPoint]
    used_placeholder_model: bool = True


class ClusterSummaryResponse(BaseModel):
    cluster_id: int
    size: int
    avg_productivity: float
    avg_burnout: float
    avg_exam_score: float
    top_features: List[str]
    used_placeholder_model: bool = True