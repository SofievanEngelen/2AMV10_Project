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
            }
        )

    return points


def get_global_feature_importance_placeholder(target: str) -> List[dict]:
    by_target = {
        "burnout_level": [
            ("Sleep_Hours", 0.20),
            ("Social_Media_Usage_Hours", 0.18),
            ("Notification_Frequency", 0.16),
            ("Gaming_Hours", 0.12),
            ("Study_Hours_Per_Day", 0.10),
            ("Focus_Score", 0.09),
            ("Smartphone_Usage_Hours", 0.08),
            ("Attendance_Percentage", 0.04),
            ("Assignment_Completion_Rate", 0.03),
        ],
        "productivity_score": [
            ("Sleep_Hours", 0.19),
            ("Focus_Score", 0.17),
            ("Study_Hours_Per_Day", 0.15),
            ("Notification_Frequency", 0.11),
            ("Smartphone_Usage_Hours", 0.10),
            ("Social_Media_Usage_Hours", 0.09),
            ("Attendance_Percentage", 0.08),
            ("Assignment_Completion_Rate", 0.07),
            ("Gaming_Hours", 0.04),
        ],
        "exam_score": [
            ("Focus_Score", 0.20),
            ("Study_Hours_Per_Day", 0.18),
            ("Assignment_Completion_Rate", 0.15),
            ("Attendance_Percentage", 0.12),
            ("Sleep_Hours", 0.11),
            ("Social_Media_Usage_Hours", 0.08),
            ("Gaming_Hours", 0.07),
            ("Notification_Frequency", 0.05),
            ("Smartphone_Usage_Hours", 0.04),
        ],
    }
    values = by_target[target]
    return [{"feature": f, "importance": v} for f, v in values]


def predict_placeholder(target: str, payload: Dict) -> Dict:
    if target == "burnout_level":
        value = (
            payload["Social_Media_Usage_Hours"] * 3
            + payload["Gaming_Hours"] * 2
            + payload["Notification_Frequency"] * 0.1
            - payload["Sleep_Hours"] * 2
            - payload["Study_Hours_Per_Day"] * 1.5
        )
        value = max(0.0, min(100.0, value))
        confidence = 0.77

    elif target == "productivity_score":
        value = (
            payload["Sleep_Hours"] * 6
            + payload["Study_Hours_Per_Day"] * 5
            + payload["Focus_Score"] * 0.5
            + payload["Attendance_Percentage"] * 0.2
            - payload["Social_Media_Usage_Hours"] * 3
            - payload["Gaming_Hours"] * 2
        )
        value = max(0.0, min(100.0, value))
        confidence = 0.78

    elif target == "exam_score":
        productivity_proxy = (
            payload["Sleep_Hours"] * 5
            + payload["Study_Hours_Per_Day"] * 5
            + payload["Focus_Score"] * 0.4
            - payload["Social_Media_Usage_Hours"] * 2
            - payload["Gaming_Hours"] * 1.5
        )
        value = (
            productivity_proxy * 0.55
            + payload["Focus_Score"] * 0.30
            + payload["Assignment_Completion_Rate"] * 0.15
        )
        value = max(0.0, min(100.0, value))
        confidence = 0.76

    else:
        raise ValueError(f"Unsupported target: {target}")

    return {
        "target": target,
        "predicted_value": round(value, 2),
        "confidence": confidence,
        "used_placeholder_model": True,
    }


