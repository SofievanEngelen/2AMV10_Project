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

  burnout_level: number;
  productivity_score: number;
  exam_score: number;
  mental_health_score: number;
  focus_index: number;

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

export type CounterfactualChange = {
  feature: string;
  current_value: number | string;
  suggested_value: number | string;
};

export type CounterfactualOption = {
  option: number;
  changes: CounterfactualChange[];
  effort: string;
  new_level: string;
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
  const [counterfactualOptions, setCounterfactualOptions] = useState<
    CounterfactualOption[]
  >([]);
  const [featureImportance, setFeatureImportance] = useState<FeatureImportanceItem[]>([]);
  const [clusterSummary, setClusterSummary] = useState<ClusterSummaryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [backendData, setBackendData] = useState<StudentPoint[]>([]);
  const [latestInputs, setLatestInputs] = useState<BackendPredictionInput>(defaultInputs);

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
    async function loadSelectionExplanation() {
      if (selection.type === "none") {
        setLocalExplanation(null);
        return;
      }

      try {
        setError(null);

        const backendTarget = mapUiTargetToBackendTarget(target);

        const avg = (key: keyof StudentPoint) =>
          selection.points.reduce((sum, p) => sum + Number(p[key] ?? 0), 0) /
          selection.points.length;

        const inputs: BackendPredictionInput =
          selection.type === "point"
            ? {
                age: selection.point.age,
                gender: selection.point.gender,
                academic_level: selection.point.academic_level,
                study_hours: selection.point.study_hours,
                self_study_hours: selection.point.self_study_hours,
                online_classes_hours: selection.point.online_classes_hours,
                social_media_hours: selection.point.social_media_hours,
                gaming_hours: selection.point.gaming_hours,
                sleep_hours: selection.point.sleep_hours,
                screen_time_hours: selection.point.screen_time_hours,
                exercise_minutes: selection.point.exercise_minutes,
                caffeine_intake_mg: selection.point.caffeine_intake_mg,
                part_time_job: selection.point.part_time_job,
                upcoming_deadline: selection.point.upcoming_deadline,
                internet_quality: selection.point.internet_quality,
                mental_health_score: selection.point.mental_health_score,
                focus_index: selection.point.focus_index,
              }
            : {
                age: Math.round(avg("age")),
                gender: selection.points[0].gender,
                academic_level: selection.points[0].academic_level,
                study_hours: avg("study_hours"),
                self_study_hours: avg("self_study_hours"),
                online_classes_hours: avg("online_classes_hours"),
                social_media_hours: avg("social_media_hours"),
                gaming_hours: avg("gaming_hours"),
                sleep_hours: avg("sleep_hours"),
                screen_time_hours: avg("screen_time_hours"),
                exercise_minutes: Math.round(avg("exercise_minutes")),
                caffeine_intake_mg: Math.round(avg("caffeine_intake_mg")),
                part_time_job: Math.round(avg("part_time_job")),
                upcoming_deadline: Math.round(avg("upcoming_deadline")),
                internet_quality: selection.points[0].internet_quality,
                mental_health_score: avg("mental_health_score"),
                focus_index: avg("focus_index"),
              };

        const explanation = await fetchLocalExplanation({
          target: backendTarget,
          inputs,
        });

        setLocalExplanation(explanation);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load local explanation"
        );
      }
    }

    loadSelectionExplanation();
  }, [selection, target]);

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
    setBackendPrediction(null);
    setLocalExplanation(null);
    setCounterfactualOptions([]);
    setClusterSummary(null);
    setError(null);

    setPrediction({
      stressLevel: "-",
      confidence: "-",
      currentLevel: "-",
      targetLevel: "LOW",
      advice: [],
    });
  }, [target]);

  const handlePredict = async (values: Record<string, string>) => {
    try {
      setError(null);

      const inputs: BackendPredictionInput = {
  age: parseInt(values.age ?? `${defaultInputs.age}`, 10),
  gender: values.gender || defaultInputs.gender,
  academic_level: values.academic_level || defaultInputs.academic_level,
  study_hours: parseNumber(values.study_hours, defaultInputs.study_hours),
  self_study_hours: parseNumber(
    values.self_study_hours,
    defaultInputs.self_study_hours
  ),
  online_classes_hours: parseNumber(
    values.online_classes_hours,
    defaultInputs.online_classes_hours
  ),
  social_media_hours: parseNumber(
    values.social_media_hours,
    defaultInputs.social_media_hours
  ),
  gaming_hours: parseNumber(values.gaming_hours, defaultInputs.gaming_hours),
  sleep_hours: parseNumber(values.sleep_hours, defaultInputs.sleep_hours),
  screen_time_hours: parseNumber(
    values.screen_time_hours,
    defaultInputs.screen_time_hours
  ),
  exercise_minutes: parseInt(
    values.exercise_minutes ?? `${defaultInputs.exercise_minutes}`,
    10
  ),
  caffeine_intake_mg: parseInt(
    values.caffeine_intake_mg ?? `${defaultInputs.caffeine_intake_mg}`,
    10
  ),
  part_time_job: parseInt(
    values.part_time_job ?? `${defaultInputs.part_time_job}`,
    10
  ),
  upcoming_deadline: parseInt(
    values.upcoming_deadline ?? `${defaultInputs.upcoming_deadline}`,
    10
  ),
  internet_quality: values.internet_quality || defaultInputs.internet_quality,
};

      setLatestInputs(inputs);

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
      setCounterfactualOptions(normalizeCounterfactualResponse(cf));

      const currentLevel = formatPredictionLabel(target, pred.predicted_value);
      const goalLevel = getTargetGoalLabel(target, pred.predicted_value);

      setPrediction({
        stressLevel: currentLevel,
        confidence: `${Math.round(pred.confidence * 100)}%`,
        currentLevel,
        targetLevel: goalLevel,
        advice:
          normalizeCounterfactualResponse(cf)[0]?.changes?.length > 0
            ? normalizeCounterfactualResponse(cf)[0].changes.map(
                (item) =>
                  `${prettyFeatureName(item.feature)}: ${item.current_value} → ${item.suggested_value}`
              )
            : ["No suggestion available"],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Prediction failed");
    }
  };

  const handleTargetLevelChange = async (nextTargetLevel: string) => {
    try {
      setPrediction((prev) => ({
        ...prev,
        targetLevel: nextTargetLevel,
      }));

      setCounterfactualOptions(normalizeCounterfactualResponse([]));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update counterfactuals");
    }
  };

  const handleSuggestChanges = async () => {
    try {
      setError(null);

      const backendTarget = mapUiTargetToBackendTarget(target);

      const cf = await fetchCounterfactuals({
        target: backendTarget,
        target_level: prediction.targetLevel,
        inputs: latestInputs,
      });

      setCounterfactualOptions(normalizeCounterfactualResponse(cf));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch counterfactual suggestions"
      );
    }
  };

  const handleApplyCounterfactual = async (option: CounterfactualOption) => {
    try {
      const updatedInputs: BackendPredictionInput = {
        ...latestInputs,
      };

      option.changes.forEach((change) => {
        const key = change.feature as keyof BackendPredictionInput;
        const raw = change.suggested_value;

        if (key in updatedInputs) {
          (updatedInputs as Record<string, string | number>)[key] =
            typeof raw === "string" && !Number.isNaN(Number(raw)) ? Number(raw) : raw;
        }
      });

      setLatestInputs(updatedInputs);

      const backendTarget = mapUiTargetToBackendTarget(target);
      const payload = {
        target: backendTarget,
        inputs: updatedInputs,
      };

      const [pred, explanation] = await Promise.all([
        fetchPrediction(payload),
        fetchLocalExplanation(payload),
      ]);

      setBackendPrediction(pred);
      setLocalExplanation(explanation);
      setCounterfactualOptions([]);

      const currentLevel = formatPredictionLabel(target, pred.predicted_value);

      setPrediction((prev) => ({
        ...prev,
        stressLevel: currentLevel,
        confidence: `${Math.round(pred.confidence * 100)}%`,
        currentLevel,
        advice:
          option.changes.length > 0
            ? option.changes.map(
                (item) =>
                  `${prettyFeatureName(item.feature)}: ${item.current_value} → ${item.suggested_value}`
              )
            : prev.advice,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to apply counterfactual");
    }
  };

  const data: StudentPoint[] = useMemo(() => {
    if (backendData.length > 0) return backendData;

    return [
      {
        id: "s1",
        x: 1.2,
        y: 5.1,
        cluster: 0,
        burnout_level: 80,
        productivity_score: 40,
        exam_score: 52,
        age: 21,
        gender: "Female",
        academic_level: "Undergraduate",
        study_hours: 2,
        self_study_hours: 1,
        online_classes_hours: 2,
        social_media_hours: 4,
        gaming_hours: 1,
        sleep_hours: 6,
        screen_time_hours: 5,
        exercise_minutes: 20,
        caffeine_intake_mg: 100,
        part_time_job: 0,
        upcoming_deadline: 1,
        internet_quality: "Good",
        mental_health_score: 6,
        focus_index: 58,
      },
      {
        id: "s2",
        x: 1.1,
        y: 5.6,
        cluster: 0,
        burnout_level: 72,
        productivity_score: 48,
        exam_score: 56,
        age: 22,
        gender: "Male",
        academic_level: "Undergraduate",
        study_hours: 3,
        self_study_hours: 1.5,
        online_classes_hours: 2,
        social_media_hours: 3.5,
        gaming_hours: 2,
        sleep_hours: 7,
        screen_time_hours: 4,
        exercise_minutes: 30,
        caffeine_intake_mg: 120,
        part_time_job: 1,
        upcoming_deadline: 1,
        internet_quality: "Good",
        mental_health_score: 6.5,
        focus_index: 62,
      },
      {
        id: "s3",
        x: 8.7,
        y: 4.8,
        cluster: 1,
        burnout_level: 25,
        productivity_score: 88,
        exam_score: 81,
        age: 20,
        gender: "Female",
        academic_level: "Undergraduate",
        study_hours: 4,
        self_study_hours: 3,
        online_classes_hours: 2,
        social_media_hours: 1.5,
        gaming_hours: 0.5,
        sleep_hours: 8,
        screen_time_hours: 2,
        exercise_minutes: 60,
        caffeine_intake_mg: 80,
        part_time_job: 0,
        upcoming_deadline: 0,
        internet_quality: "Good",
        mental_health_score: 8,
        focus_index: 82,
      },
      {
        id: "s4",
        x: 8.9,
        y: 5.3,
        cluster: 1,
        burnout_level: 31,
        productivity_score: 79,
        exam_score: 76,
        age: 23,
        gender: "Male",
        academic_level: "Graduate",
        study_hours: 5,
        self_study_hours: 3,
        online_classes_hours: 1,
        social_media_hours: 1,
        gaming_hours: 0,
        sleep_hours: 7,
        screen_time_hours: 2,
        exercise_minutes: 55,
        caffeine_intake_mg: 90,
        part_time_job: 0,
        upcoming_deadline: 0,
        internet_quality: "Excellent",
        mental_health_score: 7.5,
        focus_index: 78,
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
            <option value="mental_health">Mental health score</option>
            <option value="focus">Focus index</option>
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
              onClearSelection={() => {
                setSelection({type: "none"});
                setLocalExplanation(null);
              }}
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
              targetLabel={getUiTargetLabel(target)}
              onPredict={handlePredict}
              counterfactualOptions={counterfactualOptions}
              onTargetLevelChange={handleTargetLevelChange}
              onSuggestChanges={handleSuggestChanges}
              onApplyCounterfactual={handleApplyCounterfactual}
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
    case "mental_health":
      return "mental_health_score";
    case "focus":
      return "focus_index";
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
  if (
    target === "productivity" ||
    target === "exam" ||
    target === "mental_health" ||
    target === "focus"
  ) {
    return value.toFixed(2);
  }

  if (value < 33) return "LOW";
  if (value < 66) return "MEDIUM";
  return "HIGH";
}

function getTargetGoalLabel(target: string, value: number) {
  if (
    target === "productivity" ||
    target === "exam" ||
    target === "mental_health" ||
    target === "focus"
  ) {
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

function getUiTargetLabel(target: string) {
  switch (target) {
    case "stress":
      return "Burnout";
    case "productivity":
      return "Productivity";
    case "exam":
      return "Exam score";
    case "mental_health":
      return "Mental health score";
    case "focus":
      return "Focus index";
    default:
      return "Prediction";
  }
}

function normalizeCounterfactualResponse(raw: any): CounterfactualOption[] {
  if (!raw) return [];

  if (Array.isArray(raw)) {
    return raw as CounterfactualOption[];
  }

  if (Array.isArray(raw.options)) {
    return raw.options as CounterfactualOption[];
  }

  if (Array.isArray(raw.suggestions)) {
    return [
      {
        option: 1,
        changes: raw.suggestions,
        effort: "Low",
        new_level: "Improved",
      },
    ];
  }

  return [];
}