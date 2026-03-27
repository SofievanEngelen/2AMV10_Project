import PlotModule from "react-plotly.js";
import "../App.css";
import type { PlotSelectionEvent, PlotMouseEvent } from "plotly.js";
import { useRef } from "react";
import type { StudentPoint } from "../Dashboard_old.tsx";

const Plot = (PlotModule as any).default ?? PlotModule;

type SelectionState =
  | { type: "none" }
  | { type: "point"; point: StudentPoint }
  | { type: "cluster"; points: StudentPoint[] };

type StrategyAtlasBackground = {
  x_range: number[];
  y_range: number[];
  z: number[][];
  feature_labels: string[];
};

type CounterfactualPreviewOption = {
  color?: string;
  symbol?: string;
  label?: string;
};

type ColourOptionValue =
  | "cluster"
  | "burnout_level"
  | "productivity_score"
  | "exam_score"
  | "study_hours"
  | "self_study_hours"
  | "online_classes_hours"
  | "social_media_hours"
  | "gaming_hours"
  | "sleep_hours"
  | "screen_time_hours"
  | "exercise_minutes"
  | "caffeine_intake_mg"
  | "mental_health_score"
  | "focus_index"
  | "age"
  | "part_time_job"
  | "upcoming_deadline";

type Props = {
  data: StudentPoint[];
  background?: StrategyAtlasBackground | null;
  temporaryPoint?: StudentPoint | null;
  previewPoint?: StudentPoint | null;
  colourBy: string;
  strategyColors: string[];
  onColourByChange: (value: string) => void;
  counterfactualOptions?: CounterfactualPreviewOption[];
  activeCfIndex?: number | null;
  selection: SelectionState;
  onPointSelect: (point: StudentPoint) => void;
  onClusterSelect: (points: StudentPoint[]) => void;
  onClearSelection: () => void;
};

const colourOptions = [
  { value: "cluster", label: "Strategy" },
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
] as const;

/** Convert the selected colour dimension into a numeric value per student point. */
function getContinuousValue(
  point: StudentPoint,
  key: ColourOptionValue | string
): number {
  switch (key) {
    case "burnout_level":
    case "productivity_score":
    case "exam_score":
    case "study_hours":
    case "self_study_hours":
    case "online_classes_hours":
    case "social_media_hours":
    case "gaming_hours":
    case "sleep_hours":
    case "screen_time_hours":
    case "exercise_minutes":
    case "caffeine_intake_mg":
    case "mental_health_score":
    case "focus_index":
    case "age":
      return Number(point[key as keyof StudentPoint] ?? 0);

    case "part_time_job":
      return String(point.part_time_job) === "Yes" ? 1 : Number(point.part_time_job ?? 0);

    case "upcoming_deadline":
      return String(point.upcoming_deadline) === "Yes"
        ? 1
        : Number(point.upcoming_deadline ?? 0);

    default:
      return 0;
  }
}

/** Return the IDs currently selected in the atlas. */
function getSelectedIds(selection: SelectionState): string[] {
  if (selection.type === "point") return [selection.point.id];
  if (selection.type === "cluster") return selection.points.map((p) => p.id);
  return [];
}

