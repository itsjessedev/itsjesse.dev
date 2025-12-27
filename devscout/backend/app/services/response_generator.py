"""AI response generator using OpenRouter."""

import json
import random
from typing import Optional

import httpx

from ..config import get_settings

settings = get_settings()

# Opening style templates - one is randomly selected for each request
# This forces variety by telling the model EXACTLY how to open
OPENING_STYLES = [
    {
        "style": "direct_technical",
        "instruction": "Start by jumping straight into the technical substance. Open with a direct statement about their approach, tool, or problem. Example: 'Semantic caching for prompts makes a lot of sense—especially with embeddings...'",
    },
    {
        "style": "shared_experience",
        "instruction": "Start by sharing your own related experience first. Open with something like 'Ran into this exact issue when...' or 'Built something similar for...' or 'Dealt with this in a client project...'",
    },
    {
        "style": "genuine_question",
        "instruction": "Start with a genuine, specific question about their implementation. Open with something like 'How are you handling the edge case where...' or 'Curious about your approach to...' or 'What's your cache invalidation strategy?'",
    },
    {
        "style": "specific_callout",
        "instruction": "Start by calling out ONE specific thing from their post that caught your attention. Open with something like 'The embeddings angle is clever because...' or 'That cost optimization point hits home—' or 'The part about detecting similar prompts is key.'",
    },
    {
        "style": "practical_advice",
        "instruction": "Start with actionable, practical advice or a tip. Open with something like 'One thing that helps with this is...' or 'The trick with semantic matching is...' or 'Pro tip for embedding-based caching:'",
    },
    {
        "style": "acknowledgment_pivot",
        "instruction": "Start by briefly acknowledging their point then immediately pivot to add something new. Open with 'Makes sense. The tricky part is usually...' or 'Valid approach. One thing to watch for is...' or 'Yeah, this is a real problem. What I found helps is...'",
    },
    {
        "style": "observation",
        "instruction": "Start with an observation or insight about the broader context. Open with 'Token costs are getting out of hand for a lot of devs...' or 'This is becoming more common now that...' or 'The whole prompt caching space is interesting because...'",
    },
    {
        "style": "validation_plus",
        "instruction": "Start by validating their problem then quickly add value. Open with 'Definitely a real pain point. I found that...' or 'Yeah, this adds up fast. One approach is...' or 'This is worth solving. The key challenge is usually...'",
    },
    {
        "style": "mini_story",
        "instruction": "Start with a very brief anecdote (1-2 sentences). Open with 'Had a client last year burning $X00/month on repeated prompts...' or 'When I was building [thing], caching saved us from...'",
    },
    {
        "style": "contrarian_curious",
        "instruction": "Start with gentle pushback or a different angle, framed as curiosity. Open with 'Have you considered the false-positive case where...' or 'One thing I'd push back on is...' or 'The semantic matching sounds good, but how do you handle...'",
    },
]

# Base system prompt (opening style is added dynamically)
BASE_RESPONSE_PROMPT = """You're an experienced developer engaging authentically on Reddit. You've built real systems and have practical insights to share.

POST TYPES & RESPONSE LENGTH:
1. HELP-SEEKING (simple question) → Short, direct answer (1-2 paragraphs). Don't over-explain.
2. HELP-SEEKING (complex problem) → Medium response (2-3 paragraphs) with specific technical guidance
3. SHARING/JOURNEY → Brief engagement (1-2 paragraphs). Ask a question, share a related thought. NO unsolicited advice.
4. DISCUSSION/OPINION → Add your perspective concisely (2-3 paragraphs), build on their points
5. SHOWCASE → Brief genuine feedback (1-2 paragraphs), one specific observation or question

LENGTH CALIBRATION:
- Match response depth to post complexity
- Simple question = simple answer. Don't pad.
- If you can say it in 2 sentences, do it in 2 sentences
- Only go longer if the problem genuinely requires detailed explanation

TONE: Confident peer-to-peer. You're an expert helping a fellow developer, not a junior trying to prove yourself.

BANNED PHRASES (never use):
- "Really interesting..." or "Interesting approach/take/idea..."
- "Ah," or "Ah, [anything]"
- "Great question!" or "Cool project!" or "Nice work!"
- "This is a great..." or "This looks like..."
- "I love this..." or "Love the idea..."
- "If I understand correctly..." (just answer)
- "Happy to help!" or "Hope this helps!"

{opening_instruction}

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

        # Randomly select an opening style to force variety
        opening_style = random.choice(OPENING_STYLES)
        opening_instruction = f"⚠️ REQUIRED OPENING STYLE: {opening_style['style'].upper()}\n{opening_style['instruction']}"

        # Build the system prompt with the selected opening style
        system_prompt = BASE_RESPONSE_PROMPT.format(opening_instruction=opening_instruction)

        # Build the user prompt
        post_content = f"SUBREDDIT: r/{subreddit}\n\nTITLE: {title}"
        if body:
            post_content += f"\n\nBODY:\n{body[:1500]}"

        if custom_context:
            post_content += f"\n\nADDITIONAL CONTEXT: {custom_context}"

        # Analyze post complexity to calibrate response length
        body_len = len(body) if body else 0
        title_lower = title.lower()

        # Determine appropriate response length
        if body_len < 100 and ('?' in title or any(w in title_lower for w in ['how', 'what', 'why', 'can i', 'should i'])):
            # Simple question - short answer
            max_tokens = 200
            post_content += "\n\n[NOTE: This is a simple question. Give a direct, concise answer - 1-2 short paragraphs max.]"
        elif body_len < 300:
            # Medium post - moderate response
            max_tokens = 350
        elif any(w in title_lower for w in ['built', 'made', 'launched', 'shipped', 'released', 'sharing']):
            # Showcase/sharing post - brief engagement
            max_tokens = 250
            post_content += "\n\n[NOTE: This is a showcase/sharing post. Keep response brief - acknowledge, ask one question or share one thought.]"
        else:
            # Complex post - allow fuller response
            max_tokens = 450

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
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": post_content},
                        ],
                        "temperature": 0.8,
                        "max_tokens": max_tokens,
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


    async def generate_reply(
        self,
        subreddit: str,
        my_comment: str,
        their_reply: str,
    ) -> Optional[str]:
        """
        Generate a response to a reply to the user's comment.

        Args:
            subreddit: Subreddit name
            my_comment: The user's original comment
            their_reply: The reply they received

        Returns:
            Generated response text, or None on error
        """
        if not self.api_key:
            print("OpenRouter API key not configured")
            return None

        reply_prompt = """You're a friendly, experienced developer continuing a conversation on Reddit. Someone replied to your comment and you want to respond naturally.

