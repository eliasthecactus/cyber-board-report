interface ExecutiveSummaryEditorProps {
  data: string;
  onUpdate: (data: string) => void;
}

export default function ExecutiveSummaryEditor({
  data,
  onUpdate,
}: ExecutiveSummaryEditorProps) {
  return (
    <div>
      <h2>Executive Summary</h2>
      <p className="text-base-content/70 text-sm mb-5">
        Brief overview of quarter, key highlights, and critical issues (3-4 sentences)
      </p>

      <div className="mb-5">
        <label className="label">
          <span className="label-text font-semibold">Summary:</span>
        </label>
        <textarea
          value={data}
          onChange={(e) => onUpdate(e.target.value)}
          placeholder="Provide a concise executive summary..."
          rows={4}
          className="textarea textarea-bordered w-full"
        />
      </div>

      <div className="alert alert-info mt-5">
        <div>
          <span>Tip: Write this last. Summarize the most important insights from other sections.</span>
        </div>
      </div>
    </div>
  );
}
