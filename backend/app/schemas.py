from typing import Any, Dict, List, Literal, TypeAlias

from pydantic import BaseModel, Field

SupportedTarget: TypeAlias = Literal[
    "burnout_level",
    "productivity_score",
    "exam_score",
    "mental_health_score",
    "focus_index",
]


class PredictionInput(BaseModel):
    """Input schema for a single student profile used in prediction workflows."""

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
    exercise_minutes: float = 45.0
    caffeine_intake_mg: float = 120.0
    part_time_job: int = 0
    upcoming_deadline: int = 1
    internet_quality: str = "Good"
    mental_health_score: float = 7.0
    focus_index: float = 70.0


class PredictRequest(BaseModel):
    """Request body for model prediction."""

    target: SupportedTarget
    inputs: PredictionInput


class CounterfactualRequest(BaseModel):
    """Request body for counterfactual generation."""

    target: SupportedTarget
    inputs: PredictionInput
    target_level: str | None = None


class PredictionResponse(BaseModel):
    """Response returned by the prediction endpoint."""

    target: SupportedTarget
    predicted_level: str
    confidence: float
    used_placeholder_model: bool = True


class LocalExplanationResponse(BaseModel):
    """Response containing local feature contributions for one prediction."""

    target: SupportedTarget
    contributions: Dict[str, float]
    used_placeholder_model: bool = True


class CounterfactualChange(BaseModel):
    """Single feature change suggested by a counterfactual option."""

    feature: str
    current_value: Any
    suggested_value: Any


class CounterfactualOption(BaseModel):
    """One generated counterfactual suggestion."""

    option: int
    changes: List[CounterfactualChange]
    effort: str
    new_level: str


class FeatureImportanceItem(BaseModel):
    """Single feature importance entry."""

    feature: str
    importance: float


class FeatureImportanceResponse(BaseModel):
    """Response containing global feature importance values."""

    global_importance: List[FeatureImportanceItem]
    used_placeholder_model: bool = True


class StrategyFeature(BaseModel):
    """Feature summary used inside a strategy profile."""

    name: str
    importance: float


class StrategyProfile(BaseModel):
    """Summary of one behavioural strategy cluster."""

    name: str
    count: int
    success_pct: float
    features: List[StrategyFeature]


class StrategyAtlasPoint(BaseModel):
    """Single point shown in the Strategy Atlas projection."""

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


class StrategyAtlasBackground(BaseModel):
    """Background grid metadata for the Strategy Atlas view."""

    x_range: List[float]
    y_range: List[float]
    z: List[List[int]]
    feature_labels: List[str]


class StrategyAtlasResponse(BaseModel):
    """Full response payload for the Strategy Atlas endpoint."""

    points: List[StrategyAtlasPoint]
    background: StrategyAtlasBackground
    strategy_profiles: List[StrategyProfile] = Field(default_factory=list)
    used_placeholder_model: bool = False


class StrategyAtlasProjectionRequest(BaseModel):
    """Request body for projecting a hypothetical point into the atlas."""

    target: SupportedTarget
    inputs: PredictionInput


class StrategyAtlasProjectionResponse(BaseModel):
    """2D coordinates for a projected hypothetical point."""

    x: float
    y: float


class ClusterSummaryResponse(BaseModel):
    """Summary statistics for a selected atlas cluster."""

    cluster_id: int
    size: int
    avg_productivity: float
    avg_burnout: float
    avg_exam_score: float
    avg_mental_health_score: float
    avg_focus_index: float
    top_features: List[str]
    used_placeholder_model: bool = True