export default function StrategyAtlasPanel({
  data,
  background,
  temporaryPoint,
  previewPoint,
  colourBy,
  strategyColors,
  onColourByChange,
  selection,
  onPointSelect,
  onClusterSelect,
  onClearSelection,
  counterfactualOptions = [],
  activeCfIndex,
}: Props) {
  const suppressClickRef = useRef(false);

  const clusterColors = data.map((point) => {
    if (typeof point.cluster !== "number" || point.cluster < 0) {
      return "#BDBDBD";
    }
    return strategyColors[point.cluster % strategyColors.length];
  });

  const continuousValues = data.map((point) =>
    getContinuousValue(point, colourBy)
  );
  const minVal = Math.min(...continuousValues);
  const maxVal = Math.max(...continuousValues);
  const safeMax = minVal === maxVal ? minVal + 1e-6 : maxVal;

  const backgroundTrace = background
    ? {
        x: background.x_range,
        y: background.y_range,
        z: background.z,
        type: "heatmap" as const,
        colorscale: "Viridis",
        showscale: false,
        opacity: 0.2,
        hoverinfo: "skip" as const,
        colorbar: {
          len: 0,
          thickness: 0,
        },
      }
    : null;

  const temporaryTrace = temporaryPoint
    ? {
        x: [temporaryPoint.x],
        y: [temporaryPoint.y],
        type: "scatter" as const,
        mode: "markers" as const,
        name: "What-if point",
        showlegend: false,
        marker: {
          size: 13,
          color: "rgba(0,0,0,0)",
          opacity: 1,
          line: { color: "#FF0000", width: 3 },
        },
        hovertemplate: "What-if point<extra></extra>",
      }
    : null;

  const activeCf = activeCfIndex != null ? counterfactualOptions[activeCfIndex] : null;

  const previewTrace =
    previewPoint && activeCf
      ? {
          x: [previewPoint.x],
          y: [previewPoint.y],
          type: "scatter" as const,
          mode: "markers" as const,
          showlegend: false,
          marker: {
            size: 12,
            color: activeCf.color ?? "#999",
            symbol: activeCf.symbol ?? "circle",
          },
          hovertemplate: `${activeCf.label ?? "Strategy"}<extra></extra>`,
        }
      : null;

  const previewLineTrace =
    temporaryPoint && previewPoint && activeCf
      ? {
          x: [temporaryPoint.x, previewPoint.x],
          y: [temporaryPoint.y, previewPoint.y],
          type: "scatter" as const,
          mode: "lines" as const,
          showlegend: false,
          hoverinfo: "skip" as const,
          line: {
            color: activeCf.color ?? "#999",
            width: 2,
            dash: "dash",
          },
        }
      : null;

  const selectedIds = getSelectedIds(selection);

  const pointIndices = data
    .map((point, index) => (selectedIds.includes(point.id) ? index : -1))
    .filter((index) => index !== -1);

  const handleClick = (event: Readonly<PlotMouseEvent>) => {
    if (suppressClickRef.current) return;

    const clickedPoint = event.points?.[0];
    if (!clickedPoint) return;

    const pointIndex = clickedPoint.pointIndex;
    if (pointIndex == null) return;

    onPointSelect(data[pointIndex]);
  };

  const handleSelected = (event: Readonly<PlotSelectionEvent>) => {
    if (!event?.points || event.points.length === 0) return;

    const uniqueIndices = Array.from(
      new Set(
        event.points
          .map((point) => point.pointIndex)
          .filter((index): index is number => index != null)
      )
    );

    if (uniqueIndices.length === 0) return;

    suppressClickRef.current = true;
    window.setTimeout(() => {
      suppressClickRef.current = false;
    }, 150);

    onClusterSelect(uniqueIndices.map((index) => data[index]));
  };

  const marker =
    colourBy === "cluster"
      ? {
          color: clusterColors,
          size: 8,
          opacity: 0.85,
          line: { width: 0.5, color: "#ffffff" },
        }
      : {
          color: continuousValues,
          colorscale: "Viridis",
          cmin: minVal,
          cmax: safeMax,
          showscale: true,
          size: 8,
          opacity: 0.85,
          colorbar: {
            orientation: "h",
            x: 0.5,
            xanchor: "center",
            y: -0.2,
            yanchor: "top",
            len: 1,
            thickness: 12,
          },
          line: { width: 0 },
        };

  return (
    <div className="umap-panel-inner">
      <p className="umap-description">
        This Strategy Atlas groups students based on how the model explains their
        outcomes. Nearby points have similar explanation patterns, and the background
        regions show which feature is most dominant in that part of the atlas. Select
        a point or cluster to inspect local strategies and compare groups.
      </p>

      <div className="umap-plot-wrap">
        <Plot
          data={[
            ...(backgroundTrace ? [backgroundTrace] : []),
            {
              x: data.map((point) => point.x),
              y: data.map((point) => point.y),
              type: "scatter",
              mode: "markers",
              customdata: data.map((point) => point.id),
              selectedpoints: pointIndices,
              marker,
              selected: {
                marker: {
                  size: 13,
                  opacity: 1,
                  line: { color: "#FF0000", width: 3 },
                },
              },
              unselected: {
                marker: {
                  opacity: 0.15,
                },
              },
              hovertemplate:
                "ID: %{customdata}<br>x: %{x:.2f}<br>y: %{y:.2f}<extra></extra>",
              showlegend: false,
            },
            ...(previewLineTrace ? [previewLineTrace] : []),
            ...(previewTrace ? [previewTrace] : []),
            ...(temporaryTrace ? [temporaryTrace] : []),
          ]}
          layout={{
            autosize: true,
            dragmode: "lasso",
            margin: { l: 70, r: 15, t: 20, b: 120 },
            xaxis: {
              title: {
                text: "UMAP 1",
                font: { size: 14 },
              },
              zeroline: false,
            },
            yaxis: {
              title: {
                text: "UMAP 2",
                font: { size: 14 },
              },
              zeroline: false,
            },
            paper_bgcolor: "#d9d9d9",
            plot_bgcolor: "#d9d9d9",
            showlegend: false,
          }}
          config={{
            responsive: true,
            displaylogo: false,
            modeBarButtonsToAdd: ["lasso2d", "select2d"],
          }}
          style={{ width: "100%", height: "100%" }}
          useResizeHandler
          onClick={handleClick}
          onSelected={handleSelected}
          onDoubleClick={() => {
            onClearSelection();
            return false;
          }}
        />
      </div>

      <div className="umap-controls">
        <label className="umap-controls-label">Colour by:</label>

        <div className="umap-select-wrap">
          <select
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
          <span className="umap-select-arrow">▼</span>
        </div>

        <button className="umap-clear-btn" onClick={onClearSelection}>
          Clear selection
        </button>
      </div>
    </div>
  );
}