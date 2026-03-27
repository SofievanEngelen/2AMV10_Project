import copy
import json
from pathlib import Path
from typing import Dict, List, Optional

import dice_ml
import lime.lime_tabular
import numpy as np
import pandas as pd
import umap
import keras

from dice_ml import Dice
from sklearn.cluster import KMeans
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import LabelEncoder, OneHotEncoder, StandardScaler
from umap.parametric_umap import ParametricUMAP
from joblib import Parallel, delayed

import threading

_strategy_cache: Dict[str, Dict] = {}
_strategy_locks: Dict[str, threading.Lock] = {}
_precomputed_strategy_cache: Dict[str, Dict] = {}

SUPPORTED_TARGETS = [
    "burnout_level",
    "productivity_score",
    "exam_score",
    "mental_health_score",
    "focus_index",
]

IMMUTABLE_FEATURES = ["age", "gender", "academic_level"]

BASE_CONTINUOUS_FEATURES = [
    "study_hours",
    "self_study_hours",
    "online_classes_hours",
    "social_media_hours",
    "gaming_hours",
    "sleep_hours",
    "screen_time_hours",
    "exercise_minutes",
    "caffeine_intake_mg",
    "mental_health_score",
    "focus_index",
    "burnout_level",
    "productivity_score",
    "exam_score",
]

_model_cache: Dict[str, Dict] = {}
_lime_cache: Dict[str, Dict] = {}

BASE_DIR = Path(__file__).resolve().parent.parent
STRATEGY_ATLAS_DIR = BASE_DIR / "data" / "StrategyAtlas"


def _validate_target(target: str) -> None:
    if target not in SUPPORTED_TARGETS:
        raise ValueError(f"Unsupported target: {target}")


def _category_name(target: str) -> str:
    return f"{target}_category"


def _map_class_to_level(pred_class: int) -> str:
    return {0: "Low", 1: "Medium", 2: "High"}[int(pred_class)]


def _prepare_training_df(df: pd.DataFrame, target: str) -> pd.DataFrame:
    _validate_target(target)

    out = df.copy()
    category_col = _category_name(target)

    if category_col not in out.columns:
        ranked = out[target].rank(method="first")
        out[category_col] = pd.qcut(
            ranked,
            q=3,
            labels=[0, 1, 2],
            duplicates="drop",
        ).astype(int)

    return out


def _build_complete_input_df(payload: Dict, model_features: List[str], df: pd.DataFrame) -> pd.DataFrame:
    row = {}

    for col in model_features:
        if col in payload and payload[col] is not None:
            row[col] = payload[col]
            continue

        if pd.api.types.is_numeric_dtype(df[col]):
            row[col] = float(df[col].median())
        else:
            mode = df[col].mode(dropna=True)
            row[col] = mode.iloc[0] if not mode.empty else ""

    return pd.DataFrame([row], columns=model_features)


def _get_feature_config(df: pd.DataFrame, target: str) -> Dict:
    category_col = _category_name(target)

    all_feature_candidates = [
        c for c in df.columns
        if c not in [target, category_col, "student_id"]
    ]

    actionable_features = [
        c for c in all_feature_candidates
        if c not in IMMUTABLE_FEATURES
    ]

    continuous_features = [
        c for c in BASE_CONTINUOUS_FEATURES
        if c in actionable_features
    ]

    categorical_features = [
        c for c in actionable_features
        if c not in continuous_features
    ]

    model_features = actionable_features + IMMUTABLE_FEATURES

    return {
        "category_col": category_col,
        "actionable_features": actionable_features,
        "continuous_features": continuous_features,
        "categorical_features": categorical_features,
        "model_features": model_features,
    }


def _safe_item(value):
    return value.item() if hasattr(value, "item") else value


