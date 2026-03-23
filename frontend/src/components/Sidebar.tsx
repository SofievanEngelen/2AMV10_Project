type SidebarProps = {
  target: string;
  colourBy: string;
  onTargetChange: (value: string) => void;
  onColourByChange: (value: string) => void;
};

export default function Sidebar({
  target,
  colourBy,
  onTargetChange,
  onColourByChange,
}: SidebarProps) {
  return (
    <div className="panel-content">
      <h1 className="panel-title">Academic AdvAIsor</h1>

      <div className="control-group">
        <label>Target:</label>
        <select value={target} onChange={(e) => onTargetChange(e.target.value)}>
          <option value="stress">Stress level</option>
          <option value="productivity">Productivity</option>
        </select>
      </div>

      <div className="control-group">
        <label>Colour by:</label>
        <select value={colourBy} onChange={(e) => onColourByChange(e.target.value)}>
          <option value="stress">Stress level</option>
          <option value="productivity">Productivity</option>
          <option value="cluster">Cluster</option>
        </select>
      </div>
    </div>
  );
}