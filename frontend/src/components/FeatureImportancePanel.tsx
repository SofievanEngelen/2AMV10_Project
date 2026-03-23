import PlotModule from "react-plotly.js";
const Plot = (PlotModule as any).default ?? PlotModule;
import type { StudentPoint } from "../Dashboard";

type SelectionState =
  | { type: "none" }
  | { type: "point"; point: StudentPoint }
  | { type: "cluster"; points: StudentPoint[] };

type Props = {
  selection: SelectionState;
};

export default function FeatureImportancePanel({ selection }: Props) {
  const featureNames =
    selection.type === "point"
      ? [
          "Sleep",
          "Study hours",
          "Phone usage",
          "Stress",
          "Productivity",
          "Social media",
          "Gaming hours",
          "Exercise",
          "Focus",
          "Attendance",
          "Consistency",
          "Notifications",
          "YouTube",
          "Age",
        ]
      : [
          "Sleep",
          "Study hours",
          "Phone usage",
          "Stress",
          "Productivity",
          "Social media",
          "Gaming hours",
          "Exercise",
          "Focus",
          "Attendance",
          "Consistency",
          "Notifications",
          "YouTube",
          "Age",
          "Gender",
          "Preferred study time",
        ];

  const featureValues =
    selection.type === "point"
      ? [0.19, 0.17, 0.15, 0.12, 0.1, 0.08, 0.07, 0.055, 0.05, 0.04, 0.03, 0.025, 0.02, 0.015]
      : selection.type === "cluster"
        ? [0.18, 0.16, 0.14, 0.13, 0.11, 0.09, 0.08, 0.06, 0.05, 0.045, 0.035, 0.03, 0.025, 0.02, 0.015, 0.01]
        : [0.2, 0.18, 0.16, 0.14, 0.11, 0.09, 0.075, 0.06, 0.055, 0.045, 0.04, 0.03, 0.025, 0.02, 0.015, 0.01];

  const chartHeight = Math.max(200, featureNames.length * 12);
  const maxValue = Math.max(...featureValues) * 1.1;

  const rowHeight = chartHeight / featureNames.length;
  const fontSize = Math.max(8, Math.min(6, rowHeight * 0.6));

  return (
    <div className="feature-panel-content">
  <div className="feature-block">
    <div className="feature-plot-shell">
      <div className="feature-chart-scroll">
        <div className="feature-chart-inner" style={{ height: chartHeight }}>
          <Plot
            data={[
              {
                type: "bar",
                orientation: "h",
                x: featureValues,
                y: featureNames,
                hovertemplate: "%{y}: %{x:.3f}<extra></extra>",
                marker: {
                  line: { width: 0 },
                },
              },
            ]}
            layout={{
              autosize: true,
              height: chartHeight,
              margin: { l: 40, r: 20, t: 0, b: 0 },
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
              showlegend: false,
              bargap: 0.05,
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
              tickfont: fontSize,
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

    <div className="feature-footer">
      <div className="toggle-row">
        <div className="toggle-pill">
          <div className="toggle-knob" />
        </div>
        <span>Global</span>
      </div>
    </div>
  </div>
</div>
  );
}