import "./App.css";
import { useEffect, useMemo, useState } from "react";
import UmapPanel from "./components/UmapPanel";
import ClusterPanel from "./components/ClusterPanel";
import FeatureImportancePanel from "./components/FeatureImportancePanel";
import CounterfactualPanel from "./components/CounterfactualPanel";
import {
  fetchClusterSummary,
  fetchCounterfactuals,
  fetchFeatureImportance,
  fetchLocalExplanation,
  fetchPrediction,
  fetchUmap,
} from "./api/client";
import type {
  BackendPredictionInput,
  ClusterSummaryResponse,
  CounterfactualResponse,
  FeatureImportanceItem,
  LocalExplanationResponse,
  PredictionResponse,
  Target,
} from "./api/types";

export type StudentPoint = {
  id: string;
  x: number;
  y: number;
  cluster?: number;

  // targets
  burnout_level: number;
  productivity_score: number;
  exam_score: number;

  // features
  age: number;
  gender: string;
  academic_level: string;
  study_hours: number;
  self_study_hours: number;
  online_classes_hours: number;
  social_media_hours: number;
  gaming_hours: number;
  sleep_hours: number;
  screen_time_hours: number;
  exercise_minutes: number;
  caffeine_intake_mg: number;
  part_time_job: number;
  upcoming_deadline: number;
  internet_quality: string;
  mental_health_score: number;
  focus_index: number;
};

type SelectionState =
  | { type: "none" }
  | { type: "point"; point: StudentPoint }
  | { type: "cluster"; points: StudentPoint[] };

type LegacyPrediction = {
  stressLevel: string;
  confidence: string;
  currentLevel: string;
  targetLevel: string;
  advice: string[];
};

const defaultInputs: BackendPredictionInput = {
  age: 21,
  gender: "Female",
  academic_level: "Undergraduate",
  study_hours: 4,
  self_study_hours: 2,
  online_classes_hours: 2,
  social_media_hours: 2.5,
  gaming_hours: 1,
  sleep_hours: 7,
  screen_time_hours: 6,
  exercise_minutes: 45,
  caffeine_intake_mg: 120,
  part_time_job: 0,
  upcoming_deadline: 1,
  internet_quality: "Good",
  mental_health_score: 7,
  focus_index: 70,
};

