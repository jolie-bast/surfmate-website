// Long wordmark + one-line claim, from the style guide (Logos · Logo + claim):
// original logo file, never retyped; claim in Seattle, centred, exactly as wide
// as the logo; gap = half the logo's letter height.
export default function WearLockup({ tone = "black" }) {
  return (
    <div className={`wear-lockup wear-lockup-${tone}`}>
      <div className="wear-lockup-logo">
        <img src="/assets/logo-surfmate-schriftzug.svg" alt="Surfmate" />
      </div>
      <p className="sm-seattle">YOUR SURF. YOUR STORY.</p>
    </div>
  );
}
