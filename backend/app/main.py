import json
import os.path
from http.client import HTTPException
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from typing import List

from app.data_loader import load_data
from app.model_service import (
    compute_strategy_atlas,
    explain_local_real,
    generate_counterfactual_real,
    get_global_feature_importance_real,
    predict_real,
    summarize_cluster_real,
    project_hypothetical_strategy_point,
    load_precomputed_strategy_atlas
)
from app.schemas import (
    ClusterSummaryResponse,
    CounterfactualOption,
    CounterfactualRequest,
    FeatureImportanceResponse,
    LocalExplanationResponse,
    PredictRequest,
    PredictionResponse,
    StrategyAtlasResponse,
    StrategyAtlasProjectionRequest,
    StrategyAtlasProjectionResponse
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
    df = load_data()
    return {
        "global_importance": get_global_feature_importance_real(target, df),
        "used_placeholder_model": False,
    }


@app.post("/model/predict", response_model=PredictionResponse)
def predict(request: PredictRequest):
    df = load_data()
    return predict_real(request.target, request.inputs.model_dump(), df)


@app.post("/model/local-explanation", response_model=LocalExplanationResponse)
def local_explanation(request: PredictRequest):
    df = load_data()
    return {
        "target": request.target,
        "contributions": explain_local_real(
            request.target,
            request.inputs.model_dump(),
            df,
        ),
        "used_placeholder_model": False,
    }


# from pydantic import ValidationError

@app.get("/model/strategyAtlas", response_model=StrategyAtlasResponse)
def strategy_atlas(target: str = "exam_score"):
    df = load_data()
    atlas = compute_strategy_atlas(df, target)

    payload = {
        "points": atlas["points"],
        "background": atlas["background"],
        "strategy_profiles": atlas.get("strategy_profiles", []),
        "used_placeholder_model": False,
    }

    try:
        return StrategyAtlasResponse(**payload)
    except Exception as e:
        print("StrategyAtlasResponse validation failed")
        raise

@app.post("/model/strategyAtlas/project", response_model=StrategyAtlasProjectionResponse)
def project_strategy_point(request: StrategyAtlasProjectionRequest):
    df = load_data()
    return project_hypothetical_strategy_point(
        df,
        request.target,
        request.inputs.model_dump(),
    )


@app.post("/model/counterfactual", response_model=List[CounterfactualOption])
def model_counterfactual(req: CounterfactualRequest):
    df = load_data()
    return generate_counterfactual_real(
        req.target,
        req.inputs.model_dump(),
        df,
        req.target_level,
    )


@app.get("/model/cluster-summary/{cluster_id}", response_model=ClusterSummaryResponse)
def cluster_summary(cluster_id: int, target: str = "exam_score"):
    df = load_data()
    return summarize_cluster_real(df, target, cluster_id)