import type { ClusterSummaryResponse } from "../api/types";
import type { StudentPoint } from "../Dashboard";

type SelectionState =
  | { type: "none" }
  | { type: "point"; point: StudentPoint }
  | { type: "cluster"; points: StudentPoint[] };

type Props = {
  selection: SelectionState;
  allData: StudentPoint[];
  clusterSummary?: ClusterSummaryResponse | null;
};

const featureConfig = [
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

function average(points: StudentPoint[], key: keyof StudentPoint) {
  const values = points
    .map((p) => p[key])
    .filter((v) => typeof v === "number") as number[];

  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function formatValue(value: unknown, unit?: string) {
  if (typeof value === "number") {
    return unit ? `${value.toFixed(1)} ${unit}` : value.toFixed(2);
  }
  return String(value);
}

function formatDifference(diff: number, unit?: string) {
  const sign = diff > 0 ? "+" : "";
  return unit ? `${sign}${diff.toFixed(1)} ${unit}` : `${sign}${diff.toFixed(2)}`;
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

  const profileRows =
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
          ...featureConfig.map(({ key, label, unit }) => {
            const value = selection.point[key as keyof StudentPoint];
            return {
              label,
              value: formatValue(value, unit),
            };
          }),
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
              .filter((f) => !f.categorical)
              .map(({ key, label, unit }) => {
            return {
              label: `Average ${label.toLowerCase()}`,
              value: formatValue(
                average(profilePoints, key as keyof StudentPoint),
                unit
              ),
            };
          }),
        ];

  const restPoints =
    selection.type === "point"
      ? allData.filter((p) => p.id !== selection.point.id)
      : selection.type === "cluster"
      ? allData.filter((p) => !selection.points.some((sp) => sp.id === p.id))
      : [];

  const comparisonRows =
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
          .filter((f) => !f.categorical)
          .map(({ key, label, unit }) => {
            const diff =
              average(profilePoints, key as keyof StudentPoint) -
              average(restPoints, key as keyof StudentPoint);

            return {
              label,
              value: formatDifference(diff, unit),
            };
          }),
        ];

  const comparisonTitle =
    selection.type === "point" ? "Student vs Rest" : "Cluster vs Rest";

  return (
    <div className="cluster-panel-content">
      <section className="analysis-section-block">
        <div className="middle-section">
          <div className="middle-section-title">Profile overview</div>
          <div className="middle-values-box">
            <div className="two-col-list">
              {profileRows.flatMap((row) => [
                <div key={`${row.label}-label`}>{row.label}:</div>,
                <div key={`${row.label}-value`} className="value-right">
                  {row.value}
                </div>,
              ])}
            </div>
          </div>
        </div>

        <div className="middle-section">
          <div className="middle-section-title">{comparisonTitle}</div>
          <div className="middle-values-box">
            <div className="two-col-list">
              {selection.type === "cluster" && clusterSummary ? (
                <>
                  {comparisonRows.flatMap((row) => [
                    <div key={`${row.label}-label`}>{row.label}:</div>,
                    <div key={`${row.label}-value`} className="value-right">
                      {row.value}
                    </div>,
                  ])}
                </>
              ) : comparisonRows.length > 0 ? (
                comparisonRows.flatMap((row) => [
                  <div key={`${row.label}-label`}>{row.label}:</div>,
                  <div key={`${row.label}-value`} className="value-right">
                    {row.value}
                  </div>,
                ])
              ) : (
                <>
                  <div>No comparison</div>
                  <div className="value-right">Select a point or cluster</div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}