export default function Spinner({ text = 'Loading...' }) {
  return (
    <div className="state-box">
      <div className="spinner" />
      <div>{text}</div>
    </div>
  );
}