def _aggregate_pipeline_importances(
    transformed_feature_names: List[str],
    importances: np.ndarray,
    original_features: List[str],
) -> List[dict]:
    feature_to_importance = {f: 0.0 for f in original_features}

    for name, importance in zip(transformed_feature_names, importances):
        if name.startswith("num__"):
            raw_name = name.replace("num__", "", 1)
        elif name.startswith("cat__"):
            raw_name = name.replace("cat__", "", 1)
            matched = None
            for feature in original_features:
                prefix = feature + "_"
                if raw_name == feature or raw_name.startswith(prefix):
                    matched = feature
                    break
            raw_name = matched if matched is not None else raw_name
        else:
            raw_name = name

        if raw_name in feature_to_importance:
            feature_to_importance[raw_name] += float(importance)

    ranked = sorted(
        feature_to_importance.items(),
        key=lambda x: x[1],
        reverse=True,
    )

    return [
        {"feature": feature, "importance": float(importance)}
        for feature, importance in ranked
    ]


def _get_model_bundle(df: pd.DataFrame, target: str) -> Dict:
    _validate_target(target)

    if target in _model_cache:
        return _model_cache[target]

    train_df = _prepare_training_df(df, target)
    cfg = _get_feature_config(train_df, target)

    X = train_df[cfg["model_features"]].copy()
    y = train_df[cfg["category_col"]].copy()

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
    )

    preprocessor = ColumnTransformer([
        ("num", StandardScaler(), cfg["continuous_features"]),
        (
            "cat",
            OneHotEncoder(handle_unknown="ignore", sparse_output=False),
            cfg["categorical_features"],
        ),
    ])

    model_pipeline = Pipeline([
        ("preprocessor", preprocessor),
        ("classifier", RandomForestClassifier(
            n_estimators=100,
            random_state=42,
        )),
    ])

    model_pipeline.fit(X_train, y_train)

    train_data = pd.concat(
        [X_train.reset_index(drop=True), y_train.reset_index(drop=True)],
        axis=1,
    )

    d = dice_ml.Data(
        dataframe=train_data,
        continuous_features=cfg["continuous_features"],
        outcome_name=cfg["category_col"],
    )
    m = dice_ml.Model(
        model=model_pipeline,
        backend="sklearn",
        model_type="classifier",
    )
    exp = Dice(d, m, method="genetic")

    bundle = {
        "target": target,
        "category_col": cfg["category_col"],
        "model_features": cfg["model_features"],
        "actionable_features": cfg["actionable_features"],
        "continuous_features": cfg["continuous_features"],
        "categorical_features": cfg["categorical_features"],
        "model_pipeline": model_pipeline,
        "dice": exp,
        "X_train": X_train,
        "X_test": X_test,
        "y_train": y_train,
        "y_test": y_test,
    }

    _model_cache[target] = bundle
    return bundle


def _get_lime_bundle(df: pd.DataFrame, target: str) -> Dict:
    _validate_target(target)

    cache_key = f"lime_{target}"
    if cache_key in _lime_cache:
        return _lime_cache[cache_key]

    train_df = _prepare_training_df(df, target)
    cfg = _get_feature_config(train_df, target)

    X = train_df[cfg["model_features"]].copy()
    y = train_df[cfg["category_col"]].copy()

    X_encoded = X.copy()
    label_encoders: Dict[str, LabelEncoder] = {}

    for col in X_encoded.select_dtypes(include=["object"]).columns:
        le = LabelEncoder()
        X_encoded[col] = le.fit_transform(X_encoded[col].astype(str))
        label_encoders[col] = le

    X_train, X_test, y_train, y_test = train_test_split(
        X_encoded,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y,
    )

    lime_model = RandomForestClassifier(
        n_estimators=200,
        random_state=42,
    )
    lime_model.fit(X_train, y_train)

    explainer = lime.lime_tabular.LimeTabularExplainer(
        training_data=X_train.values,
        feature_names=X_encoded.columns.tolist(),
        class_names=["0", "1", "2"],
        mode="classification",
    )

    bundle = {
        "feature_names": X_encoded.columns.tolist(),
        "label_encoders": label_encoders,
        "X_train": X_train,
        "X_test": X_test,
        "y_train": y_train,
        "y_test": y_test,
        "model": lime_model,
        "explainer": explainer,
    }

    _lime_cache[cache_key] = bundle
    return bundle


