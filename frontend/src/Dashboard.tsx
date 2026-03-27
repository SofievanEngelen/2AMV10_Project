import "./App.css";
import { useEffect, useMemo, useState } from "react";
import StrategyAtlasPanel from "./components/StrategyAtlasPanel.tsx";
import ClusterPanel from "./components/ClusterPanel";
import FeatureImportancePanel from "./components/FeatureImportancePanel";
import CounterfactualPanel from "./components/CounterfactualPanel";
import ModelStrategiesPanel from "./components/ModelStrategiesPanel";
import {
  fetchClusterSummary,
  fetchCounterfactuals,
  fetchFeatureImportance,
  fetchLocalExplanation,
  fetchPrediction,
  fetchStrategyAtlas,
  fetchStrategyAtlasProjection,
} from "./api/client";
import type {
  BackendPredictionInput,
  ClusterSummaryResponse,
  FeatureImportanceItem,
  LocalExplanationResponse,
  PredictionResponse,
  StrategyAtlasBackground,
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
};

type MiddleSectionKey = "analysis" | "importance" | "strategies";

const numericWhatIfFields = [
  "age",
  "study_hours",
  "self_study_hours",
  "online_classes_hours",
  "social_media_hours",
  "gaming_hours",
  "sleep_hours",
  "screen_time_hours",
  "exercise_minutes",
  "caffeine_intake_mg",
] as const;

const categoricalWhatIfFields = [
  "gender",
  "academic_level",
  "part_time_job",
  "upcoming_deadline",
  "internet_quality",
] as const;

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

const COUNTERFACTUAL_STYLES = [
  { color: "#013220", symbol: "star" as const, label: "Strategy 1" },
  { color: "#00008B", symbol: "star" as const, label: "Strategy 2" },
  { color: "#8B0000", symbol: "star" as const, label: "Strategy 3" },
];

const STRATEGY_COLOURS = ["#2f7ed8", "#f27c2a", "#58b43d"];

/**
 * Convert form values into the backend payload shape.
 * Keeps number parsing in one place so all interactions stay consistent.
 */
function valuesToBackendInputs(
  values: Record<string, string>,
  fallback: BackendPredictionInput = defaultInputs
): BackendPredictionInput {
  return {
    age: parseInt(values.age ?? `${fallback.age}`, 10),
    gender: values.gender || fallback.gender,
    academic_level: values.academic_level || fallback.academic_level,
    study_hours: parseNumber(values.study_hours, fallback.study_hours),
    self_study_hours: parseNumber(
      values.self_study_hours,
      fallback.self_study_hours
    ),
    online_classes_hours: parseNumber(
      values.online_classes_hours,
      fallback.online_classes_hours
    ),
    social_media_hours: parseNumber(
      values.social_media_hours,
      fallback.social_media_hours
    ),
    gaming_hours: parseNumber(values.gaming_hours, fallback.gaming_hours),
    sleep_hours: parseNumber(values.sleep_hours, fallback.sleep_hours),
    screen_time_hours: parseNumber(
      values.screen_time_hours,
      fallback.screen_time_hours
    ),
    exercise_minutes: parseNumber(
      values.exercise_minutes,
      fallback.exercise_minutes
    ),
    caffeine_intake_mg: parseNumber(
      values.caffeine_intake_mg,
      fallback.caffeine_intake_mg
    ),
    part_time_job: parseInt(
      values.part_time_job ?? `${fallback.part_time_job}`,
      10
    ),
    upcoming_deadline: parseInt(
      values.upcoming_deadline ?? `${fallback.upcoming_deadline}`,
      10
    ),
    internet_quality: values.internet_quality || fallback.internet_quality,
  };
}

