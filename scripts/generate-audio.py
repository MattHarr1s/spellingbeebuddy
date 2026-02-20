#!/usr/bin/env python3
"""
Generate MP3 audio files for all spelling bee words using Edge TTS.

Usage:
    python scripts/generate-audio.py

Requires: pip install edge-tts

Output: public/audio/{voice}/{word}.mp3
"""

import asyncio
import json
import re
import sys
from pathlib import Path

try:
    import edge_tts
except ImportError:
    print("Error: edge-tts not installed. Run: pip install edge-tts")
    sys.exit(1)

# ─── Configuration ────────────────────────────────────────────────────────────

VOICES = {
    "dalia":  "es-MX-DaliaNeural",
    "jorge":  "es-MX-JorgeNeural",
    "paloma": "es-US-PalomaNeural",
    "alonso": "es-US-AlonsoNeural",
}

MAX_CONCURRENT = 5
MAX_RETRIES = 3
RETRY_DELAY = 2  # seconds

PROJECT_ROOT = Path(__file__).resolve().parent.parent
WORDS_FILE = PROJECT_ROOT / "src" / "data" / "words.js"
AUDIO_DIR = PROJECT_ROOT / "public" / "audio"

# ─── Parse words from words.js ───────────────────────────────────────────────

def parse_words():
    """Extract all word strings from the ALL_WORDS array in words.js."""
    content = WORDS_FILE.read_text(encoding="utf-8")
    # Match word: "..." patterns
    words = re.findall(r'word:\s*"([^"]+)"', content)
    if not words:
        print("Error: No words found in", WORDS_FILE)
        sys.exit(1)
    # Deduplicate while preserving order
    seen = set()
    unique = []
    for w in words:
        if w not in seen:
            seen.add(w)
            unique.append(w)
    return unique

# ─── Generate audio ──────────────────────────────────────────────────────────

async def generate_one(voice_id: str, voice_name: str, word: str, semaphore: asyncio.Semaphore):
    """Generate a single MP3 file for one voice + word combination."""
    out_dir = AUDIO_DIR / voice_id
    out_file = out_dir / f"{word.lower()}.mp3"

    # Skip if already exists (resume support)
    if out_file.exists() and out_file.stat().st_size > 0:
        return "skip"

    out_dir.mkdir(parents=True, exist_ok=True)

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            async with semaphore:
                communicate = edge_tts.Communicate(word, voice_name)
                await communicate.save(str(out_file))
            return "ok"
        except Exception as e:
            if attempt < MAX_RETRIES:
                await asyncio.sleep(RETRY_DELAY * attempt)
            else:
                print(f"  FAIL: {voice_id}/{word} after {MAX_RETRIES} attempts: {e}")
                return "fail"

async def generate_voice(voice_id: str, voice_name: str, words: list[str]):
    """Generate all MP3s for one voice."""
    semaphore = asyncio.Semaphore(MAX_CONCURRENT)
    tasks = [generate_one(voice_id, voice_name, w, semaphore) for w in words]

    ok = skip = fail = 0
    total = len(tasks)

    for i, coro in enumerate(asyncio.as_completed(tasks)):
        result = await coro
        if result == "ok":
            ok += 1
        elif result == "skip":
            skip += 1
        else:
            fail += 1

        done = ok + skip + fail
        if done % 50 == 0 or done == total:
            print(f"  {voice_id}: {done}/{total}  (new: {ok}, cached: {skip}, failed: {fail})")

    return ok, skip, fail

async def main():
    words = parse_words()
    print(f"Found {len(words)} unique words in {WORDS_FILE.name}")
    print(f"Output directory: {AUDIO_DIR}")
    print(f"Voices: {', '.join(f'{k} ({v})' for k, v in VOICES.items())}")
    print(f"Total files to generate: {len(words) * len(VOICES)}")
    print()

    total_ok = total_skip = total_fail = 0

    for voice_id, voice_name in VOICES.items():
        print(f"Generating: {voice_id} ({voice_name})...")
        ok, skip, fail = await generate_voice(voice_id, voice_name, words)
        total_ok += ok
        total_skip += skip
        total_fail += fail
        print(f"  Done: {ok} new, {skip} cached, {fail} failed")
        print()

    print("=" * 50)
    print(f"Total: {total_ok} new, {total_skip} cached, {total_fail} failed")
    if total_fail > 0:
        print(f"WARNING: {total_fail} files failed to generate. Re-run to retry.")
        sys.exit(1)
    else:
        print("All files generated successfully!")

if __name__ == "__main__":
    asyncio.run(main())
