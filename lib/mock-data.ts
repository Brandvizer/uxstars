// Tijdelijke data voor fase 1. In fase 2 komt dit uit Supabase
// (tabellen: stars, missies, vouches) met dezelfde vorm.

export type Ster = {
  id: string;
  naam: string;
  rol: string;
  beschikbaar: boolean;
  /** Positie als fractie van het canvas (0–1) */
  x: number;
  y: number;
  grootte: number;
};

export type Vouch = {
  van: string;
  naar: string;
};

export type Missie = {
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

export const sterren: Ster[] = [
  { id: "s1", naam: "Maartje V.", rol: "Senior UX Designer", beschikbaar: true, x: 0.18, y: 0.32, grootte: 3.2 },
  { id: "s2", naam: "Daan K.", rol: "Product Designer", beschikbaar: false, x: 0.31, y: 0.18, grootte: 2.6 },
  { id: "s3", naam: "Sofie B.", rol: "UX Researcher", beschikbaar: true, x: 0.44, y: 0.41, grootte: 3.0 },
  { id: "s4", naam: "Ruben T.", rol: "Design Lead", beschikbaar: false, x: 0.27, y: 0.58, grootte: 2.8 },
  { id: "s5", naam: "Anne-Fleur D.", rol: "Service Designer", beschikbaar: true, x: 0.55, y: 0.22, grootte: 2.7 },
  { id: "s6", naam: "Jasper M.", rol: "UX Designer", beschikbaar: false, x: 0.63, y: 0.52, grootte: 2.5 },
  { id: "s7", naam: "Lotte H.", rol: "UX Writer", beschikbaar: true, x: 0.72, y: 0.3, grootte: 2.9 },
  { id: "s8", naam: "Bram S.", rol: "Senior Product Designer", beschikbaar: false, x: 0.81, y: 0.48, grootte: 3.1 },
  { id: "s9", naam: "Yara E.", rol: "UX Researcher", beschikbaar: true, x: 0.88, y: 0.24, grootte: 2.6 },
  { id: "s10", naam: "Thomas W.", rol: "Interaction Designer", beschikbaar: false, x: 0.5, y: 0.68, grootte: 2.4 },
  { id: "s11", naam: "Nadia R.", rol: "Design Systems Designer", beschikbaar: true, x: 0.69, y: 0.72, grootte: 2.8 },
  { id: "s12", naam: "Pieter J.", rol: "Senior UX Designer", beschikbaar: false, x: 0.12, y: 0.62, grootte: 2.5 },
  { id: "s13", naam: "Eva L.", rol: "Product Designer", beschikbaar: true, x: 0.38, y: 0.78, grootte: 2.7 },
  { id: "s14", naam: "Koen A.", rol: "UX Strateeg", beschikbaar: false, x: 0.85, y: 0.7, grootte: 2.6 },
];

export const vouches: Vouch[] = [
  { van: "s1", naar: "s2" },
  { van: "s1", naar: "s4" },
  { van: "s2", naar: "s5" },
  { van: "s3", naar: "s5" },
  { van: "s3", naar: "s6" },
  { van: "s5", naar: "s7" },
  { van: "s6", naar: "s10" },
  { van: "s7", naar: "s8" },
  { van: "s8", naar: "s9" },
  { van: "s8", naar: "s14" },
  { van: "s10", naar: "s13" },
  { van: "s11", naar: "s14" },
  { van: "s4", naar: "s12" },
  { van: "s6", naar: "s11" },
];

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
