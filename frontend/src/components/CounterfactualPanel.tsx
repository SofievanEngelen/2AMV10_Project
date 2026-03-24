import { useMemo, useState } from "react";
import type {
  BackendPredictionInput,
} from "../api/types";
import type { CounterfactualOption } from "../Dashboard";

type LegacyPrediction = {
  stressLevel: string;
  confidence: string;
  currentLevel: string;
  targetLevel: string;
  advice: string[];
};

type Props = {
  prediction: LegacyPrediction;
  targetLabel: string;
  onPredict: (values: Record<string, string>) => void;
  counterfactualOptions?: CounterfactualOption[];
  onTargetLevelChange?: (value: string) => void;
  onSuggestChanges?: () => void;
  onApplyCounterfactual?: (option: CounterfactualOption) => void;
};

const whatIfFields = [
  { key: "age", label: "Age", type: "number" },
  {
    key: "gender",
    label: "Gender",
    type: "select",
    options: ["Female", "Male"],
  },
  {
    key: "academic_level",
    label: "Academic level",
    type: "select",
    options: ["Undergraduate", "Graduate"],
  },
  { key: "study_hours", label: "Study hours", type: "number", step: "0.1" },
  { key: "self_study_hours", label: "Self study hours", type: "number", step: "0.1" },
  { key: "online_classes_hours", label: "Online classes hours", type: "number", step: "0.1" },
  { key: "social_media_hours", label: "Social media hours", type: "number", step: "0.1" },
  { key: "gaming_hours", label: "Gaming hours", type: "number", step: "0.1" },
  { key: "sleep_hours", label: "Sleep hours", type: "number", step: "0.1" },
  { key: "screen_time_hours", label: "Screen time hours", type: "number", step: "0.1" },
  { key: "exercise_minutes", label: "Exercise minutes", type: "number" },
  { key: "caffeine_intake_mg", label: "Caffeine intake", type: "number" },
  {
    key: "part_time_job",
    label: "Part-time job",
    type: "select",
    options: ["0", "1"],
  },
  {
    key: "upcoming_deadline",
    label: "Upcoming deadline",
    type: "select",
    options: ["0", "1"],
  },
  {
    key: "internet_quality",
    label: "Internet quality",
    type: "select",
    options: ["Poor", "Average", "Good", "Excellent"],
  },
] as const;

const initialFormValues: Record<string, string> = {
  age: "21",
  gender: "Female",
  academic_level: "Undergraduate",
  study_hours: "4",
  self_study_hours: "2",
  online_classes_hours: "2",
  social_media_hours: "2.5",
  gaming_hours: "1",
  sleep_hours: "7",
  screen_time_hours: "6",
  exercise_minutes: "45",
  caffeine_intake_mg: "120",
  part_time_job: "0",
  upcoming_deadline: "1",
  internet_quality: "Good",
};

function prettyFeatureName(name: string) {
  const map: Record<string, string> = {
    study_hours: "Study hours",
    screen_time_hours: "Phone usage",
    social_media_hours: "Social media",
    exercise_minutes: "Exercise",
    sleep_hours: "Sleep hours",
    self_study_hours: "Self study",
    online_classes_hours: "Online classes",
    focus_index: "Focus",
    gaming_hours: "Gaming hours",
  };
  return map[name] ?? name.replaceAll("_", " ");
}

function formatValue(feature: string, value: number | string) {
  if (typeof value === "string") return value;

  if (feature === "exercise_minutes") {
    const hours = value / 60;
    return Number.isInteger(hours) ? `${hours}` : `${hours.toFixed(1)}`;
  }

  return `${value}`;
}

function formatUnit(feature: string) {
  if (
    feature === "study_hours" ||
    feature === "screen_time_hours" ||
    feature === "social_media_hours" ||
    feature === "sleep_hours" ||
    feature === "self_study_hours" ||
    feature === "online_classes_hours" ||
    feature === "gaming_hours"
  ) {
    return " hours";
  }

  if (feature === "exercise_minutes") {
    return " hours";
  }

  return "";
}

