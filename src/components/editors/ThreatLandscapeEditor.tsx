interface ThreatLandscapeEditorProps {
  data: string;
  onUpdate: (data: string) => void;
}

export default function ThreatLandscapeEditor({
  data,
  onUpdate,
}: ThreatLandscapeEditorProps) {
  return (
    <div>
      <h2>Threat Landscape</h2>
      <p className="text-base-content/70 text-sm mb-5">
        External threats and emerging attack patterns (2-3 paragraphs)
      </p>

      <div className="mb-5">
        <label className="label">
          <span className="label-text">Threat Assessment:</span>
        </label>
        <textarea
          value={data}
          onChange={(e) => onUpdate(e.target.value)}
          placeholder="Describe the current threat landscape, APTs, zero-days, industry trends..."
          rows={6}
          className="textarea textarea-bordered w-full"
        />
      </div>

      <div className="alert alert-info mt-5">
        <div>
          <span>Tip: Focus on threats relevant to your industry. Reference threat reports, advisories.</span>
        </div>
      </div>
    </div>
  );
}
