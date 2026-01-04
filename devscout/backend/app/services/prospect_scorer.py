"""AI-powered prospect scoring using OpenRouter."""

import json
import asyncio
from typing import Optional, List, Dict, Any

import httpx
from pydantic import BaseModel

from ..config import get_settings

settings = get_settings()


class ProspectInput(BaseModel):
    """Input data for a prospect to score."""
    source: str  # 'reddit', 'hackernews', 'craigslist', 'linkedin', etc.
    source_id: str  # Platform-specific ID
    platform_detail: Optional[str] = None  # Subreddit, city, etc.
    title: Optional[str] = None
    body: Optional[str] = None
    url: str
    author: Optional[str] = None
    posted_at: Optional[str] = None


class ProspectScore(BaseModel):
    """Structured scoring output from AI."""
    is_lead: bool  # Actively looking to pay for work?
    confidence: float  # 0-1 confidence in assessment
    lead_type: str  # direct_hire, project, contract, job_post, discussion, competitor, spam
    urgency: str  # immediate, this_week, this_month, exploring, unknown
    fit_score: int  # 0-100 match with Jesse's services
    budget_signal: str  # high, medium, low, unknown
    services_needed: List[str]  # api_integration, automation, scraping, etc.
    key_need: str  # One-sentence summary
    contact_info: Optional[str] = None  # Extracted email/discord/etc
    company_name: Optional[str] = None  # Company or project name
    recommended_approach: str  # How to reach out
    red_flags: List[str] = []  # Any concerns
    skip_reason: Optional[str] = None  # If is_lead=false, why


SCORING_PROMPT = """You are analyzing a post to determine if this person is actively looking to hire a developer.

JESSE'S SERVICES (match against these):
- API integrations (Salesforce, HubSpot, Stripe, Shopify, QuickBooks, etc.)
- Workflow automation (n8n, Zapier alternatives, custom Python/Node scripts)
- Web scraping and data extraction
- Python/JavaScript/TypeScript development
- Bug fixes and legacy code rescue
- Dashboard and web app development (React, FastAPI)
- Bot development (Discord, Slack, Telegram)
- Mobile app backends

ANALYZE THIS POST:
Source: {source}
Platform/Subreddit: {platform_detail}
Title: {title}
Body: {body}
Author: {author}

RESPOND WITH VALID JSON ONLY (no markdown, no explanation):
{{
  "is_lead": true/false,
  "confidence": 0.0-1.0,
  "lead_type": "direct_hire|project|contract|job_post|discussion|competitor|spam",
  "urgency": "immediate|this_week|this_month|exploring|unknown",
  "fit_score": 0-100,
  "budget_signal": "high|medium|low|unknown",
  "services_needed": ["api_integration", "automation", "scraping", "web_dev", "bug_fix", "bot", "mobile_backend"],
  "key_need": "One sentence: what do they actually need?",
  "contact_info": "Any email/discord/contact found, or null",
  "company_name": "Company or project name if mentioned, or null",
  "recommended_approach": "How should Jesse reach out?",
  "red_flags": ["any concerns about this lead"],
  "skip_reason": "If is_lead=false, explain why this isn't a lead"
}}

CRITICAL DISTINCTIONS:
- "Looking for developer" in a STORY about past experience = NOT a lead (is_lead: false)
- "[Hiring]" or "[Task]" tags with details = IS a lead (is_lead: true)
- "Anyone know a good..." or "Can someone help..." = LIKELY a lead (is_lead: true, confidence: 0.7+)
- "Tips for hiring..." or "My experience with..." = NOT a lead (is_lead: false, lead_type: discussion)
- Someone offering THEIR OWN services = competitor (is_lead: false, lead_type: competitor)
- Requests for FREE work or "exposure" = skip (is_lead: false, budget_signal: none)
- Job postings at big companies = job_post (is_lead: true but lower priority)
- Must show intent to PAY for work to be is_lead=true

BE STRICT: Only mark is_lead=true if they clearly want to pay for work done."""


