#!/usr/bin/env python3
"""
Prospect Scraper - Comprehensive tool to find freelance prospects
Scrapes Reddit, Hacker News, and other sources
Outputs clean text files for easy review
"""

import requests
import json
import sys
import re
from datetime import datetime, timedelta
from pathlib import Path
from urllib.parse import quote

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
}

OUTPUT_DIR = Path(__file__).parent.parent / "prospects" / "scraped"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# ============= REDDIT =============

REDDIT_SEARCHES = [
    # r/smallbusiness - automation/spreadsheet pain points
    ('smallbusiness', 'spreadsheet OR excel OR automation'),
    ('smallbusiness', 'software OR app OR tool'),
    ('smallbusiness', 'developer OR programmer OR coder'),
    ('smallbusiness', 'outgrown OR manual OR tedious'),

    # r/startups - people seeking technical help
    ('startups', 'looking for developer'),
    ('startups', 'need technical cofounder'),
    ('startups', 'non-technical founder'),
    ('startups', 'MVP OR prototype'),

    # r/SaaS - founders building products
    ('SaaS', 'looking for developer'),
    ('SaaS', 'need help building'),
    ('SaaS', 'technical cofounder'),

    # r/entrepreneur - non-tech founders
    ('entrepreneur', 'need developer'),
    ('entrepreneur', 'looking for programmer'),
    ('entrepreneur', 'build my app'),
    ('entrepreneur', 'spreadsheet hell'),

    # r/webdev - clients looking for help
    ('webdev', 'client OR freelance'),

    # r/forhire - direct job posts (GOLD)
    ('forhire', '[Hiring]'),

    # r/freelance - people discussing needs
    ('freelance', 'looking for'),

    # r/Entrepreneur - more founder posts
    ('Entrepreneur', 'automation OR automate'),

    # r/ecommerce - store owners with tech needs
    ('ecommerce', 'developer OR integration OR automation'),

    # r/shopify - Shopify store owners
    ('shopify', 'developer OR custom OR help'),
]

