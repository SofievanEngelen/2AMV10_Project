from typing import Dict, List
import pandas as pd


def compute_umap_placeholder(df: pd.DataFrame) -> List[dict]:
    x = (
        df["study_hours"] * 0.8
        + df["self_study_hours"] * 0.4
        + df["focus_index"] * 0.03
        - df["burnout_level"] * 0.02
    )

    y = (
        df["sleep_hours"] * 0.9
        - df["social_media_hours"] * 0.35
        - df["gaming_hours"] * 0.2
        - df["screen_time_hours"] * 0.1
        + df["exercise_minutes"] * 0.01
    )

    cluster = pd.qcut(
        df["productivity_score"].rank(method="first"),
        q=3,
        labels=False,
        duplicates="drop"
    )

    points = []
    for row, px, py, cl in zip(df.to_dict("records"), x, y, cluster):
        points.append(
            {
                "id": int(row["student_id"]),
                "x": float(px),
                "y": float(py),
                "cluster": int(cl) if pd.notna(cl) else 0,

                "burnout_level": float(row["burnout_level"]),
                "productivity_score": float(row["productivity_score"]),
                "exam_score": float(row["exam_score"]),

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
                "mental_health_score": float(row["mental_health_score"]),
                "focus_index": float(row["focus_index"]),
            }
        )

    return points


def get_global_feature_importance_placeholder(target: str) -> List[dict]:
    by_target = {
        "burnout_level": [
            ("sleep_hours", 0.20),
            ("social_media_hours", 0.18),
            ("screen_time_hours", 0.16),
            ("gaming_hours", 0.12),
            ("study_hours", 0.10),
            ("focus_index", 0.09),
            ("self_study_hours", 0.08),
            ("mental_health_score", 0.04),
            ("exercise_minutes", 0.03),
        ],
        "productivity_score": [
            ("sleep_hours", 0.19),
            ("focus_index", 0.17),
            ("study_hours", 0.15),
            ("self_study_hours", 0.11),
            ("screen_time_hours", 0.10),
            ("social_media_hours", 0.09),
            ("mental_health_score", 0.08),
            ("online_classes_hours", 0.07),
            ("gaming_hours", 0.04),
        ],
        "exam_score": [
            ("focus_index", 0.20),
            ("study_hours", 0.18),
            ("self_study_hours", 0.15),
            ("online_classes_hours", 0.12),
            ("sleep_hours", 0.11),
            ("mental_health_score", 0.08),
            ("gaming_hours", 0.07),
            ("social_media_hours", 0.05),
            ("screen_time_hours", 0.04),
        ],
    }

    values = by_target[target]
    return [{"feature": f, "importance": v} for f, v in values]

def predict_placeholder(target: str, payload: Dict) -> Dict:
    if target == "burnout_level":
        value = (
            20
            + payload["social_media_hours"] * 4.0
            + payload["gaming_hours"] * 3.0
            + payload["screen_time_hours"] * 1.5
            + payload["upcoming_deadline"] * 8.0
            - payload["sleep_hours"] * 2.2
            - payload["study_hours"] * 1.0
            - payload["mental_health_score"] * 1.8
            - payload["exercise_minutes"] * 0.03
        )
        confidence = 0.77

    elif target == "productivity_score":
        value = (
            25
            + payload["study_hours"] * 4.0
            + payload["self_study_hours"] * 3.0
            + payload["focus_index"] * 0.35
            + payload["mental_health_score"] * 2.0
            + payload["sleep_hours"] * 2.5
            - payload["social_media_hours"] * 2.0
            - payload["gaming_hours"] * 1.2
            - payload["screen_time_hours"] * 1.0
        )
        confidence = 0.78

    elif target == "exam_score":
        value = (
            20
            + payload["study_hours"] * 4.5
            + payload["self_study_hours"] * 2.5
            + payload["online_classes_hours"] * 1.5
            + payload["focus_index"] * 0.30
            + payload["mental_health_score"] * 1.2
            + payload["sleep_hours"] * 1.0
            - payload["social_media_hours"] * 1.0
            - payload["gaming_hours"] * 0.8
        )
        confidence = 0.76

    else:
        raise ValueError(f"Unsupported target: {target}")

    value = max(0.0, min(100.0, value))

    return {
        "target": target,
        "predicted_value": round(value, 2),
        "confidence": confidence,
        "used_placeholder_model": True,
    }


