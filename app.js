const { useState, useEffect, useMemo } = React;

const TODAY_LABEL = new Date().toLocaleDateString("fr-FR", {
  weekday: "long", year: "numeric", month: "long", day: "numeric",
});

const BLOCS = [
  { id: "eg", label: "Extrême gauche", color: "#B0122A" },
  { id: "g", label: "Gauche", color: "var(--red)" },
  { id: "eco", label: "Écologie", color: "var(--green)" },
  { id: "c", label: "Centre", color: "var(--gold)" },
  { id: "d", label: "Droite", color: "#3A5A8C" },
  { id: "ed", label: "Extrême droite", color: "#1A1A1A" },
];

/* Partis & candidats restent gérés à la main (données peu volatiles).
   Pour les auto-générer aussi, on peut écrire un second script Python
   qui scrape/actualise ce bloc — voir README, section "aller plus loin". */
const PARTIS = [
  { bloc: "eg", nom: "Lutte ouvrière", sigle: "LO", figure: "Nathalie Arthaud", fonde: "1968 (sous ce nom depuis 1974)",
    note: "Parti trotskiste, héritier d'Arlette Laguiller, porte une ligne ouvriériste et anticapitaliste constante depuis un demi-siècle.", avis: "Une voix minoritaire mais qui n'a jamais dévié de la question sociale." },
  { bloc: "eg", nom: "Nouveau Parti anticapitaliste", sigle: "NPA", figure: "Philippe Poutou (porte-parole)", fonde: "2009",
    note: "Issu de la Ligue communiste révolutionnaire, milite pour une rupture avec le capitalisme et appelle à l'union la plus large à gauche.", avis: null },
  { bloc: "g", nom: "La France insoumise", sigle: "LFI", figure: "Jean-Luc Mélenchon", fonde: "2016",
    note: "Première force de gauche à l'Assemblée depuis 2022, porte un programme de rupture et une ligne critique de l'Union européenne actuelle.", avis: "Le moteur du Nouveau Front populaire, mais dont le style clivant complique parfois l'union qu'il appelle de ses vœux." },
  { bloc: "g", nom: "Parti communiste français", sigle: "PCF", figure: "Fabien Roussel", fonde: "1920",
    note: "Doyen des partis de gauche, défend une ligne axée sur le pouvoir d'achat et les services publics, à distance de LFI depuis 2022.", avis: null },
  { bloc: "g", nom: "Parti socialiste", sigle: "PS", figure: "Olivier Faure", fonde: "1969",
    note: "Ancien parti de gouvernement, traversé par un débat interne entre primaire élargie et fidélité au Nouveau Front populaire.", avis: "Le PS doit choisir entre se dissoudre dans une primaire commune ou risquer l'isolement." },
  { bloc: "g", nom: "Place Publique", sigle: "PP", figure: "Raphaël Glucksmann", fonde: "2018",
    note: "Mouvement social-démocrate et europhile, arrivé en tête de la gauche aux européennes de 2024.", avis: null },
  { bloc: "g", nom: "Génération.s", sigle: "G.s", figure: "Direction collégiale", fonde: "2017",
    note: "Né de la campagne de Benoît Hamon, participe à la primaire de la gauche unitaire d'octobre 2026.", avis: null },
  { bloc: "g", nom: "L'Après", sigle: "—", figure: "Figures issues de la gauche plurielle", fonde: "2025",
    note: "Formation récente, engagée dans la primaire unitaire d'octobre 2026.", avis: null },
  { bloc: "g", nom: "Debout!", sigle: "—", figure: "Clémentine Autain (proche)", fonde: "2025",
    note: "Mouvement issu de LFI et de la gauche écologiste, se présente comme trait d'union de la gauche.", avis: null },
  { bloc: "g", nom: "La Convention", sigle: "—", figure: "Bernard Cazeneuve", fonde: "2024",
    note: "Fondé après la rupture de Bernard Cazeneuve avec le PS, refuse la primaire, ligne d'autorité républicaine assumée à gauche.", avis: null },
  { bloc: "eco", nom: "Les Écologistes", sigle: "EELV", figure: "Marine Tondelier", fonde: "1984",
    note: "Principal parti écologiste français, participe à la primaire de la gauche unitaire d'octobre 2026.", avis: "Sur les canicules et les incendies à répétition, souvent la seule à réclamer d'arrêter de gérer l'urgence climatique en mode pompier." },
  { bloc: "c", nom: "Renaissance", sigle: "RE", figure: "Gabriel Attal", fonde: "2016 (ex-LREM)",
    note: "Parti présidentiel fondé par Emmanuel Macron, aujourd'hui dirigé par Gabriel Attal.", avis: "Porter le bilan d'une réforme des retraites passée en force reste un fardeau." },
  { bloc: "c", nom: "MoDem", sigle: "MoDem", figure: "François Bayrou", fonde: "2007",
    note: "Parti centriste allié historique de la majorité, dont le fondateur a occupé Matignon de fin 2024 à septembre 2025.", avis: null },
  { bloc: "c", nom: "Horizons", sigle: "HOR", figure: "Édouard Philippe", fonde: "2021",
    note: "Fondé par l'ancien Premier ministre, s'est lancé tôt dans la campagne de 2027.", avis: null },
  { bloc: "d", nom: "Les Républicains", sigle: "LR", figure: "Bruno Retailleau", fonde: "2015 (ex-UMP)",
    note: "Principal parti de la droite parlementaire, dans la majorité gouvernementale depuis 2024.", avis: null },
  { bloc: "d", nom: "Nouvelle Énergie", sigle: "NE", figure: "David Lisnard", fonde: "2021",
    note: "Mouvement du maire de Cannes, centré sur la décentralisation et les territoires.", avis: null },
  { bloc: "d", nom: "Debout la France", sigle: "DLF", figure: "Nicolas Dupont-Aignan", fonde: "2008",
    note: "Parti souverainiste de droite, candidat pour la quatrième fois consécutive.", avis: null },
  { bloc: "ed", nom: "Rassemblement national", sigle: "RN", figure: "Marine Le Pen", fonde: "1972 (ex-Front national)",
    note: "Premier parti d'extrême droite du pays, en tête de plusieurs sondages pour 2027 malgré une condamnation en première instance.", avis: "Un parti qui n'a jamais soldé ses comptes avec son histoire." },
  { bloc: "ed", nom: "Reconquête", sigle: "REC", figure: "Éric Zemmour", fonde: "2021",
    note: "Scission d'extrême droite née de la candidature d'Éric Zemmour en 2022.", avis: null },
  { bloc: "ed", nom: "Union populaire républicaine", sigle: "UPR", figure: "François Asselineau", fonde: "2007",
    note: "Mouvement souverainiste centré sur la sortie de l'euro, régulièrement qualifié de complotiste.", avis: null },
];

