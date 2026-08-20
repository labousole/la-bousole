#!/usr/bin/env python3
"""
fetch_actu.py — Récupère l'actualité politique française via RSS et génère
data/actu.json, consommé directement par le site statique (fetch côté client).

Usage : python scripts/fetch_actu.py
Aucune clé API requise : uniquement des flux RSS publics.
"""

import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

import feedparser
import requests

# Beaucoup de sites de presse (Cloudflare et équivalents) renvoient une page
# HTML de vérification au lieu du flux XML si la requête n'a pas d'en-tête
# User-Agent ressemblant à un navigateur. feedparser seul n'en envoie pas,
# d'où les "syntax error" observés : on a reçu du HTML, pas du XML.
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "application/rss+xml, application/xml, text/xml, */*",
}

# ---------------------------------------------------------------------------
# Flux RSS à surveiller. Ajoute/retire des sources ici librement.
# Format : (nom_source, url_flux, tag_par_defaut, couleur_hex)
# ---------------------------------------------------------------------------
FEEDS = [
    ("Le Monde – Politique", "https://www.lemonde.fr/politique/rss_full.xml", "Politique", "#C81E3A"),
    ("franceinfo – Politique", "https://www.francetvinfo.fr/politique.rss", "Politique", "#8C1327"),
    ("Libération – Politique", "https://www.liberation.fr/arc/outboundfeeds/rss/category/politique/?outputType=xml", "Politique", "#C81E3A"),
    ("L'Humanité – Politique", "https://www.humanite.fr/sections/politique/feed", "Gauche", "#1F5C4A"),
    ("Sénat – Communiqués de presse", "https://www.senat.fr/rss/presse.rss", "Institutions", "#C9972B"),
    ("Le Figaro – Politique", "https://www.lefigaro.fr/rss/figaro_politique.xml", "Droite", "#3A5A8C"),
    ("Mediapart", "https://www.mediapart.fr/articles/feed", "Gauche", "#1F5C4A"),
    ("Politis", "https://www.politis.fr/flux-rss-apps/", "Gauche", "#1F5C4A"),
    ("Les Échos – Politique", "https://services.lesechos.fr/rss/les-echos-politique.xml", "Politique", "#8a8272"),
]

# Mots-clés utilisés pour ne garder que les articles réellement liés à la
# vie politique / 2027 (utile si un flux mélange plusieurs rubriques).
KEYWORDS = [
    "élection", "présidentielle", "candidat", "gouvernement", "assemblée",
    "sénat", "parti", "ministre", "budget", "retraite", "loi", "vote",
    "primaire", "2027", "macron", "lecornu", "rn", "lfi", "ps ", "gauche",
    "droite", "écologiste",
]

MAX_ITEMS = 12
OUTPUT_PATH = Path(__file__).resolve().parent.parent / "data" / "actu.json"


def strip_html(text: str) -> str:
    return re.sub(r"<[^>]+>", "", text or "").strip()


def matches_keywords(title: str, summary: str) -> bool:
    haystack = f"{title} {summary}".lower()
    return any(kw in haystack for kw in KEYWORDS)


def parse_date(entry) -> str:
    for field in ("published_parsed", "updated_parsed"):
        val = getattr(entry, field, None)
        if val:
            return datetime(*val[:6], tzinfo=timezone.utc).strftime("%d %b %Y")
    return datetime.now(timezone.utc).strftime("%d %b %Y")


def sort_key(entry):
    for field in ("published_parsed", "updated_parsed"):
        val = getattr(entry, field, None)
        if val:
            return datetime(*val[:6], tzinfo=timezone.utc)
    return datetime.min.replace(tzinfo=timezone.utc)


def fetch_all():
    items = []
    for source, url, default_tag, color in FEEDS:
        try:
            resp = requests.get(url, headers=HEADERS, timeout=15)
            resp.raise_for_status()
        except Exception as exc:  # noqa: BLE001
            print(f"[warn] échec réseau sur {source} ({url}): {exc}", file=sys.stderr)
            continue

        feed = feedparser.parse(resp.content)

        if feed.bozo and not feed.entries:
            print(f"[warn] flux illisible pour {source} (probablement bloqué par anti-bot ou URL obsolète): {feed.bozo_exception}", file=sys.stderr)
            continue

        for entry in feed.entries:
            title = strip_html(getattr(entry, "title", ""))
            summary = strip_html(getattr(entry, "summary", "") or getattr(entry, "description", ""))
            if not title:
                continue
            if not matches_keywords(title, summary):
                continue

            items.append(
                {
                    "_sort": sort_key(entry),
                    "tag": default_tag,
                    "color": color,
                    "source": source,
                    "date": parse_date(entry),
                    "titre": title,
                    "dek": (summary[:280] + "…") if len(summary) > 280 else summary,
                    "avis": None,  # l'angle éditorial reste rédigé à la main, jamais généré automatiquement
                    "lien": getattr(entry, "link", None),
                }
            )

    items.sort(key=lambda x: x["_sort"], reverse=True)

    # Déduplique par titre proche (évite les doublons republiés par plusieurs flux)
    seen = set()
    deduped = []
    for it in items:
        key = it["titre"].lower()[:60]
        if key in seen:
            continue
        seen.add(key)
        it.pop("_sort")
        deduped.append(it)
        if len(deduped) >= MAX_ITEMS:
            break

    return deduped


def main():
    articles = fetch_all()
    if not articles:
        print("[error] aucun article récupéré, on ne touche pas au fichier existant", file=sys.stderr)
        sys.exit(1)

    payload = {
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "articles": articles,
    }

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[ok] {len(articles)} articles écrits dans {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
