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
    {
        "style": "honest_review",
        "instruction": "Start with a balanced, honest take. If they're asking for feedback, give it straight but kindly. Open with 'Couple things I'd flag here...' or 'The core idea is solid, but...' or 'Honest take: [strength], though [concern]...'",
    },
]

# LinkedIn opening styles - randomly selected for each post
# Professional but human - sounds like an expert who knows their stuff
LINKEDIN_OPENING_STYLES = [
    # Expert observations
    {"style": "pattern_recognition", "instruction": "Start by identifying a pattern from experience. Example: 'After building 50+ integrations, I've noticed the ones that fail share one thing in common.'"},
    {"style": "industry_insight", "instruction": "Start with a sharp industry observation. Example: 'Every company wants AI. Few have the data infrastructure to support it.'"},
    {"style": "counterintuitive", "instruction": "Start with something counterintuitive. Example: 'The fastest way to ship isn't to write more code. It's to delete it.'"},
    {"style": "truth_bomb", "instruction": "Start with an uncomfortable truth. Example: 'Most automation projects fail not because of technology, but because of unclear requirements.'"},
    {"style": "myth_busting", "instruction": "Start by busting a common myth. Example: 'APIs are easy to integrate. That's what everyone thinks until they actually try.'"},

    # Questions (thought-provoking)
    {"style": "rhetorical_question", "instruction": "Start with a thought-provoking question. Example: 'Why do companies spend $10k/month on tools that a $500 automation could replace?'"},
    {"style": "challenge_assumption", "instruction": "Start by questioning a common belief. Example: 'Everyone says you need microservices to scale. Do you, though?'"},
    {"style": "diagnostic_question", "instruction": "Start with a question that diagnoses a problem. Example: 'How much time does your team spend on manual data entry? The answer is usually \"too much.\"'"},

    # Bold statements
    {"style": "hot_take", "instruction": "Start with 'Hot take:' followed by a confident opinion. Example: 'Hot take: most companies don't have a technology problem. They have a process problem.'"},
    {"style": "unpopular_opinion", "instruction": "Start with 'Unpopular opinion:' and a contrarian view. Example: 'Unpopular opinion: you don't need a $50k enterprise solution for most integration needs.'"},
    {"style": "direct_claim", "instruction": "Start with a strong declarative statement. Example: 'The best automation is the one your team actually uses.'"},
    {"style": "definitive_statement", "instruction": "Start with a confident, definitive take. Example: 'There are two types of API documentation: outdated and very outdated.'"},

    # Experience-based
    {"style": "years_of_experience", "instruction": "Start by referencing your experience. Example: 'After years of building integrations, here's what I've learned about scoping projects.'"},
    {"style": "client_insight", "instruction": "Start with an insight from client work. Example: 'A client came to me last month with a \"simple\" integration request. Spoiler: it wasn't simple.'"},
    {"style": "project_retrospective", "instruction": "Start with a project reflection. Example: 'Just wrapped up a 3-month automation project. Here's what went right and what I'd do differently.'"},
    {"style": "lesson_from_failure", "instruction": "Start with a lesson from a mistake. Example: 'I once deployed an automation without proper error handling. Cost the client 8 hours of manual cleanup.'"},
    {"style": "before_after", "instruction": "Start with a transformation story. Example: 'Before: 6 hours of daily manual data entry. After: 15-minute automated sync. Here's how.'"},

    # Numbers and specifics
    {"style": "specific_number", "instruction": "Start with a specific, credible number. Example: '47 API endpoints. 12 different authentication methods. One integration. Welcome to enterprise software.'"},
    {"style": "time_saved", "instruction": "Start with time/money saved. Example: 'Saved a client 20 hours per week with a script that took 3 days to build. That's the ROI of automation.'"},
    {"style": "percentage_insight", "instruction": "Start with a percentage or ratio. Example: '80% of integration bugs come from 20% of the codebase. Usually the error handling.'"},

    # Teaching/Value
    {"style": "common_mistake", "instruction": "Start by addressing a common mistake. Example: 'The #1 mistake I see in automation projects: building before understanding the workflow.'"},
    {"style": "overlooked_factor", "instruction": "Start with something people overlook. Example: 'Everyone focuses on the API. Nobody talks about the webhook reliability.'"},
    {"style": "framework", "instruction": "Start by introducing a framework or approach. Example: 'Three questions I ask before starting any integration: What breaks? What scales? What changes?'"},
    {"style": "principle", "instruction": "Start with a guiding principle. Example: 'Principle I live by: automate the boring stuff, but keep humans in the loop for decisions.'"},

    # Contrarian/Debate
    {"style": "pushback", "instruction": "Start by pushing back on conventional wisdom. Example: 'Stop telling developers to \"just use Zapier.\" Some problems need real code.'"},
    {"style": "controversial_take", "instruction": "Start with a mildly controversial position. Example: 'Most startups don't need a dedicated DevOps engineer. They need better automation.'"},
    {"style": "reframing", "instruction": "Start by reframing a problem. Example: 'It's not a \"legacy system\" problem. It's an integration strategy problem.'"},

    # Timely/Current
    {"style": "recent_observation", "instruction": "Start with a recent observation (no 'so' or 'okay'). Example: 'Noticed something interesting while reviewing client architectures this week.'"},
    {"style": "trend_commentary", "instruction": "Start with commentary on a trend. Example: 'The rush to add AI to everything is creating a new category of technical debt.'"},
    {"style": "current_project", "instruction": "Start with current work insight. Example: 'Working on an API integration right now that's a masterclass in what not to do.'"},

    # Professional reflection
    {"style": "honest_assessment", "instruction": "Start with an honest professional take. Example: 'Honest assessment: most companies underestimate how long integrations take by 3-5x.'"},
    {"style": "professional_opinion", "instruction": "Start with a grounded opinion. Example: 'In my experience, the best integrations are boring. Reliable beats clever every time.'"},
    {"style": "hard_truth", "instruction": "Start with a hard truth. Example: 'Hard truth: if your automation requires a manual step, it's not really automated.'"},

    # Results-focused
    {"style": "outcome_first", "instruction": "Start with the outcome, then explain. Example: 'Cut a client's reporting time from 2 days to 2 hours. Here's the approach that made it possible.'"},
    {"style": "problem_solution", "instruction": "Start by stating a problem you solved. Example: 'The problem: data scattered across 5 systems. The solution: one automated pipeline.'"},
    {"style": "case_study_hook", "instruction": "Start like a mini case study. Example: 'E-commerce client. 10,000 orders/day. Zero automated fulfillment. Here's how we fixed it.'"},
]

