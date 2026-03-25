from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from typing import List

from app.data_loader import load_data
from app.model_service import (
    compute_umap_placeholder,
    explain_local_placeholder,
    generate_counterfactual_placeholder,
    get_global_feature_importance_placeholder,
    predict_placeholder,
    summarize_cluster_placeholder,
)
from app.schemas import (
    ClusterSummaryResponse,
    CounterfactualOption,
    CounterfactualRequest,
    FeatureImportanceResponse,
    LocalExplanationResponse,
    PredictRequest,
    PredictionResponse,
    UmapResponse,
)

app = FastAPI(title="Student Productivity VA Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/data")
def get_data():
    df = load_data()
    return df.to_dict(orient="records")


@app.get("/data/columns")
def get_columns():
    df = load_data()
    return {"columns": df.columns.tolist()}


@app.get("/debug/data-shape")
def debug_data_shape():
    df = load_data()
    return {
        "rows": len(df),
        "columns": df.columns.tolist(),
    }


@app.get("/model/feature-importance/{target}", response_model=FeatureImportanceResponse)
def feature_importance(target: str):
    return {
        "global_importance": get_global_feature_importance_placeholder(target),
        "used_placeholder_model": True,
    }

@app.post("/model/predict", response_model=PredictionResponse)
def predict(request: PredictRequest):
    return predict_placeholder(request.target, request.inputs.model_dump())


@app.post("/model/local-explanation", response_model=LocalExplanationResponse)
def local_explanation(request: PredictRequest):
    return {
        "target": request.target,
        "contributions": explain_local_placeholder(
            request.target, request.inputs.model_dump()
        ),
        "used_placeholder_model": True,
    }


@app.get("/model/umap", response_model=UmapResponse)
def umap():
    df = load_data()
    points = compute_umap_placeholder(df)
    return {
        "points": points,
        "used_placeholder_model": True,
    }


@app.post("/model/counterfactual", response_model=List[CounterfactualOption])
def model_counterfactual(req: CounterfactualRequest):
    return generate_counterfactual_placeholder(req.target, req.inputs.model_dump())


@app.get("/model/cluster-summary/{cluster_id}", response_model=ClusterSummaryResponse)
def cluster_summary(cluster_id: int):
    df = load_data()
    points = compute_umap_placeholder(df)

    cluster_df = df.copy()
    cluster_df["cluster"] = [p["cluster"] for p in points]

    return summarize_cluster_placeholder(cluster_df, cluster_id)