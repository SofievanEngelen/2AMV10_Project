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
            ("self_study_hours", 0.08),
            ("exercise_minutes", 0.03),
        ],
        "productivity_score": [
            ("sleep_hours", 0.19),
            ("study_hours", 0.15),
            ("self_study_hours", 0.11),
            ("screen_time_hours", 0.10),
            ("social_media_hours", 0.09),
            ("online_classes_hours", 0.07),
            ("gaming_hours", 0.04),
        ],
        "exam_score": [
            ("study_hours", 0.18),
            ("self_study_hours", 0.15),
            ("online_classes_hours", 0.12),
            ("sleep_hours", 0.11),
            ("gaming_hours", 0.07),
            ("social_media_hours", 0.05),
            ("screen_time_hours", 0.04),
        ],
        "mental_health_score": [
            ("sleep_hours", 0.22),
            ("exercise_minutes", 0.18),
            ("social_media_hours", 0.16),
            ("screen_time_hours", 0.14),
            ("gaming_hours", 0.10),
            ("study_hours", 0.08),
            ("upcoming_deadline", 0.07),
        ],
        "focus_index": [
            ("sleep_hours", 0.21),
            ("study_hours", 0.17),
            ("self_study_hours", 0.14),
            ("screen_time_hours", 0.13),
            ("social_media_hours", 0.11),
            ("gaming_hours", 0.09),
            ("exercise_minutes", 0.07),
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
            - payload["exercise_minutes"] * 0.03
        )
        confidence = 0.77

    elif target == "productivity_score":
        value = (
            25
            + payload["study_hours"] * 4.0
            + payload["self_study_hours"] * 3.0
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
            + payload["sleep_hours"] * 1.0
            - payload["social_media_hours"] * 1.0
            - payload["gaming_hours"] * 0.8
        )
        confidence = 0.76

    elif target == "mental_health_score":
        value = (
            55
            + payload["sleep_hours"] * 3.0
            + payload["exercise_minutes"] * 0.12
            - payload["social_media_hours"] * 2.5
            - payload["gaming_hours"] * 1.5
            - payload["screen_time_hours"] * 1.3
            - payload["upcoming_deadline"] * 6.0
        )
        confidence = 0.74

    elif target == "focus_index":
        value = (
            45
            + payload["sleep_hours"] * 3.0
            + payload["study_hours"] * 2.2
            + payload["self_study_hours"] * 1.4
            + payload["exercise_minutes"] * 0.08
            - payload["social_media_hours"] * 2.0
            - payload["gaming_hours"] * 1.4
            - payload["screen_time_hours"] * 1.5
        )
        confidence = 0.75

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
            "exercise_minutes": -payload["exercise_minutes"] * 0.03,
            "study_hours": -payload["study_hours"] * 0.8,
        }

    elif target == "productivity_score":
        contributions = {
            "study_hours": (payload["study_hours"] - 4.0) * 3.0,
            "self_study_hours": (payload["self_study_hours"] - 2.0) * 2.2,
            "sleep_hours": payload["sleep_hours"] * 1.8,
            "social_media_hours": -payload["social_media_hours"] * 1.8,
            "gaming_hours": -payload["gaming_hours"] * 1.2,
            "screen_time_hours": -payload["screen_time_hours"] * 1.0,
            "exercise_minutes": payload["exercise_minutes"] * 0.03,
        }

    elif target == "exam_score":
        contributions = {
            "study_hours": payload["study_hours"] * 3.5,
            "self_study_hours": payload["self_study_hours"] * 2.2,
            "online_classes_hours": payload["online_classes_hours"] * 1.5,
            "sleep_hours": payload["sleep_hours"] * 1.2,
            "social_media_hours": -payload["social_media_hours"] * 1.0,
            "gaming_hours": -payload["gaming_hours"] * 0.8,
        }

    elif target == "mental_health_score":
        contributions = {
            "sleep_hours": payload["sleep_hours"] * 2.2,
            "exercise_minutes": payload["exercise_minutes"] * 0.05,
            "social_media_hours": -payload["social_media_hours"] * 1.8,
            "gaming_hours": -payload["gaming_hours"] * 1.0,
            "screen_time_hours": -payload["screen_time_hours"] * 1.2,
            "upcoming_deadline": -payload["upcoming_deadline"] * 4.5,
        }

    elif target == "focus_index":
        contributions = {
            "sleep_hours": payload["sleep_hours"] * 2.0,
            "study_hours": payload["study_hours"] * 1.8,
            "self_study_hours": payload["self_study_hours"] * 1.4,
            "exercise_minutes": payload["exercise_minutes"] * 0.04,
            "social_media_hours": -payload["social_media_hours"] * 1.6,
            "gaming_hours": -payload["gaming_hours"] * 1.1,
            "screen_time_hours": -payload["screen_time_hours"] * 1.5,
        }

    else:
        raise ValueError(f"Unsupported target: {target}")

    max_abs = max(abs(v) for v in contributions.values()) or 1
    contributions = {k: round(v / max_abs, 3) for k, v in contributions.items()}
    return contributions