def _encode_for_lime(input_df: pd.DataFrame, label_encoders: Dict[str, LabelEncoder]) -> pd.DataFrame:
    out = input_df.copy()

    for col, le in label_encoders.items():
        raw_val = str(out.at[out.index[0], col]) if len(out) == 1 else None

        if len(out) == 1:
            if raw_val in le.classes_:
                out[col] = le.transform([raw_val])[0]
            else:
                out[col] = 0
        else:
            out[col] = out[col].astype(str).map(
                lambda v: le.transform([v])[0] if v in le.classes_ else 0
            )

    return out


def _lime_vector_for_instance(
    input_array: np.ndarray,
    model,
    explainer,
    feature_names: List[str],
    num_features: int,
    num_samples: int | None = None,
) -> np.ndarray:
    input_df = pd.DataFrame([input_array], columns=feature_names)
    pred = int(model.predict(input_df)[0])

    explain_kwargs = {
        "data_row": input_array,
        "predict_fn": lambda x: model.predict_proba(pd.DataFrame(x, columns=feature_names)),
        "num_features": num_features,
        "labels": (pred,),
    }

    if num_samples is not None:
        explain_kwargs["num_samples"] = num_samples

    exp = explainer.explain_instance(**explain_kwargs)

    contribs = np.zeros(len(feature_names))
    for feat_idx, weight in exp.as_map()[pred]:
        contribs[feat_idx] = weight

    max_abs = np.abs(contribs).max()
    if max_abs == 0:
        max_abs = 1.0

    return contribs / max_abs


def _encode_dataframe_for_lime(
    df_in: pd.DataFrame,
    label_encoders: Dict[str, LabelEncoder],
) -> pd.DataFrame:
    out = df_in.copy()
    for col, le in label_encoders.items():
        out[col] = out[col].astype(str).map(
            lambda v: le.transform([v])[0] if v in le.classes_ else 0
        )
    return out


def _normalize_payload_values(payload: Dict, model_features: List[str], df: pd.DataFrame) -> Dict:
    normalized = dict(payload)

    for col in model_features:
        if col not in normalized or normalized[col] is None:
            continue

        if not pd.api.types.is_numeric_dtype(df[col]):
            valid_values = [str(v).strip() for v in df[col].dropna().unique()]
            raw = str(normalized[col]).strip()

            if raw in valid_values:
                normalized[col] = raw
                continue

            lower_map = {v.lower(): v for v in valid_values}
            if raw.lower() in lower_map:
                normalized[col] = lower_map[raw.lower()]
                continue

            mode = df[col].mode(dropna=True)
            normalized[col] = str(mode.iloc[0]).strip() if not mode.empty else raw

    return normalized


def _normalize_precomputed_points(raw_points: List[dict], target: str) -> List[dict]:
    points: List[dict] = []

    for i, p in enumerate(raw_points):
        points.append({
            "id": int(p.get("id", p.get("student_id", i))),
            "x": float(p["x"]),
            "y": float(p["y"]),
            "cluster": int(p.get("cluster", p.get("strategy_label", -1))),
            "burnout_level": float(p.get("burnout_level", 0.0)),
            "productivity_score": float(p.get("productivity_score", 0.0)),
            "exam_score": float(p.get("exam_score", 0.0)),
            "mental_health_score": float(p.get("mental_health_score", 0.0)),
            "focus_index": float(p.get("focus_index", 0.0)),
            "age": int(p.get("age", 0)),
            "gender": str(p.get("gender", "")),
            "academic_level": str(p.get("academic_level", "")),
            "study_hours": float(p.get("study_hours", 0.0)),
            "self_study_hours": float(p.get("self_study_hours", 0.0)),
            "online_classes_hours": float(p.get("online_classes_hours", 0.0)),
            "social_media_hours": float(p.get("social_media_hours", 0.0)),
            "gaming_hours": float(p.get("gaming_hours", 0.0)),
            "sleep_hours": float(p.get("sleep_hours", 0.0)),
            "screen_time_hours": float(p.get("screen_time_hours", 0.0)),
            "exercise_minutes": float(p.get("exercise_minutes", 0.0)),
            "caffeine_intake_mg": float(p.get("caffeine_intake_mg", 0.0)),
            "part_time_job": int(p.get("part_time_job", 0)),
            "upcoming_deadline": int(p.get("upcoming_deadline", 0)),
            "internet_quality": str(p.get("internet_quality", "")),
        })

    return points


