#!/usr/bin/env python3
"""
post_social.py — Publie automatiquement sur Bluesky et/ou Mastodon les
articles réellement nouveaux détectés par le dernier run de fetch_actu.py.

Ce script est volontairement silencieux (skip, pas d'erreur bloquante) si
les identifiants d'une plateforme ne sont pas configurés : tu peux activer
Bluesky seul, Mastodon seul, les deux, ou aucun.

Identifiants attendus (variables d'environnement / secrets GitHub Actions) :
  BLUESKY_HANDLE          ex. laboussole.bsky.social
  BLUESKY_APP_PASSWORD    généré depuis Bluesky → Paramètres → App passwords
  MASTODON_INSTANCE_URL   ex. https://mastodon.social
  MASTODON_ACCESS_TOKEN   généré depuis Préférences → Développement → Nouvelle appli
"""

import datetime
import json
import os
import sys
from pathlib import Path

import requests

NEW_ITEMS_PATH = Path(__file__).resolve().parent.parent / "data" / "_new_since_last_run.json"

# Sécurité anti-flood : au premier run, ou après une longue coupure, il peut
# y avoir beaucoup d'articles "nouveaux" d'un coup. On n'en poste qu'un
# nombre limité par run pour ne pas spammer les abonnés.
MAX_POSTS_PER_RUN = 5

# Hashtags toujours présents, quel que soit le sujet de l'article.
BASE_HASHTAGS = ["#Politique", "#France2027"]

# Hashtag supplémentaire selon le tag de l'article (voir fetch_actu.py).
TAG_HASHTAGS = {
    "Retraites": "#Retraites",
    "Climat": "#Climat",
    "Justice": "#Justice",
    "Institutions": "#Institutions",
    "Automobile": "#Industrie",
    "Primaire de gauche": "#Gauche",
    "Gauche": "#Gauche",
    "Droite": "#Droite",
}


def load_new_items():
    if not NEW_ITEMS_PATH.exists():
        print("[info] aucun fichier d'articles inédits trouvé, rien à poster", file=sys.stderr)
        return []
    try:
        items = json.loads(NEW_ITEMS_PATH.read_text(encoding="utf-8"))
    except Exception as exc:  # noqa: BLE001
        print(f"[warn] impossible de lire {NEW_ITEMS_PATH}: {exc}", file=sys.stderr)
        return []
    # Les plus anciens d'abord, pour publier dans l'ordre chronologique
    items = sorted(items, key=lambda x: x.get("date_iso", ""))
    return items[:MAX_POSTS_PER_RUN]


def hashtags_for(article):
    tags = list(BASE_HASHTAGS)
    extra = TAG_HASHTAGS.get(article.get("tag", ""))
    if extra and extra not in tags:
        tags.append(extra)
    return tags


def build_message(article, max_len):
    """Construit le texte du post : [tag] titre (tronqué si besoin) + lien + hashtags."""
    tag = article.get("tag", "Politique")
    titre = article.get("titre", "")
    lien = article.get("lien")
    tags = hashtags_for(article)
    tags_line = " ".join(tags)

    prefix = f"[{tag}] "
    lien_block = f"\n\n{lien}" if lien else ""
    tags_block = f"\n{tags_line}"

    budget = max_len - len(prefix) - len(lien_block) - len(tags_block)
    if len(titre) > budget:
        titre = titre[: max(0, budget - 1)].rstrip() + "…"

    return f"{prefix}{titre}{lien_block}{tags_block}"


