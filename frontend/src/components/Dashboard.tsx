import { useState } from "react";
import Plot from "react-plotly.js";
import { getPrediction, type PredictionResponse } from "../api/client";

export default function Dashboard() {
  const [form, setForm] = useState({
    study_hours: 4,
    sleep_hours: 7,
    smartphone_hours: 3,
    stress_level: 2,
  });

  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [error, setError] = useState("");

  async function handlePredict() {
    try {
      setError("");
      const data = await getPrediction(form);
      setResult(data);
    } catch (err) {
      setError("Could not get prediction.");
      console.error(err);
    }
  }

  function updateField(name: string, value: string) {
    setForm((prev) => ({
      ...prev,
      [name]: Number(value),
    }));
  }

  const shapKeys = result ? Object.keys(result.shap_values) : [];
  const shapValues = result ? Object.values(result.shap_values) : [];

  return (
    <div style={{ padding: "30px", fontFamily: "Arial, sans-serif" }}>
      <h1>Student Productivity Dashboard</h1>

      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: "24px" }}>
        <div style={card}>
          <h2>Inputs</h2>

          <label>
            Study hours
            <input
              type="number"
              value={form.study_hours}
              onChange={(e) => updateField("study_hours", e.target.value)}
              style={input}
            />
          </label>

          <label>
            Sleep hours
            <input
              type="number"
              value={form.sleep_hours}
              onChange={(e) => updateField("sleep_hours", e.target.value)}
              style={input}
            />
          </label>

          <label>
            Smartphone hours
            <input
              type="number"
              value={form.smartphone_hours}
              onChange={(e) => updateField("smartphone_hours", e.target.value)}
              style={input}
            />
          </label>

          <label>
            Stress level
            <input
              type="number"
              value={form.stress_level}
              onChange={(e) => updateField("stress_level", e.target.value)}
              style={input}
            />
          </label>

          <button onClick={handlePredict} style={button}>
            Run model
          </button>

          {result && (
            <div style={{ marginTop: "16px" }}>
              <p><strong>Score:</strong> {result.productivity_score}</p>
              <p><strong>Risk:</strong> {result.risk_level}</p>
            </div>
          )}

          {error && <p style={{ color: "crimson" }}>{error}</p>}
        </div>

        <div style={{ display: "grid", gap: "24px" }}>
          <div style={card}>
            <h2>Predicted Productivity</h2>
            {result && (
              <Plot
                data={[
                  {
                    x: ["Productivity Score"],
                    y: [result.productivity_score],
                    type: "bar",
                  },
                ]}
                layout={{
                  height: 300,
                  title: { text: "Model Prediction" },
                }}
                style={{ width: "100%" }}
              />
            )}
          </div>

          <div style={card}>
            <h2>Feature Importance</h2>
            {result && (
              <Plot
                data={[
                  {
                    x: shapValues,
                    y: shapKeys,
                    type: "bar",
                    orientation: "h",
                  },
                ]}
                layout={{
                  height: 400,
                  title: { text: "SHAP Values" },
                }}
                style={{ width: "100%" }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const card: React.CSSProperties = {
  background: "#fff",
  borderRadius: "12px",
  padding: "20px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
};

const input: React.CSSProperties = {
  display: "block",
  width: "100%",
  marginTop: "6px",
  marginBottom: "12px",
  padding: "8px",
  boxSizing: "border-box",
};

const button: React.CSSProperties = {
  padding: "10px 14px",
  cursor: "pointer",
};