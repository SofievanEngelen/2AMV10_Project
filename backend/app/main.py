from typing import List

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.data_loader import load_data
from app.model_service import (
    compute_strategy_atlas,
    explain_local_real,
    generate_counterfactual_real,
    get_global_feature_importance_real,
    predict_real,
    project_hypothetical_strategy_point,
    summarize_cluster_real,
)
from app.schemas import (
    ClusterSummaryResponse,
    CounterfactualOption,
    CounterfactualRequest,
    FeatureImportanceResponse,
    LocalExplanationResponse,
    PredictRequest,
    PredictionResponse,
    StrategyAtlasProjectionRequest,
    StrategyAtlasProjectionResponse,
    StrategyAtlasResponse,
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
def health() -> dict[str, str]:
    """Simple health check endpoint for backend availability."""
    return {"status": "ok"}


@app.get("/data")
def get_data() -> list[dict]:
    """Return the full cleaned dataset as a list of records."""
    df = load_data()
    return df.to_dict(orient="records")


@app.get("/data/columns")
def get_columns() -> dict[str, list[str]]:
    """Return the available dataset column names."""
    df = load_data()
    return {"columns": df.columns.tolist()}


@app.get("/debug/data-shape")
def debug_data_shape() -> dict[str, object]:
    """Return dataset size and column metadata for debugging."""
    df = load_data()
    return {
        "rows": len(df),
        "columns": df.columns.tolist(),
    }


@app.get("/model/feature-importance/{target}", response_model=FeatureImportanceResponse)
def feature_importance(target: str) -> dict:
    """Return global feature importance for the selected target variable."""
    df = load_data()
    return {
        "global_importance": get_global_feature_importance_real(target, df),
        "used_placeholder_model": False,
    }


@app.post("/model/predict", response_model=PredictionResponse)
def predict(request: PredictRequest):
    """Generate a prediction for a given student profile and target variable."""
    df = load_data()
    return predict_real(request.target, request.inputs.model_dump(), df)


@app.post("/model/local-explanation", response_model=LocalExplanationResponse)
def local_explanation(request: PredictRequest) -> dict:
    """Return local explanation contributions for a single prediction."""
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


@app.get("/model/strategyAtlas", response_model=StrategyAtlasResponse)
def strategy_atlas(target: str = "exam_score") -> StrategyAtlasResponse:
    """Return the precomputed Strategy Atlas for the selected target."""
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
    except Exception:
        print("StrategyAtlasResponse validation failed")
        raise


@app.post("/model/strategyAtlas/project", response_model=StrategyAtlasProjectionResponse)
def project_strategy_point(
    request: StrategyAtlasProjectionRequest,
) -> StrategyAtlasProjectionResponse:
    """Project a hypothetical student profile into the Strategy Atlas space."""
    df = load_data()
    return project_hypothetical_strategy_point(
        df,
        request.target,
        request.inputs.model_dump(),
    )


@app.post("/model/counterfactual", response_model=List[CounterfactualOption])
def model_counterfactual(req: CounterfactualRequest) -> List[CounterfactualOption]:
    """Generate counterfactual suggestions for improving a target outcome."""
    df = load_data()
    return generate_counterfactual_real(
        req.target,
        req.inputs.model_dump(),
        df,
        req.target_level,
    )


@app.get("/model/cluster-summary/{cluster_id}", response_model=ClusterSummaryResponse)
def cluster_summary(cluster_id: int, target: str = "exam_score"):
    """Return summary statistics and explanation data for a selected cluster."""
    df = load_data()
    return summarize_cluster_real(df, target, cluster_id)