export default function Dashboard() {
  const [target, setTarget] = useState("stress");
  const [colourBy, setColourBy] = useState("burnout_level");
  const [selection, setSelection] = useState<SelectionState>({ type: "none" });

  const [prediction, setPrediction] = useState<LegacyPrediction>({
    stressLevel: "MEDIUM",
    confidence: "High",
    currentLevel: "MEDIUM",
    targetLevel: "LOW",
    advice: ["+2 hours of sleep", "+1 hour less phone use"],
  });

  const [backendPrediction, setBackendPrediction] =
    useState<PredictionResponse | null>(null);
  const [localExplanation, setLocalExplanation] =
    useState<LocalExplanationResponse | null>(null);
  const [counterfactuals, setCounterfactuals] =
    useState<CounterfactualResponse | null>(null);
  const [featureImportance, setFeatureImportance] = useState<FeatureImportanceItem[]>([]);
  const [clusterSummary, setClusterSummary] = useState<ClusterSummaryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [backendData, setBackendData] = useState<StudentPoint[]>([]);

  useEffect(() => {
    async function loadUmap() {
      try {
        const res = await fetchUmap();

        setBackendData(
          res.points.map((p) => ({
            id: String(p.id),
            x: p.x,
            y: p.y,
            cluster: p.cluster,

            burnout_level: p.burnout_level,
            productivity_score: p.productivity_score,
            exam_score: p.exam_score,

            age: p.age,
            gender: p.gender,
            academic_level: p.academic_level,
            study_hours: p.study_hours,
            self_study_hours: p.self_study_hours,
            online_classes_hours: p.online_classes_hours,
            social_media_hours: p.social_media_hours,
            gaming_hours: p.gaming_hours,
            sleep_hours: p.sleep_hours,
            screen_time_hours: p.screen_time_hours,
            exercise_minutes: p.exercise_minutes,
            caffeine_intake_mg: p.caffeine_intake_mg,
            part_time_job: p.part_time_job,
            upcoming_deadline: p.upcoming_deadline,
            internet_quality: p.internet_quality,
            mental_health_score: p.mental_health_score,
            focus_index: p.focus_index,
          }))
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load UMAP");
      }
    }

    loadUmap();
  }, []);

  useEffect(() => {
    async function loadFeatureImportanceData() {
      try {
        const backendTarget = mapUiTargetToBackendTarget(target);
        const res = await fetchFeatureImportance(backendTarget);
        setFeatureImportance(res.global_importance);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load feature importance");
      }
    }

    loadFeatureImportanceData();
  }, [target]);

  useEffect(() => {
    async function loadClusterData() {
      if (selection.type !== "cluster" || selection.points.length === 0) {
        setClusterSummary(null);
        return;
      }

      const clusterId = selection.points[0].cluster;
      if (clusterId == null) {
        setClusterSummary(null);
        return;
      }

      try {
        const res = await fetchClusterSummary(clusterId);
        setClusterSummary(res);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load cluster summary");
      }
    }

    loadClusterData();
  }, [selection]);

  useEffect(() => {
    const backendTarget = mapUiTargetToBackendTarget(target);
    setColourBy(backendTarget);
  }, [target]);

  const handlePredict = async (values: Record<string, string>) => {
    try {
      setError(null);

      const inputs: BackendPredictionInput = {
  ...defaultInputs,
  gender: values["Gender"] || defaultInputs.gender,
  study_hours: parseRange(values["Study hours"], defaultInputs.study_hours),
  social_media_hours: parseNumber(
    values["Social media hrs"],
    defaultInputs.social_media_hours
  ),
  gaming_hours: parseNumber(values["Gaming hours"], defaultInputs.gaming_hours),
  sleep_hours: parseRange(values["Sleep"], defaultInputs.sleep_hours),
  screen_time_hours: parseRange(values["Phone usage"], defaultInputs.screen_time_hours),
};

      const backendTarget = mapUiTargetToBackendTarget(target);
      const payload = {
        target: backendTarget,
        inputs,
      };

      const [pred, explanation, cf] = await Promise.all([
        fetchPrediction(payload),
        fetchLocalExplanation(payload),
        fetchCounterfactuals(payload),
      ]);

      setBackendPrediction(pred);
      setLocalExplanation(explanation);
      setCounterfactuals(cf);

      setPrediction({
        stressLevel: formatPredictionLabel(target, pred.predicted_value),
        confidence: `${Math.round(pred.confidence * 100)}%`,
        currentLevel: formatPredictionLabel(target, pred.predicted_value),
        targetLevel: getTargetGoalLabel(target, pred.predicted_value),
        advice:
          cf.suggestions.length > 0
            ? cf.suggestions.map(
                (item) =>
                  `${prettyFeatureName(item.feature)}: ${item.current_value} → ${item.suggested_value}`
              )
            : ["No suggestion available"],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Prediction failed");
    }
  };

  const data: StudentPoint[] = useMemo(() => {
    if (backendData.length > 0) return backendData;

    return [
      {
        id: "s1",
        x: 1.2,
        y: 5.1,
        stress: 0.8,
        productivity: 0.4,
        sleep: 6,
        study_hours: 2,
        phone_usage: 5,
      },
      {
        id: "s2",
        x: 1.1,
        y: 5.6,
        stress: 0.7,
        productivity: 0.5,
        sleep: 7,
        study_hours: 3,
        phone_usage: 4,
      },
      {
        id: "s3",
        x: 8.7,
        y: 4.8,
        stress: 0.2,
        productivity: 0.9,
        sleep: 8,
        study_hours: 4,
        phone_usage: 2,
      },
      {
        id: "s4",
        x: 8.9,
        y: 5.3,
        stress: 0.3,
        productivity: 0.8,
        sleep: 7,
        study_hours: 5,
        phone_usage: 2,
      },
    ];
  }, [backendData]);

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
            <option value="stress">Burnout</option>
            <option value="productivity">Productivity</option>
            <option value="exam">Exam score</option>
          </select>
        </div>
      </header>

      {error ? (
        <div style={{ padding: "0 20px 10px 20px", color: "#b00020" }}>{error}</div>
      ) : null}

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
                <ClusterPanel
                  selection={selection}
                  allData={data}
                  clusterSummary={clusterSummary}
                />
              </div>
            </div>

            <div className="subcolumn-shell">
              <div className="column-header">Feature importance</div>

              <div className="subcolumn-body">
                <FeatureImportancePanel
                  selection={selection}
                  items={featureImportance}
                  localItems={localExplanation?.contributions ?? null}
                />
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

function mapUiTargetToBackendTarget(target: string): Target {
  switch (target) {
    case "productivity":
      return "productivity_score";
    case "exam":
      return "exam_score";
    case "stress":
    default:
      return "burnout_level";
  }
}

function parseRange(value: string | undefined, fallback: number) {
  if (!value) return fallback;
  const match = value.match(/(\d+)\s*-\s*(\d+)/);
  if (!match) return fallback;
  return (Number(match[1]) + Number(match[2])) / 2;
}

function parseNumber(value: string | undefined, fallback: number) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function formatPredictionLabel(target: string, value: number) {
  if (target === "productivity") return value.toFixed(2);
  if (value < 33) return "LOW";
  if (value < 66) return "MEDIUM";
  return "HIGH";
}

function getTargetGoalLabel(target: string, value: number) {
  if (target === "productivity") {
    if (value >= 75) return "HIGH";
    if (value >= 45) return "MEDIUM";
    return "LOW";
  }

  if (value < 33) return "LOW";
  if (value < 66) return "MEDIUM";
  return "HIGH";
}

function prettyFeatureName(name: string) {
  return name.replaceAll("_", " ");
}