export default function Dashboard() {
  const [target, setTarget] = useState("exam");
  const [colourBy, setColourBy] = useState("cluster");
  const [selection, setSelection] = useState<SelectionState>({ type: "none" });
  const [atlasBackground, setAtlasBackground] =
    useState<StrategyAtlasBackground | null>(null);
  const [strategyProfiles, setStrategyProfiles] = useState<any[]>([]);

  const [openMiddleSections, setOpenMiddleSections] = useState<
    MiddleSectionKey[]
  >(["analysis", "importance"]);

  const [prediction, setPrediction] = useState<LegacyPrediction>({
    stressLevel: "MEDIUM",
    confidence: "High",
    currentLevel: "MEDIUM",
    targetLevel: "LOW",
  });

  const [backendPrediction, setBackendPrediction] =
    useState<PredictionResponse | null>(null);
  const [localExplanation, setLocalExplanation] =
    useState<LocalExplanationResponse | null>(null);
  const [counterfactualOptions, setCounterfactualOptions] = useState<
    CounterfactualOption[]
  >([]);
  const [featureImportance, setFeatureImportance] = useState<
    FeatureImportanceItem[]
  >([]);
  const [clusterSummary, setClusterSummary] =
    useState<ClusterSummaryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [backendData, setBackendData] = useState<StudentPoint[]>([]);
  const [latestInputs, setLatestInputs] =
    useState<BackendPredictionInput>(defaultInputs);
  const [temporaryWhatIfPoint, setTemporaryWhatIfPoint] =
    useState<StudentPoint | null>(null);
  const [whatIfValues, setWhatIfValues] =
    useState<Record<string, string> | null>(null);

  const [selectedCfIndex, setSelectedCfIndex] = useState<number | null>(null);
  const [hoveredCfIndex, setHoveredCfIndex] = useState<number | null>(null);
  const [previewCounterfactualPoint, setPreviewCounterfactualPoint] =
    useState<StudentPoint | null>(null);

  const isMiddleSectionOpen = (key: MiddleSectionKey) =>
    openMiddleSections.includes(key);

  const handleMiddleSectionClick = (key: MiddleSectionKey) => {
    if (openMiddleSections.includes(key)) return;
    setOpenMiddleSections(([first, second]) => [second, key]);
  };

  const styledCounterfactuals = useMemo(() => {
    return counterfactualOptions.map((option, index) => ({
      ...option,
      ...COUNTERFACTUAL_STYLES[index % COUNTERFACTUAL_STYLES.length],
      index,
    }));
  }, [counterfactualOptions]);

  const activeCfIndex = selectedCfIndex ?? hoveredCfIndex ?? null;

  useEffect(() => {
    async function loadStrategyAtlas() {
      try {
        const backendTarget = mapUiTargetToBackendTarget(target);
        const res = await fetchStrategyAtlas(backendTarget);

        setStrategyProfiles(res.strategy_profiles ?? []);
        setAtlasBackground(res.background);
        setBackendData(
          res.points.map((p) => ({
            id: String(p.id),
            x: p.x,
            y: p.y,
            cluster: p.cluster,

            burnout_level: p.burnout_level,
            productivity_score: p.productivity_score,
            exam_score: p.exam_score,
            mental_health_score: p.mental_health_score,
            focus_index: p.focus_index,

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
          }))
        );
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load Strategy Atlas"
        );
        setBackendData([]);
      }
    }

    loadStrategyAtlas();
  }, [target]);

  useEffect(() => {
    async function loadFeatureImportanceData() {
      try {
        const backendTarget = mapUiTargetToBackendTarget(target);
        const res = await fetchFeatureImportance(backendTarget);
        setFeatureImportance(res.global_importance);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load feature importance"
        );
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

        const avg = (points: StudentPoint[], key: keyof StudentPoint) =>
          points.reduce((sum, p) => sum + Number(p[key] ?? 0), 0) / points.length;

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
              }
            : {
                age: Math.round(avg(selection.points, "age")),
                gender: selection.points[0].gender,
                academic_level: selection.points[0].academic_level,
                study_hours: avg(selection.points, "study_hours"),
                self_study_hours: avg(selection.points, "self_study_hours"),
                online_classes_hours: avg(selection.points, "online_classes_hours"),
                social_media_hours: avg(selection.points, "social_media_hours"),
                gaming_hours: avg(selection.points, "gaming_hours"),
                sleep_hours: avg(selection.points, "sleep_hours"),
                screen_time_hours: avg(selection.points, "screen_time_hours"),
                exercise_minutes: avg(selection.points, "exercise_minutes"),
                caffeine_intake_mg: avg(selection.points, "caffeine_intake_mg"),
                part_time_job: Math.round(avg(selection.points, "part_time_job")),
                upcoming_deadline: Math.round(
                  avg(selection.points, "upcoming_deadline")
                ),
                internet_quality: selection.points[0].internet_quality,
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
        setError(
          err instanceof Error ? err.message : "Failed to load cluster summary"
        );
      }
    }

    loadClusterData();
  }, [selection]);

  useEffect(() => {
    setCounterfactualOptions([]);
  }, [target, selection]);

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
    });
  }, [target]);

  const selectionFillValues = useMemo(() => {
    if (selection.type === "none") return null;

    if (selection.type === "point") {
      const p = selection.point;

      return {
        age: String(p.age),
        gender: String(p.gender),
        academic_level: String(p.academic_level),
        study_hours: String(p.study_hours),
        self_study_hours: String(p.self_study_hours),
        online_classes_hours: String(p.online_classes_hours),
        social_media_hours: String(p.social_media_hours),
        gaming_hours: String(p.gaming_hours),
        sleep_hours: String(p.sleep_hours),
        screen_time_hours: String(p.screen_time_hours),
        exercise_minutes: String(p.exercise_minutes),
        caffeine_intake_mg: String(p.caffeine_intake_mg),
        part_time_job: String(p.part_time_job),
        upcoming_deadline: String(p.upcoming_deadline),
        internet_quality: String(p.internet_quality),
      };
    }

    const points = selection.points;
    if (points.length === 0) return null;

    const result: Record<string, string> = {};

    for (const field of numericWhatIfFields) {
      result[field] = String(round1(average(points.map((p) => Number(p[field])))));
    }

    for (const field of categoricalWhatIfFields) {
      result[field] = mode(points.map((p) => p[field] as string | number));
    }

    return result;
  }, [selection]);

  const whatIfFillValues = whatIfValues ?? selectionFillValues;

  useEffect(() => {
    setWhatIfValues(null);
  }, [selection]);

  useEffect(() => {
    if (!whatIfFillValues) return;
    setLatestInputs(valuesToBackendInputs(whatIfFillValues));
  }, [whatIfFillValues]);

  useEffect(() => {
    async function projectPreviewCounterfactual() {
      if (activeCfIndex == null || !styledCounterfactuals[activeCfIndex]) {
        setPreviewCounterfactualPoint(null);
        return;
      }

      const cf = styledCounterfactuals[activeCfIndex];
      const baseValues = whatIfFillValues ?? inputsToWhatIfValues(latestInputs);
      const updatedValues: Record<string, string> = { ...baseValues };

      cf.changes.forEach((change) => {
        updatedValues[change.feature] = String(change.suggested_value);
      });

      const inputs = valuesToBackendInputs(updatedValues);

      try {
        const backendTarget = mapUiTargetToBackendTarget(target);
        const projected = await fetchStrategyAtlasProjection({
          target: backendTarget,
          inputs,
        });

        setPreviewCounterfactualPoint({
          id: `preview-${cf.option}`,
          x: projected.x,
          y: projected.y,
          cluster: -2,

          burnout_level: 50,
          productivity_score: 50,
          exam_score: 50,
          mental_health_score: 50,
          focus_index: 70,

          ...inputs,
        });
      } catch (err) {
        console.error("Failed to preview counterfactual projection", err);
        setPreviewCounterfactualPoint(null);
      }
    }

    projectPreviewCounterfactual();
  }, [activeCfIndex, styledCounterfactuals, whatIfFillValues, latestInputs, target]);

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
        mental_health_score: 6,
        focus_index: 58,
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
      },
      {
        id: "s2",
        x: 1.1,
        y: 5.6,
        cluster: 0,
        burnout_level: 72,
        productivity_score: 48,
        exam_score: 56,
        mental_health_score: 6.5,
        focus_index: 62,
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
      },
      {
        id: "s3",
        x: 8.7,
        y: 4.8,
        cluster: 1,
        burnout_level: 25,
        productivity_score: 88,
        exam_score: 81,
        mental_health_score: 8,
        focus_index: 82,
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
      },
      {
        id: "s4",
        x: 8.9,
        y: 5.3,
        cluster: 1,
        burnout_level: 31,
        productivity_score: 79,
        exam_score: 76,
        mental_health_score: 7.5,
        focus_index: 78,
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
      },
    ];
  }, [backendData]);

  const derivedCurrentLevel = useMemo(() => {
    const values = inputsToWhatIfValues(latestInputs);

    const existingPoint = data.find((point) =>
      pointMatchesWhatIfValues(point, values)
    );

    if (existingPoint) {
      return getLevelFromTargetValue(
        target,
        getPointTargetValue(existingPoint, target)
      );
    }

    if (backendPrediction) {
      return formatPredictionLabel(backendPrediction, target);
    }

    return "-";
  }, [latestInputs, data, target, backendPrediction]);

  const handlePredict = async (values: Record<string, string>) => {
    try {
      setError(null);

      const inputs = valuesToBackendInputs(values);
      setLatestInputs(inputs);

      const backendTarget = mapUiTargetToBackendTarget(target);
      const payload = {
        target: backendTarget,
        inputs,
      };

      const [pred, explanation] = await Promise.all([
        fetchPrediction(payload),
        fetchLocalExplanation(payload),
      ]);

      setBackendPrediction(pred);
      setLocalExplanation(explanation);
      setCounterfactualOptions([]);

      const matchedPoint = data.find((point) =>
        pointMatchesWhatIfValues(point, values)
      );

      const currentLevel = matchedPoint
        ? getLevelFromTargetValue(target, getPointTargetValue(matchedPoint, target))
        : formatPredictionLabel(pred, target);

      const goalLevel = matchedPoint
        ? getLevelFromTargetValue(target, getPointTargetValue(matchedPoint, target))
        : formatPredictionLabel(pred, target);

      setPrediction({
        stressLevel: currentLevel,
        confidence: `${Math.round(pred.confidence * 100)}%`,
        currentLevel,
        targetLevel: goalLevel,
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
      setError(
        err instanceof Error ? err.message : "Failed to update counterfactuals"
      );
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
        err instanceof Error
          ? err.message
          : "Failed to fetch counterfactual suggestions"
      );
    }
  };

  const handleApplyCounterfactual = async (option: CounterfactualOption) => {
    const baseValues = whatIfFillValues ?? inputsToWhatIfValues(latestInputs);
    const updatedValues: Record<string, string> = {
      ...baseValues,
    };

    option.changes.forEach((change) => {
      updatedValues[change.feature] = String(change.suggested_value);
    });

    setWhatIfValues(updatedValues);

    const inputs = valuesToBackendInputs(updatedValues);

    try {
      const backendTarget = mapUiTargetToBackendTarget(target);

      const projected = await fetchStrategyAtlasProjection({
        target: backendTarget,
        inputs,
      });

      const newPoint: StudentPoint = {
        id: "-1",
        x: projected.x,
        y: projected.y,
        cluster: -1,

        burnout_level: 50,
        productivity_score: 50,
        exam_score: 50,
        mental_health_score: 50,
        focus_index: 70,

        ...inputs,
      };

      setTemporaryWhatIfPoint(newPoint);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to project counterfactual point"
      );
    }
  };

  async function handleShowInGraph(values: Record<string, string>) {
    const existingPoint = data.find((point) =>
      pointMatchesWhatIfValues(point, values)
    );

    if (existingPoint) {
      setTemporaryWhatIfPoint(existingPoint);
      return;
    }

    try {
      setError(null);

      const inputs = valuesToBackendInputs(values);

      const backendTarget = mapUiTargetToBackendTarget(target);
      const projected = await fetchStrategyAtlasProjection({
        target: backendTarget,
        inputs,
      });

      const tempPoint: StudentPoint = {
        id: "-1",
        x: projected.x,
        y: projected.y,
        cluster: -1,

        burnout_level: 50,
        productivity_score: 50,
        exam_score: 50,
        mental_health_score: 50,
        focus_index: 70,

        age: Number(values.age),
        gender: values.gender,
        academic_level: values.academic_level,
        study_hours: Number(values.study_hours),
        self_study_hours: Number(values.self_study_hours),
        online_classes_hours: Number(values.online_classes_hours),
        social_media_hours: Number(values.social_media_hours),
        gaming_hours: Number(values.gaming_hours),
        sleep_hours: Number(values.sleep_hours),
        screen_time_hours: Number(values.screen_time_hours),
        exercise_minutes: Number(values.exercise_minutes),
        caffeine_intake_mg: Number(values.caffeine_intake_mg),
        part_time_job: Number(values.part_time_job),
        upcoming_deadline: Number(values.upcoming_deadline),
        internet_quality: values.internet_quality,
      };

      setTemporaryWhatIfPoint(tempPoint);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to project temporary Strategy Atlas point"
      );
    }
  }

  const showAllMiddlePanels = selection.type === "none";

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
            <option value="exam">Exam score</option>
            <option value="stress">Burnout</option>
            <option value="productivity">Productivity</option>
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
          <div className="column-header">Strategy Atlas</div>
          <div className="column-body">
            <StrategyAtlasPanel
              data={data}
              background={atlasBackground}
              temporaryPoint={temporaryWhatIfPoint}
              colourBy={colourBy}
              strategyColors={STRATEGY_COLOURS}
              onColourByChange={setColourBy}
              selection={selection}
              onPointSelect={(point) => {
                if (point.id !== "-1") {
                  setTemporaryWhatIfPoint(null);
                }
                setSelection({ type: "point", point });
              }}
              onClusterSelect={(points) => {
                setTemporaryWhatIfPoint(null);
                setSelection(
                  points.length === 0
                    ? { type: "none" }
                    : points.length === 1
                    ? { type: "point", point: points[0] }
                    : { type: "cluster", points }
                );
              }}
              onClearSelection={() => {
                setTemporaryWhatIfPoint(null);
                setSelection({ type: "none" });
                setLocalExplanation(null);
              }}
              counterfactualOptions={styledCounterfactuals}
              activeCfIndex={activeCfIndex}
              previewPoint={previewCounterfactualPoint}
            />
          </div>
        </section>

        <section className="column-shell">
          <div
            className={`middle-column-body ${
              showAllMiddlePanels ? "middle-column-body--three" : ""
            }`}
          >
            <div
              className="subcolumn-shell"
              style={
                showAllMiddlePanels
                  ? undefined
                  : {
                      flex: isMiddleSectionOpen("analysis") ? 1 : "0 0 auto",
                      minHeight: isMiddleSectionOpen("analysis") ? 0 : 56,
                    }
              }
            >
              <div
                className="column-header"
                onClick={
                  showAllMiddlePanels
                    ? undefined
                    : () => handleMiddleSectionClick("analysis")
                }
                style={
                  showAllMiddlePanels
                    ? undefined
                    : { cursor: "pointer", userSelect: "none" }
                }
              >
                {selection.type === "point"
                  ? "Student analysis"
                  : selection.type === "cluster"
                  ? "Cluster analysis"
                  : "Global analysis"}
              </div>

              {(showAllMiddlePanels || isMiddleSectionOpen("analysis")) && (
                <div className="subcolumn-body">
                  <ClusterPanel
                    selection={selection}
                    allData={data}
                    clusterSummary={clusterSummary}
                  />
                </div>
              )}
            </div>

            <div
              className="subcolumn-shell"
              style={
                showAllMiddlePanels
                  ? undefined
                  : {
                      flex: isMiddleSectionOpen("importance") ? 1 : "0 0 auto",
                      minHeight: isMiddleSectionOpen("importance") ? 0 : 56,
                    }
              }
            >
              <div
                className="column-header"
                onClick={
                  showAllMiddlePanels
                    ? undefined
                    : () => handleMiddleSectionClick("importance")
                }
                style={
                  showAllMiddlePanels
                    ? undefined
                    : { cursor: "pointer", userSelect: "none" }
                }
              >
                Feature importance
              </div>

              {(showAllMiddlePanels || isMiddleSectionOpen("importance")) && (
                <div className="subcolumn-body">
                  <FeatureImportancePanel
                    selection={selection}
                    items={featureImportance}
                    localItems={localExplanation?.contributions ?? null}
                    compact={showAllMiddlePanels}
                  />
                </div>
              )}
            </div>

            <div
              className="subcolumn-shell"
              style={
                showAllMiddlePanels
                  ? undefined
                  : {
                      flex: isMiddleSectionOpen("strategies") ? 1 : "0 0 auto",
                      minHeight: isMiddleSectionOpen("strategies") ? 0 : 56,
                    }
              }
            >
              <div
                className="column-header"
                onClick={
                  showAllMiddlePanels
                    ? undefined
                    : () => handleMiddleSectionClick("strategies")
                }
                style={
                  showAllMiddlePanels
                    ? undefined
                    : { cursor: "pointer", userSelect: "none" }
                }
              >
                Model strategies
              </div>

              {(showAllMiddlePanels || isMiddleSectionOpen("strategies")) && (
                <div className="subcolumn-body">
                  <ModelStrategiesPanel strategyProfiles={strategyProfiles} />
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="column-shell">
          <div className="column-header">Intervention analysis</div>
          <div className="column-body">
            <CounterfactualPanel
              prediction={{ ...prediction, currentLevel: derivedCurrentLevel }}
              targetLabel={getUiTargetLabel(target)}
              onPredict={handlePredict}
              onShowInGraph={handleShowInGraph}
              counterfactualOptions={styledCounterfactuals}
              onTargetLevelChange={handleTargetLevelChange}
              onSuggestChanges={handleSuggestChanges}
              onApplyCounterfactual={handleApplyCounterfactual}
              fillValues={whatIfFillValues}
              onHoverOption={(i) => setHoveredCfIndex(i)}
              onSelectOption={(i) => setSelectedCfIndex(i)}
              selectedIndex={selectedCfIndex}
            />
          </div>
        </section>
      </main>
    </div>
  );
}

