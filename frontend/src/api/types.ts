export type Target = "burnout_level" | "productivity_score" | "exam_score";

export type BackendPredictionInput = {
  age: number;
  gender: string;
  academic_level: string;
  study_hours: number;
  self_study_hours: number;
  online_classes_hours: number;
  social_media_hours: number;
  gaming_hours: number;
  sleep_hours: number;
  screen_time_hours: number;
  exercise_minutes: number;
  caffeine_intake_mg: number;
  part_time_job: number;
  upcoming_deadline: number;
  internet_quality: string;
  mental_health_score: number;
  focus_index: number;
};

export type PredictRequest = {
  target: Target;
  inputs: BackendPredictionInput;
};

export type PredictionResponse = {
  target: Target;
  predicted_value: number;
  confidence: number;
  used_placeholder_model: boolean;
};

export type LocalExplanationResponse = {
  target: Target;
  contributions: Record<string, number>;
  used_placeholder_model: boolean;
};

export type CounterfactualSuggestion = {
  feature: string;
  current_value: string | number;
  suggested_value: string | number;
  expected_effect: string;
};

export type CounterfactualResponse = {
  target: Target;
  original_prediction: PredictionResponse;
  suggestions: CounterfactualSuggestion[];
  used_placeholder_model: boolean;
};

export type FeatureImportanceItem = {
  feature: string;
  importance: number;
};

export type FeatureImportanceResponse = {
  global_importance: FeatureImportanceItem[];
  used_placeholder_model: boolean;
};

export type UmapPoint = {
  id: number;
  x: number;
  y: number;
  cluster: number;
  burnout_level: number;
  productivity_score: number;
};

export type UmapResponse = {
  points: UmapPoint[];
  used_placeholder_model: boolean;
};

export type ClusterSummaryResponse = {
  cluster_id: number;
  size: number;
  avg_productivity: number;
  avg_burnout: number;
  avg_exam_score: number;
  top_features: string[];
  used_placeholder_model: boolean;
};