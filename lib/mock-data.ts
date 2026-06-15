// Tijdelijke data voor fase 1. In fase 2 komt dit uit Supabase
// (tabellen: stars, missies, vouches) met dezelfde vorm.

export type Ster = {
  id: string;
  naam: string;
  specialisme: string;
  seniority: string;
  beschikbaar: boolean;
  /** Publiek tonbare profielfoto (alleen met toestemming) */
  foto_url?: string | null;
  /**
   * Ids van sterren waarmee deze ster een (vouch)verbinding heeft.
   * Posities worden niet opgeslagen: StarField seedt ze stabiel op de id.
   */
  verbindingen?: string[];
};

export type Missie = {
  /** Aanwezig bij missies uit de DB; afwezig bij mock-fallback */
  id?: string;
  slug: string;
  titel: string;
  rol: string;
  locatie: string;
  urenPerWeek: string;
  tariefIndicatie: string;
  seniority: string;
  status: "open" | "gevuld";
  intro: string;
  omschrijving: string[];
  opdrachtgever: string;
};

export type Verhaal = {
  slug: string;
  titel: string;
  ondertitel: string;
  ster: string;
  rol: string;
  quote: string;
  alineas: string[];
};

// 51 mock-sterren. In fase 2 vervangt een Supabase-query (stars status=actief)
// deze lijst; de vorm blijft gelijk zodat StarField niet wijzigt.
const sterNamen = [
  "Maartje V.", "Daan K.", "Sofie B.", "Ruben T.", "Anne-Fleur D.",
  "Jasper M.", "Lotte H.", "Bram S.", "Yara E.", "Thomas W.",
  "Nadia R.", "Pieter J.", "Eva L.", "Koen A.", "Fleur P.",
  "Sander G.", "Iris N.", "Joost V.", "Sanne K.", "Tijn B.",
  "Noor M.", "Lars D.", "Femke H.", "Bas O.", "Roos T.",
  "Wessel K.", "Lieke V.", "Stijn R.", "Marit B.", "Gijs L.",
  "Hanne D.", "Niels P.", "Saar W.", "Teun M.", "Julia K.",
  "Mees B.", "Tess V.", "Daniël H.", "Loes G.", "Robin J.",
  "Anouk D.", "Cas T.", "Veerle M.", "Floris B.", "Esmee K.",
  "Menno W.", "Nina V.", "Carlijn S.", "Sven P.", "Imke R.",
  "Bram-Jan O.",
];

const specialismen = [
  "UX Design", "Product Design", "UX Research", "Service Design",
  "UX Writing", "Interaction Design", "Design Systems", "UX Strategy",
  "Content Design", "UI / Visual Design", "Design Ops", "Conversation Design",
];

const seniorityNiveaus = ["Junior", "Medior", "Senior", "Lead", "Principal"];

// Verbindingen als paren van (1-gebaseerde) indices — vormen het stelsel.
const verbindingsParen: [number, number][] = [
  [1, 2], [1, 4], [2, 5], [3, 5], [3, 6], [5, 7], [6, 10], [7, 8],
  [8, 9], [8, 14], [10, 13], [11, 14], [4, 12], [6, 11], [9, 15], [15, 17],
  [16, 18], [12, 16], [19, 20], [20, 21], [17, 22], [21, 25], [23, 25], [24, 26],
  [27, 28], [28, 29], [30, 31], [31, 33], [13, 19], [26, 30], [34, 37], [38, 40],
  [40, 42], [41, 43], [44, 45], [45, 47], [46, 48], [48, 49], [50, 51], [35, 36],
  [22, 24], [29, 32], [33, 35], [37, 39], [43, 44], [47, 50], [32, 34], [36, 38],
];

export const sterren: Ster[] = sterNamen.map((naam, i) => {
  const n = i + 1;
  const verbindingen = verbindingsParen
    .filter(([van]) => van === n)
    .map(([, naar]) => `s${naar}`);
  return {
    id: `s${n}`,
    naam,
    specialisme: specialismen[(i * 5) % specialismen.length],
    seniority: seniorityNiveaus[(i * 3 + 1) % seniorityNiveaus.length],
    // ~40% beschikbaar, deterministisch zodat de render stabiel is
    beschikbaar: (i * 13 + 4) % 10 < 4,
    ...(verbindingen.length ? { verbindingen } : {}),
  };
});