const CANDIDATS = [
  { nom: "Nathalie Arthaud", parti: "LO", bloc: "eg", statut: "déclarée", note: "Candidate en 2012, 2017 et 2022, repart pour porter la voix ouvriériste." },
  { nom: "Philippe Poutou", parti: "NPA", bloc: "eg", statut: "déclaré", note: "Porte-parole du NPA, candidat pour la quatrième fois." },
  { nom: "Jean-Luc Mélenchon", parti: "LFI", bloc: "g", statut: "déclaré", note: "En course pour une quatrième présidentielle." },
  { nom: "Fabien Roussel", parti: "PCF", bloc: "g", statut: "déclaré", note: "Réélu à la tête du PCF en juillet 2026." },
  { nom: "Ségolène Royal", parti: "PS (primaire)", bloc: "g", statut: "déclarée", note: "Candidate à la primaire socialiste, vingt ans après 2007." },
  { nom: "Karim Bouamrane", parti: "PS", bloc: "g", statut: "déclaré", note: "Maire socialiste de Saint-Ouen, candidature fédératrice." },
  { nom: "Bernard Cazeneuve", parti: "La Convention", bloc: "g", statut: "déclaré", note: "Décline la primaire pour porter directement son propre projet." },
  { nom: "Marine Tondelier", parti: "Les Écologistes", bloc: "eco", statut: "déclarée", note: "Engagée dans la primaire de la gauche unitaire." },
  { nom: "Gabriel Attal", parti: "Renaissance", bloc: "c", statut: "déclaré", note: "Président du parti présidentiel." },
  { nom: "Édouard Philippe", parti: "Horizons", bloc: "c", statut: "déclaré", note: "L'un des candidats les plus précoces de cette élection." },
  { nom: "Bruno Retailleau", parti: "LR", bloc: "d", statut: "déclaré", note: "Peine encore à rassembler toute sa famille politique." },
  { nom: "David Lisnard", parti: "Nouvelle Énergie", bloc: "d", statut: "déclaré", note: "Appelle à une primaire de toute la droite." },
  { nom: "Nicolas Dupont-Aignan", parti: "DLF", bloc: "d", statut: "déclaré", note: "Prêt à se retirer pour l'union nationaliste." },
  { nom: "Marine Le Pen", parti: "RN", bloc: "ed", statut: "déclarée", note: "Candidate malgré la peine prononcée en première instance." },
  { nom: "François Asselineau", parti: "UPR", bloc: "ed", statut: "déclaré", note: "Candidat sans interruption depuis 2012." },
  { nom: "Raphaël Glucksmann", parti: "Place Publique", bloc: "g", statut: "déclaré", note: "Candidate à la primaire socialiste, Vive la Fraaaaaaance." },
  { nom: "François Hollande", parti: "PS", bloc: "g", statut: "pressenti", note: "Prépare son retour en coulisses, sans passer par la primaire." },
  { nom: "Olivier Faure", parti: "PS", bloc: "g", statut: "pressenti", note: "En désaccord ouvert avec Boris Vallaud sur la stratégie." },
  { nom: "Boris Vallaud", parti: "PS", bloc: "g", statut: "pressenti", note: "Président du groupe socialiste à l'Assemblée." },
  { nom: "Éric Zemmour", parti: "Reconquête", bloc: "ed", statut: "pressenti", note: "Se présenterait « en principe », sans confirmation officielle." },
  { nom: "Dominique de Villepin", parti: "sans étiquette", bloc: "d", statut: "pressenti", note: "Verrait dans l'actualité internationale une voie de passage." },
  { nom: "Gérald Darmanin", parti: "sans étiquette", bloc: "d", statut: "pressenti", note: "Avance vers 2027 « d'une manière ou d'une autre »." },
];