def build_bluesky_facets(text, lien, hashtag_list):
    """Calcule les facets AT Protocol (liens + hashtags cliquables). Les
    offsets doivent être en octets UTF-8, pas en caractères."""
    facets = []
    text_bytes = text.encode("utf-8")

    if lien:
        lien_bytes = lien.encode("utf-8")
        if lien_bytes in text_bytes:
            start = text_bytes.index(lien_bytes)
            facets.append({
                "index": {"byteStart": start, "byteEnd": start + len(lien_bytes)},
                "features": [{"$type": "app.bsky.richtext.facet#link", "uri": lien}],
            })

    for tag in hashtag_list:
        tag_bytes = tag.encode("utf-8")
        if tag_bytes in text_bytes:
            start = text_bytes.index(tag_bytes)
            facets.append({
                "index": {"byteStart": start, "byteEnd": start + len(tag_bytes)},
                "features": [{"$type": "app.bsky.richtext.facet#tag", "tag": tag.lstrip("#")}],
            })

    return facets


# ---------------------------------------------------------------------------
# Bluesky (protocole AT) — deux appels REST : login puis création du post.
# ---------------------------------------------------------------------------
def post_to_bluesky(text, lien=None, hashtag_list=None):
    handle = os.environ.get("BLUESKY_HANDLE")
    app_password = os.environ.get("BLUESKY_APP_PASSWORD")
    if not handle or not app_password:
        return "skip (pas d'identifiants configurés)"

    try:
        session_resp = requests.post(
            "https://bsky.social/xrpc/com.atproto.server.createSession",
            json={"identifier": handle, "password": app_password},
            timeout=15,
        )
        session_resp.raise_for_status()
        session = session_resp.json()
        did = session["did"]
        access_jwt = session["accessJwt"]

        record = {
            "$type": "app.bsky.feed.post",
            "text": text,
            "createdAt": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "langs": ["fr"],
        }

        facets = build_bluesky_facets(text, lien, hashtag_list or [])
        if facets:
            record["facets"] = facets

        post_resp = requests.post(
            "https://bsky.social/xrpc/com.atproto.repo.createRecord",
            headers={"Authorization": f"Bearer {access_jwt}"},
            json={"repo": did, "collection": "app.bsky.feed.post", "record": record},
            timeout=15,
        )
        post_resp.raise_for_status()
        return "ok"
    except Exception as exc:  # noqa: BLE001
        return f"erreur ({exc})"


# ---------------------------------------------------------------------------
# Mastodon — un seul appel REST. Les hashtags en texte brut y sont reconnus
# nativement, pas besoin de facets comme sur Bluesky.
# ---------------------------------------------------------------------------
def post_to_mastodon(text):
    instance = os.environ.get("MASTODON_INSTANCE_URL")
    token = os.environ.get("MASTODON_ACCESS_TOKEN")
    if not instance or not token:
        return "skip (pas d'identifiants configurés)"

    try:
        resp = requests.post(
            f"{instance.rstrip('/')}/api/v1/statuses",
            headers={"Authorization": f"Bearer {token}"},
            data={"status": text, "language": "fr"},
            timeout=15,
        )
        resp.raise_for_status()
        return "ok"
    except Exception as exc:  # noqa: BLE001
        return f"erreur ({exc})"


def main():
    items = load_new_items()
    if not items:
        print("[ok] rien à publier ce run")
        return

    has_bluesky = bool(os.environ.get("BLUESKY_HANDLE"))
    has_mastodon = bool(os.environ.get("MASTODON_INSTANCE_URL"))
    if not has_bluesky and not has_mastodon:
        print("[info] aucune plateforme configurée (ni Bluesky ni Mastodon) — voir l'en-tête du script pour les secrets attendus")
        return

    for article in items:
        titre_court = article.get("titre", "?")[:60]
        lien = article.get("lien")
        tags = hashtags_for(article)

        bsky_text = build_message(article, max_len=300)
        masto_text = build_message(article, max_len=480)

        bsky_result = post_to_bluesky(bsky_text, lien=lien, hashtag_list=tags)
        masto_result = post_to_mastodon(masto_text)
        print(f"[post] {titre_court}… — Bluesky: {bsky_result} — Mastodon: {masto_result}")


if __name__ == "__main__":
    main()
