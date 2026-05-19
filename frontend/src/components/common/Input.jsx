export default function Input({ label, error, ...props }) {
  return (
    <div className="input-group">
      {label && <label>{label}</label>}
      <input {...props} />
      {error && <span className="input-error">{error}</span>}
    </div>
  );
}