const DOSSIERS = [
  {
    titre: "Le travail paie-t-il encore en France ?",
    dek: "Salaires, inflation, pouvoir d'achat : ce dossier confronte les affirmations les plus courantes du débat aux données Insee, sans nier que les salaires progressent, sans avaler l'idée que tout irait donc bien.",
    date: "Dossier de vérification",
    lien: "dossiers/travail-salaires.html",
  },
  {
    titre: "Immigration : ce que disent vraiment les chiffres",
    dek: "Un dossier de vérification qui reprend les affirmations les plus courantes sur l'immigration, les confronte aux données Insee et SSMSI, et explique pourquoi la gauche ne doit ni les nier ni les laisser au RN.",
    date: "Dossier de vérification",
    lien: "dossiers/immigration-chiffres.html",
  },
];

const NAV = [
  { id: "accueil", label: "Accueil" },
  { id: "partis", label: "Partis" },
  { id: "candidats", label: "Candidats 2027" },
  { id: "dossiers", label: "Dossiers" },
  { id: "edito", label: "Édito" },
];

function useDaysUntil(dateStr) {
  return useMemo(() => {
    const target = new Date(dateStr);
    const now = new Date();
    return Math.max(0, Math.ceil((target - now) / 86400000));
  }, [dateStr]);
}