def _normalize_precomputed_background(raw_grid: dict) -> dict:
    if "x_range" in raw_grid and "y_range" in raw_grid and "z" in raw_grid:
        x_range = raw_grid["x_range"]
        y_range = raw_grid["y_range"]
        z = raw_grid["z"]
    else:
        x_range = raw_grid["xx"][0]
        y_range = [row[0] for row in raw_grid["yy"]]
        z = raw_grid["zz"]

    if x_range and isinstance(x_range[0], list):
        x_range = x_range[0]
    if y_range and isinstance(y_range[0], list):
        y_range = [row[0] for row in y_range]
    if z and not isinstance(z[0], list):
        grid_res = int(len(x_range))
        z = [z[i:i + grid_res] for i in range(0, len(z), grid_res)]

    return {
        "x_range": [float(v) for v in x_range],
        "y_range": [float(v) for v in y_range],
        "z": [[int(cell) for cell in row] for row in z],
        "feature_labels": raw_grid["feature_labels"],
    }


def load_precomputed_strategy_atlas(target: str):
    _validate_target(target)

    if target in _precomputed_strategy_cache:
        return _precomputed_strategy_cache[target]

    target_dir = STRATEGY_ATLAS_DIR / target

    atlas_grid_file = target_dir / "atlas_grid.json"
    atlas_points_file = target_dir / "atlas_points.json"
    lime_contributions_file = target_dir / "lime_contributions.json"
    umap_model_dir = target_dir / "strategy_umap_model"
    encoder_file = umap_model_dir / "encoder.keras"

    required_paths = [
        atlas_grid_file,
        atlas_points_file,
        lime_contributions_file,
        encoder_file,
    ]

    if not target_dir.exists() or not all(path.exists() for path in required_paths):
        return None

    with atlas_grid_file.open("r", encoding="utf-8") as f:
        raw_grid = json.load(f)

    with atlas_points_file.open("r", encoding="utf-8") as f:
        raw_points = json.load(f)

    with lime_contributions_file.open("r", encoding="utf-8") as f:
        lime_contributions = json.load(f)

    encoder = keras.models.load_model(encoder_file)

    loaded = {
        "points": _normalize_precomputed_points(raw_points, target),
        "background": _normalize_precomputed_background(raw_grid),
        "lime_contributions": lime_contributions,
        "encoder": encoder,
        "encoder_path": str(encoder_file),
    }

    _precomputed_strategy_cache[target] = loaded
    return loaded


def predict_real(target: str, payload: Dict, df: pd.DataFrame) -> Dict:
    bundle = _get_model_bundle(df, target)
    model_pipeline = bundle["model_pipeline"]

    normalized_payload = _normalize_payload_values(payload, bundle["model_features"], df)
    input_df = _build_complete_input_df(normalized_payload, bundle["model_features"], df)

    pred_class = int(model_pipeline.predict(input_df)[0])
    probabilities = model_pipeline.predict_proba(input_df)[0]
    confidence = float(np.max(probabilities))

    return {
        "target": target,
        "predicted_level": _map_class_to_level(pred_class),
        "confidence": round(confidence, 3),
        "used_placeholder_model": False,
    }


def get_global_feature_importance_real(target: str, df: pd.DataFrame) -> List[dict]:
    bundle = _get_model_bundle(df, target)
    model_pipeline = bundle["model_pipeline"]

    preprocessor = model_pipeline.named_steps["preprocessor"]
    classifier = model_pipeline.named_steps["classifier"]

    feature_names = preprocessor.get_feature_names_out().tolist()
    importances = classifier.feature_importances_

    aggregated = _aggregate_pipeline_importances(
        transformed_feature_names=feature_names,
        importances=importances,
        original_features=bundle["model_features"],
    )

    return aggregated[:15]