class ProspectScorer:
    """Scores prospects using LLM analysis."""

    def __init__(self):
        self.api_keys = [k for k in [settings.openrouter_api_key, settings.openrouter_api_key_2] if k]
        self.base_url = "https://openrouter.ai/api/v1/chat/completions"
        self.model = "google/gemini-2.0-flash-001"

    async def _call_openrouter(self, messages: list) -> Optional[str]:
        """Call OpenRouter API with automatic fallback between keys."""
        if not self.api_keys:
            print("No OpenRouter API keys configured")
            return None

        for i, api_key in enumerate(self.api_keys):
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.post(
                        self.base_url,
                        headers={
                            "Authorization": f"Bearer {api_key}",
                            "Content-Type": "application/json",
                        },
                        json={
                            "model": self.model,
                            "messages": messages,
                            "temperature": 0.3,
                            "max_tokens": 500,
                        },
                        timeout=30.0,
                    )

                    if response.status_code == 200:
                        data = response.json()
                        return data["choices"][0]["message"]["content"].strip()
                    elif response.status_code == 402:
                        print(f"OpenRouter key {i+1} exhausted, trying next...")
                        continue
                    else:
                        print(f"OpenRouter error: {response.status_code} - {response.text}")
                        return None

            except Exception as e:
                print(f"Error calling OpenRouter with key {i+1}: {e}")
                continue

        print("All OpenRouter API keys exhausted or failed")
        return None

    async def score_single(self, prospect: ProspectInput) -> Dict[str, Any]:
        """
        Score a single prospect using AI analysis.

        Returns the original prospect data merged with AI scoring.
        """
        if not self.api_keys:
            print("No OpenRouter API keys configured")
            return self._error_response(prospect, "API key not configured")

        # Build the prompt
        prompt = SCORING_PROMPT.format(
            source=prospect.source,
            platform_detail=prospect.platform_detail or "unknown",
            title=prospect.title or "(no title)",
            body=(prospect.body or "")[:2000],  # Limit body length
            author=prospect.author or "unknown",
        )

        ai_response = await self._call_openrouter([{"role": "user", "content": prompt}])

        if not ai_response:
            return self._error_response(prospect, "API call failed")

        # Parse the JSON response
        try:
            # Handle potential markdown code blocks
            if ai_response.startswith("```"):
                ai_response = ai_response.split("```")[1]
                if ai_response.startswith("json"):
                    ai_response = ai_response[4:]

            ai_score = json.loads(ai_response)
        except json.JSONDecodeError as e:
            print(f"Failed to parse AI response: {e}")
            print(f"Response was: {ai_response[:500]}")
            return self._error_response(prospect, "Failed to parse AI response")

        # Merge prospect data with AI score
        return {
            # Original prospect data
            "source": prospect.source,
            "source_id": prospect.source_id,
            "platform_detail": prospect.platform_detail,
            "title": prospect.title,
            "body": prospect.body,
            "url": prospect.url,
            "author": prospect.author,
            "posted_at": prospect.posted_at,
            # AI scoring
            "ai_score": ai_score,
            "is_lead": ai_score.get("is_lead", False),
            "confidence": ai_score.get("confidence", 0.0),
            "fit_score": ai_score.get("fit_score", 0),
            "urgency": ai_score.get("urgency", "unknown"),
            "budget_signal": ai_score.get("budget_signal", "unknown"),
            "lead_type": ai_score.get("lead_type", "unknown"),
            "key_need": ai_score.get("key_need", ""),
            "services_needed": ai_score.get("services_needed", []),
            "contact_info": ai_score.get("contact_info"),
            "company_name": ai_score.get("company_name"),
            "recommended_approach": ai_score.get("recommended_approach", ""),
            "red_flags": ai_score.get("red_flags", []),
            "skip_reason": ai_score.get("skip_reason"),
        }

    async def score_batch(
        self,
        prospects: List[ProspectInput],
        delay_ms: int = 200,
        on_progress: Optional[callable] = None,
    ) -> List[Dict[str, Any]]:
        """
        Score a batch of prospects with rate limiting.

        Args:
            prospects: List of prospects to score
            delay_ms: Delay between API calls in milliseconds
            on_progress: Optional callback(completed, total) for progress updates

        Returns:
            List of scored prospects (includes original data + AI scores)
        """
        results = []
        total = len(prospects)

        for i, prospect in enumerate(prospects):
            result = await self.score_single(prospect)
            results.append(result)

            if on_progress:
                on_progress(i + 1, total)

            # Rate limiting delay (except for last item)
            if i < total - 1:
                await asyncio.sleep(delay_ms / 1000)

        return results

    def _error_response(self, prospect: ProspectInput, error: str) -> Dict[str, Any]:
        """Create an error response that preserves prospect data."""
        return {
            "source": prospect.source,
            "source_id": prospect.source_id,
            "platform_detail": prospect.platform_detail,
            "title": prospect.title,
            "body": prospect.body,
            "url": prospect.url,
            "author": prospect.author,
            "posted_at": prospect.posted_at,
            "ai_score": None,
            "is_lead": False,
            "confidence": 0.0,
            "fit_score": 0,
            "urgency": "unknown",
            "budget_signal": "unknown",
            "lead_type": "error",
            "key_need": "",
            "services_needed": [],
            "contact_info": None,
            "company_name": None,
            "recommended_approach": "",
            "red_flags": [],
            "skip_reason": f"Error: {error}",
            "error": error,
        }


# Singleton
_scorer: Optional[ProspectScorer] = None


def get_scorer() -> ProspectScorer:
    """Get or create scorer instance."""
    global _scorer
    if _scorer is None:
        _scorer = ProspectScorer()
    return _scorer
