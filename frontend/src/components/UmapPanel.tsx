import PlotModule from "react-plotly.js";
import "../App.css";
import type { PlotSelectionEvent, PlotMouseEvent } from "plotly.js";
import {useEffect, useRef} from "react";
import type { StudentPoint } from "../Dashboard";

const Plot = (PlotModule as any).default ?? PlotModule;

type SelectionState =
  | { type: "none" }
  | { type: "point"; point: StudentPoint }
  | { type: "cluster"; points: StudentPoint[] };

type Props = {
  data: StudentPoint[];
  colourBy: string;
  onColourByChange: (value: string) => void;
  selection: SelectionState;
  onPointSelect: (point: StudentPoint) => void;
  onClusterSelect: (points: StudentPoint[]) => void;
  onClearSelection: () => void;
};

const colourOptions = [
  { value: "burnout_level", label: "Burnout level" },
  { value: "productivity_score", label: "Productivity score" },
  { value: "exam_score", label: "Exam score" },
  { value: "study_hours", label: "Study hours" },
  { value: "self_study_hours", label: "Self study hours" },
  { value: "online_classes_hours", label: "Online classes hours" },
  { value: "social_media_hours", label: "Social media hours" },
  { value: "gaming_hours", label: "Gaming hours" },
  { value: "sleep_hours", label: "Sleep hours" },
  { value: "screen_time_hours", label: "Screen time hours" },
  { value: "exercise_minutes", label: "Exercise minutes" },
  { value: "caffeine_intake_mg", label: "Caffeine intake" },
  { value: "mental_health_score", label: "Mental health score" },
  { value: "focus_index", label: "Focus index" },
  { value: "age", label: "Age" },
  { value: "part_time_job", label: "Part-time job" },
  { value: "upcoming_deadline", label: "Upcoming deadline" },
  { value: "cluster", label: "Cluster" },
] as const;

export default function UmapPanel({
  data,
  colourBy,
  onColourByChange,
  selection,
  onPointSelect,
  onClusterSelect,
  onClearSelection,
}: Props) {


  const suppressClickRef = useRef(false);

  const colourValues = data.map((d) => {
    const value = d[colourBy as keyof StudentPoint];
    return typeof value === "number" ? value : 0;
  });

  const selectedIds =
    selection.type === "point"
      ? [selection.point.id]
      : selection.type === "cluster"
      ? selection.points.map((p) => p.id)
      : [];

  const pointIndices = data
    .map((d, i) => (selectedIds.includes(d.id) ? i : -1))
    .filter((i) => i !== -1);

  const handleClick = (event: Readonly<PlotMouseEvent>) => {
    if (suppressClickRef.current) return;

    const p = event.points?.[0];
    if (!p) return;

    const pointIndex = p.pointIndex;
    if (pointIndex == null) return;

    onPointSelect(data[pointIndex]);
  };

  const handleSelected = (event: Readonly<PlotSelectionEvent>) => {
    if (!event?.points || event.points.length === 0) {
      return;
    }

    const unique = Array.from(
      new Set(
        event.points
          .map((p) => p.pointIndex)
          .filter((i): i is number => i != null)
      )
    );

    if (unique.length === 0) return;

    suppressClickRef.current = true;
    window.setTimeout(() => {
      suppressClickRef.current = false;
    }, 150);

    onClusterSelect(unique.map((i) => data[i]));
  };

  return (
    <div className="umap-panel-inner">
      <p className="umap-description">
        Adjust values like sleep, study time, or screen time to see how the
        prediction changes. The system updates the outcome and shows where the
        student would move in the UMAP.
      </p>

      <div className="umap-plot-wrap">
        <Plot
          data={[
            {
              x: data.map((d) => d.x),
              y: data.map((d) => d.y),
              type: "scatter",
              mode: "markers",
              customdata: data.map((d) => d.id),
              selectedpoints: pointIndices,
              marker: {
                size: 10,
                color: colourValues,
                colorscale: "Viridis",
                showscale: true,
                colorbar: {
                  orientation: "h",
                  x: 0.5,
                  xanchor: "center",
                  y: -0.15,
                  len: 1,
                  thickness: 12,
                },
                line: {
                  width: 0,
                },
              },
              selected: {
                marker: {
                  size: 13,
                  opacity: 1,
                  line: { color: "#111", width: 2 },
                },
              },
              unselected: {
                marker: {
                  opacity: 0.35,
                },
              },
              hovertemplate:
                "ID: %{customdata}<br>x: %{x:.2f}<br>y: %{y:.2f}<extra></extra>",
            },
          ]}
          layout={{
            autosize: true,
            dragmode: "lasso",
            margin: { l: 15, r: 15, t: 20, b: 90 },
            paper_bgcolor: "#d9d9d9",
            plot_bgcolor: "#d9d9d9",
          }}
          config={{
            responsive: true,
            displaylogo: false,
            modeBarButtonsToAdd: ["lasso2d", "select2d"],
          }}
          style={{ width: "100%", height: "100%" }}
          useResizeHandler={true}
          onClick={handleClick}
          onSelected={handleSelected}
          onDoubleClick={() => {
            onClearSelection();
            return false;
          }}
        />
      </div>

      <div className="umap-controls">
        <label htmlFor="colour-by-select" className="umap-control-label">
          Colour by
        </label>
        <select
          id="colour-by-select"
          className="umap-select"
          value={colourBy}
          onChange={(e) => onColourByChange(e.target.value)}
        >
          {colourOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <button className="clear-selection-btn" onClick={onClearSelection}>
          Clear selection
        </button>
      </div>
    </div>
  );
}