def explain_local_real(target: str, payload: Dict, df: pd.DataFrame) -> Dict[str, float]:
    bundle = _get_lime_bundle(df, target)

    feature_names = bundle["feature_names"]
    label_encoders = bundle["label_encoders"]
    model = bundle["model"]
    explainer = bundle["explainer"]

    normalized_payload = _normalize_payload_values(payload, feature_names, df)
    input_df = _build_complete_input_df(normalized_payload, feature_names, df)
    input_df = _encode_for_lime(input_df, label_encoders)

    input_array = input_df.values[0]
    contributions = _lime_vector_for_instance(
        input_array=input_array,
        model=model,
        explainer=explainer,
        feature_names=feature_names,
        num_features=len(feature_names),
    )

    return {
        feature_names[i]: float(np.round(contributions[i], 3))
        for i in range(len(feature_names))
    }


def get_strategy_profiles(lime_norm, X, y_test, n_strategies=3):
    kmeans = KMeans(n_clusters=n_strategies, random_state=42)
    strategy_labels = kmeans.fit_predict(lime_norm)

    strategy_profiles = []

    for i in range(n_strategies):
        idx = np.where(strategy_labels == i)[0]
        if len(idx) == 0:
            continue

        group_lime = lime_norm[idx]
        mean_importance = np.mean(group_lime, axis=0)

        top_indices = np.argsort(np.abs(mean_importance))[::-1]

        top_features = [
            {
                "name": X.columns[j],
                "importance": float(mean_importance[j]),
            }
            for j in top_indices
        ]

        success_rate = float((y_test.iloc[idx] == 2).mean() * 100)

        strategy_profiles.append({
            "name": f"Strategy {i + 1}",
            "count": int(len(idx)),
            "success_pct": round(success_rate, 1),
            "features": top_features,
        })

    return strategy_profiles, strategy_labels


def generate_counterfactual_real(
    target: str,
    payload: Dict,
    df: pd.DataFrame,
    target_level: Optional[str] = None,
) -> List[dict]:
    bundle = _get_model_bundle(df, target)

    desired_class_map = {"LOW": 0, "MEDIUM": 1, "HIGH": 2}
    desired_class = desired_class_map.get(target_level, 1)

    normalized_payload = _normalize_payload_values(payload, bundle["model_features"], df)
    query_instance = _build_complete_input_df(normalized_payload, bundle["model_features"], df)

    current_study_hours = query_instance.study_hours[0]

    cf = bundle["dice"].generate_counterfactuals(
        query_instance,
        total_CFs=3,
        desired_class=desired_class,
        features_to_vary=bundle["actionable_features"],
        permitted_range={
            "sleep_hours": [7, 9],
            "study_hours": [current_study_hours, 12],
        }
    )

    query_df = cf.cf_examples_list[0].test_instance_df
    cfs_df = cf.cf_examples_list[0].final_cfs_df

    options = []
    for i in range(len(cfs_df)):
        row = cfs_df.iloc[i]
        changes = []

        for col in bundle["actionable_features"]:
            original = query_df[col].iloc[0]
            new = row[col]

            if str(original) != str(new):
                changes.append({
                    "feature": col,
                    "current_value": _safe_item(original),
                    "suggested_value": _safe_item(new),
                })

        predicted_class = (
            int(row[bundle["category_col"]])
            if bundle["category_col"] in row
            else desired_class
        )

        options.append({
            "option": i + 1,
            "changes": changes,
            "effort": ["Low", "Medium", "High"][min(i, 2)],
            "new_level": _map_class_to_level(predicted_class),
        })

    return options


def _precomputed_lime_to_matrix(raw_contributions, feature_names: List[str]) -> np.ndarray:
    rows = []

    for item in raw_contributions:
        if isinstance(item, dict):
            rows.append([float(item.get(feature, 0.0)) for feature in feature_names])
        else:
            rows.append([float(v) for v in item])

    return np.asarray(rows, dtype=float)


