import type { ClusterSummaryResponse } from "../api/types";
import type { StudentPoint } from "../Dashboard_old.tsx";

type SelectionState =
  | { type: "none" }
  | { type: "point"; point: StudentPoint }
  | { type: "cluster"; points: StudentPoint[] };

type Props = {
  selection: SelectionState;
  allData: StudentPoint[];
  clusterSummary?: ClusterSummaryResponse | null;
};

type FeatureConfigItem = {
  key: keyof StudentPoint;
  label: string;
  unit?: string;
  categorical?: boolean;
};

type DisplayRow = {
  label: string;
  value: string;
};

const featureConfig: readonly FeatureConfigItem[] = [
  { key: "age", label: "Age" },
  { key: "gender", label: "Gender", categorical: true },
  { key: "academic_level", label: "Academic level", categorical: true },
  { key: "study_hours", label: "Study hours", unit: "hours" },
  { key: "self_study_hours", label: "Self study", unit: "hours" },
  { key: "online_classes_hours", label: "Online classes", unit: "hours" },
  { key: "social_media_hours", label: "Social media", unit: "hours" },
  { key: "gaming_hours", label: "Gaming", unit: "hours" },
  { key: "sleep_hours", label: "Sleep", unit: "hours" },
  { key: "screen_time_hours", label: "Screen time", unit: "hours" },
  { key: "exercise_minutes", label: "Exercise", unit: "min" },
  { key: "caffeine_intake_mg", label: "Caffeine", unit: "mg" },
  { key: "part_time_job", label: "Part-time job" },
  { key: "upcoming_deadline", label: "Upcoming deadline" },
  { key: "internet_quality", label: "Internet quality", categorical: true },
] as const;

/** Average a numeric field across a set of student points. */
function average(points: StudentPoint[], key: keyof StudentPoint): number {
  const values = points
    .map((p) => p[key])
    .filter((v): v is number => typeof v === "number");

  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

/** Format a displayed value with optional unit. */
function formatValue(value: unknown, unit?: string): string {
  if (typeof value === "number") {
    return unit ? `${value.toFixed(1)} ${unit}` : value.toFixed(2);
  }
  return String(value);
}

/** Format a signed difference for comparison rows. */
function formatDifference(diff: number, unit?: string): string {
  const sign = diff > 0 ? "+" : "";
  return unit ? `${sign}${diff.toFixed(1)} ${unit}` : `${sign}${diff.toFixed(2)}`;
}

/** Render label/value rows in the shared two-column layout. */
function renderRows(rows: DisplayRow[]) {
  return rows.flatMap((row) => [
    <div key={`${row.label}-label`}>{row.label}:</div>,
    <div key={`${row.label}-value`} className="value-right">
      {row.value}
    </div>,
  ]);
}

export default function ClusterPanel({
  selection,
  allData,
  clusterSummary,
}: Props) {
  const profilePoints =
    selection.type === "point"
      ? [selection.point]
      : selection.type === "cluster"
      ? selection.points
      : allData;

  const showComparison = selection.type !== "none";

  const profileRows: DisplayRow =
    null as never;

  const resolvedProfileRows: DisplayRow[] =
    selection.type === "point"
      ? [
          { label: "Student ID", value: selection.point.id },
          {
            label: "Burnout",
            value: selection.point.burnout_level.toFixed(2),
          },
          {
            label: "Productivity",
            value: selection.point.productivity_score.toFixed(2),
          },
          {
            label: "Exam score",
            value: selection.point.exam_score.toFixed(2),
          },
          {
            label: "Mental health",
            value: selection.point.mental_health_score.toFixed(2),
          },
          {
            label: "Focus index",
            value: selection.point.focus_index.toFixed(2),
          },
          ...featureConfig.map(({ key, label, unit }) => ({
            label,
            value: formatValue(selection.point[key], unit),
          })),
        ]
      : [
          {
            label: "Average burnout",
            value: average(profilePoints, "burnout_level").toFixed(2),
          },
          {
            label: "Average productivity",
            value: average(profilePoints, "productivity_score").toFixed(2),
          },
          {
            label: "Average exam score",
            value: average(profilePoints, "exam_score").toFixed(2),
          },
          {
            label: "Average mental health",
            value: average(profilePoints, "mental_health_score").toFixed(2),
          },
          {
            label: "Average focus index",
            value: average(profilePoints, "focus_index").toFixed(2),
          },
          ...featureConfig
            .filter((feature) => !feature.categorical)
            .map(({ key, label, unit }) => ({
              label: `Average ${label.toLowerCase()}`,
              value: formatValue(average(profilePoints, key), unit),
            })),
        ];

  const restPoints =
    selection.type === "point"
      ? allData.filter((point) => point.id !== selection.point.id)
      : selection.type === "cluster"
      ? allData.filter(
          (point) => !selection.points.some((selected) => selected.id === point.id)
        )
      : [];

  const comparisonRows: DisplayRow[] =
    selection.type === "none"
      ? []
      : [
          {
            label: "Burnout level",
            value: formatDifference(
              average(profilePoints, "burnout_level") -
                average(restPoints, "burnout_level")
            ),
          },
          {
            label: "Productivity",
            value: formatDifference(
              average(profilePoints, "productivity_score") -
                average(restPoints, "productivity_score")
            ),
          },
          {
            label: "Exam score",
            value: formatDifference(
              average(profilePoints, "exam_score") -
                average(restPoints, "exam_score")
            ),
          },
          {
            label: "Mental health",
            value: formatDifference(
              average(profilePoints, "mental_health_score") -
                average(restPoints, "mental_health_score")
            ),
          },
          {
            label: "Focus index",
            value: formatDifference(
              average(profilePoints, "focus_index") -
                average(restPoints, "focus_index")
            ),
          },
          ...featureConfig
            .filter((feature) => !feature.categorical)
            .map(({ key, label, unit }) => ({
              label,
              value: formatDifference(
                average(profilePoints, key) - average(restPoints, key),
                unit
              ),
            })),
        ];

  const comparisonTitle =
    selection.type === "point" ? "Student vs Rest" : "Cluster vs Rest";

  return (
    <div className="cluster-panel-content">
      <section className="analysis-section-block">
        <div className="middle-section">
          <div className="middle-section-title">Profile overview</div>
          <div className="middle-values-box">
            <div className="two-col-list">{renderRows(resolvedProfileRows)}</div>
          </div>
        </div>

        {showComparison && (
          <div className="middle-section">
            <div className="middle-section-title">{comparisonTitle}</div>
            <div className="middle-values-box">
              <div className="two-col-list">
                {selection.type === "cluster" && clusterSummary
                  ? renderRows(comparisonRows)
                  : comparisonRows.length > 0
                  ? renderRows(comparisonRows)
                  : null}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}