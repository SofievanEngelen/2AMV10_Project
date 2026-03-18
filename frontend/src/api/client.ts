export type PredictionRequest = {
  study_hours: number;
  sleep_hours: number;
  smartphone_hours: number;
  stress_level: number;
};

export type PredictionResponse = {
  productivity_score: number;
  risk_level: string;
  contributions: Record<string, number>;
};

const API_URL = import.meta.env.VITE_API_URL;

export async function getPrediction(
  payload: PredictionRequest
): Promise<PredictionResponse> {
  const response = await fetch(`${API_URL}/predict`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Prediction request failed");
  }

  return response.json();
}