def explain_local_placeholder(target: str, payload: Dict) -> Dict[str, float]:
    contributions = {}

    if target == "burnout_level":
        contributions = {
            "sleep_hours": (7.5 - payload["sleep_hours"]) * 2.5,
            "social_media_hours": payload["social_media_hours"] * 2.0,
            "gaming_hours": payload["gaming_hours"] * 1.6,
            "screen_time_hours": payload["screen_time_hours"] * 1.2,
            "upcoming_deadline": payload["upcoming_deadline"] * 6.0,
            "mental_health_score": (5.0 - payload["mental_health_score"]) * 2.2,
            "exercise_minutes": -payload["exercise_minutes"] * 0.03,
            "focus_index": -payload["focus_index"] * 0.04,
        }

    elif target == "productivity_score":
        contributions = {
            "study_hours": (payload["study_hours"] - 4.0) * 3.0,
            "self_study_hours": (payload["self_study_hours"] - 2.0) * 2.2,
            "focus_index": payload["focus_index"] * 0.25,
            "sleep_hours": payload["sleep_hours"] * 1.8,
            "mental_health_score": payload["mental_health_score"] * 1.5,
            "social_media_hours": -payload["social_media_hours"] * 1.8,
            "gaming_hours": -payload["gaming_hours"] * 1.2,
            "screen_time_hours": -payload["screen_time_hours"] * 1.0,
        }

    elif target == "exam_score":
        contributions = {
            "study_hours": payload["study_hours"] * 3.5,
            "self_study_hours": payload["self_study_hours"] * 2.2,
            "online_classes_hours": payload["online_classes_hours"] * 1.5,
            "focus_index": payload["focus_index"] * 0.28,
            "sleep_hours": payload["sleep_hours"] * 1.2,
            "mental_health_score": payload["mental_health_score"] * 1.0,
            "social_media_hours": -payload["social_media_hours"] * 1.0,
            "gaming_hours": -payload["gaming_hours"] * 0.8,
        }

    else:
        raise ValueError(f"Unsupported target: {target}")

    # normalize for nicer visualization
    max_abs = max(abs(v) for v in contributions.values()) or 1

    contributions = {
        k: round(v / max_abs, 3)
        for k, v in contributions.items()
    }

    return contributions

def generate_counterfactual_placeholder(target: str, payload: Dict) -> List[dict]:
    suggestions = []

    if target == "burnout_level":
        if payload["sleep_hours"] < 8:
            suggestions.append({
                "feature": "sleep_hours",
                "current_value": payload["sleep_hours"],
                "suggested_value": min(8.0, payload["sleep_hours"] + 1.0),
                "expected_effect": "Lower predicted burnout",
            })
        if payload["social_media_hours"] > 2:
            suggestions.append({
                "feature": "social_media_hours",
                "current_value": payload["social_media_hours"],
                "suggested_value": round(max(1.0, payload["social_media_hours"] - 1.0), 1),
                "expected_effect": "Lower predicted burnout",
            })
        if payload["screen_time_hours"] > 5:
            suggestions.append({
                "feature": "screen_time_hours",
                "current_value": payload["screen_time_hours"],
                "suggested_value": round(max(4.0, payload["screen_time_hours"] - 1.0), 1),
                "expected_effect": "Reduce overload and burnout",
            })

    elif target == "productivity_score":
        if payload["study_hours"] < 6:
            suggestions.append({
                "feature": "study_hours",
                "current_value": payload["study_hours"],
                "suggested_value": round(min(6.0, payload["study_hours"] + 1.0), 1),
                "expected_effect": "Increase predicted productivity",
            })
        if payload["focus_index"] < 80:
            suggestions.append({
                "feature": "focus_index",
                "current_value": payload["focus_index"],
                "suggested_value": min(80.0, payload["focus_index"] + 8.0),
                "expected_effect": "Increase predicted productivity",
            })
        if payload["sleep_hours"] < 8:
            suggestions.append({
                "feature": "sleep_hours",
                "current_value": payload["sleep_hours"],
                "suggested_value": min(8.0, payload["sleep_hours"] + 1.0),
                "expected_effect": "Increase predicted productivity",
            })

    elif target == "exam_score":
        if payload["study_hours"] < 6:
            suggestions.append({
                "feature": "study_hours",
                "current_value": payload["study_hours"],
                "suggested_value": round(min(6.0, payload["study_hours"] + 1.0), 1),
                "expected_effect": "Increase predicted exam score",
            })
        if payload["self_study_hours"] < 3:
            suggestions.append({
                "feature": "self_study_hours",
                "current_value": payload["self_study_hours"],
                "suggested_value": round(min(3.0, payload["self_study_hours"] + 0.5), 1),
                "expected_effect": "Increase predicted exam score",
            })
        if payload["focus_index"] < 80:
            suggestions.append({
                "feature": "focus_index",
                "current_value": payload["focus_index"],
                "suggested_value": min(80.0, payload["focus_index"] + 8.0),
                "expected_effect": "Support better exam performance",
            })

    else:
        raise ValueError(f"Unsupported target: {target}")

    return suggestions[:3]

def summarize_cluster_placeholder(df: pd.DataFrame, cluster_id: int) -> Dict:
    cluster_df = df[df["cluster"] == cluster_id].copy()

    if cluster_df.empty:
        return {
            "cluster_id": cluster_id,
            "size": 0,
            "avg_productivity": 0.0,
            "avg_burnout": 0.0,
            "avg_exam_score": 0.0,
            "top_features": [],
            "used_placeholder_model": True,
        }

    return {
        "cluster_id": cluster_id,
        "size": int(len(cluster_df)),
        "avg_productivity": round(float(cluster_df["productivity_score"].mean()), 2),
        "avg_burnout": round(float(cluster_df["burnout_level"].mean()), 2),
        "avg_exam_score": round(float(cluster_df["exam_score"].mean()), 2),
        "top_features": [
            "sleep_hours",
            "focus_index",
            "social_media_hours",
        ],
        "used_placeholder_model": True,
    }