# LinkedIn COMMENT styles - for replying to others' posts
# These are more casual and conversational - not always teaching/advising
# Categories help with smart selection based on post content
LINKEDIN_COMMENT_STYLES = [
    # === AGREEMENT / VIBING ===
    {"style": "simple_agreement", "category": "agreement", "instruction": "Just agree and add one small thought. Keep it brief, like 1-2 sentences. Example: 'This is so true. The debugging part especially.' or 'Been there. The auth stuff is always messier than expected.'"},
    {"style": "relatable_moment", "category": "agreement", "instruction": "Share a brief relatable moment without turning it into a lesson. Example: 'Ha, this hit close to home. Had this exact conversation with a PM last week.' or 'The accuracy of this post...'"},
    {"style": "casual_addition", "category": "agreement", "instruction": "Just add a casual related thought, not advice. Example: 'The part about documentation is what gets me. Nobody wants to write it, everybody needs it.' or 'API versioning is another one that always gets messy.'"},
    {"style": "fist_bump", "category": "agreement", "instruction": "Brief solidarity/agreement. Example: 'This is the way.' or 'Couldn't agree more.' or 'Exactly this.' or 'Right there with you on this.'"},

    # === CURIOSITY / QUESTIONS ===
    {"style": "genuine_curiosity", "category": "curiosity", "instruction": "Ask something you're genuinely curious about, not to help them. Example: 'How long did the migration end up taking?' or 'What made you choose that approach over X?' or 'Did you end up sticking with this or changing course?'"},
    {"style": "tangent_question", "category": "curiosity", "instruction": "Ask about something tangentially related that interests you. Example: 'Curious - are you using this in prod or still experimenting?' or 'What's the team size on this?'"},
    {"style": "follow_up", "category": "curiosity", "instruction": "Ask a natural follow-up question. Example: 'What happened next?' or 'How did the team react?' or 'Did that end up working out?'"},
    {"style": "context_seeking", "category": "curiosity", "instruction": "Ask for more context casually. Example: 'Was this a startup or enterprise context?' or 'How big was the codebase at that point?'"},

    # === ANECDOTES / PERSONAL ===
    {"style": "quick_anecdote", "category": "anecdote", "instruction": "Share a very brief related experience WITHOUT a lesson or advice. Just the story. Example: 'Reminds me of a project where we tried to automate everything and ended up with more work than before.' or 'Had a client insist on this exact approach once. Interesting few months.'"},
    {"style": "me_too", "category": "anecdote", "instruction": "Just a 'me too' type response with minimal elaboration. Example: 'Same. The refactoring never ends.' or 'This is basically my last three projects.' or 'I feel this in my soul.'"},
    {"style": "parallel_experience", "category": "anecdote", "instruction": "Mention a similar experience briefly. Example: 'Going through something similar right now actually.' or 'Dealt with this last quarter. It's a journey.'"},
    {"style": "flashback", "category": "anecdote", "instruction": "Brief callback to past experience. Example: 'This takes me back to my first integration project.' or 'Had flashbacks reading this.' or 'Getting deja vu here.'"},

    # === OBSERVATIONS ===
    {"style": "noticing", "category": "observation", "instruction": "Just notice or observe something from the post. Example: 'The part about stakeholder communication is underrated.' or 'Interesting that caching was the bottleneck - wouldn't have guessed that.'"},
    {"style": "pattern_spotting", "category": "observation", "instruction": "Point out a pattern you've noticed, casually. Example: 'Seems like every project hits this wall around month 3.' or 'Always funny how the \"quick fix\" becomes the permanent solution.'"},
    {"style": "highlighting", "category": "observation", "instruction": "Highlight a specific part that resonated. Example: 'The bit about testing in production hit different.' or 'That last point though.' or 'The debugging section especially.'"},
    {"style": "connecting_dots", "category": "observation", "instruction": "Connect to something else casually. Example: 'This connects to something I read about microservices recently.' or 'Similar vibe to what's happening with AI tooling.'"},

    # === LIGHT / HUMOR ===
    {"style": "light_humor", "category": "light", "instruction": "Add a light, relatable joke or quip. Example: 'The \"it works on my machine\" energy is strong with this one.' or 'Ah yes, the classic \"we need it yesterday\" timeline.'"},
    {"style": "commiseration", "category": "light", "instruction": "Commiserate without trying to solve anything. Example: 'Legacy code is a special kind of adventure.' or 'The joys of enterprise software.' or 'Gotta love scope creep.'"},
    {"style": "sarcastic_agreement", "category": "light", "instruction": "Light sarcasm or irony. Example: 'Oh, you mean the \"quick five minute fix\" that took two weeks? Love those.' or 'The \"simple\" API integration. Classic.'"},
    {"style": "emoji_reaction", "category": "light", "instruction": "Brief comment with well-placed emoji. Example: 'The accuracy 😂' or 'This hit hard 💯' or 'Called out 🎯'"},

    # === THOUGHTFUL ===
    {"style": "musing", "category": "thoughtful", "instruction": "Share a related thought you've been mulling over, not advice. Example: 'Been thinking about this lately too. The line between automation and over-engineering is blurry.' or 'Wonder how this changes with AI tooling becoming more common.'"},
    {"style": "different_angle", "category": "thoughtful", "instruction": "Offer a different perspective casually, not as a correction. Example: 'Interesting - I've had the opposite experience with microservices, but might be context-dependent.' or 'We went a different direction but I can see why this works.'"},
    {"style": "wondering", "category": "thoughtful", "instruction": "Express a related wondering or thought. Example: 'Makes me wonder what this looks like at larger scale.' or 'Wonder if this applies to smaller teams too.'"},
    {"style": "reflection", "category": "thoughtful", "instruction": "Brief reflection without being preachy. Example: 'This kind of thing is why I got into automation in the first place.' or 'These are the conversations I wish we had more often.'"},

    # === SIMPLE ENGAGEMENT ===
    {"style": "bookmark", "category": "simple", "instruction": "Just indicate you're saving/noting this. Example: 'Bookmarking this for later.' or 'Good stuff, saving this.' or 'Needed to hear this today.'"},
    {"style": "appreciation", "category": "simple", "instruction": "Simple appreciation without being over the top. Example: 'Solid breakdown.' or 'Clear and practical, thanks for sharing.' or 'This is useful context.'"},
    {"style": "sharing", "category": "simple", "instruction": "Mention you're sharing it. Example: 'Sharing this with my team.' or 'Forwarding to some folks who need to see this.'"},
    {"style": "tagging", "category": "simple", "instruction": "Mention it reminded you of someone (but don't actually tag). Example: 'This is so relevant to what my coworker was dealing with.' or 'My PM needs to see this.'"},

    # === SUPPORTIVE (for personal/vulnerable posts) ===
    {"style": "encouragement", "category": "supportive", "instruction": "Offer brief, genuine encouragement. Example: 'Rooting for you on this.' or 'You've got this.' or 'Keep going, this stuff matters.'"},
    {"style": "validation", "category": "supportive", "instruction": "Validate their experience briefly. Example: 'That takes guts to share.' or 'Respect for putting this out there.' or 'More people should talk about this.'"},
    {"style": "acknowledgment", "category": "supportive", "instruction": "Simply acknowledge what they shared. Example: 'This resonates.' or 'Appreciate you sharing this.' or 'Real talk.'"},
]

