import json
import requests

BASE = "http://127.0.0.1:8000"

# Base input (same for all targets)
base_inputs = {
    "Age": 21,
    "Gender": "Female",
    "Study_Hours_Per_Day": 4.0,
    "Study_Consistency": "Medium",
    "Preferred_Study_Time": "Evening",
    "Smartphone_Usage_Hours": 5.0,
    "Social_Media_Usage_Hours": 2.5,
    "Gaming_Hours": 1.0,
    "Notification_Frequency": 45,
    "Sleep_Hours": 7.0,
    "Physical_Activity_Level": "Moderate",
    "Focus_Score": 70.0,
    "Attendance_Percentage": 85.0,
    "Assignment_Completion_Rate": 88.0
}


def make_payload(target: str):
    return {
        "target": target,
        "inputs": base_inputs
    }


def test_endpoint(method, path, json_body=None):
    url = f"{BASE}{path}"

    try:
        if method == "GET":
            response = requests.get(url)
        else:
            response = requests.post(url, json=json_body)

        print(f"{method} {path} -> {response.status_code}")

        try:
            data = response.json()
            print(json.dumps(data, indent=2)[:1000])
        except Exception:
            print(response.text[:1000])

    except Exception as e:
        print(f"{method} {path} -> ERROR: {e}")

    print("-" * 60)


def test_target_flow(target: str):
    print(f"\n===== TESTING TARGET: {target} =====\n")

    payload = make_payload(target)

    test_endpoint("GET", f"/model/feature-importance/{target}")
    test_endpoint("POST", "/model/predict", payload)
    test_endpoint("POST", "/model/local-explanation", payload)
    test_endpoint("POST", "/model/counterfactual", payload)


def main():
    # Basic checks
    test_endpoint("GET", "/health")
    test_endpoint("GET", "/data")
    test_endpoint("GET", "/data/columns")
    test_endpoint("GET", "/debug/data-shape")

    # UMAP & clustering
    test_endpoint("GET", "/model/umap")
    test_endpoint("GET", "/model/cluster-summary/0")

    # Test all targets
    for target in ["burnout_level", "productivity_score", "exam_score"]:
        test_target_flow(target)


if __name__ == "__main__":
    main()