export const missies: Missie[] = [
  {
    slug: "senior-ux-designer-energieplatform",
    titel: "Herontwerp van een energieplatform voor 2 miljoen huishoudens",
    rol: "Senior UX Designer",
    locatie: "Amsterdam · hybride",
    urenPerWeek: "32 uur p/w",
    tariefIndicatie: "€95–110 p/u",
    seniority: "Senior",
    status: "open",
    intro:
      "Een grote energieleverancier vernieuwt zijn mijn-omgeving. Jij leidt het ontwerp van inzicht- en bespaarfeatures.",
    omschrijving: [
      "De huidige mijn-omgeving is organisch gegroeid en loopt tegen zijn grenzen aan. Samen met een vast productteam ontwerp je de nieuwe inzichtomgeving: verbruik, kosten en bespaaradvies in één helder verhaal.",
      "Je werkt nauw samen met een UX-researcher uit het UXSTARS-netwerk en presenteert je werk tweewekelijks aan stakeholders. Het designsysteem staat; jij bouwt erop voort en daagt het uit waar nodig.",
    ],
    opdrachtgever: "Energieleverancier (top 3 NL)",
  },
  {
    slug: "ux-researcher-zorgapp",
    titel: "Gebruikersonderzoek voor een zorgapp die mantelzorgers ontlast",
    rol: "UX Researcher",
    locatie: "Utrecht · 1 dag op locatie",
    urenPerWeek: "24 uur p/w",
    tariefIndicatie: "€85–95 p/u",
    seniority: "Medior–senior",
    status: "open",
    intro:
      "Een scale-up in de zorg wil weten waarom mantelzorgers afhaken na de eerste week. Jij zet het onderzoek op en vertaalt het naar ontwerprichting.",
    omschrijving: [
      "De app heeft een sterke instroom maar verliest gebruikers na zeven dagen. Jij ontwerpt en voert een mixed-methods onderzoek uit: interviews, dagboekstudie en funnel-analyse samen met de data-analist.",
      "Je rapporteert niet in een dik rapport maar in werksessies met het team. De uitkomsten landen direct in de roadmap.",
    ],
    opdrachtgever: "Zorgscale-up, Utrecht",
  },
  {
    slug: "product-designer-fintech-onboarding",
    titel: "Onboarding redesign voor een zakelijke betaalapp",
    rol: "Product Designer",
    locatie: "Volledig remote",
    urenPerWeek: "36 uur p/w",
    tariefIndicatie: "€90–105 p/u",
    seniority: "Senior",
    status: "open",
    intro:
      "Een fintech wil de activatie van nieuwe zakelijke klanten verdubbelen. Jij ontwerpt de onboarding van aanmelding tot eerste transactie.",
    omschrijving: [
      "De funnel kent twaalf stappen en een uitval van 60%. Jij brengt de flow terug naar de essentie, ontwerpt experimenten en werkt samen met twee engineers die dezelfde week shippen wat jij ontwerpt.",
      "KYC-eisen maken dit een puzzel met echte randvoorwaarden. Ervaring met compliance-zware flows is een plus.",
    ],
    opdrachtgever: "Fintech, Amsterdam",
  },
  {
    slug: "service-designer-gemeente",
    titel: "Dienstverlening rond schuldhulp opnieuw ontwerpen",
    rol: "Service Designer",
    locatie: "Rotterdam · hybride",
    urenPerWeek: "28 uur p/w",
    tariefIndicatie: "€80–95 p/u",
    seniority: "Medior–senior",
    status: "gevuld",
    intro:
      "Een grote gemeente wil dat inwoners met geldzorgen eerder aankloppen. Jij ontwerpt de reis van eerste signaal tot hulptraject.",
    omschrijving: [
      "Je brengt de huidige keten in kaart met inwoners, balie­medewerkers en schuldhulpverleners. Daarna prototyp je nieuwe contactmomenten en test je die in de praktijk, in de wijk.",
      "Deze missie is inmiddels gevuld door een ster uit het netwerk.",
    ],
    opdrachtgever: "Gemeente (G4)",
  },
  {
    slug: "design-systems-designer-saas",
    titel: "Eén designsysteem voor drie productteams van een SaaS-schaalbedrijf",
    rol: "Design Systems Designer",
    locatie: "Hybride · Eindhoven",
    urenPerWeek: "32 uur p/w",
    tariefIndicatie: "€90–105 p/u",
    seniority: "Senior",
    status: "open",
    intro:
      "Drie teams bouwen drie keer dezelfde componenten. Jij brengt rust met één designsysteem dat ze allemaal delen.",
    omschrijving: [
      "De productsuite is snel gegroeid en elk team maakt zijn eigen knoppen, tabellen en formulieren. Jij inventariseert de echte variatie, ontwerpt een gedeeld systeem en zet de governance op die het levend houdt.",
      "Je werkt samen met een front-end gilde en een tweede ster uit het netwerk voor de documentatie. Ervaring met tokens en een headless component-aanpak is een plus.",
    ],
    opdrachtgever: "SaaS-schaalbedrijf, Eindhoven",
  },
];