function Eyebrow({ children, color = "var(--red)" }) {
  return (
    <span className="inline-flex items-center gap-2 text-[11px] tracking-[0.18em] uppercase font-medium"
      style={{ fontFamily: "'IBM Plex Mono', monospace", color }}>
      <span className="w-3 h-[2px]" style={{ background: color }} />
      {children}
    </span>
  );
}

function BlocDot({ bloc }) {
  const b = BLOCS.find((x) => x.id === bloc);
  return <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ background: b && b.color }} />;
}

function StampBadge() {
  return (
    <div className="relative shrink-0 w-[132px] h-[132px] rounded-full flex items-center justify-center select-none"
      style={{ border: "2.5px solid var(--red)", transform: "rotate(-9deg)", color: "var(--red)" }} aria-hidden="true">
      <div className="absolute inset-[6px] rounded-full" style={{ border: "1px solid var(--red)", opacity: 0.55 }} />
      <div className="text-center leading-tight px-2" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
        <div className="text-[10px] tracking-[0.15em] uppercase">Ligne</div>
        <div className="text-[15px] font-bold tracking-[0.05em] uppercase" style={{ fontFamily: "'Oswald', sans-serif" }}>éditoriale</div>
        <div className="text-[10px] tracking-[0.15em] uppercase mt-0.5">à gauche</div>
      </div>
    </div>
  );
}

