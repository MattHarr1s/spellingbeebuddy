#!/usr/bin/env python3
"""
Generate MP3 audio files for all spelling bee word definitions using Edge TTS.

Generates both English and Spanish definitions for each word across 4 voices.

Usage:
    python scripts/generate-definition-audio.py

Requires: pip install edge-tts

Output: public/audio/{voice}/def-en/{word}.mp3
        public/audio/{voice}/def-es/{word}.mp3
"""

import asyncio
import re
import sys
from pathlib import Path

try:
    import edge_tts
except ImportError:
    print("Error: edge-tts not installed. Run: pip install edge-tts")
    sys.exit(1)

# ─── Configuration ────────────────────────────────────────────────────────────

# Spanish voices for Spanish definitions
ES_VOICES = {
    "dalia":  "es-MX-DaliaNeural",
    "jorge":  "es-MX-JorgeNeural",
    "paloma": "es-US-PalomaNeural",
    "alonso": "es-US-AlonsoNeural",
}

# English voices matched by gender/style for English definitions
EN_VOICES = {
    "dalia":  "en-US-JennyNeural",     # female US
    "jorge":  "en-US-GuyNeural",       # male US
    "paloma": "en-US-AriaNeural",      # female US
    "alonso": "en-US-ChristopherNeural",  # male US
}

MAX_CONCURRENT = 5
MAX_RETRIES = 3
RETRY_DELAY = 2  # seconds

PROJECT_ROOT = Path(__file__).resolve().parent.parent
WORDS_FILE = PROJECT_ROOT / "src" / "data" / "words.js"
AUDIO_DIR = PROJECT_ROOT / "public" / "audio"

# ─── Parse words with definitions from words.js ──────────────────────────────

def parse_words_with_defs():
    """Extract word, en, and es fields from ALL_WORDS array in words.js."""
    content = WORDS_FILE.read_text(encoding="utf-8")

    # Match each word object: { word: "...", en: "...", es: "...", tip: "..." }
    pattern = re.compile(
        r'\{\s*word:\s*"([^"]+)"\s*,\s*en:\s*"([^"]+)"\s*,\s*es:\s*"([^"]+)"\s*,\s*tip:\s*"[^"]*"\s*\}'
    )
    matches = pattern.findall(content)
    if not matches:
        print("Error: No words found in", WORDS_FILE)
        sys.exit(1)

    # Deduplicate by word while preserving order
    seen = set()
    words = []
    for word, en, es in matches:
        if word not in seen:
            seen.add(word)
            words.append({"word": word, "en": en, "es": es})
    return words

# ─── Generate audio ──────────────────────────────────────────────────────────

async def generate_one(voice_id: str, voice_name: str, word: str, text: str,
                       sub_dir: str, semaphore: asyncio.Semaphore):
    """Generate a single MP3 file for one voice + definition combination."""
    out_dir = AUDIO_DIR / voice_id / sub_dir
    out_file = out_dir / f"{word.lower()}.mp3"

    # Skip if already exists (resume support)
    if out_file.exists() and out_file.stat().st_size > 0:
        return "skip"

    out_dir.mkdir(parents=True, exist_ok=True)

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            async with semaphore:
                communicate = edge_tts.Communicate(text, voice_name)
                await communicate.save(str(out_file))
            return "ok"
        except Exception as e:
            if attempt < MAX_RETRIES:
                await asyncio.sleep(RETRY_DELAY * attempt)
            else:
                print(f"  FAIL: {voice_id}/{sub_dir}/{word} after {MAX_RETRIES} attempts: {e}")
                return "fail"

async def generate_voice_defs(voice_id: str, voice_name: str, words: list[dict],
                              lang: str, semaphore: asyncio.Semaphore):
    """Generate all definition MP3s for one voice + language."""
    sub_dir = f"def-{lang}"
    tasks = [
        generate_one(voice_id, voice_name, w["word"], w[lang], sub_dir, semaphore)
        for w in words
    ]

    ok = skip = fail = 0
    total = len(tasks)

    for coro in asyncio.as_completed(tasks):
        result = await coro
        if result == "ok":
            ok += 1
        elif result == "skip":
            skip += 1
        else:
            fail += 1

        done = ok + skip + fail
        if done % 100 == 0 or done == total:
            print(f"  {voice_id}/def-{lang}: {done}/{total}  (new: {ok}, cached: {skip}, failed: {fail})")

    return ok, skip, fail

async def main():
    words = parse_words_with_defs()
    print(f"Found {len(words)} unique words with definitions in {WORDS_FILE.name}")
    print(f"Output directory: {AUDIO_DIR}")
    print(f"Generating: ES definitions (Spanish voices) + EN definitions (English voices)")
    print(f"Total files to generate: {len(words) * len(ES_VOICES) * 2}")
    print()

    total_ok = total_skip = total_fail = 0
    semaphore = asyncio.Semaphore(MAX_CONCURRENT)

    for voice_id in ES_VOICES:
        # Spanish definitions with Spanish voice
        es_voice = ES_VOICES[voice_id]
        print(f"Generating ES defs: {voice_id} ({es_voice})...")
        ok, skip, fail = await generate_voice_defs(voice_id, es_voice, words, "es", semaphore)
        total_ok += ok; total_skip += skip; total_fail += fail
        print(f"  Done: {ok} new, {skip} cached, {fail} failed")
        print()

        # English definitions with matched English voice
        en_voice = EN_VOICES[voice_id]
        print(f"Generating EN defs: {voice_id} ({en_voice})...")
        ok, skip, fail = await generate_voice_defs(voice_id, en_voice, words, "en", semaphore)
        total_ok += ok; total_skip += skip; total_fail += fail
        print(f"  Done: {ok} new, {skip} cached, {fail} failed")
        print()

    print("=" * 50)
    print(f"Total: {total_ok} new, {total_skip} cached, {total_fail} failed")
    if total_fail > 0:
        print(f"WARNING: {total_fail} files failed to generate. Re-run to retry.")
        sys.exit(1)
    else:
        print("All definition audio files generated successfully!")

if __name__ == "__main__":
    asyncio.run(main())