/** Map UI dropdown target values to backend API target names. */
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

function parseNumber(value: string | undefined, fallback: number) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function formatPredictionLabel(
  pred: PredictionResponse | null,
  _target: string,
  fallbackValue?: number
) {
  if (!pred) return "-";

  if ("predicted_level" in pred && typeof pred.predicted_level === "string") {
    return pred.predicted_level.toUpperCase();
  }

  if (typeof fallbackValue === "number") {
    if (fallbackValue < 33) return "LOW";
    if (fallbackValue < 66) return "MEDIUM";
    return "HIGH";
  }

  return "-";
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

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

function average(nums: number[]) {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function mode(values: Array<string | number>) {
  const counts = new Map<string, number>();

  values.forEach((value) => {
    const key = String(value);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });

  let bestKey = String(values[0] ?? "");
  let bestCount = -1;

  counts.forEach((count, key) => {
    if (count > bestCount) {
      bestKey = key;
      bestCount = count;
    }
  });

  return bestKey;
}

function numericEqual(a: number, b: string, epsilon = 1e-9) {
  return Math.abs(a - Number(b)) < epsilon;
}

function pointMatchesWhatIfValues(
  point: StudentPoint,
  values: Record<string, string>
) {
  for (const field of numericWhatIfFields) {
    if (!numericEqual(Number(point[field]), values[field])) {
      return false;
    }
  }

  for (const field of categoricalWhatIfFields) {
    if (String(point[field]) !== values[field]) {
      return false;
    }
  }

  return true;
}

function inputsToWhatIfValues(
  inputs: BackendPredictionInput
): Record<string, string> {
  return {
    age: String(inputs.age),
    gender: String(inputs.gender),
    academic_level: String(inputs.academic_level),
    study_hours: String(inputs.study_hours),
    self_study_hours: String(inputs.self_study_hours),
    online_classes_hours: String(inputs.online_classes_hours),
    social_media_hours: String(inputs.social_media_hours),
    gaming_hours: String(inputs.gaming_hours),
    sleep_hours: String(inputs.sleep_hours),
    screen_time_hours: String(inputs.screen_time_hours),
    exercise_minutes: String(inputs.exercise_minutes),
    caffeine_intake_mg: String(inputs.caffeine_intake_mg),
    part_time_job: String(inputs.part_time_job),
    upcoming_deadline: String(inputs.upcoming_deadline),
    internet_quality: String(inputs.internet_quality),
  };
}

function getPointTargetValue(point: StudentPoint, target: string): number {
  switch (target) {
    case "stress":
      return point.burnout_level;
    case "productivity":
      return point.productivity_score;
    case "exam":
      return point.exam_score;
    case "mental_health":
      return point.mental_health_score;
    case "focus":
      return point.focus_index;
    default:
      return point.burnout_level;
  }
}

function getLevelFromTargetValue(target: string, value: number): string {
  if (target === "stress") {
    if (value < 33) return "LOW";
    if (value < 66) return "MEDIUM";
    return "HIGH";
  }

  if (value >= 75) return "HIGH";
  if (value >= 45) return "MEDIUM";
  return "LOW";
}