function useActu() {
  const [state, setState] = useState({ loading: true, error: null, articles: [], generatedAt: null });

  useEffect(() => {
    fetch("data/actu.json", { cache: "no-store" })
      .then((r) => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then((data) => setState({ loading: false, error: null, articles: data.articles || [], generatedAt: data.generated_at }))
      .catch((err) => setState({ loading: false, error: String(err), articles: [], generatedAt: null }));
  }, []);

  return state;
}

function Accueil() {
  const jours = useDaysUntil("2027-04-11");
  const { loading, error, articles, generatedAt } = useActu();
  const PAGE_SIZE = 8;
  const [visible, setVisible] = useState(PAGE_SIZE);
  const shown = articles.slice(0, visible);
  const hasMore = visible < articles.length;

  return (
    <div>
      <section className="px-5 md:px-10 pt-10 pb-12 border-b" style={{ borderColor: "var(--line)" }}>
        <div className="max-w-6xl mx-auto grid md:grid-cols-[1fr_auto] gap-8 items-start">
          <div>
            <Eyebrow>Édition du {TODAY_LABEL}</Eyebrow>
            <h1 className="mt-4 leading-[0.95] uppercase"
              style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: "clamp(2.4rem, 6vw, 4.6rem)", color: "var(--ink)" }}>
              L'année qui décide
              <span className="block" style={{ color: "var(--red)" }}>de 2027</span>
            </h1>
            <p className="mt-5 max-w-xl text-[1.05rem] leading-relaxed" style={{ fontFamily: "'Source Serif 4', serif", color: "var(--ink)" }}>
              La Boussole suit, semaine après semaine, la course à l'Élysée — les partis, les candidats,
              les rapports de force. Notre boussole pointe à gauche ; nos pages restent ouvertes à tout
              le paysage politique, sans exclusive.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-4">
              <div className="flex items-baseline gap-2 px-4 py-2" style={{ background: "var(--ink)", color: "var(--paper)" }}>
                <span className="text-3xl font-bold" style={{ fontFamily: "'Oswald', sans-serif" }}>{jours}</span>
                <span className="text-xs uppercase tracking-wide" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                  jours avant le 1<sup>er</sup> tour
                </span>
              </div>
              <span className="text-xs" style={{ fontFamily: "'IBM Plex Mono', monospace", color: "#6b6558" }}>
                1er tour le 11 avril 2027 · 2nd tour le 25 avril 2027
              </span>
            </div>
          </div>
          <StampBadge />
        </div>
      </section>

      <section className="px-5 md:px-10 py-10 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
          <Eyebrow>À la une</Eyebrow>
          <span className="text-xs" style={{ fontFamily: "'IBM Plex Mono', monospace", color: "#6b6558" }}>
            {loading ? "chargement…" : generatedAt ? `mis à jour le ${new Date(generatedAt).toLocaleString("fr-FR")}` : "contenu de secours"}
          </span>
        </div>

        {error && (
          <p className="text-sm mb-6 px-4 py-3" style={{ fontFamily: "'IBM Plex Mono', monospace", background: "#fdeceb", color: "var(--red-dark)" }}>
            Impossible de charger data/actu.json ({error}). Vérifie que le fichier existe bien à côté de index.html.
          </p>
        )}

        <div className="grid gap-0">
          {shown.map((a, i) => (
            <article key={i} className="grid md:grid-cols-[110px_1fr] gap-4 md:gap-8 py-6"
              style={{ borderTop: i === 0 ? "none" : "1px solid var(--line)" }}>
              <div>
                <span className="inline-block text-[10px] uppercase tracking-wide px-2 py-1 font-medium"
                  style={{ fontFamily: "'IBM Plex Mono', monospace", color: "#fff", background: a.color || "var(--red)" }}>
                  {a.tag}
                </span>
                <div className="text-[11px] mt-2" style={{ fontFamily: "'IBM Plex Mono', monospace", color: "#8a8272" }}>{a.date}</div>
                {a.source && (
                  <div className="text-[10px] mt-0.5" style={{ fontFamily: "'IBM Plex Mono', monospace", color: "#a39c8c" }}>{a.source}</div>
                )}
              </div>
              <div>
                <h3 className="text-xl md:text-[1.4rem] leading-snug" style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 600, color: "var(--ink)" }}>
                  {a.lien ? <a href={a.lien} target="_blank" rel="noreferrer" className="hover:underline">{a.titre}</a> : a.titre}
                </h3>
                <p className="mt-2 text-[0.98rem] leading-relaxed" style={{ fontFamily: "'Source Serif 4', serif", color: "#332f27" }}>
                  {a.dek}
                </p>
                {a.avis && (
                  <p className="mt-3 pl-3 text-[0.92rem] italic leading-relaxed"
                    style={{ fontFamily: "'Source Serif 4', serif", borderLeft: "3px solid var(--red)", color: "var(--red-dark)" }}>
                    {a.avis}
                  </p>
                )}
              </div>
            </article>
          ))}
          {!loading && !error && articles.length === 0 && (
            <p style={{ fontFamily: "'IBM Plex Mono', monospace", color: "#8a8272" }}>Aucun article pour le moment.</p>
          )}
        </div>

        {hasMore && (
          <div className="flex justify-center mt-8">
            <button
              onClick={() => setVisible((v) => v + PAGE_SIZE)}
              className="px-5 py-2.5 text-xs uppercase tracking-wide"
              style={{ fontFamily: "'IBM Plex Mono', monospace", border: "1px solid var(--ink)", color: "var(--ink)", background: "transparent" }}
            >
              Articles précédents ({articles.length - visible} de plus)
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

function Partis() {
  const [filtre, setFiltre] = useState("tous");
  const liste = filtre === "tous" ? PARTIS : PARTIS.filter((p) => p.bloc === filtre);
  return (
    <div className="px-5 md:px-10 py-10 max-w-6xl mx-auto">
      <Eyebrow>Panorama</Eyebrow>
      <h2 className="mt-3 uppercase" style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: "clamp(1.8rem, 4vw, 2.6rem)", color: "var(--ink)" }}>
        Les partis, de l'extrême gauche à l'extrême droite
      </h2>
      <p className="mt-3 max-w-2xl text-[0.98rem] leading-relaxed" style={{ fontFamily: "'Source Serif 4', serif", color: "#332f27" }}>
        Chaque formation qui compte dans le paysage politique français, présentée sans exclusion.
      </p>
      <div className="mt-6 flex flex-wrap gap-2">
        <button onClick={() => setFiltre("tous")} className="px-3 py-1.5 text-xs uppercase tracking-wide"
          style={{ fontFamily: "'IBM Plex Mono', monospace", background: filtre === "tous" ? "var(--ink)" : "transparent", color: filtre === "tous" ? "var(--paper)" : "var(--ink)", border: "1px solid var(--ink)" }}>
          Tous
        </button>
        {BLOCS.map((b) => (
          <button key={b.id} onClick={() => setFiltre(b.id)} className="px-3 py-1.5 text-xs uppercase tracking-wide flex items-center gap-2"
            style={{ fontFamily: "'IBM Plex Mono', monospace", background: filtre === b.id ? b.color : "transparent", color: filtre === b.id ? "#fff" : "var(--ink)", border: `1px solid ${b.color}` }}>
            <span className="w-2 h-2 rounded-full" style={{ background: filtre === b.id ? "#fff" : b.color }} />
            {b.label}
          </button>
        ))}
      </div>
      <div className="mt-8 grid md:grid-cols-2 gap-x-8 gap-y-0">
        {liste.map((p, i) => (
          <div key={i} className="py-5" style={{ borderTop: "1px solid var(--line)" }}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <BlocDot bloc={p.bloc} />
                <h3 style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 600, fontSize: "1.15rem", color: "var(--ink)" }}>{p.nom}</h3>
              </div>
              <span className="text-[11px] shrink-0" style={{ fontFamily: "'IBM Plex Mono', monospace", color: "#8a8272" }}>{p.sigle}</span>
            </div>
            <div className="text-[11px] mt-1 mb-2" style={{ fontFamily: "'IBM Plex Mono', monospace", color: "#8a8272" }}>{p.figure} · fondé {p.fonde}</div>
            <p className="text-[0.92rem] leading-relaxed" style={{ fontFamily: "'Source Serif 4', serif", color: "#332f27" }}>{p.note}</p>
            {p.avis && <p className="mt-2 text-[0.88rem] italic leading-relaxed" style={{ fontFamily: "'Source Serif 4', serif", color: "var(--red-dark)" }}>{p.avis}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

function Candidats() {
  const [filtre, setFiltre] = useState("tous");
  const liste = filtre === "tous" ? CANDIDATS : CANDIDATS.filter((c) => c.bloc === filtre);
  return (
    <div className="px-5 md:px-10 py-10 max-w-6xl mx-auto">
      <Eyebrow>Présidentielle 2027</Eyebrow>
      <h2 className="mt-3 uppercase" style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: "clamp(1.8rem, 4vw, 2.6rem)", color: "var(--ink)" }}>
        Qui vise l'Élysée ?
      </h2>
      <p className="mt-3 max-w-2xl text-[0.98rem] leading-relaxed" style={{ fontFamily: "'Source Serif 4', serif", color: "#332f27" }}>
        Candidatures déclarées et prétendants pressentis, tous camps confondus.
      </p>
      <div className="mt-6 flex flex-wrap gap-2">
        <button onClick={() => setFiltre("tous")} className="px-3 py-1.5 text-xs uppercase tracking-wide"
          style={{ fontFamily: "'IBM Plex Mono', monospace", background: filtre === "tous" ? "var(--ink)" : "transparent", color: filtre === "tous" ? "var(--paper)" : "var(--ink)", border: "1px solid var(--ink)" }}>
          Tous
        </button>
        {BLOCS.map((b) => (
          <button key={b.id} onClick={() => setFiltre(b.id)} className="px-3 py-1.5 text-xs uppercase tracking-wide flex items-center gap-2"
            style={{ fontFamily: "'IBM Plex Mono', monospace", background: filtre === b.id ? b.color : "transparent", color: filtre === b.id ? "#fff" : "var(--ink)", border: `1px solid ${b.color}` }}>
            <span className="w-2 h-2 rounded-full" style={{ background: filtre === b.id ? "#fff" : b.color }} />
            {b.label}
          </button>
        ))}
      </div>
      <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {liste.map((c, i) => (
          <div key={i} className="p-4" style={{ border: "1px solid var(--line)" }}>
            <div className="flex items-center gap-2">
              <BlocDot bloc={c.bloc} />
              <h3 style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 600, fontSize: "1.05rem", color: "var(--ink)" }}>{c.nom}</h3>
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[11px]" style={{ fontFamily: "'IBM Plex Mono', monospace", color: "#8a8272" }}>{c.parti}</span>
              <span className="text-[10px] uppercase px-1.5 py-0.5"
                style={{ fontFamily: "'IBM Plex Mono', monospace", color: c.statut.startsWith("déclar") ? "#fff" : "var(--ink)", background: c.statut.startsWith("déclar") ? "var(--red)" : "var(--line)" }}>
                {c.statut}
              </span>
            </div>
            <p className="mt-2 text-[0.88rem] leading-relaxed" style={{ fontFamily: "'Source Serif 4', serif", color: "#332f27" }}>{c.note}</p>
          </div>
        ))}
      </div>
      <p className="mt-8 text-[0.82rem]" style={{ fontFamily: "'IBM Plex Mono', monospace", color: "#8a8272" }}>
        Liste non exhaustive. Chaque candidature définitive devra réunir 500 parrainages d'élus avant le dépôt officiel.
      </p>
    </div>
  );
}

