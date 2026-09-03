const logos = [
  "Eneco",
  "Gemeente Rotterdam",
  "Mollie",
  "NS",
  "Coolblue",
  "Achmea",
];

export default function LogoRij({ compact = false }: { compact?: boolean }) {
  return (
    <section
      className={`mx-auto max-w-7xl px-4 sm:px-6 ${compact ? "py-10" : "py-16"}`}
    >
      <p className="label text-center text-tekst-secundair">
        Sterren van UXSTARS werkten voor
      </p>
      <ul
        className={`flex flex-wrap items-center justify-center gap-y-4 ${
          compact ? "mt-6 gap-x-10" : "mt-8 gap-x-12 gap-y-6"
        }`}
      >
        {logos.map((naam) => (
          <li
            key={naam}
            className={`font-semibold text-tekst-secundair/50 transition-colors duration-300 ease-uit hover:text-tekst ${
              compact ? "text-lg" : "text-xl"
            }`}
          >
            {naam}
          </li>
        ))}
      </ul>
    </section>
  );
}
