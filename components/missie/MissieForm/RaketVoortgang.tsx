export default function RaketVoortgang({
  stap,
  totaal,
}: {
  stap: number;
  totaal: number;
}) {
  const voortgang = (stap / (totaal - 1)) * 100;

  return (
    <div aria-hidden="true" className="relative mb-12 h-8">
      {/* Vluchtbaan */}
      <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-lijn" />
      <div
        className="absolute left-0 top-1/2 h-px -translate-y-1/2 bg-accent transition-all duration-400 ease-uit"
        style={{ width: `${voortgang}%` }}
      />
      {/* Het raketje */}
      <div
        className="absolute top-1/2 -translate-y-1/2 transition-all duration-400 ease-uit"
        style={{ left: `calc(${voortgang}% - 12px)` }}
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6 rotate-45 fill-accent">
          <path d="M12 2c3 2.5 4.5 6 4.5 9.5 0 1.4-.2 2.7-.6 3.9l2.6 2.6-1.4 3-3-1.4c-.7.3-1.4.4-2.1.4s-1.4-.1-2.1-.4l-3 1.4-1.4-3 2.6-2.6c-.4-1.2-.6-2.5-.6-3.9C7.5 8 9 4.5 12 2zm0 6a2 2 0 100 4 2 2 0 000-4z" />
        </svg>
      </div>
      {/* Bestemming */}
      <svg
        viewBox="0 0 24 24"
        className="absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 translate-x-1/2 fill-accent-actief"
      >
        <path d="M12 0l2.6 9.4L24 12l-9.4 2.6L12 24l-2.6-9.4L0 12l9.4-2.6L12 0z" />
      </svg>
    </div>
  );
}