def explain_local_placeholder(target: str, payload: Dict) -> Dict[str, float]:
    if target == "burnout_level":
        return {
            "Sleep_Hours": round((7.5 - payload["Sleep_Hours"]) * 3.2, 2),
            "Study_Hours_Per_Day": round((4.0 - payload["Study_Hours_Per_Day"]) * 1.8, 2),
            "Social_Media_Usage_Hours": round(payload["Social_Media_Usage_Hours"] * 2.5, 2),
            "Gaming_Hours": round(payload["Gaming_Hours"] * 1.8, 2),
            "Notification_Frequency": round(payload["Notification_Frequency"] * 0.08, 2),
            "Focus_Score": round((65 - payload["Focus_Score"]) * 0.12, 2),
        }

    if target == "productivity_score":
        return {
            "Sleep_Hours": round((payload["Sleep_Hours"] - 7.0) * 4.0, 2),
            "Study_Hours_Per_Day": round((payload["Study_Hours_Per_Day"] - 4.0) * 3.0, 2),
            "Smartphone_Usage_Hours": round((5.0 - payload["Smartphone_Usage_Hours"]) * 2.5, 2),
            "Social_Media_Usage_Hours": round((2.0 - payload["Social_Media_Usage_Hours"]) * 2.0, 2),
            "Gaming_Hours": round((1.0 - payload["Gaming_Hours"]) * 1.5, 2),
            "Notification_Frequency": round((40 - payload["Notification_Frequency"]) * 0.15, 2),
            "Focus_Score": round((payload["Focus_Score"] - 65) * 0.35, 2),
            "Attendance_Percentage": round((payload["Attendance_Percentage"] - 80) * 0.12, 2),
            "Assignment_Completion_Rate": round((payload["Assignment_Completion_Rate"] - 80) * 0.12, 2),
        }

    if target == "exam_score":
        return {
            "Study_Hours_Per_Day": round((payload["Study_Hours_Per_Day"] - 4.0) * 3.0, 2),
            "Focus_Score": round((payload["Focus_Score"] - 65) * 0.40, 2),
            "Assignment_Completion_Rate": round((payload["Assignment_Completion_Rate"] - 80) * 0.18, 2),
            "Attendance_Percentage": round((payload["Attendance_Percentage"] - 80) * 0.15, 2),
            "Sleep_Hours": round((payload["Sleep_Hours"] - 7.0) * 1.8, 2),
            "Social_Media_Usage_Hours": round((2.0 - payload["Social_Media_Usage_Hours"]) * 1.4, 2),
        }

    raise ValueError(f"Unsupported target: {target}")


def generate_counterfactual_placeholder(target: str, payload: Dict) -> List[dict]:
    suggestions = []

    if target == "burnout_level":
        if payload["Sleep_Hours"] < 8:
            suggestions.append({
                "feature": "Sleep_Hours",
                "current_value": payload["Sleep_Hours"],
                "suggested_value": min(8.0, payload["Sleep_Hours"] + 1.0),
                "expected_effect": "Lower predicted burnout",
            })
        if payload["Notification_Frequency"] > 30:
            suggestions.append({
                "feature": "Notification_Frequency",
                "current_value": payload["Notification_Frequency"],
                "suggested_value": max(20, payload["Notification_Frequency"] - 15),
                "expected_effect": "Reduce overload and lower burnout",
            })
        if payload["Social_Media_Usage_Hours"] > 2:
            suggestions.append({
                "feature": "Social_Media_Usage_Hours",
                "current_value": payload["Social_Media_Usage_Hours"],
                "suggested_value": round(max(1.0, payload["Social_Media_Usage_Hours"] - 1.0), 1),
                "expected_effect": "Lower predicted burnout",
            })

    elif target == "productivity_score":
        if payload["Sleep_Hours"] < 8:
            suggestions.append({
                "feature": "Sleep_Hours",
                "current_value": payload["Sleep_Hours"],
                "suggested_value": min(8.0, payload["Sleep_Hours"] + 1.0),
                "expected_effect": "Increase predicted productivity",
            })
        if payload["Smartphone_Usage_Hours"] > 4:
            suggestions.append({
                "feature": "Smartphone_Usage_Hours",
                "current_value": payload["Smartphone_Usage_Hours"],
                "suggested_value": round(max(2.5, payload["Smartphone_Usage_Hours"] - 1.5), 1),
                "expected_effect": "Improve focus and productivity",
            })
        if payload["Focus_Score"] < 75:
            suggestions.append({
                "feature": "Focus_Score",
                "current_value": payload["Focus_Score"],
                "suggested_value": min(80.0, payload["Focus_Score"] + 8.0),
                "expected_effect": "Increase predicted productivity",
            })

    elif target == "exam_score":
        if payload["Study_Hours_Per_Day"] < 6:
            suggestions.append({
                "feature": "Study_Hours_Per_Day",
                "current_value": payload["Study_Hours_Per_Day"],
                "suggested_value": round(min(6.0, payload["Study_Hours_Per_Day"] + 1.0), 1),
                "expected_effect": "Increase predicted exam score",
            })
        if payload["Assignment_Completion_Rate"] < 95:
            suggestions.append({
                "feature": "Assignment_Completion_Rate",
                "current_value": payload["Assignment_Completion_Rate"],
                "suggested_value": min(95.0, payload["Assignment_Completion_Rate"] + 5.0),
                "expected_effect": "Increase predicted exam score",
            })
        if payload["Sleep_Hours"] < 8:
            suggestions.append({
                "feature": "Sleep_Hours",
                "current_value": payload["Sleep_Hours"],
                "suggested_value": min(8.0, payload["Sleep_Hours"] + 1.0),
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