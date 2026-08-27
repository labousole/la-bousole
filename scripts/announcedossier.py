#!/usr/bin/env python3
"""
announce.py — Poste UNE annonce ponctuelle (pas liée à un article) sur
Bluesky et/ou Mastodon. Déclenché manuellement (bouton "Run workflow"),
jamais par le cron, pour ne pas republier le même message toutes les 6h.

Modifie SITE_URL et MESSAGE ci-dessous pour changer le contenu de l'annonce.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from post_social import post_to_bluesky, post_to_mastodon  # noqa: E402

SITE_URL = "https://labousole.github.io/la-bousole/"

HASHTAGS = ["#Politique", "#France2027", "#Gauche", "#Présidentielle2027"]

MESSAGE_BODY = (
    "Retrouvez-nous sur La Boussole : actualité politique, panorama des "
    "est nos dossiers Enquêtes & vérification sur https://labousole.github.io/la-bousole/"
    "Immigration, l'hôpital Français, les salaires..."
)


def build_announcement(max_len):
    tags_line = " ".join(HASHTAGS)
    suffix = f"\n\n{SITE_URL}\n{tags_line}"
    budget = max_len - len(suffix)
    body = MESSAGE_BODY
    if len(body) > budget:
        body = body[: max(0, budget - 1)].rstrip() + "…"
    return f"{body}{suffix}"


def main():
    bsky_text = build_announcement(max_len=300)
    masto_text = build_announcement(max_len=480)

    bsky_result = post_to_bluesky(bsky_text, lien=SITE_URL, hashtag_list=HASHTAGS)
    masto_result = post_to_mastodon(masto_text)

    print(f"[announce] Bluesky: {bsky_result} — Mastodon: {masto_result}")


if __name__ == "__main__":
    main()
