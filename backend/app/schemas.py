from typing import Any, Dict, List, Literal
from pydantic import BaseModel


class PredictionInput(BaseModel):
    Age: int = 21
    Gender: str = "Female"
    Study_Hours_Per_Day: float = 4.0
    Study_Consistency: str = "Medium"
    Preferred_Study_Time: str = "Evening"
    Smartphone_Usage_Hours: float = 5.0
    Social_Media_Usage_Hours: float = 2.5
    Gaming_Hours: float = 1.0
    Notification_Frequency: int = 45
    Sleep_Hours: float = 7.0
    Physical_Activity_Level: str = "Moderate"
    Focus_Score: float = 70.0
    Attendance_Percentage: float = 85.0
    Assignment_Completion_Rate: float = 88.0


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