function Dossiers() {
  return (
    <div className="px-5 md:px-10 py-10 max-w-4xl mx-auto">
      <Eyebrow>Enquêtes &amp; vérification</Eyebrow>
      <h2 className="mt-3 uppercase" style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: "clamp(1.8rem, 4vw, 2.6rem)", color: "var(--ink)" }}>
        Dossiers
      </h2>
      <p className="mt-3 max-w-2xl text-[0.98rem] leading-relaxed" style={{ fontFamily: "'Source Serif 4', serif", color: "#332f27" }}>
        Des formats longs, sourcés, pour aller au-delà de l'actu au jour le jour.
      </p>

      <div className="mt-8 grid gap-5">
        {DOSSIERS.map((d, i) => (
          <a
            key={i}
            href={d.lien}
            className="block p-5 transition-colors"
            style={{ border: "1px solid var(--line)", background: "#fff" }}
          >
            <span className="text-[11px] uppercase tracking-wide" style={{ fontFamily: "'IBM Plex Mono', monospace", color: "var(--red)" }}>
              {d.date}
            </span>
            <h3 className="mt-2 text-xl leading-snug" style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 600, color: "var(--ink)" }}>
              {d.titre}
            </h3>
            <p className="mt-2 text-[0.95rem] leading-relaxed" style={{ fontFamily: "'Source Serif 4', serif", color: "#332f27" }}>
              {d.dek}
            </p>
            <span className="inline-block mt-3 text-[0.85rem] font-medium" style={{ fontFamily: "'IBM Plex Mono', monospace", color: "var(--red)" }}>
              Lire le dossier →
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}

