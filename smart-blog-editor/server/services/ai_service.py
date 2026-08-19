import json
import asyncio
from core.config import GEMINI_API_KEY

try:
    from google import genai
    HAS_GENAI = True
except ImportError:
    HAS_GENAI = False

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
            client = genai.Client(api_key=GEMINI_API_KEY)
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt_text
            )
            return response.text or "[AI] Could not generate response."
        except Exception as e:
            print(f"SDK Error: {e}, falling back to REST API")

    import requests
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"
    headers = {"Content-Type": "application/json"}
    payload = {"contents": [{"parts": [{"text": prompt_text}]}]}
    response = requests.post(url, headers=headers, json=payload)
    
    if response.status_code != 200:
        raise Exception(f"AI Provider Error: {response.text}")
        
    result = response.json()
    generated_content = result.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', '')
    return generated_content or "[AI] Could not generate response."

async def generate_autocomplete_stream(text: str):
    if not GEMINI_API_KEY:
        mock_words = [" is", " an", " AI", " copilot", " suggestion."]
        for word in mock_words:
            yield f"data: {json.dumps(word)}\n\n"
            await asyncio.sleep(0.08)
        return

    prompt = f"Complete the following text naturally starting from the exact end. Provide ONLY the next completing phrase or sentence (12 words max). Do NOT repeat the input text:\n{text}"

    if HAS_GENAI:
        try:
            client = genai.Client(api_key=GEMINI_API_KEY)
            response = client.models.generate_content_stream(
                model='gemini-2.5-flash',
                contents=prompt
            )
            for chunk in response:
                if chunk.text:
                    yield f"data: {json.dumps(chunk.text)}\n\n"
                    await asyncio.sleep(0.01)
            return
        except Exception as e:
            print(f"SDK Stream Error: {e}, falling back to REST stream")

    try:
        import requests
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?key={GEMINI_API_KEY}&alt=sse"
        headers = {"Content-Type": "application/json"}
        payload = {"contents": [{"parts": [{"text": prompt}]}]}
        with requests.post(url, headers=headers, json=payload, stream=True) as resp:
            for line in resp.iter_lines():
                if line:
                    line_str = line.decode("utf-8")
                    if line_str.startswith("data: "):
                        try:
                            json_data = json.loads(line_str[6:])
                            text_chunk = json_data.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', '')
                            if text_chunk:
                                yield f"data: {json.dumps(text_chunk)}\n\n"
                        except Exception:
                            pass
    except Exception as e:
        print(f"REST Stream error: {e}")
        yield f"data: {json.dumps('...')}\n\n"
