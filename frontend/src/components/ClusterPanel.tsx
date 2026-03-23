import type { StudentPoint } from "../Dashboard";

type SelectionState =
  | { type: "none" }
  | { type: "point"; point: StudentPoint }
  | { type: "cluster"; points: StudentPoint[] };

type Props = {
  selection: SelectionState;
  allData: StudentPoint[];
};

function average(points: StudentPoint[], key: keyof StudentPoint) {
  const values = points
    .map((p) => p[key])
    .filter((v) => typeof v === "number") as number[];

  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export default function ClusterPanel({ selection, allData }: Props) {
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
          { label: "Stress", value: selection.point.stress.toFixed(2) },
          { label: "Productivity", value: selection.point.productivity.toFixed(2) },
          { label: "Sleep", value: `${selection.point.sleep.toFixed(1)} hours` },
          { label: "Study hours", value: `${selection.point.study_hours.toFixed(1)} hours` },
          { label: "Phone usage", value: `${selection.point.phone_usage.toFixed(1)} hours` },
        ]
      : [
          { label: "Average sleep", value: `${average(profilePoints, "sleep").toFixed(1)} hours` },
          { label: "Average study", value: `${average(profilePoints, "study_hours").toFixed(1)} hours` },
          { label: "Average phone usage", value: `${average(profilePoints, "phone_usage").toFixed(1)} hours` },
          { label: "Average stress", value: average(profilePoints, "stress").toFixed(2) },
          { label: "Average productivity", value: average(profilePoints, "productivity").toFixed(2) },
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
              <div>Sleep:</div>
              <div className="value-right">+2 hours</div>

              <div>Study:</div>
              <div className="value-right">+0 hours</div>

              <div>Phone usage:</div>
              <div className="value-right">+2 hours</div>

              <div>Exercise:</div>
              <div className="value-right">-3 hours</div>

              <div>Social media:</div>
              <div className="value-right">+3 hours</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}