export const verhalen: Verhaal[] = [
  {
    slug: "maartje-energieplatform",
    titel: "Hoe Maartje een energieplatform menselijk maakte",
    ondertitel: "Van datadump naar bespaarverhaal in veertien weken",
    ster: "Maartje V.",
    rol: "Senior UX Designer",
    quote:
      "Het netwerk gaf me binnen een dag een sparringpartner toen ik vastliep op de informatiearchitectuur. Dat is het verschil met alleen freelancen.",
    alineas: [
      "Toen Maartje aan boord kwam, toonde de mijn-omgeving vooral grafieken. Gebruikersonderzoek liet zien dat klanten geen kilowatturen willen zien, maar antwoorden: zit ik goed, en wat kan ik doen?",
      "Ze herstructureerde de omgeving rond drie vragen en ontwierp een bespaaradvies dat zich aanpast aan het huishouden. De klanttevredenheid op de vernieuwde pagina's steeg van 6,4 naar 7,9.",
      "Via een vouch uit het netwerk haalde ze er tijdelijk een UX-writer bij voor de toon van de adviezen. Twee sterren, één missie.",
    ],
  },
  {
    slug: "sofie-onderzoek-zorgapp",
    titel: "Sofie vond in drie weken waarom mantelzorgers afhaakten",
    ondertitel: "Dagboekstudie legt de echte drempel bloot",
    ster: "Sofie B.",
    rol: "UX Researcher",
    quote:
      "De aanname was dat de app te ingewikkeld was. Het echte probleem was schuldgevoel: hulp vragen voelde als falen.",
    alineas: [
      "Sofie combineerde een dagboekstudie met diepte-interviews. Niet de interface bleek de drempel, maar de eerste vraag om hulp aan familie. Die stap voelde voor mantelzorgers als toegeven dat ze het niet alleen konden.",
      "Het team herschreef de uitnodigingsflow rond wederkerigheid: je vraagt geen hulp, je deelt een planning. De retentie na week één steeg met 34%.",
    ],
  },
  {
    slug: "bram-design-system-fintech",
    titel: "Bram bouwde het designsysteem dat drie teams ontkoppelde",
    ondertitel: "Eén taal voor product, marketing en platform",
    ster: "Bram S.",
    rol: "Senior Product Designer",
    quote:
      "Een designsysteem is geen bibliotheek, het is een afspraak. De componenten zijn het bewijs dat de afspraak werkt.",
    alineas: [
      "Drie teams bouwden drie keer dezelfde tabel, net even anders. Bram begon niet met componenten maar met een inventarisatie: waar zat de echte variatie, en waar alleen ruis?",
      "Na twaalf weken stond er een systeem met 28 componenten dat 80% van de schermen dekte. De ontwerptijd voor nieuwe features halveerde.",
    ],
  },
];
