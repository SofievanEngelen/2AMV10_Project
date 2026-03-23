import "./App.css";
import { useMemo, useState } from "react";
import UmapPanel from "./components/UmapPanel";
import ClusterPanel from "./components/ClusterPanel";
import FeatureImportancePanel from "./components/FeatureImportancePanel";
import CounterfactualPanel from "./components/CounterfactualPanel";

export type StudentPoint = {
  id: string;
  x: number;
  y: number;
  stress: number;
  productivity: number;
  sleep: number;
  study_hours: number;
  phone_usage: number;
};

type SelectionState =
  | { type: "none" }
  | { type: "point"; point: StudentPoint }
  | { type: "cluster"; points: StudentPoint[] };

export default function Dashboard() {
  const [target, setTarget] = useState("stress");
  const [colourBy, setColourBy] = useState("stress");
  const [selection, setSelection] = useState<SelectionState>({ type: "none" });

  const [prediction, setPrediction] = useState({
    stressLevel: "MEDIUM",
    confidence: "High",
    currentLevel: "MEDIUM",
    targetLevel: "LOW",
    advice: ["+2 hours of sleep", "+1 hour less phone use"],
  });

  const handlePredict = (values: Record<string, string>) => {
    console.log("Predict with values:", values);

    setPrediction({
      stressLevel: "MEDIUM",
      confidence: "High",
      currentLevel: "MEDIUM",
      targetLevel: "LOW",
      advice: ["+2 hours of sleep", "+1 hour less phone use"],
    });
  };

  const data: StudentPoint[] = useMemo(
    () => [
      { id: "s1", x: 1.2, y: 5.1, stress: 0.8, productivity: 0.4, sleep: 6, study_hours: 2, phone_usage: 5 },
      { id: "s2", x: 1.1, y: 5.6, stress: 0.7, productivity: 0.5, sleep: 7, study_hours: 3, phone_usage: 4 },
      { id: "s3", x: 8.7, y: 4.8, stress: 0.2, productivity: 0.9, sleep: 8, study_hours: 4, phone_usage: 2 },
      { id: "s4", x: 8.9, y: 5.3, stress: 0.3, productivity: 0.8, sleep: 7, study_hours: 5, phone_usage: 2 },
    ],
    []
  );

  return (
    <div className="app-shell">
      <header className="header">
        <div className="header-left">
          <span className="logo">🧠</span>
          <span className="title">Academic AdvAIsor</span>
        </div>

        <div className="header-right">
          <span className="label">Target:</span>
          <select
            className="target-select"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          >
            <option value="stress">Stress level</option>
            <option value="productivity">Productivity</option>
          </select>
        </div>
      </header>

      <main className="dashboard-grid">
        <section className="column-shell">
          <div className="column-header">UMAP</div>
          <div className="column-body">
            <UmapPanel
              data={data}
              colourBy={colourBy}
              onColourByChange={setColourBy}
              selection={selection}
              onPointSelect={(point) => setSelection({ type: "point", point })}
              onClusterSelect={(points) =>
                setSelection(
                  points.length === 0
                    ? { type: "none" }
                    : points.length === 1
                      ? { type: "point", point: points[0] }
                      : { type: "cluster", points }
                )
              }
              onClearSelection={() => setSelection({ type: "none" })}
            />
          </div>
        </section>

        <section className="column-shell">
          <div className="middle-column-body">
            <div className="subcolumn-shell">
              <div className="column-header">
                {selection.type === "point"
                  ? "Student analysis"
                  : selection.type === "cluster"
                  ? "Cluster analysis"
                  : "Global analysis"}
              </div>

              <div className="subcolumn-body">
                <ClusterPanel selection={selection} allData={data} />
              </div>
            </div>

            {/* Feature importance */}
            <div className="subcolumn-shell">
              <div className="column-header">Feature importance</div>

              <div className="subcolumn-body">
                <FeatureImportancePanel selection={selection} />
              </div>
            </div>
          </div>
        </section>

        <section className="column-shell">
          <div className="column-header">What-If analysis</div>
          <div className="column-body">
            <CounterfactualPanel
              prediction={prediction}
              onPredict={handlePredict}
            />
          </div>
        </section>
      </main>
    </div>
  );
}