def compute_strategy_atlas(df: pd.DataFrame, target: str) -> Dict:
    _validate_target(target)

    cache_key = f"strategy_atlas_{target}"
    if cache_key in _strategy_cache:
        return _strategy_cache[cache_key]

    precomputed = load_precomputed_strategy_atlas(target)
    if precomputed is not None:
        lime_bundle = _get_lime_bundle(df, target)

        X = lime_bundle["X_test"].reset_index(drop=True)
        y_test = lime_bundle["y_test"].reset_index(drop=True)

        feature_names = lime_bundle["feature_names"]

        lime_contributions = _precomputed_lime_to_matrix(
            precomputed["lime_contributions"],
            feature_names,
        )

        strategy_profiles, _ = get_strategy_profiles(
            lime_norm=lime_contributions,
            X=X,
            y_test=y_test,
            n_strategies=3,
        )

        result = {
            "points": precomputed["points"],
            "background": precomputed["background"],
            "strategy_profiles": strategy_profiles,
            "used_placeholder_model": False,
            "strategy_umap": None,
        }

        _strategy_cache[cache_key] = result
        return result

    if cache_key not in _strategy_locks:
        _strategy_locks[cache_key] = threading.Lock()

    with _strategy_locks[cache_key]:
        if cache_key in _strategy_cache:
            return _strategy_cache[cache_key]

        train_df = _prepare_training_df(df, target)
        lime_bundle = _get_lime_bundle(df, target)

        feature_names = lime_bundle["feature_names"]
        label_encoders = lime_bundle["label_encoders"]
        model = lime_bundle["model"]
        explainer = lime_bundle["explainer"]

        raw_X = lime_bundle["X_test"].copy()
        test_idx = raw_X.index
        raw_rows = train_df.loc[test_idx].copy()

        X = raw_X.reset_index(drop=True)
        raw_rows = raw_rows.reset_index(drop=True)

        X_encoded = _encode_dataframe_for_lime(X, label_encoders)

        lime_matrix = np.zeros((len(X_encoded), len(feature_names)))

        for i in range(len(X_encoded)):
            instance = X_encoded.iloc[i].values
            lime_matrix[i] = _lime_vector_for_instance(
                input_array=instance,
                model=model,
                explainer=explainer,
                feature_names=feature_names,
                num_features=len(feature_names),
                num_samples=None,
            )

        strategy_umap = ParametricUMAP(
            n_components=2,
            random_state=42,
            n_epochs=200,
        )
        embedding = strategy_umap.fit_transform(lime_matrix)

        strategy_profiles, cluster_labels = get_strategy_profiles(
            lime_norm=lime_matrix,
            X=X,
            y_test=lime_bundle["y_test"].reset_index(drop=True),
            n_strategies=3,
        )

        inverse_model = keras.Sequential([
            keras.layers.Input(shape=(2,)),
            keras.layers.Dense(128, activation="relu"),
            keras.layers.Dense(128, activation="relu"),
            keras.layers.Dense(len(feature_names), activation="linear"),
        ])
        inverse_model.compile(optimizer="adam", loss="mse")
        inverse_model.fit(
            embedding,
            lime_matrix,
            epochs=50,
            batch_size=32,
            verbose=0,
        )

        grid_res = 100
        x_range = np.linspace(embedding[:, 0].min() - 1, embedding[:, 0].max() + 1, grid_res)
        y_range = np.linspace(embedding[:, 1].min() - 1, embedding[:, 1].max() + 1, grid_res)
        xx, yy = np.meshgrid(x_range, y_range)
        grid_pts = np.c_[xx.ravel(), yy.ravel()]

        synth_importance = inverse_model.predict(grid_pts, verbose=0)
        dominant_feat_idx = np.argmax(np.abs(synth_importance), axis=1)
        zz = dominant_feat_idx.reshape(xx.shape)

        points = []
        for i, row in raw_rows.iterrows():
            points.append({
                "id": int(row["student_id"]) if "student_id" in row else int(i),
                "x": float(embedding[i, 0]),
                "y": float(embedding[i, 1]),
                "cluster": int(cluster_labels[i]),
                "burnout_level": float(row["burnout_level"]),
                "productivity_score": float(row["productivity_score"]),
                "exam_score": float(row["exam_score"]),
                "mental_health_score": float(row["mental_health_score"]),
                "focus_index": float(row["focus_index"]),
                "age": int(row["age"]),
                "gender": str(row["gender"]),
                "academic_level": str(row["academic_level"]),
                "study_hours": float(row["study_hours"]),
                "self_study_hours": float(row["self_study_hours"]),
                "online_classes_hours": float(row["online_classes_hours"]),
                "social_media_hours": float(row["social_media_hours"]),
                "gaming_hours": float(row["gaming_hours"]),
                "sleep_hours": float(row["sleep_hours"]),
                "screen_time_hours": float(row["screen_time_hours"]),
                "exercise_minutes": float(row["exercise_minutes"]),
                "caffeine_intake_mg": float(row["caffeine_intake_mg"]),
                "part_time_job": int(row["part_time_job"]),
                "upcoming_deadline": int(row["upcoming_deadline"]),
                "internet_quality": str(row["internet_quality"]),
            })

        background = {
            "x_range": x_range.tolist(),
            "y_range": y_range.tolist(),
            "z": zz.tolist(),
            "feature_labels": feature_names,
        }

        result = {
            "points": points,
            "background": background,
            "feature_names": feature_names,
            "strategy_umap": strategy_umap,
            "strategy_profiles": strategy_profiles,
            "used_placeholder_model": False,
        }

        _strategy_cache[cache_key] = result
        return result


