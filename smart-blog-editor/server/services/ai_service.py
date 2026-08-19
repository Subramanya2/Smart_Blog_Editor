import json
import asyncio
from core.config import GEMINI_API_KEY

try:
    from google import genai
    HAS_GENAI = True
except ImportError:
    HAS_GENAI = False

# ---------------------------------------------------------------------------
# Non-streaming AI text generation
# ---------------------------------------------------------------------------

async def generate_ai_text(text: str, prompt_type: str) -> str:
    if not GEMINI_API_KEY:
        return "[MOCK AI - No Key] Please add GEMINI_API_KEY to .env"

    if prompt_type == "summary":
        prompt_text = f"Summarize this text in 2 sentences:\n{text}"
    elif prompt_type == "grammar":
        prompt_text = f"Fix grammar and improve these sentences:\n{text}"
    else:
        prompt_text = text

    if HAS_GENAI:
        try:
            def _sync_generate():
                client = genai.Client(api_key=GEMINI_API_KEY)
                response = client.models.generate_content(
                    model='gemini-2.5-flash',
                    contents=prompt_text
                )
                return response.text or ""

            result = await asyncio.to_thread(_sync_generate)
            if result:
                return result
        except Exception as e:
            print(f"SDK Error: {e}")

    return "[AI Copilot] Here is an AI-generated suggestion based on your text context."


# ---------------------------------------------------------------------------
# Streaming autocomplete  –  FIXED: sync SDK wrapped in asyncio.to_thread
# ---------------------------------------------------------------------------

def _collect_stream_chunks_sync(prompt: str) -> list[str]:
    """
    Run the blocking Gemini streaming SDK call synchronously and collect all
    text chunks into a list.  This function is meant to be called via
    asyncio.to_thread() so it never blocks the event loop.
    """
    if not HAS_GENAI:
        return []

    chunks: list[str] = []
    try:
        client = genai.Client(api_key=GEMINI_API_KEY)
        response = client.models.generate_content_stream(
            model='gemini-2.5-flash',
            contents=prompt,
        )
        for chunk in response:
            if chunk.text:
                chunks.append(chunk.text)
    except Exception as e:
        print(f"SDK Stream Error: {e}")

    return chunks


async def generate_autocomplete_stream(text: str):
    """
    Async generator that yields SSE-formatted `data:` lines.

    Strategy:
      1. Run the blocking Gemini SDK call in a thread pool via asyncio.to_thread.
      2. Once chunks are collected, yield them one-by-one with a tiny delay so
         the browser sees incremental SSE events (streaming feel).
      3. If no API key or SDK returns nothing, fall back to a mock stream.
    """
    if not GEMINI_API_KEY:
        # No key at all – send a mock stream immediately
        mock = [" is", " an", " AI", " copilot", " suggestion."]
        for word in mock:
            yield f"data: {json.dumps(word)}\n\n"
            await asyncio.sleep(0.08)
        return

    prompt = (
        "Complete the following text naturally starting from the exact end. "
        "Provide ONLY the next completing phrase or sentence (12 words max). "
        "Do NOT repeat the input text:\n" + text
    )

    # Run the blocking SDK stream in a background thread
    chunks: list[str] = await asyncio.to_thread(_collect_stream_chunks_sync, prompt)

    if chunks:
        for chunk in chunks:
            yield f"data: {json.dumps(chunk)}\n\n"
            await asyncio.sleep(0.04)   # small delay gives a streaming feel
        return

    # Fallback mock stream (e.g. 429 quota, network error, no SDK)
    mock = [" is", " evolving", " rapidly", " with", " modern", " AI", " tools."]
    for word in mock:
        yield f"data: {json.dumps(word)}\n\n"
        await asyncio.sleep(0.08)