export default function CounterfactualPanel({
  prediction,
  targetLabel,
  onPredict,
  counterfactualOptions = [],
  onTargetLevelChange,
  onSuggestChanges,
  onApplyCounterfactual,
}: Props) {
  const [activeTab, setActiveTab] = useState<"whatif" | "counterfactuals">("whatif");
  const [values, setValues] = useState<Record<string, string>>(initialFormValues);

  const renderedOptions = useMemo(() => counterfactualOptions.slice(0, 3), [counterfactualOptions]);

  return (
    <div className="cf-root">
      <div className="cf-top-tabs">
        <button
          className={`cf-top-tab ${activeTab === "whatif" ? "active" : ""}`}
          onClick={() => setActiveTab("whatif")}
        >
          What-If
        </button>
        <button
          className={`cf-top-tab ${activeTab === "counterfactuals" ? "active" : ""}`}
          onClick={() => setActiveTab("counterfactuals")}
        >
          Counterfactuals
        </button>
      </div>

      {activeTab === "whatif" ? (
        <div className="whatif-view">
          <p className="cf-description">
            Adjust values like sleep, study time, or phone usage to see how the prediction changes.
            The system updates the outcome and shows where the student would move in the UMAP,
            helping you explore which changes could improve your target.
          </p>

          <div className="whatif-form">
            {whatIfFields.map((field) => (
              <div className="whatif-row" key={field.key}>
                <div className="whatif-label">{field.label}</div>
                <div className="whatif-equals">=</div>

                {field.type === "select" ? (
                  <select
                    className="whatif-input"
                    value={values[field.key]}
                    onChange={(e) =>
                      setValues((prev) => ({
                        ...prev,
                        [field.key]: e.target.value,
                      }))
                    }
                  >
                    {field.options.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    className="whatif-input"
                    type="number"
                    step={field.step ?? "1"}
                    value={values[field.key]}
                    onChange={(e) =>
                      setValues((prev) => ({
                        ...prev,
                        [field.key]: e.target.value,
                      }))
                    }
                  />
                )}
              </div>
            ))}
          </div>

          <button className="whatif-predict-button" onClick={() => onPredict(values)}>
            Predict
          </button>

          <div className="whatif-prediction-block">
            <div className="whatif-prediction-title">Prediction</div>
            <div className="whatif-prediction-grid">
              <div className="whatif-prediction-item">
                <div className="whatif-prediction-label">{targetLabel}</div>
                <div className="whatif-prediction-value">{prediction.stressLevel}</div>
              </div>
              <div className="whatif-prediction-item">
                <div className="whatif-prediction-label">Confidence</div>
                <div className="whatif-prediction-value">{prediction.confidence}</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="counterfactuals-view">
          <p className="cf-description cf-description-counterfactuals">
            This view shows small, realistic changes to your inputs that would improve the
            predicted outcome. Each option represents a different way to reach a better
            target level, helping you understand what adjustments have the most impact.
          </p>

          <div className="cf-levels-block">
            <div className="cf-level-row">
              <div className="cf-level-row-label">Current level:</div>
              <div className="cf-level-box">{toTitleCase(prediction.currentLevel)}</div>
            </div>

            <div className="cf-level-row">
              <div className="cf-level-row-label">Target level:</div>
              <div className="cf-select-wrap">
                <select
                  className="cf-level-select"
                  value={toTitleCase(prediction.targetLevel)}
                  onChange={(e) => onTargetLevelChange?.(e.target.value.toUpperCase())}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
                <span className="cf-select-caret">▼</span>
              </div>
            </div>
          </div>

          <button className="cf-button suggest-button" onClick={() => onSuggestChanges?.()}>
            Suggest changes
          </button>


          <div className="cf-options-list">
            {renderedOptions.map((option) => (
              <div className="cf-option-card" key={option.option}>
                <div className="cf-option-header">Option {option.option}</div>

                <div className="cf-option-body">
                  <div className="cf-option-left">
                    {option.changes.slice(0, 5).map((change, idx) => (
                      <div className="cf-change-row" key={`${option.option}-${idx}`}>
                        <span className="cf-change-feature">
                          {prettyFeatureName(change.feature)}:
                        </span>
                        <span className="cf-change-value">
                          {formatValue(change.feature, change.current_value)}
                          {"->"}
                          {formatValue(change.feature, change.suggested_value)}
                          {/*{formatUnit(change.feature)}*/}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="cf-option-right">
                    <div className="cf-meta-row">
                      <span className="cf-meta-label">Effort:</span>
                      <span className="cf-meta-value">{option.effort}</span>
                    </div>

                    <div className="cf-meta-row">
                      <span className="cf-meta-label">New level:</span>
                      <span className="cf-meta-value">{option.new_level}</span>
                    </div>

                    <button
                      className="cf-button"
                      onClick={() => onApplyCounterfactual?.(option)}
                    >
                      Apply changes
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {renderedOptions.length === 0 && (
              <div className="cf-option-card">
                <div className="cf-option-header">Option 1</div>
                <div className="cf-option-body">
                  <div className="cf-option-left">
                    <div className="cf-change-row">
                      <span className="cf-change-feature">No suggestions available</span>
                    </div>
                  </div>
                  <div className="cf-option-right">
                    <div className="cf-meta-row">
                      <span className="cf-meta-label">Effort:</span>
                      <span className="cf-meta-value">-</span>
                    </div>
                    <div className="cf-meta-row">
                      <span className="cf-meta-label">New level:</span>
                      <span className="cf-meta-value">-</span>
                    </div>
                    <button className="cf-apply-button" disabled>
                      Apply changes
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function toTitleCase(value: string) {
  const lower = value.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}