# Category weights for smart style selection based on post content
STYLE_CATEGORY_WEIGHTS = {
    "question": {"curiosity": 0.1, "agreement": 0.3, "anecdote": 0.3, "observation": 0.2, "light": 0.1},  # Don't ask questions back if they're asking
    "story": {"anecdote": 0.35, "agreement": 0.25, "light": 0.2, "observation": 0.15, "simple": 0.05},
    "lesson": {"agreement": 0.3, "observation": 0.25, "thoughtful": 0.2, "anecdote": 0.15, "simple": 0.1},
    "frustration": {"commiseration": 0.4, "anecdote": 0.3, "light": 0.2, "agreement": 0.1},  # Commiserate with venting
    "announcement": {"simple": 0.35, "agreement": 0.3, "supportive": 0.2, "curiosity": 0.15},
    "technical": {"observation": 0.3, "curiosity": 0.25, "thoughtful": 0.2, "anecdote": 0.15, "agreement": 0.1},
    "vulnerable": {"supportive": 0.5, "agreement": 0.25, "anecdote": 0.15, "simple": 0.1},  # Be supportive for personal posts
    "default": {"agreement": 0.25, "anecdote": 0.2, "observation": 0.15, "light": 0.15, "curiosity": 0.1, "thoughtful": 0.1, "simple": 0.05},
}


def detect_post_type(post_text: str) -> str:
    """Detect the type of LinkedIn post for smarter style selection."""
    text_lower = post_text.lower()

    # Check for vulnerable/personal content
    vulnerable_signals = ["struggling", "burnout", "laid off", "fired", "mental health", "anxiety", "depression", "imposter syndrome", "hard to admit", "vulnerability", "honest moment", "confession"]
    if any(signal in text_lower for signal in vulnerable_signals):
        return "vulnerable"

    # Check for frustration/venting
    frustration_signals = ["frustrated", "annoying", "hate when", "drives me crazy", "so tired of", "sick of", "rant", "pet peeve", "why do people", "stop doing this"]
    if any(signal in text_lower for signal in frustration_signals):
        return "frustration"

    # Check for questions
    question_signals = ["what do you think", "thoughts?", "what's your", "how do you", "anyone else", "have you ever", "curious what", "what would you", "?"]
    if any(signal in text_lower for signal in question_signals) and text_lower.count("?") >= 1:
        return "question"

    # Check for announcements
    announcement_signals = ["excited to announce", "thrilled to share", "happy to announce", "proud to", "just launched", "introducing", "we're hiring", "new role", "started a new"]
    if any(signal in text_lower for signal in announcement_signals):
        return "announcement"

    # Check for lessons/advice
    lesson_signals = ["lesson learned", "here's what i learned", "pro tip", "hot take", "unpopular opinion", "advice:", "tip:", "things i wish", "what nobody tells you"]
    if any(signal in text_lower for signal in lesson_signals):
        return "lesson"

    # Check for stories
    story_signals = ["last week", "yesterday", "recently", "once had", "true story", "let me tell you", "here's what happened", "a few months ago", "back when"]
    if any(signal in text_lower for signal in story_signals):
        return "story"

    # Check for technical content
    technical_signals = ["api", "database", "code", "architecture", "deployment", "infrastructure", "algorithm", "optimization", "performance", "debugging", "integration"]
    if sum(1 for signal in technical_signals if signal in text_lower) >= 2:
        return "technical"

    return "default"


def select_comment_style(post_text: str) -> dict:
    """Select an appropriate comment style based on post content."""
    post_type = detect_post_type(post_text)
    weights = STYLE_CATEGORY_WEIGHTS.get(post_type, STYLE_CATEGORY_WEIGHTS["default"])

    # Build weighted list of styles
    weighted_styles = []
    for style in LINKEDIN_COMMENT_STYLES:
        category = style.get("category", "agreement")
        weight = weights.get(category, 0.1)
        weighted_styles.append((style, weight))

    # Normalize weights
    total_weight = sum(w for _, w in weighted_styles)
    normalized = [(s, w / total_weight) for s, w in weighted_styles]

    # Random selection based on weights
    r = random.random()
    cumulative = 0
    for style, weight in normalized:
        cumulative += weight
        if r <= cumulative:
            return style

    # Fallback to last style
    return normalized[-1][0]


