const logos = [
  "Eneco",
  "Gemeente Rotterdam",
  "Mollie",
  "NS",
  "Coolblue",
  "Achmea",
];

/** `compact`: minder verticale ruimte, bijv. direct onder een formulier. */
export default function LogoRij({ compact = false }: { compact?: boolean }) {
  return (
    <section
      className={`mx-auto max-w-7xl px-4 sm:px-6 ${compact ? "py-10" : "py-16"}`}
    >
      <p className="label text-center text-tekst-secundair">
        Sterren van UXSTARS werkten voor
      </p>
      <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
        {logos.map((naam) => (
          <li
            key={naam}
            className="text-xl font-semibold text-tekst-secundair/50 transition-colors duration-300 ease-uit hover:text-tekst"
          >
            {naam}
          </li>
        ))}
      </ul>
    </section>
  );
}