def scrape_reddit_search(subreddit: str, query: str, limit: int = 15) -> list:
    """Search a subreddit for posts matching query"""
    url = f"https://www.reddit.com/r/{subreddit}/search.json"
    params = {
        'q': query,
        'restrict_sr': 'on',
        'sort': 'new',
        't': 'week',
        'limit': limit
    }

    try:
        resp = requests.get(url, headers=HEADERS, params=params, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            posts = []
            for child in data.get('data', {}).get('children', []):
                post = child.get('data', {})
                posts.append({
                    'title': post.get('title', ''),
                    'author': post.get('author', ''),
                    'url': f"https://reddit.com{post.get('permalink', '')}",
                    'score': post.get('score', 0),
                    'comments': post.get('num_comments', 0),
                    'created': datetime.fromtimestamp(post.get('created_utc', 0)).strftime('%Y-%m-%d'),
                    'selftext': post.get('selftext', '')[:500],
                    'source': f"r/{subreddit}"
                })
            return posts
        elif resp.status_code == 429:
            print(f"  Rate limited on r/{subreddit}")
            return []
        else:
            print(f"  r/{subreddit} returned {resp.status_code}")
            return []
    except Exception as e:
        print(f"  Error on r/{subreddit}: {e}")
        return []

def scrape_reddit_new(subreddit: str, limit: int = 25) -> list:
    """Get newest posts from a subreddit"""
    url = f"https://www.reddit.com/r/{subreddit}/new.json"
    params = {'limit': limit}

    try:
        resp = requests.get(url, headers=HEADERS, params=params, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            posts = []
            for child in data.get('data', {}).get('children', []):
                post = child.get('data', {})
                posts.append({
                    'title': post.get('title', ''),
                    'author': post.get('author', ''),
                    'url': f"https://reddit.com{post.get('permalink', '')}",
                    'score': post.get('score', 0),
                    'comments': post.get('num_comments', 0),
                    'created': datetime.fromtimestamp(post.get('created_utc', 0)).strftime('%Y-%m-%d'),
                    'selftext': post.get('selftext', '')[:500],
                    'source': f"r/{subreddit}"
                })
            return posts
        return []
    except Exception as e:
        print(f"  Error: {e}")
        return []

# ============= HACKER NEWS =============

def scrape_hn_search(query: str, limit: int = 20) -> list:
    """Search Hacker News via Algolia API"""
    url = "https://hn.algolia.com/api/v1/search_by_date"
    params = {
        'query': query,
        'tags': 'story',
        'hitsPerPage': limit,
        'numericFilters': f'created_at_i>{int((datetime.now() - timedelta(days=7)).timestamp())}'
    }

    try:
        resp = requests.get(url, params=params, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            posts = []
            for hit in data.get('hits', []):
                posts.append({
                    'title': hit.get('title', ''),
                    'author': hit.get('author', ''),
                    'url': f"https://news.ycombinator.com/item?id={hit.get('objectID', '')}",
                    'score': hit.get('points', 0),
                    'comments': hit.get('num_comments', 0),
                    'created': datetime.fromtimestamp(hit.get('created_at_i', 0)).strftime('%Y-%m-%d'),
                    'selftext': hit.get('story_text', '')[:500] if hit.get('story_text') else '',
                    'source': 'Hacker News'
                })
            return posts
        return []
    except Exception as e:
        print(f"  HN Error: {e}")
        return []

def scrape_hn_ask() -> list:
    """Get Ask HN posts - often people looking for help"""
    url = "https://hn.algolia.com/api/v1/search_by_date"
    params = {
        'tags': 'ask_hn',
        'hitsPerPage': 30,
        'numericFilters': f'created_at_i>{int((datetime.now() - timedelta(days=7)).timestamp())}'
    }

    try:
        resp = requests.get(url, params=params, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            posts = []
            for hit in data.get('hits', []):
                title = hit.get('title', '').lower()
                # Filter for relevant Ask HN posts
                if any(kw in title for kw in ['freelance', 'hire', 'developer', 'looking for', 'need help', 'build', 'automation']):
                    posts.append({
                        'title': hit.get('title', ''),
                        'author': hit.get('author', ''),
                        'url': f"https://news.ycombinator.com/item?id={hit.get('objectID', '')}",
                        'score': hit.get('points', 0),
                        'comments': hit.get('num_comments', 0),
                        'created': datetime.fromtimestamp(hit.get('created_at_i', 0)).strftime('%Y-%m-%d'),
                        'selftext': hit.get('story_text', '')[:500] if hit.get('story_text') else '',
                        'source': 'Hacker News (Ask HN)'
                    })
            return posts
        return []
    except Exception as e:
        print(f"  HN Ask Error: {e}")
        return []

# ============= OUTPUT =============

def format_prospects(posts: list, source: str) -> str:
    """Format posts into clean readable text"""
    lines = [f"# {source}"]
    lines.append(f"Scraped: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    lines.append(f"Found: {len(posts)} posts\n")

    for i, post in enumerate(posts, 1):
        lines.append(f"## {i}. {post['title']}")
        lines.append(f"- Author: {post['author']}")
        lines.append(f"- URL: {post['url']}")
        lines.append(f"- Date: {post['created']} | Score: {post['score']} | Comments: {post['comments']}")
        if post.get('selftext'):
            text = post['selftext'].replace('\n', ' ').strip()
            if text:
                lines.append(f"- Preview: {text[:300]}...")
        lines.append("")

    return '\n'.join(lines)

def dedupe_posts(posts: list) -> list:
    """Remove duplicate posts by URL"""
    seen = set()
    unique = []
    for post in posts:
        if post['url'] not in seen:
            seen.add(post['url'])
            unique.append(post)
    return unique

def is_competitor(post: dict) -> bool:
    """Check if post is from a competitor offering services"""
    title = post['title'].lower()

    # Direct competitor indicators
    competitor_patterns = [
        '[for hire]', '[offer]', 'for hire',
        'i will build', 'i will scrape', 'i will create',
        'my services', 'hire me', 'available for',
        'looking for clients', 'seeking clients'
    ]
    return any(p in title for p in competitor_patterns)

def score_prospect(post: dict) -> int:
    """Score a prospect based on likelihood of being a good lead"""
    # Competitors get score of 0
    if is_competitor(post):
        return 0

    score = 0
    title = post['title'].lower()
    text = (post.get('selftext', '') or '').lower()
    combined = title + ' ' + text

    # [HIRING] tag is gold
    if '[hiring]' in title:
        score += 30

    # High-value keywords
    high_value = ['spreadsheet', 'automation', 'automate', 'manual', 'tedious',
                  'looking for developer', 'need developer', 'need a developer',
                  'hire developer', 'find developer', 'where to hire',
                  'csv', 'excel', 'integration', 'api', 'script',
                  'non-technical', 'non technical', 'non-tech']
    for kw in high_value:
        if kw in combined:
            score += 10

    # Medium-value keywords
    mid_value = ['software', 'app', 'tool', 'help', 'build', 'create',
                 'cofounder', 'technical', 'programmer']
    for kw in mid_value:
        if kw in combined:
            score += 5

    # Engagement signals
    if post['comments'] > 10:
        score += 5
    if post['score'] > 20:
        score += 5

    # Recency bonus
    try:
        post_date = datetime.strptime(post['created'], '%Y-%m-%d')
        days_old = (datetime.now() - post_date).days
        if days_old <= 1:
            score += 10
        elif days_old <= 3:
            score += 5
    except:
        pass

    return score

def main():
    print("=" * 60)
    print("PROSPECT SCRAPER - Scanning all sources")
    print("=" * 60)

    all_posts = []

    # Reddit searches
    print("\n[REDDIT SEARCHES]")
    for subreddit, query in REDDIT_SEARCHES:
        print(f"  r/{subreddit}: {query}")
        posts = scrape_reddit_search(subreddit, query, limit=10)
        all_posts.extend(posts)

    # Reddit new posts from key subreddits
    print("\n[REDDIT NEW POSTS]")
    for sub in ['forhire', 'slavelabour']:
        print(f"  r/{sub} (newest)")
        posts = scrape_reddit_new(sub, limit=25)
        all_posts.extend(posts)

    # Hacker News
    print("\n[HACKER NEWS]")
    hn_queries = ['freelance developer', 'looking for developer', 'hire developer',
                  'automation', 'spreadsheet', 'need help building']
    for query in hn_queries:
        print(f"  HN: {query}")
        posts = scrape_hn_search(query, limit=10)
        all_posts.extend(posts)

    print("  HN: Ask HN posts")
    posts = scrape_hn_ask()
    all_posts.extend(posts)

    # Dedupe
    all_posts = dedupe_posts(all_posts)
    print(f"\n[TOTAL] {len(all_posts)} unique prospects")

    # Score and sort
    for post in all_posts:
        post['prospect_score'] = score_prospect(post)
    all_posts.sort(key=lambda x: x['prospect_score'], reverse=True)

    # Filter out competitors
    leads_only = [p for p in all_posts if not is_competitor(p)]
    print(f"[FILTERED] {len(all_posts) - len(leads_only)} competitor posts removed")

    # Save hot prospects (score >= 15)
    hot = [p for p in leads_only if p['prospect_score'] >= 15]
    if hot:
        output = format_prospects(hot, "HOT LEADS (Score >= 15, competitors excluded)")
        (OUTPUT_DIR / "HOT_LEADS.txt").write_text(output)
        print(f"[SAVED] {len(hot)} hot leads to HOT_LEADS.txt")

    # Save warm leads (score 5-14)
    warm = [p for p in leads_only if 5 <= p['prospect_score'] < 15]
    if warm:
        output = format_prospects(warm, "WARM LEADS (Score 5-14, competitors excluded)")
        (OUTPUT_DIR / "WARM_LEADS.txt").write_text(output)
        print(f"[SAVED] {len(warm)} warm leads to WARM_LEADS.txt")

    # Save all prospects
    output = format_prospects(all_posts, "ALL PROSPECTS (sorted by score)")
    (OUTPUT_DIR / "ALL_PROSPECTS.txt").write_text(output)
    print(f"[SAVED] All {len(all_posts)} prospects to ALL_PROSPECTS.txt")

    # Print top 5 for quick review
    print("\n" + "=" * 60)
    print("TOP 5 PROSPECTS")
    print("=" * 60)
    for i, post in enumerate(all_posts[:5], 1):
        print(f"\n{i}. [{post['prospect_score']} pts] {post['title'][:60]}...")
        print(f"   {post['url']}")

    return all_posts

if __name__ == "__main__":
    main()
