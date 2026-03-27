import { useState } from "react";
import "../App.css";

type StrategyProfile = {
  name: string;
  count: number;
  success_pct?: number;
  features?: {
    name: string;
    importance: number;
  }[];
};

type Props = {
  strategyProfiles: StrategyProfile[];
};

export default function ModelStrategiesPanel({ strategyProfiles = [] }: Props) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selected = strategyProfiles?.[selectedIndex];

  return (
    <div className="model-strategies-panel">
      <div className="model-strategies-pills">
        {strategyProfiles.map((strategy, index) => {
          const colorClass =
            index % 3 === 0 ? "blue" : index % 3 === 1 ? "orange" : "green";

          return (
            <button
              key={strategy.name}
              type="button"
              onClick={() => setSelectedIndex(index)}
              className={`strategy-pill ${colorClass} ${
                index !== selectedIndex ? "inactive" : ""
              }`}
            >
              {strategy.name}
            </button>
          );
        })}
      </div>

      {!selected ? (
        <div className="model-strategies-empty">No strategies available.</div>
      ) : (
        <div className="model-strategies-card">
          <div className="model-strategies-card-scroll">
            <div className="model-strategies-label">Students:</div>
            <div className="model-strategies-value">{selected.count}</div>

            <div className="model-strategies-label">
              Student performance:
            </div>
            <div className="model-strategies-value">
              {Number(selected.success_pct ?? 0).toFixed(1)}%
            </div>

            {(selected.features ?? []).map((feature, i) => (
              <>
                <div
                  key={`${feature.name}-label`}
                  className="model-strategies-label"
                >
                  {feature.name}
                </div>
                <div
                  key={`${feature.name}-value`}
                  className="model-strategies-value"
                >
                  {Number(feature.importance ?? 0).toFixed(3)}
                </div>
              </>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}