// Static shell; the drawing is added in phase 4.
export default function Spectrogram() {
  return (
    <div className="spec-wrap">
      <canvas
        className="spec-canvas"
        role="img"
        aria-label="Animated illustration of a log-mel spectrogram of speech"
      />
      <span className="spec-label">fakewave · log-mel spectrogram</span>
      <div className="spec-toggle" role="group" aria-label="Voice type">
        <button type="button" aria-pressed="true">
          real voice
        </button>
        <button type="button" aria-pressed="false">
          synthetic
        </button>
      </div>
      <span className="spec-axis y">freq ↑ · time →</span>
    </div>
  );
}
