import PlotModule from "react-plotly.js";
const Plot = (PlotModule as any).default ?? PlotModule;

import type { FeatureImportanceItem } from "../api/types";
import type { StudentPoint } from "../Dashboard";

type SelectionState =
  | { type: "none" }
  | { type: "point"; point: StudentPoint }
  | { type: "cluster"; points: StudentPoint[] };

type Props = {
  selection: SelectionState;
  items?: FeatureImportanceItem[];
  localItems?: Record<string, number> | null;
  compact?: boolean;
};

export default function FeatureImportancePanel({
  selection,
  items = [],
  localItems = null,
  compact = false,
}: Props) {
  const fallbackNames =
    selection.type === "point"
      ? [
          "sleep_hours",
          "study_hours",
          "screen_time_hours",
          "social_media_hours",
          "gaming_hours",
          "mental_health_score",
          "focus_index",
        ]
      : [
          "sleep_hours",
          "study_hours",
          "screen_time_hours",
          "social_media_hours",
          "gaming_hours",
          "mental_health_score",
          "focus_index",
          "exercise_minutes",
        ];

  const fallbackValues =
    selection.type === "point"
      ? [0.19, 0.17, 0.15, 0.12, 0.1, 0.08, 0.07]
      : [0.2, 0.18, 0.16, 0.14, 0.11, 0.09, 0.075, 0.06];

  const globalMap =
    items.length > 0
      ? Object.fromEntries(items.map((d) => [d.feature, d.importance]))
      : Object.fromEntries(
          fallbackNames.map((name, i) => [name, fallbackValues[i] ?? 0])
        );

  const hasLocal =
    selection.type !== "none" &&
    localItems != null &&
    Object.keys(localItems).length > 0;

  const localMap = hasLocal
    ? Object.fromEntries(
        Object.entries(localItems!).map(([key, value]) => [key, Math.abs(value)])
      )
    : {};

  const featureNames = hasLocal
    ? Array.from(new Set([...Object.keys(globalMap), ...Object.keys(localMap)]))
    : Object.keys(globalMap);

  const sortedFeatureNames = [...featureNames].sort((a, b) => {
    if (hasLocal) {
      return (localMap[b] ?? 0) - (localMap[a] ?? 0);
    }
    return (globalMap[b] ?? 0) - (globalMap[a] ?? 0);
  });

  const globalValues = sortedFeatureNames.map((name) => globalMap[name] ?? 0);
  const localValues = sortedFeatureNames.map((name) => localMap[name] ?? 0);

  const ROW_HEIGHT = hasLocal ? (compact ? 22 : 26) : compact ? 16 : 20;
  const MIN_HEIGHT = compact ? 170 : 220;
  const chartHeight = Math.max(MIN_HEIGHT, sortedFeatureNames.length * ROW_HEIGHT);

  const maxValue = Math.max(
    0.01,
    ...globalValues,
    ...(hasLocal ? localValues : [0])
  ) * 1.1;

  const rowHeight = chartHeight / Math.max(sortedFeatureNames.length, 1);
  const fontSize = Math.max(8, Math.min(10, rowHeight * 0.5));

  const traces = hasLocal
    ? [
        {
          type: "bar" as const,
          orientation: "h" as const,
          x: globalValues,
          y: sortedFeatureNames,
          name: "Global",
          hovertemplate: "Global<br>%{y}: %{x:.3f}<extra></extra>",
          marker: { line: { width: 0 } },
          width: 0.35,
        },
        {
          type: "bar" as const,
          orientation: "h" as const,
          x: localValues,
          y: sortedFeatureNames,
          name: "Local",
          hovertemplate: "Local<br>%{y}: %{x:.3f}<extra></extra>",
          marker: { line: { width: 0 } },
          width: 0.35,
        },
      ]
    : [
        {
          type: "bar" as const,
          orientation: "h" as const,
          x: globalValues,
          y: sortedFeatureNames,
          name: "Global",
          hovertemplate: "Global<br>%{y}: %{x:.3f}<extra></extra>",
          marker: { line: { width: 0 } },
        },
      ];

  return (
    <div className="feature-panel-content">
      <div className="feature-block">
        <div className="feature-plot-shell">
          <div className="feature-chart-scroll">
            <div className="feature-chart-inner" style={{ height: chartHeight }}>
              <Plot
                data={traces}
                layout={{
                  autosize: true,
                  height: chartHeight,
                  margin: { l: 40, r: 20, t: hasLocal ? 20 : 0, b: 0 },
                  barmode: hasLocal ? "group" : "relative",
                  xaxis: {
                    range: [0, maxValue],
                    showticklabels: false,
                    ticks: "",
                    showgrid: true,
                    zeroline: false,
                  },
                  yaxis: {
                    automargin: true,
                    autorange: "reversed",
                    tickfont: {
                      size: fontSize,
                    },
                  },
                  paper_bgcolor: "#efefef",
                  plot_bgcolor: "#efefef",
                  showlegend: hasLocal,
                  legend: hasLocal
                    ? {
                        orientation: "h",
                        x: 0,
                        y: 1.1,
                        font: { size: 10 },
                      }
                    : undefined,
                  bargap: hasLocal ? 0.2 : 0.05,
                  bargroupgap: hasLocal ? 0.08 : 0,
                }}
                config={{
                  responsive: true,
                  displayModeBar: false,
                }}
                style={{ width: "100%", height: "100%" }}
                useResizeHandler
              />
            </div>
          </div>

          <div className="feature-axis-fixed">
            <Plot
              data={[
                {
                  type: "scatter",
                  x: [0, maxValue],
                  y: [0, 0],
                  mode: "lines",
                  line: { width: 0 },
                  hoverinfo: "skip",
                  showlegend: false,
                },
              ]}
              layout={{
                autosize: true,
                height: 15,
                margin: { l: 60, r: 20, t: 0, b: 24 },
                xaxis: {
                  range: [0, maxValue],
                  showgrid: false,
                  zeroline: false,
                  tickformat: ".2f",
                  fixedrange: true,
                  tickfont: { size: fontSize },
                },
                yaxis: {
                  visible: false,
                  fixedrange: true,
                },
                paper_bgcolor: "#efefef",
                plot_bgcolor: "#efefef",
                showlegend: false,
              }}
              config={{
                responsive: true,
                displayModeBar: false,
                staticPlot: true,
              }}
              style={{ width: "100%", height: "100%" }}
              useResizeHandler
            />
          </div>
        </div>
      </div>
    </div>
  );
}