GUIDELINES:
- Continue the conversation naturally, as if talking to a peer
- Reference specific things they said
- Be helpful if they asked follow-up questions
- Be appreciative if they agreed or added to your point
- Be respectful if they disagreed - find common ground
- Keep it conversational, not preachy or corporate
- Match their energy - if they're casual, be casual; if technical, be technical

TONE:
- Warm and collegial
- Like chatting with a fellow developer at a meetup
- Personal, not generic

AVOID:
- Starting with "Thanks for your reply!" or similar corporate phrases
- Being defensive if they challenged something
- Over-explaining or lecturing
- Being overly enthusiastic or fake

Write ONLY the response. No JSON, no explanation. Just the natural reply."""

        context = f"""SUBREDDIT: r/{subreddit}

YOUR ORIGINAL COMMENT:
{my_comment[:1000]}

THEIR REPLY TO YOU:
{their_reply[:1500]}"""

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
                            {"role": "system", "content": reply_prompt},
                            {"role": "user", "content": context},
                        ],
                        "temperature": 0.7,
                        "max_tokens": 400,
                    },
                    timeout=30.0,
                )

                if response.status_code != 200:
                    print(f"OpenRouter error: {response.status_code} - {response.text}")
                    return None

                data = response.json()
                return data["choices"][0]["message"]["content"].strip()

        except Exception as e:
            print(f"Error generating reply: {e}")
            return None


    async def generate_engage_post(
        self,
        subreddit: str,
        idea_template: str,
        category: str,
    ) -> Optional[str]:
        """
        Generate an engagement post for starting a discussion on Reddit.

        Args:
            subreddit: Target subreddit
            idea_template: The post idea template (e.g., "After {X} years of {Y}, here are my biggest lessons")
            category: Post category (experience_sharing, questions_discussions, etc.)

        Returns:
            Generated post content (title and body), or None on error
        """
        if not self.api_key:
            print("OpenRouter API key not configured")
            return None

        engage_prompt = """You're an experienced developer who specializes in automation and integrations. You want to start a genuine discussion on Reddit that will engage the community.

BACKGROUND:
- You're Jesse, a developer who builds automation tools, API integrations, and workflow solutions
- You have experience with Python, JavaScript/TypeScript, FastAPI, React, and various APIs
- You genuinely want to contribute to the community, not just self-promote
- You enjoy helping other developers and sharing what you've learned

GUIDELINES:
- Write a genuine, engaging post that sparks discussion
- Fill in the template with REAL examples from your experience (make them believable and specific)
- Be conversational and authentic - like talking to peers
- Include enough detail to be interesting but not overwhelming
- End with something that invites responses (a question, request for experiences, etc.)
- DO NOT mention that you're looking for clients or that you offer services
- DO NOT be preachy or lecture-y
- Keep it focused on sharing/learning, not selling

FORMAT YOUR OUTPUT AS:
**Title:** [Your post title here]

**Body:**
[Your post body here - can be multiple paragraphs]

Write naturally, like you're having a conversation with fellow developers."""

        context = f"""SUBREDDIT: r/{subreddit}
POST CATEGORY: {category.replace('_', ' ')}
POST IDEA TEMPLATE: {idea_template}

Fill in this template with specific, believable examples from a developer's experience in automation and integrations. Make it genuine and engaging."""

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
                            {"role": "system", "content": engage_prompt},
                            {"role": "user", "content": context},
                        ],
                        "temperature": 0.8,  # Higher creativity for unique posts
                        "max_tokens": 800,
                    },
                    timeout=30.0,
                )

                if response.status_code != 200:
                    print(f"OpenRouter error: {response.status_code} - {response.text}")
                    return None

                data = response.json()
                return data["choices"][0]["message"]["content"].strip()

        except Exception as e:
            print(f"Error generating engage post: {e}")
            return None


# Singleton
_generator: Optional[ResponseGenerator] = None


def get_generator() -> ResponseGenerator:
    """Get or create generator instance."""
    global _generator
    if _generator is None:
        _generator = ResponseGenerator()
    return _generator
