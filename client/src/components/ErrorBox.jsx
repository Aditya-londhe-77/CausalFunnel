export default function ErrorBox({ message }) {
  return (
    <div className="state-box error">
      <strong>Error:</strong> {message}
    </div>
  );
}