from typing import Dict, List
import copy


def generate_counterfactual_placeholder(target: str, payload: Dict) -> List[dict]:
    base_changes = []

    def add_change(feature, current, new):
        base_changes.append({
            "feature": feature,
            "current_value": current,
            "suggested_value": new,
        })

    # ---- Define possible improvements ----
    if target in [
        "burnout_level",
        "productivity_score",
        "exam_score",
        "mental_health_score",
        "focus_index",
    ]:

        # Sleep ↑
        if payload.get("sleep_hours", 0) < 8:
            add_change("sleep_hours", payload["sleep_hours"], min(8, payload["sleep_hours"] + 1))

        # Study ↑
        if payload.get("study_hours", 0) < 6:
            add_change("study_hours", payload["study_hours"], min(6, payload["study_hours"] + 1))

        # Social media ↓
        if payload.get("social_media_hours", 0) > 2:
            add_change("social_media_hours", payload["social_media_hours"], max(1, payload["social_media_hours"] - 1))

        # Phone usage ↓
        if payload.get("screen_time_hours", 0) > 5:
            add_change("screen_time_hours", payload["screen_time_hours"], max(4, payload["screen_time_hours"] - 1))

        # Exercise ↑
        if payload.get("exercise_minutes", 0) < 60:
            add_change("exercise_minutes", payload["exercise_minutes"], payload["exercise_minutes"] + 30)

    else:
        raise ValueError(f"Unsupported target: {target}")

    # Ensure we always have enough changes
    while len(base_changes) < 5:
        base_changes.append({
            "feature": "sleep_hours",
            "current_value": payload.get("sleep_hours", 6),
            "suggested_value": min(8, payload.get("sleep_hours", 6) + 1),
        })

    # Take top 5
    base_changes = base_changes[:5]

    # ---- Create 3 slightly different options ----
    options = []

    for i in range(3):
        changes_variant = copy.deepcopy(base_changes)

        # Slight variation per option
        for c in changes_variant:
            if i == 1 and isinstance(c["suggested_value"], (int, float)):
                c["suggested_value"] = round(c["suggested_value"] * 0.9, 1)
            elif i == 2 and isinstance(c["suggested_value"], (int, float)):
                c["suggested_value"] = round(c["suggested_value"] * 1.1, 1)

        options.append({
            "option": i + 1,
            "changes": changes_variant,
            "effort": ["Low", "Medium", "High"][i],
            "new_level": ["Medium", "Low", "Low"][i],
        })

    return options


def summarize_cluster_placeholder(df: pd.DataFrame, cluster_id: int) -> Dict:
    cluster_df = df[df["cluster"] == cluster_id].copy()

    if cluster_df.empty:
        return {
            "cluster_id": cluster_id,
            "size": 0,
            "avg_productivity": 0.0,
            "avg_burnout": 0.0,
            "avg_exam_score": 0.0,
            "avg_mental_health_score": 0.0,
            "avg_focus_index": 0.0,
            "top_features": [],
            "used_placeholder_model": True,
        }

    return {
        "cluster_id": cluster_id,
        "size": int(len(cluster_df)),
        "avg_productivity": round(float(cluster_df["productivity_score"].mean()), 2),
        "avg_burnout": round(float(cluster_df["burnout_level"].mean()), 2),
        "avg_exam_score": round(float(cluster_df["exam_score"].mean()), 2),
        "avg_mental_health_score": round(float(cluster_df["mental_health_score"].mean()), 2),
        "avg_focus_index": round(float(cluster_df["focus_index"].mean()), 2),
        "top_features": [
            "sleep_hours",
            "study_hours",
            "social_media_hours",
        ],
        "used_placeholder_model": True,
    }