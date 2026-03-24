import type {
  ClusterSummaryResponse,
  CounterfactualResponse,
  FeatureImportanceResponse,
  LocalExplanationResponse,
  PredictRequest,
  PredictionResponse,
  Target,
  UmapResponse,
} from "./types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${path} failed: ${response.status} ${text}`);
  }

  return response.json() as Promise<T>;
}

export function fetchUmap() {
  return apiFetch<UmapResponse>("/model/umap");
}

export function fetchFeatureImportance(target: Target) {
  return apiFetch<FeatureImportanceResponse>(
    `/model/feature-importance/${target}`
  );
}

export function fetchPrediction(payload: PredictRequest) {
  return apiFetch<PredictionResponse>("/model/predict", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fetchLocalExplanation(payload: PredictRequest) {
  return apiFetch<LocalExplanationResponse>("/model/local-explanation", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchCounterfactuals(payload: {
  target: string;
  target_level?: string;
  inputs: Record<string, unknown>;
}) {
  const response = await fetch("http://127.0.0.1:8000/model/counterfactual", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Counterfactual request failed: ${response.status} ${text}`);
  }

  return response.json();
}

export function fetchClusterSummary(clusterId: number) {
  return apiFetch<ClusterSummaryResponse>(
    `/model/cluster-summary/${clusterId}`
  );
}