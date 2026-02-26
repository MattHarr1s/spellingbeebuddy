#!/usr/bin/env python3
"""
Generate MP3 audio files for all spelling bee context sentences using Edge TTS.

Generates Spanish context sentences for each word across 4 Spanish voices.

Usage:
    python scripts/generate-sentence-audio.py

Requires: pip install edge-tts

Output: public/audio/{voice}/sentence/{word}.mp3
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

# Spanish voices for Spanish sentences
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
SENTENCES_FILE = PROJECT_ROOT / "src" / "data" / "sentences.js"
AUDIO_DIR = PROJECT_ROOT / "public" / "audio"

# ─── Parse sentences from sentences.js ────────────────────────────────────────

def parse_sentences():
    """Extract word → sentence mappings from sentences.js."""
    content = SENTENCES_FILE.read_text(encoding="utf-8")

    # Match "word": "sentence", patterns
    pattern = re.compile(r'"([^"]+)":\s*"([^"]+)"')
    matches = pattern.findall(content)
    if not matches:
        print("Error: No sentences found in", SENTENCES_FILE)
        sys.exit(1)

    # Deduplicate by word while preserving order
    seen = set()
    sentences = []
    for word, sentence in matches:
        if word not in seen:
            seen.add(word)
            sentences.append({"word": word, "sentence": sentence})
    return sentences

# ─── Generate audio ──────────────────────────────────────────────────────────

async def generate_one(voice_id: str, voice_name: str, word: str, text: str,
                       semaphore: asyncio.Semaphore):
    """Generate a single MP3 file for one voice + sentence combination."""
    out_dir = AUDIO_DIR / voice_id / "sentence"
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
            if out_file.stat().st_size == 0:
                out_file.unlink()
                raise Exception("Empty file produced")
            return "ok"
        except Exception as e:
            if out_file.exists() and out_file.stat().st_size == 0:
                out_file.unlink()
            if attempt < MAX_RETRIES:
                await asyncio.sleep(RETRY_DELAY * attempt)
            else:
                print(f"  FAIL: {voice_id}/sentence/{word} after {MAX_RETRIES} attempts: {e}")
                return "fail"

async def generate_voice(voice_id: str, voice_name: str, sentences: list[dict],
                         semaphore: asyncio.Semaphore):
    """Generate all sentence MP3s for one voice."""
    tasks = [
        generate_one(voice_id, voice_name, s["word"], s["sentence"], semaphore)
        for s in sentences
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
            print(f"  {voice_id}/sentence: {done}/{total}  (new: {ok}, cached: {skip}, failed: {fail})")

    return ok, skip, fail

async def main():
    sentences = parse_sentences()
    print(f"Found {len(sentences)} sentences in {SENTENCES_FILE.name}")
    print(f"Output directory: {AUDIO_DIR}")
    print(f"Voices: {', '.join(f'{k} ({v})' for k, v in VOICES.items())}")
    print(f"Total files to generate: {len(sentences) * len(VOICES)}")
    print()

    total_ok = total_skip = total_fail = 0
    semaphore = asyncio.Semaphore(MAX_CONCURRENT)

    for voice_id, voice_name in VOICES.items():
        print(f"Generating sentences: {voice_id} ({voice_name})...")
        ok, skip, fail = await generate_voice(voice_id, voice_name, sentences, semaphore)
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
        print("All sentence audio files generated successfully!")

if __name__ == "__main__":
    asyncio.run(main())