def analyze_author(author: str, headline: Optional[str]) -> dict:
    """Analyze the author to determine engagement strategy."""
    headline_lower = (headline or "").lower()
    author_lower = (author or "").lower()

    result = {
        "is_potential_client": False,
        "is_peer": False,
        "is_influencer": False,
        "is_technical": False,
        "seniority": "unknown",  # junior, mid, senior, executive
        "persona": "general",  # business_owner, startup_founder, corporate_exec, developer, consultant, recruiter, influencer
        "strategy": "casual",  # casual, value_add, strategic, expert_peer
        "industry": "unknown",
    }

    # Detect potential clients (business owners, founders, executives who might need dev services)
    client_signals = [
        "founder", "co-founder", "ceo", "cto", "coo", "owner", "president",
        "director", "vp ", "vice president", "head of", "chief",
        "entrepreneur", "business owner", "startup", "building",
        "agency owner", "managing director"
    ]
    if any(signal in headline_lower for signal in client_signals):
        result["is_potential_client"] = True
        result["strategy"] = "strategic"

    # Detect seniority
    exec_signals = ["ceo", "cto", "coo", "cfo", "chief", "founder", "co-founder", "president", "owner"]
    senior_signals = ["senior", "lead", "principal", "staff", "architect", "director", "head of", "vp ", "vice president", "manager"]
    mid_signals = ["engineer", "developer", "consultant", "specialist", "analyst"]

    if any(signal in headline_lower for signal in exec_signals):
        result["seniority"] = "executive"
    elif any(signal in headline_lower for signal in senior_signals):
        result["seniority"] = "senior"
    elif any(signal in headline_lower for signal in mid_signals):
        result["seniority"] = "mid"
    elif "junior" in headline_lower or "intern" in headline_lower or "entry" in headline_lower:
        result["seniority"] = "junior"

    # Detect persona
    if any(s in headline_lower for s in ["founder", "co-founder", "ceo", "started", "building my"]):
        result["persona"] = "startup_founder"
        result["is_potential_client"] = True
    elif any(s in headline_lower for s in ["agency", "consultancy", "consulting firm"]):
        result["persona"] = "agency_owner"
        result["is_potential_client"] = True
    elif any(s in headline_lower for s in ["cto", "vp engineering", "head of engineering", "director of engineering"]):
        result["persona"] = "tech_leader"
        result["is_potential_client"] = True
    elif any(s in headline_lower for s in ["ceo", "coo", "president", "owner"]) and "tech" not in headline_lower:
        result["persona"] = "business_executive"
        result["is_potential_client"] = True
    elif any(s in headline_lower for s in ["developer", "engineer", "programmer", "coder", "software"]):
        result["persona"] = "developer"
        result["is_peer"] = True
        result["is_technical"] = True
        result["strategy"] = "expert_peer"
    elif any(s in headline_lower for s in ["consultant", "freelance", "independent"]):
        result["persona"] = "consultant"
        result["is_peer"] = True
        result["strategy"] = "expert_peer"
    elif any(s in headline_lower for s in ["recruiter", "talent", "hiring", "hr ", "human resources"]):
        result["persona"] = "recruiter"
        result["strategy"] = "casual"
    elif any(s in headline_lower for s in ["coach", "speaker", "author", "influencer", "creator"]):
        result["persona"] = "influencer"
        result["is_influencer"] = True
        result["strategy"] = "value_add"

    # Detect if technical based on headline
    tech_signals = ["developer", "engineer", "architect", "devops", "backend", "frontend", "fullstack",
                    "data", "ml", "ai ", "cloud", "infrastructure", "platform", "api", "software"]
    if any(signal in headline_lower for signal in tech_signals):
        result["is_technical"] = True

    # Detect industry
    industries = {
        "saas": ["saas", "software as a service", "b2b saas", "b2c saas"],
        "ecommerce": ["ecommerce", "e-commerce", "shopify", "amazon", "retail", "dtc", "d2c"],
        "fintech": ["fintech", "finance", "banking", "payments", "crypto", "defi"],
        "healthcare": ["health", "medical", "healthcare", "biotech", "pharma"],
        "marketing": ["marketing", "growth", "seo", "content", "brand", "advertising"],
        "real_estate": ["real estate", "property", "realty", "realtor"],
        "agency": ["agency", "studio", "consultancy"],
    }
    for industry, signals in industries.items():
        if any(signal in headline_lower for signal in signals):
            result["industry"] = industry
            break

    return result


# Smart model for strategic engagement (Claude Sonnet via OpenRouter)
SMART_MODEL = "anthropic/claude-sonnet-4"

# Strategic LinkedIn comment prompt - different based on author type
STRATEGIC_LINKEDIN_COMMENT_PROMPT = """You're Jesse, an experienced developer specializing in automation, API integrations, and workflow optimization. You build systems that save companies time and money.

YOUR EXPERTISE (reference naturally when relevant):
- API integrations: Salesforce, HubSpot, Shopify, QuickBooks, eBay, custom APIs
- Workflow automation: Better-than-Zapier solutions, cron jobs, report automation
- Web scraping: Competitor monitoring, lead generation, data extraction
- Bot development: Slack, Discord, Telegram integrations
- Custom dashboards: Admin panels, analytics, internal tools
- AI integration: GPT/Claude integration, document classification, semantic search

AUTHOR ANALYSIS:
{author_analysis}

ENGAGEMENT STRATEGY: {strategy}

{strategy_instructions}

GUIDELINES:
- Sound like a real person, not a LinkedIn bot
- Be confident but not arrogant - you know your stuff
- Reference specific technical details when relevant (shows expertise)
- Match their level - technical with tech people, business outcomes with executives
- If they're a potential client, plant seeds without being salesy
- ALWAYS use 'I' never 'we' - you're an independent developer
- Current year is 2026 - don't reference outdated things

BANNED PHRASES:
- "Great post!" / "Love this!" / "This is so valuable!"
- "Absolutely!" / "Couldn't agree more!"
- "As someone who..." (overused)
- "I'd be happy to..." (too salesy)
- Generic cheerleading without substance

LENGTH: {length_guidance}

OUTPUT: Just the comment text, nothing else."""

STRATEGY_INSTRUCTIONS = {
    "casual": """
CASUAL ENGAGEMENT:
- Just be yourself, join the conversation naturally
- Share a thought, ask a question, or relate to their experience
- No need to showcase expertise - just be genuine
- Keep it light and conversational""",

    "value_add": """
VALUE-ADD ENGAGEMENT:
- Contribute something genuinely useful to the conversation
- Share an insight, perspective, or experience that adds depth
- Ask thoughtful questions that advance the discussion
- Position yourself as knowledgeable without showing off""",

    "strategic": """
STRATEGIC ENGAGEMENT (potential client detected):
- Demonstrate expertise subtly through the quality of your comment
- Share insights relevant to their industry/role
- If they mention a problem you solve, acknowledge it thoughtfully (don't pitch)
- Plant seeds: show you understand their world
- Goal: they should think "this person gets it" not "this person wants my money"
- A great comment makes them curious enough to check your profile""",

    "expert_peer": """
EXPERT PEER ENGAGEMENT:
- Engage as an equal - fellow practitioner to practitioner
- Share technical insights, war stories, or different approaches
- Be specific and concrete - generalities don't impress other experts
- Okay to respectfully disagree or offer alternative perspectives
- Reference real experience: "In my integrations I've found..." or "Ran into this with a client..."
- Keep the technical depth appropriate to their post"""
}

