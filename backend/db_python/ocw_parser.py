#!/usr/bin/env python3
"""
Fetch all MIT OCW courses from the search API and dump to JSON.
"""

import json
import time
import requests


def build_query(frm: int, size: int):
    return {
        "from": frm,
        "size": size,
        "query": {
            "bool": {
                "should": [
                    {"bool": {"filter": {"bool": {"must": [{"term": {"object_type": "course"}}]}}}}
                ]
            }
        },
        "post_filter": {
            "bool": {
                "must": [
                    {"bool": {"should": [{"term": {"object_type.keyword": "course"}}]}}
                ]
            }
        },
    }


def fetch_all(url: str, page_size: int = 10000, pause: float = 0.2):
    results = []
    frm = 0

    while True:
        payload = build_query(frm, page_size)
        resp = requests.post(url, json=payload, timeout=30)
        resp.raise_for_status()
        data = resp.json()

        hits = data.get("hits", {}).get("hits", [])
        if not hits:
            break

        for h in hits:
            src = h.get("_source")
            if src and src.get("object_type") == "course":
                results.append(src)

        frm += page_size
        if frm >= data["hits"]["total"]["value"] if isinstance(data["hits"]["total"], dict) else data["hits"]["total"]:
            break

        time.sleep(pause)

    return results


if __name__ == "__main__":
    API_URL = "https://open.mit.edu/api/v0/search/"  # replace with your endpoint if different
    courses = fetch_all(API_URL)
    # print(courses)
    with open("all_courses.json", "w", encoding="utf-8") as f:
        json.dump(courses, f, ensure_ascii=False, indent=2)
    print(f"Saved {len(courses)} courses to all_courses.json")
