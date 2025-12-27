"""AI response generator using OpenRouter."""

import json
from typing import Optional

import httpx

from ..config import get_settings

settings = get_settings()

# System prompt for generating Reddit responses
RESPONSE_PROMPT = """You're a friendly, experienced developer who mentors people on Reddit. You've been through the struggles yourself and genuinely want to help.

TONE - Friendly Mentor:
- Warm but not corporate. Like a senior dev helping a junior over coffee
- Acknowledge their pain point empathetically ("super common issue", "this one's tricky")
- Share personal experience naturally ("I've wrestled with this", "took me hours to figure out")
- Be specific and technical, but explain the *why* not just the *what*
- End with encouragement or offer to help more

STRUCTURE:
1. Quick empathetic hook acknowledging the problem
2. Explain the likely cause (the "why" behind the issue)
3. Give specific, actionable advice they can try right now
4. Personal touch - share your experience, add warmth
5. Friendly closing (optional offer to clarify, wish them luck)

GOOD EXAMPLE:
"This is a super common pain point when working with Drive + media in n8n.

One thing to double-check is whether your Google Drive node is outputting binary data vs just file metadata. A lot of G-drive workflows look "connected" but never actually pass the binary forward, which breaks downstream video nodes.

A quick test: after the Drive node, open the execution data and confirm you see a binary object (not just JSON). If not, you'll want to use a Download operation before any video processing.

Happy to clarify further if you want, I've wrestled with this exact setup before. It took me 4 hours to figure that one out. Good Luck!"

AVOID:
- "Great question!" as an opener (too generic)
- Bullet point lists for everything
- Overly formal or corporate language
- Being preachy or condescending
- Walls of text - keep it digestible

You're building credibility by being genuinely helpful AND personable. People should think "this person really knows their stuff AND they're cool."

Write ONLY the response. No JSON, no explanation."""


class ResponseGenerator:
    """Generates Reddit responses using OpenRouter API."""

    def __init__(self):
        self.api_key = settings.openrouter_api_key
        self.base_url = "https://openrouter.ai/api/v1/chat/completions"
        self.model = "google/gemini-2.0-flash-001"

    async def generate(
        self,
        title: str,
        body: Optional[str],
        subreddit: str,
        custom_context: Optional[str] = None,
    ) -> Optional[str]:
        """
        Generate a response for a Reddit post.

        Args:
            title: Post title
            body: Post body/selftext
            subreddit: Subreddit name
            custom_context: Additional context to influence the response

        Returns:
            Generated response text, or None on error
        """
        if not self.api_key:
            print("OpenRouter API key not configured")
            return None

        # Build the prompt
        post_content = f"SUBREDDIT: r/{subreddit}\n\nTITLE: {title}"
        if body:
            post_content += f"\n\nBODY:\n{body[:1500]}"

        if custom_context:
            post_content += f"\n\nADDITIONAL CONTEXT: {custom_context}"

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.base_url,
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": self.model,
                        "messages": [
                            {"role": "system", "content": RESPONSE_PROMPT},
                            {"role": "user", "content": post_content},
                        ],
                        "temperature": 0.7,  # Slightly creative for natural responses
                        "max_tokens": 500,
                    },
                    timeout=30.0,
                )

                if response.status_code != 200:
                    print(f"OpenRouter error: {response.status_code} - {response.text}")
                    return None

                data = response.json()
                return data["choices"][0]["message"]["content"].strip()

        except Exception as e:
            print(f"Error generating response: {e}")
            return None


# Singleton
_generator: Optional[ResponseGenerator] = None


def get_generator() -> ResponseGenerator:
    """Get or create generator instance."""
    global _generator
    if _generator is None:
        _generator = ResponseGenerator()
    return _generator
