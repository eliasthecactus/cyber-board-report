interface OutlookEditorProps {
  data: string;
  onUpdate: (data: string) => void;
}

export default function OutlookEditor({ data, onUpdate }: OutlookEditorProps) {
  return (
    <div>
      <h2>Outlook & Emerging Risks</h2>
      <p className="text-base-content/70 text-sm mb-5">
        What to watch for next quarter. Emerging threats, planned changes, uncertainties.
      </p>

      <div className="mb-5">
        <label className="label">
          <span className="label-text">Outlook:</span>
        </label>
        <textarea
          value={data}
          onChange={(e) => onUpdate(e.target.value)}
          placeholder="Describe what's on the horizon: new regulations, industry shifts, planned investments, organizational changes..."
          rows={6}
          className="textarea textarea-bordered w-full"
        />
      </div>

      <div className="alert alert-info mt-5">
        <div>
          <span>Tip: Be forward-looking. Mention regulatory changes, M&A, new technology, etc.</span>
        </div>
      </div>
    </div>
  );
}