function Edito() {
  return (
    <div className="px-5 md:px-10 py-10 max-w-3xl mx-auto">
      <Eyebrow>L'édito de la rédaction</Eyebrow>
      <h2 className="mt-3 uppercase" style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: "clamp(1.8rem, 4vw, 2.4rem)", color: "var(--ink)" }}>
        Pourquoi nous assumons une ligne
      </h2>
      <div className="mt-6 space-y-5 text-[1.05rem] leading-relaxed" style={{ fontFamily: "'Source Serif 4', serif", color: "#241f18" }}>
        <p>La Boussole ne prétend pas être neutre : nous pensons que la réponse aux crises sociale et climatique se trouve du côté du partage des richesses, des services publics et de la planification écologique. Nous l'écrivons noir sur blanc plutôt que de le dissimuler sous un ton d'objectivité de façade.</p>
        <p>Ce parti pris ne nous dispense pas d'un devoir : présenter l'ensemble du paysage politique, y compris les formations que nous combattons, avec les mêmes faits, datés et vérifiables.</p>
        <p>À huit mois du premier tour, trois lignes de force structurent la campagne : le pouvoir d'achat et les retraites, la réponse à l'urgence climatique, et la capacité de la gauche à transformer une addition de candidatures en projet commun.</p>
      </div>
    </div>
  );
}

