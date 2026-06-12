const logos = [
  "Eneco",
  "Gemeente Rotterdam",
  "Mollie",
  "NS",
  "Coolblue",
  "Achmea",
];

export default function LogoRij() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <p className="text-center text-sm font-semibold uppercase tracking-[0.2em] text-tekst-secundair">
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
