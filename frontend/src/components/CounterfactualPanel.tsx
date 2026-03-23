import { useState } from "react";

type Prediction = {
  stressLevel: string;
  confidence: string;
  currentLevel: string;
  targetLevel: string;
  advice: string[];
};

type Props = {
  prediction: Prediction;
  onPredict: (values: Record<string, string>) => void;
};

export default function CounterfactualPanel({ prediction, onPredict }: Props) {
  const [activeTab, setActiveTab] = useState<"whatif" | "counterfactuals">("whatif");

  const [values, setValues] = useState<Record<string, string>>({
    Gender: "Male",
    Age: "18 - 25",
    "Study hours": "0 - 5",
    "Phone usage": "0 - 2",
    "Social media hrs": "",
    "YouTube hrs": "",
    "Gaming hours": "",
  });

  const handleChange = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="counterfactual-panel">
      <div className="counterfactual-tabs">
        <button
          className={`tab-button ${activeTab === "whatif" ? "active" : ""}`}
          onClick={() => setActiveTab("whatif")}
        >
          What-If
        </button>
        <button
          className={`tab-button ${activeTab === "counterfactuals" ? "active" : ""}`}
          onClick={() => setActiveTab("counterfactuals")}
        >
          Counterfactuals
        </button>
      </div>

      <div className="counterfactual-content">
        {activeTab === "whatif" ? (
          <div className="whatif-content">
            <p className="panel-description">
              Adjust values like sleep, study time, or phone usage to see how the
              prediction changes. The system updates the outcome and shows where the
              student would move in the UMAP.
            </p>

            <div className="input-grid">
              {Object.entries(values).map(([label, value]) => (
                <div className="input-row" key={label}>
                  <label>{label}</label>
                  <span className="equals-sign">=</span>
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => handleChange(label, e.target.value)}
                  />
                </div>
              ))}
            </div>

            <button className="simulate-button" onClick={() => onPredict(values)}>
              Simulate
            </button>

            <div className="prediction-box">
              <h4>Prediction</h4>
              <p>Stress level: {prediction.stressLevel}</p>
              <p>Confidence: {prediction.confidence}</p>
            </div>
          </div>
        ) : (
          <div className="counterfactuals-content">
            <div className="prediction-box">
              <h4>Counterfactual Recommendation</h4>
              <p>
                Current level: <strong>{prediction.currentLevel}</strong>
              </p>
              <p>
                Target level: <strong>{prediction.targetLevel}</strong>
              </p>
            </div>

            <div className="advice-box">
              <h4>Suggested changes</h4>
              <ul>
                {prediction.advice.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}