function App() {
  const [tab, setTab] = useState("accueil");
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div style={{ background: "var(--paper)", minHeight: "100%" }}>
      <div className="overflow-hidden whitespace-nowrap py-1.5" style={{ background: "var(--ink)" }}>
        <div className="inline-block" style={{ animation: "ticker 32s linear infinite", fontFamily: "'IBM Plex Mono', monospace" }}>
          <span className="text-[11px] tracking-wide" style={{ color: "var(--paper)" }}>
            &nbsp;&nbsp;PRIMAIRE DE LA GAUCHE UNITAIRE LE 11 OCTOBRE 2026 &nbsp;·&nbsp; 500 PARRAINAGES REQUIS POUR CHAQUE CANDIDATURE &nbsp;·&nbsp;
            1<sup>ER</sup> TOUR DE LA PRÉSIDENTIELLE LE 11 AVRIL 2027 &nbsp;·&nbsp; SUIVEZ LA CAMPAGNE SUR LA BOUSSOLE &nbsp;·&nbsp;
          </span>
        </div>
      </div>

      <header className="border-b" style={{ borderColor: "var(--ink)" }}>
        <div className="max-w-6xl mx-auto px-5 md:px-10 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-white font-bold" style={{ background: "var(--red)" }} aria-hidden="true">✓</div>
            <div>
              <div className="uppercase leading-none" style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: "1.55rem", color: "var(--ink)" }}>La Boussole</div>
              <div className="text-[10px] uppercase tracking-[0.16em]" style={{ fontFamily: "'IBM Plex Mono', monospace", color: "var(--red)" }}>Actualité politique · cap à gauche</div>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-1">
            {NAV.map((n) => (
              <button key={n.id} onClick={() => setTab(n.id)} className="px-3 py-2 text-sm uppercase tracking-wide"
                style={{ fontFamily: "'IBM Plex Mono', monospace", color: tab === n.id ? "var(--red)" : "var(--ink)", borderBottom: tab === n.id ? "2px solid var(--red)" : "2px solid transparent" }}>
                {n.label}
              </button>
            ))}
          </nav>
          <button className="md:hidden text-2xl leading-none" onClick={() => setMenuOpen((v) => !v)} aria-label="Menu">{menuOpen ? "✕" : "☰"}</button>
        </div>
        {menuOpen && (
          <div className="md:hidden border-t px-5 py-3 flex flex-col gap-1" style={{ borderColor: "var(--line)" }}>
            {NAV.map((n) => (
              <button key={n.id} onClick={() => { setTab(n.id); setMenuOpen(false); }} className="py-2.5 text-sm uppercase tracking-wide text-left"
                style={{ fontFamily: "'IBM Plex Mono', monospace", color: tab === n.id ? "var(--red)" : "var(--ink)" }}>
                {n.label}
              </button>
            ))}
          </div>
        )}
      </header>

      <main>
        {tab === "accueil" && <Accueil />}
        {tab === "partis" && <Partis />}
        {tab === "candidats" && <Candidats />}
        {tab === "dossiers" && <Dossiers />}
        {tab === "edito" && <Edito />}
      </main>

      <footer className="border-t px-5 md:px-10 py-8 mt-6" style={{ borderColor: "var(--ink)" }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          <p className="text-[0.8rem] max-w-xl leading-relaxed" style={{ fontFamily: "'IBM Plex Mono', monospace", color: "#6b6558" }}>
            La Boussole est un média indépendant à ligne éditoriale assumée de gauche. L'actualité est
            actualisée automatiquement via des flux RSS ; les partis et candidats sont maintenus à la main.
          </p>
          <div className="text-[0.75rem]" style={{ fontFamily: "'IBM Plex Mono', monospace", color: "#8a8272" }}>engagés, pas sectaires</div>
        </div>
      </footer>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
