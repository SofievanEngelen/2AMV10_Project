import PlotModule from "react-plotly.js";
import "../App.css"
import type { PlotSelectionEvent, PlotMouseEvent } from "plotly.js";
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

export default function UmapPanel({
  data,
  colourBy,
  onColourByChange,
  selection,
  onPointSelect,
  onClusterSelect,
  onClearSelection,
}: Props) {
  const colourValues = data.map((d) => {
    switch (colourBy) {
      case "productivity":
        return d.productivity;
      case "sleep":
        return d.sleep;
      case "study_hours":
        return d.study_hours;
      case "phone_usage":
        return d.phone_usage;
      case "stress":
      default:
        return d.stress;
    }
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
    const p = event.points?.[0];
    if (!p) return;
    const pointIndex = p.pointIndex;
    if (pointIndex == null) return;
    onPointSelect(data[pointIndex]);
  };

  const handleSelected = (event: Readonly<PlotSelectionEvent>) => {
    if (!event?.points || event.points.length === 0) {
      onClearSelection();
      return;
    }

    const unique = Array.from(
      new Set(
        event.points
          .map((p) => p.pointIndex)
          .filter((i): i is number => i != null)
      )
    );

    onClusterSelect(unique.map((i) => data[i]));
  };

  return (
    <div className="umap-panel-inner">
      <p className="umap-description">
        Adjust values like sleep, study time, or phone usage to see how the
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
                  y: -0.2,
                  len: 0.65,
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
            margin: { l: 40, r: 10, t: 20, b: 90 },
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
          <option value="stress">Stress level</option>
          <option value="productivity">Productivity</option>
          <option value="sleep">Sleep hours</option>
          <option value="study_hours">Study hours</option>
          <option value="phone_usage">Phone usage</option>
        </select>

        <button className="clear-selection-btn" onClick={onClearSelection}>
          Clear selection
        </button>
      </div>
    </div>
  );
}