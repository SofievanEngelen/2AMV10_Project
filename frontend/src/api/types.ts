export type PredictionResponse = {
  prediction: string;
  confidence: string;
  advice: string[];
};

export type StudentInput = {
  gender: string;
  age: string;
  study_hours: string;
  phone_usage: string;
  sleep_hours: string;
};