# LinkedIn comment prompt - more casual and varied
LINKEDIN_COMMENT_PROMPT = """You're Jesse, a developer who does automation and API integrations. You're commenting on a LinkedIn post - just being part of the conversation, not trying to be a guru or mentor.

IMPORTANT: You're just commenting like a normal person. NOT every comment needs to:
- Give advice
- Teach something
- Validate them
- Establish your expertise
- Add "value"

Sometimes you just:
- Agree and move on
- Share a quick related thought
- Ask something you're curious about
- Make a relatable observation
- Commiserate
- Add a light comment

COMMENT STYLES (randomly vary between these):
1. CASUAL AGREEMENT - "This is so true" + one brief thought
2. RELATABLE - Share that you've experienced something similar (no lesson)
3. CURIOUS - Ask a genuine question (not to help, just interested)
4. BRIEF ANECDOTE - Quick related story, no moral or advice attached
5. OBSERVATION - Just notice something interesting in their post
6. LIGHT - A relatable quip or commiseration
7. SIMPLE - Just a brief, genuine reaction

LENGTH: Keep it SHORT. 1-3 sentences usually. This is a comment, not a blog post.

NEVER:
- Start with "Great post!" or "Love this!" or "This is so valuable!"
- Give unsolicited advice
- Turn every comment into a teaching moment
- Mention your services or expertise
- Be overly enthusiastic or corporate
- Write multiple paragraphs
- Include style labels or prefixes like "ME_TOO:" or "CASUAL_AGREEMENT:"
- Start with "Yeah" or "Yep" every time - vary your openings

{opening_instruction}

Write ONLY the comment text itself. No labels, no prefixes, just the natural comment."""