def project_hypothetical_strategy_point(
    df: pd.DataFrame,
    target: str,
    payload: Dict,
) -> Dict[str, float]:
    _validate_target(target)

    precomputed = load_precomputed_strategy_atlas(target)

    lime_bundle = _get_lime_bundle(df, target)
    feature_names = lime_bundle["feature_names"]
    label_encoders = lime_bundle["label_encoders"]
    model = lime_bundle["model"]
    explainer = lime_bundle["explainer"]

    train_df = _prepare_training_df(df, target)
    cfg = _get_feature_config(train_df, target)

    input_df = _build_complete_input_df(payload, cfg["model_features"], train_df)
    input_df = input_df.reindex(columns=feature_names)
    input_df = _encode_dataframe_for_lime(input_df, label_encoders)

    input_array = input_df.values[0]

    hypo_lime = _lime_vector_for_instance(
        input_array=input_array,
        model=model,
        explainer=explainer,
        feature_names=feature_names,
        num_features=len(feature_names),
        num_samples=None,
    )

    if precomputed is not None:
        hypo_2d = precomputed["encoder"].predict(hypo_lime.reshape(1, -1), verbose=0)
    else:
        cache_key = f"strategy_atlas_{target}"
        if cache_key not in _strategy_cache:
            compute_strategy_atlas(df, target)

        strategy_umap = _strategy_cache[cache_key]["strategy_umap"]
        hypo_2d = strategy_umap.transform(hypo_lime.reshape(1, -1))

    return {
        "x": float(hypo_2d[0, 0]),
        "y": float(hypo_2d[0, 1]),
    }


def summarize_cluster_real(df: pd.DataFrame, target: str, cluster_id: int) -> Dict:
    _validate_target(target)

    cache_key = f"strategy_atlas_{target}"
    if cache_key not in _strategy_cache:
        compute_strategy_atlas(df, target)

    cache = _strategy_cache[cache_key]
    points = cache["points"]

    subset = [p for p in points if int(p["cluster"]) == int(cluster_id)]

    if not subset:
        return {
            "cluster_id": cluster_id,
            "size": 0,
            "avg_productivity": 0.0,
            "avg_burnout": 0.0,
            "avg_exam_score": 0.0,
            "avg_mental_health_score": 0.0,
            "avg_focus_index": 0.0,
            "top_features": [],
            "used_placeholder_model": False,
        }

    return {
        "cluster_id": int(cluster_id),
        "size": int(len(subset)),
        "avg_productivity": round(float(np.mean([p["productivity_score"] for p in subset])), 2),
        "avg_burnout": round(float(np.mean([p["burnout_level"] for p in subset])), 2),
        "avg_exam_score": round(float(np.mean([p["exam_score"] for p in subset])), 2),
        "avg_mental_health_score": round(float(np.mean([p["mental_health_score"] for p in subset])), 2),
        "avg_focus_index": round(float(np.mean([p["focus_index"] for p in subset])), 2),
        "top_features": [],
        "used_placeholder_model": False,
    }