# Base system prompt (opening style is added dynamically)
BASE_RESPONSE_PROMPT = """You're an experienced developer engaging authentically on Reddit. You've built real systems and have practical insights to share.

POST TYPES & RESPONSE LENGTH:
1. HELP-SEEKING (simple question) → Short, direct answer (1-2 paragraphs). Don't over-explain.
2. HELP-SEEKING (complex problem) → Medium response (2-3 paragraphs) with specific technical guidance
3. SHARING/JOURNEY → Brief engagement (1-2 paragraphs). Ask a question, share a related thought. NO unsolicited advice.
4. DISCUSSION/OPINION → Add your perspective concisely (2-3 paragraphs), build on their points
5. SHOWCASE → Brief genuine feedback (1-2 paragraphs), one specific observation or question
6. FEEDBACK REQUEST → Be honestly helpful (2-3 paragraphs). Give real, actionable feedback - don't just hype them up.

HONEST FEEDBACK APPROACH (for feedback/critique/review requests):
- If they ask for feedback, GIVE real feedback - both positives AND areas to improve
- Don't just validate everything. Point out potential issues, gaps, or concerns.
- Be specific: "The auth flow could use rate limiting" not just "looks good!"
- Balance is key: lead with something genuine you like, then honest concerns, then encouragement
- Be kind but direct. Sugarcoating wastes their time.
- If something is actually bad, say so diplomatically: "The UX here might frustrate users because..."

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
        self.api_keys = [k for k in [settings.openrouter_api_key, settings.openrouter_api_key_2] if k]
        self.base_url = "https://openrouter.ai/api/v1/chat/completions"
        self.model = "google/gemini-2.0-flash-001"

    async def _call_openrouter(self, messages: list, max_tokens: int, temperature: float = 0.8, model: Optional[str] = None) -> Optional[str]:
        """Call OpenRouter API with automatic fallback between keys."""
        if not self.api_keys:
            print("No OpenRouter API keys configured")
            return None

        use_model = model or self.model

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
                            "model": use_model,
                            "messages": messages,
                            "temperature": temperature,
                            "max_tokens": max_tokens,
                        },
                        timeout=30.0,
                    )

                    if response.status_code == 200:
                        data = response.json()
                        return data["choices"][0]["message"]["content"].strip()
                    elif response.status_code == 402:
                        # Insufficient credits - try next key
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
        if not self.api_keys:
            print("No OpenRouter API keys configured")
            return None

        # Build the user prompt
        post_content = f"SUBREDDIT: r/{subreddit}\n\nTITLE: {title}"
        if body:
            post_content += f"\n\nBODY:\n{body[:1500]}"

        if custom_context:
            post_content += f"\n\nADDITIONAL CONTEXT: {custom_context}"

        # Analyze post complexity to calibrate response length and opening style
        body_len = len(body) if body else 0
        title_lower = title.lower()
        body_lower = (body or '').lower()
        combined = title_lower + ' ' + body_lower

        # Detect feedback-seeking posts - use honest_review style
        feedback_keywords = ['roast my', 'roast this', 'feedback', 'critique', 'criticism',
                            'honest opinion', 'honest thoughts', 'be brutal', 'be honest',
                            'tear it apart', 'what do you think', 'rate my', 'review my',
                            'looking for feedback', 'want feedback', 'need feedback',
                            'any suggestions', 'what am i missing', 'what could be better']
        is_feedback_request = any(kw in combined for kw in feedback_keywords)

        # Select opening style - force honest_review for feedback requests
        if is_feedback_request:
            opening_style = next(s for s in OPENING_STYLES if s['style'] == 'honest_review')
        else:
            opening_style = random.choice(OPENING_STYLES)
        opening_instruction = f"⚠️ REQUIRED OPENING STYLE: {opening_style['style'].upper()}\n{opening_style['instruction']}"

        # Build the system prompt with the selected opening style
        system_prompt = BASE_RESPONSE_PROMPT.format(opening_instruction=opening_instruction)

        # Determine appropriate response length
        if is_feedback_request:
            # Feedback request - give honest, balanced review
            max_tokens = 400
            post_content += "\n\n[NOTE: They're asking for feedback. Give HONEST, balanced feedback - genuine positives AND real concerns/suggestions. Don't just hype them up.]"
        elif body_len < 100 and ('?' in title or any(w in title_lower for w in ['how', 'what', 'why', 'can i', 'should i'])):
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

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": post_content},
        ]
        return await self._call_openrouter(messages, max_tokens, temperature=0.8)


    async def generate_reply(
        self,
        subreddit: str,
        my_comment: str,
        their_reply: str,
        thread_context: Optional[list] = None,
    ) -> Optional[str]:
        """
        Generate a response to a reply to the user's comment.

        Args:
            subreddit: Subreddit name
            my_comment: The user's original comment (for backwards compatibility)
            their_reply: The reply they received (the one we're responding to)
            thread_context: Optional full thread history [{author, text, is_me}, ...]

        Returns:
            Generated response text, or None on error
        """
        if not self.api_keys:
            print("No OpenRouter API keys configured")
            return None

        reply_prompt = """You're a friendly, experienced developer continuing a conversation on Reddit. Someone replied in a thread and you want to respond naturally.

CRITICAL: Consider the ENTIRE conversation thread, not just the last message. Your response should:
- Reference relevant points from earlier in the conversation
- Maintain consistency with your previous statements
- Build on the conversation's progression
- Acknowledge context that has already been established

GUIDELINES:
- Continue the conversation naturally, as if talking to a peer
- Reference specific things they said, both recent AND earlier in the thread
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
- Repeating things you already said in the thread
- Ignoring earlier context that's relevant

Write ONLY the response. No JSON, no explanation. Just the natural reply."""

        # Build context with full thread if available
        if thread_context and len(thread_context) > 0:
            # Format full thread
            thread_text = ""
            for i, msg in enumerate(thread_context):
                author_label = "YOU" if msg.get("is_me") else msg.get("author", "Unknown")
                thread_text += f"\n[{author_label}]: {msg.get('text', '')[:800]}\n"

            context = f"""SUBREDDIT: r/{subreddit}

FULL CONVERSATION THREAD (oldest to newest):
{thread_text}

THE SPECIFIC COMMENT YOU'RE REPLYING TO:
{their_reply[:1500]}

Generate a response that considers the full thread context above, but is specifically aimed at the last comment."""
        else:
            # Fallback to original format for backwards compatibility
            context = f"""SUBREDDIT: r/{subreddit}

YOUR ORIGINAL COMMENT:
{my_comment[:1000]}

THEIR REPLY TO YOU:
{their_reply[:1500]}"""

        messages = [
            {"role": "system", "content": reply_prompt},
            {"role": "user", "content": context},
        ]
        return await self._call_openrouter(messages, max_tokens=400, temperature=0.7)


    async def generate_linkedin_comment(
        self,
        post_text: str,
        author: str,
        author_headline: Optional[str] = None,
    ) -> Optional[str]:
        """
        Generate an intelligent, strategic comment for a LinkedIn post.

        Uses Claude Sonnet for higher quality reasoning and adapts strategy based on:
        - Who the author is (potential client, peer, influencer)
        - The type of post (technical, story, question, etc.)
        - The author's seniority and industry

        Args:
            post_text: The LinkedIn post content
            author: Post author name
            author_headline: Author's headline/title

        Returns:
            Generated comment text, or None on error
        """
        if not self.api_keys:
            print("No OpenRouter API keys configured")
            return None

        # Analyze the author to determine engagement strategy
        author_info = analyze_author(author, author_headline)
        strategy = author_info["strategy"]
        post_type = detect_post_type(post_text)

        # Build author analysis summary for the prompt
        author_analysis_parts = [f"Author: {author}"]
        if author_headline:
            author_analysis_parts.append(f"Headline: {author_headline}")
        author_analysis_parts.append(f"Persona: {author_info['persona']}")
        author_analysis_parts.append(f"Seniority: {author_info['seniority']}")
        if author_info["industry"] != "unknown":
            author_analysis_parts.append(f"Industry: {author_info['industry']}")
        if author_info["is_potential_client"]:
            author_analysis_parts.append("⚠️ POTENTIAL CLIENT - engage thoughtfully")
        if author_info["is_technical"]:
            author_analysis_parts.append("Technical person - can go deeper on implementation details")
        author_analysis_parts.append(f"Post type detected: {post_type}")

        author_analysis = "\n".join(author_analysis_parts)

        # Get strategy-specific instructions
        strategy_instructions = STRATEGY_INSTRUCTIONS.get(strategy, STRATEGY_INSTRUCTIONS["casual"])

        # Determine length based on strategy and post type
        if strategy == "strategic" or strategy == "value_add":
            length_guidance = "2-4 sentences. Substantial enough to demonstrate expertise, but not a lecture."
            max_tokens = 250
        elif strategy == "expert_peer" and post_type == "technical":
            length_guidance = "2-5 sentences. Match the technical depth of their post. Concrete specifics > vague generalities."
            max_tokens = 300
        else:
            length_guidance = "1-3 sentences. Keep it natural and conversational."
            max_tokens = 180

        # Build the prompt
        system_prompt = STRATEGIC_LINKEDIN_COMMENT_PROMPT.format(
            author_analysis=author_analysis,
            strategy=strategy.upper(),
            strategy_instructions=strategy_instructions,
            length_guidance=length_guidance,
        )

        context = f"""POST CONTENT:
{post_text[:2500]}

Generate a comment that's appropriate for this specific author and post."""

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": context},
        ]

        # Use Claude Sonnet for smarter responses
        return await self._call_openrouter(messages, max_tokens=max_tokens, temperature=0.85, model=SMART_MODEL)


    async def generate_linkedin_comment_reply(
        self,
        my_comment_text: str,
        their_reply_text: str,
        post_text: Optional[str] = None,
        post_author: Optional[str] = None,
    ) -> Optional[str]:
        """
        Generate a reply to someone who replied to my LinkedIn comment.

        Context: I made a comment on someone else's post, and now someone has replied to my comment.
        I need to respond to THEIR REPLY in a natural, conversational way.

        Args:
            my_comment_text: The comment I originally made
            their_reply_text: What they said in response to my comment (THIS IS WHAT WE'RE RESPONDING TO)
            post_text: The original post content (for context)
            post_author: Author of the original post

        Returns:
            Generated reply text, or None on error
        """
        if not self.api_keys:
            print("No OpenRouter API keys configured")
            return None

        reply_prompt = """You're a developer replying to someone on LinkedIn. They replied to a comment you made, and now you're responding to THEIR REPLY.

YOUR PERSONA:
- You're Jesse, a developer who builds automation tools, API integrations, and workflows
- You're helpful, friendly, and genuinely engage with people
- You sound like a real person, not corporate or robotic
- ALWAYS use 'I' never 'we' - you're an individual, not a company

CRITICAL: You're responding to THEIR REPLY, not the original post. Focus on what they said to you.

GUIDELINES:
- Keep it short and conversational (1-3 sentences)
- Engage authentically with what THEY SAID in their reply
- Be warm but not over-the-top
- You can ask a follow-up question if relevant
- Don't be preachy or lecture
- Match their energy level

BANNED PHRASES (never use these):
- "Great point!"
- "Absolutely!"
- "Couldn't agree more!"
- "This is so true!"
- "Love this!"
- Any emoji spam

OUTPUT: Just the reply text, nothing else."""

        context = f"""CONVERSATION THREAD:

1. ORIGINAL POST (by {post_author or 'someone'}):
{post_text[:300] if post_text else '[Background post]'}

2. MY COMMENT (what I wrote on the post):
{my_comment_text}

3. THEIR REPLY TO ME (what they said in response to my comment):
{their_reply_text}

I need to respond to THEIR REPLY (#3). Generate a natural, casual response that continues this conversation."""

        messages = [
            {"role": "system", "content": reply_prompt},
            {"role": "user", "content": context},
        ]

        return await self._call_openrouter(messages, max_tokens=150, temperature=0.9)


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
        if not self.api_keys:
            print("No OpenRouter API keys configured")
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

        messages = [
            {"role": "system", "content": engage_prompt},
            {"role": "user", "content": context},
        ]
        return await self._call_openrouter(messages, max_tokens=800, temperature=0.8)


    async def generate_linkedin_post(
        self,
        idea_template: str,
        category: str,
        length: str = "medium",
    ) -> Optional[str]:
        """
        Generate a LinkedIn post for professional dev audience.

        Args:
            idea_template: The post idea template
            category: Post category (lessons_learned, technical_insights, etc.)
            length: Post length - short (50-100 words), medium (150-250 words), long (300-500 words)

        Returns:
            Generated LinkedIn post content, or None on error
        """
        if not self.api_keys:
            print("No OpenRouter API keys configured")
            return None

        # Length-specific instructions
        length_configs = {
            "short": {
                "words": "50-100 words",
                "style": "Punchy and direct. One main point. Maybe just 2-3 short paragraphs. Great for hot takes, quick tips, or questions.",
                "max_tokens": 200,
            },
            "medium": {
                "words": "150-250 words",
                "style": "Balanced depth. Set up the context, share the insight, invite discussion. 3-5 paragraphs.",
                "max_tokens": 450,
            },
            "long": {
                "words": "300-500 words",
                "style": "Full story or deep dive. Build narrative, include specifics/examples, end with takeaway. Good for case studies and lessons learned.",
                "max_tokens": 700,
            },
        }
        config = length_configs.get(length, length_configs["medium"])

        # Select random opening style to force variety
        opening_style = random.choice(LINKEDIN_OPENING_STYLES)

        linkedin_prompt = f"""You're Jesse, a freelance developer who builds automation and API integrations. Write a LinkedIn post that sounds like YOU wrote it - not a marketing team.

IMPORTANT: The current year is 2026. If you reference the year, use 2026.

⚠️ REQUIRED OPENING STYLE: {opening_style['style'].upper()}
{opening_style['instruction']}

YOUR VOICE:
- ALWAYS use "I" never "we" - you're an independent freelancer, not a company
- Casual but smart. Like texting a friend who's also a developer.
- You've been doing this for years. You have opinions. Share them.
- You make mistakes and learn from them. That's interesting.
- You're not trying to be an influencer. You're just sharing what you know.

THIS POST SHOULD BE: {config['words']}
STYLE: {config['style']}

WHAT MAKES POSTS FEEL HUMAN:
- Use contractions (I'm, don't, that's, it's)
- Incomplete sentences are fine. For emphasis.
- Specific details make stories real (not "a client" but "a SaaS startup" or "an e-commerce client")
- Admit uncertainty when appropriate: "I might be wrong but..." or "Still figuring this out..."

DON'T ALWAYS END THE SAME WAY:
- Sometimes end with a question
- Sometimes just end (no call to action)
- Sometimes end with a takeaway
- Sometimes end with what you're trying next
- Hashtags: 0-3 max. Skip them often.

BANNED OPENINGS (never start with these - they sound unprofessional or generic):
- "Okay, so..." / "Okay so..." / "Ok so..."
- "So I was..." / "So, I was..."
- "So I've been..." / "So, I've been..."
- "Alright, so..."
- "Well, I..."
- "I'm excited to..."
- "In today's..."
- "Let me share..."
- "I wanted to talk about..."
- "I thought I'd share..."
- "Just wanted to..."
- Any sentence starting with "So," or "So "

BANNED PHRASES:
- 🚀 emoji spam 🔥 like 💯 this 📈
- "Here are 5 tips..."
- "What do you think? Let me know in the comments!"
- Corporate buzzwords: leverage, synergy, game-changer, thought leader

CATEGORY: {category.replace('_', ' ')}
POST IDEA: {idea_template}

Write this post as Jesse would actually write it. Use the required opening style above. Be specific. Be real."""

        messages = [
            {"role": "user", "content": linkedin_prompt},
        ]
        return await self._call_openrouter(messages, max_tokens=config["max_tokens"], temperature=0.9)


    async def generate_smart_linkedin_post(
        self,
        post_type: str = "random",
    ) -> Optional[dict]:
        """
        Generate a LinkedIn post with AI-created idea AND content in one step.

        Args:
            post_type: Type of post to generate:
                - "random" - AI picks the best type
                - "thought_leadership" - Technical insight, lesson, or hot take
                - "soft_sell" - Subtle service mention
                - "engagement" - Question or discussion starter
                - "story" - Personal anecdote or case study
                - "quick_tip" - Short, actionable tip

        Returns:
            Dict with 'idea' and 'content' keys, or None on error
        """
        if not self.api_keys:
            print("No OpenRouter API keys configured")
            return None

        # Post type configurations
        post_type_configs = {
            "random": {
                "guidance": "Pick the type that would work best right now. Mix it up - could be a lesson, a tip, a story, a hot take, a question, or sharing something you're working on. Surprise me.",
                "length": "medium",
            },
            "thought_leadership": {
                "guidance": """Share technical expertise. Options:
                - A lesson you learned the hard way
                - A hot take / unpopular opinion about development
                - A technical insight from a recent project
                - A pattern or anti-pattern you've observed
                - Something most devs get wrong""",
                "length": "medium",
            },
            "soft_sell": {
                "guidance": """Subtly showcase your services through a recent win or observation.

YOUR ACTUAL SERVICES (pick ONE to highlight):
1. API Integration - Connecting systems like Salesforce, Shopify, eBay, QuickBooks. Syncing data between platforms.
2. Workflow Automation - Replacing manual processes, automating reports, cron jobs, eliminating copy-paste work. "Better than Zapier" solutions.
3. Web Scraping - Competitor price monitoring, lead generation, data extraction from websites
4. Bot Development - Slack bots, Discord bots, Telegram bots for support, notifications, community management
5. Custom Dashboards - Admin panels, analytics dashboards, internal tools
6. AI Integration - Adding GPT/Claude to existing systems, document classification, smart assistants

SOFT SELL APPROACH (pick one):
- Just finished a project: "Wrapped up a [service type] project for a [client type]. The before/after was wild - [specific improvement]."
- Problem you solve often: "Keep seeing businesses struggle with [specific problem]. It's usually a [simple/quick/straightforward] fix with [your service]."
- What you're working on: "Building a [specific thing] this week that [does what]. Always satisfying when [outcome]."
- Tool/approach you use: "For [service type], I've been using [tool/technique]. Cuts the time from [X] to [Y]."

CRITICAL: Must mention a SPECIFIC service you offer. Not generic "automation" - say "Salesforce integration" or "Slack bot" or "competitor price scraper".

REQUIRED CTA (subtle, pick one):
- "DM me if you're dealing with something similar"
- "Happy to chat if this sounds familiar"
- "If you're stuck on [problem], feel free to reach out"
- "Link in bio if you need help with [service type]"
- "Always happy to talk shop about [topic] - DMs open"

The CTA is REQUIRED. Without it, the post is just a story with no business value. Keep it casual and inviting, not salesy.""",
                "length": "medium",
            },
            "engagement": {
                "guidance": """Start a conversation. Ask something interesting:
                - What's your take on [topic]?
                - Curious what tools/approaches others use for [thing]
                - What's been your experience with [thing]?
                - Hot take followed by 'thoughts?'
                Keep it SHORT. Questions work best when they're easy to answer.""",
                "length": "short",
            },
            "story": {
                "guidance": """Tell a story from your work. Options:
                - A debugging session that taught you something
                - A client situation that was memorable
                - How a project went sideways (and what you learned)
                - A win worth celebrating
                - Something funny/surprising that happened
                Make it specific - names, numbers, details make stories real.""",
                "length": "long",
            },
            "quick_tip": {
                "guidance": """Share one actionable tip. Keep it punchy:
                - A specific technique that saves time
                - A tool or trick most people don't know
                - A one-liner or code pattern
                - A debugging trick
                Short and immediately useful.""",
                "length": "short",
            },
        }

        config = post_type_configs.get(post_type, post_type_configs["random"])

        # Length settings
        length_settings = {
            "short": {"words": "50-100 words", "max_tokens": 250},
            "medium": {"words": "150-250 words", "max_tokens": 500},
            "long": {"words": "300-450 words", "max_tokens": 700},
        }
        length = length_settings.get(config["length"], length_settings["medium"])

        # Select random opening style
        opening_style = random.choice(LINKEDIN_OPENING_STYLES)

        smart_prompt = f"""You're Jesse, a freelance developer who builds automation and API integrations. Create a LinkedIn post from scratch.

IMPORTANT: The current year is 2026.

STEP 1 - COME UP WITH AN IDEA:
{config['guidance']}

Think of something FRESH - not generic. Draw from real developer experiences. The idea should feel like something that actually happened or a real opinion you hold.

STEP 2 - WRITE THE POST:

⚠️ OPENING STYLE: {opening_style['style'].upper()}
{opening_style['instruction']}

LENGTH: {length['words']} - STRICT. Stay focused. No tangents or digressions.

YOUR VOICE:
- ALWAYS use "I" never "we" - you're an independent freelancer, not a company
- Direct and confident. You know your stuff.
- Conversational but professional. Not trying to be quirky.
- Share insights, not complaints or rants.
- Real opinions backed by experience.

FORMAT RULES:
- Short paragraphs (1-3 sentences each)
- Line breaks between paragraphs for readability
- Get to the point fast. Every sentence should add value.

HASHTAGS:
- Usually SKIP hashtags entirely (preferred)
- If using one: weave it naturally INTO a sentence, never at the end
- Example: "Working with the Salesforce API taught me..." NOT "...learned a lot #salesforce #api"
- NEVER end with a hashtag block

ENDINGS (vary these):
- A question (short, easy to answer)
- Just end (no call to action needed)
- A one-line takeaway
- What you're trying next

BANNED:
- Starting with "So," or "Okay, so" or "So I was"
- "I'm excited to..." / "Let me share..." / "Just wanted to..."
- "hoo boy" / "oh boy" / "welp"
- Drama phrases: "special place in hell", "nightmare", "disaster"
- Emoji spam 🚀🔥💯
- "What do you think? Let me know in the comments!"
- Corporate buzzwords: leverage, synergy, game-changer
- Hashtags at the end of the post

OUTPUT FORMAT:
Return your response as JSON with this structure:
{{"idea": "Brief 5-10 word description of the post topic", "content": "The full LinkedIn post text"}}

ONLY output the JSON. No explanation before or after."""

        messages = [
            {"role": "user", "content": smart_prompt},
        ]

        response = await self._call_openrouter(messages, max_tokens=length["max_tokens"], temperature=0.95)

        if not response:
            return None

        # Parse JSON response
        try:
            # Clean up response - sometimes AI adds markdown code blocks
            cleaned = response.strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:]
            if cleaned.startswith("```"):
                cleaned = cleaned[3:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            cleaned = cleaned.strip()

            # Fix literal newlines inside JSON string values (common AI mistake)
            # The model sometimes puts actual \n chars inside strings instead of \\n
            import re
            def escape_newlines_in_strings(match):
                # Escape actual newlines within the matched string value
                return match.group(0).replace('\n', '\\n')
            # Match JSON string values (content between quotes, handling escaped quotes)
            cleaned = re.sub(r'"(?:[^"\\]|\\.)*"', escape_newlines_in_strings, cleaned)

            result = json.loads(cleaned)
            return {
                "idea": result.get("idea", "Generated post"),
                "content": result.get("content", response).replace('\\n', '\n'),  # Restore newlines for display
                "post_type": post_type,
            }
        except json.JSONDecodeError:
            # If JSON parsing fails, return the whole response as content
            return {
                "idea": f"{post_type.replace('_', ' ').title()} post",
                "content": response,
                "post_type": post_type,
            }


# Singleton
_generator: Optional[ResponseGenerator] = None


def get_generator() -> ResponseGenerator:
    """Get or create generator instance."""
    global _generator
    if _generator is None:
        _generator = ResponseGenerator()
    return _generator
