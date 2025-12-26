# FeedbackPulse

**Review & Survey Analyzer**

Aggregate feedback from all sources, analyze sentiment, detect trends, and get alerted on negative spikes.

## Problem Statement

Customer feedback is scattered across multiple platforms:
- Google Reviews
- Yelp
- Custom surveys
- Support tickets

There's no unified view to understand overall customer sentiment, identify emerging issues, or track trends over time.

## Solution

FeedbackPulse aggregates reviews from all sources into a single platform, providing:

- **Unified Review Dashboard**: See all feedback in one place
- **Sentiment Analysis**: Automatic classification (positive/neutral/negative)
- **Keyword Extraction**: Identify common themes and issues
- **Trend Detection**: Track changes in ratings and sentiment over time
- **Smart Alerts**: Get notified when negative reviews spike or trends decline

## Tech Stack

- **Backend**: Python, FastAPI
- **AI/ML**: OpenAI GPT (with keyword-based fallback)
- **APIs**: Google Places API, Yelp Fusion API
- **Deployment**: Docker, Docker Compose

## Features

### Core Features
- Multi-source review aggregation (Google, Yelp, surveys, tickets)
- AI-powered sentiment analysis with confidence scores
- Keyword and phrase extraction
- Trend detection (rating, sentiment, volume)
- Automatic alert generation
- Demo mode for testing without API keys

### API Endpoints

**Reviews**
- `GET /reviews/` - Fetch all reviews from configured sources
- `GET /reviews/{source}` - Fetch reviews from specific source
- `GET /reviews/stats/summary` - Get review statistics

**Analysis**
- `GET /analysis/keywords` - Extract top keywords
- `GET /analysis/phrases` - Find common phrases
- `GET /analysis/sentiment-breakdown` - Sentiment by source

**Alerts**
- `GET /alerts/trends` - Get trend analysis
- `GET /alerts/check-alerts` - Check for active alerts
- `GET /alerts/negative-reviews` - Get recent negative reviews

## Quick Start

### Using Docker (Recommended)

```bash
# Clone repository
git clone <repo-url>
cd feedbackpulse

# Copy environment file
cp .env.example .env

# Start in demo mode (no API keys required)
docker-compose up -d

# View logs
docker-compose logs -f

# Open browser
open http://localhost:8000/docs
```

### Local Development

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Run application
uvicorn src.main:app --reload

# Open browser
open http://localhost:8000/docs
```

## Configuration

Edit `.env` file to configure:

```bash
# Enable/disable demo mode
DEMO_MODE=true

# Add API keys (optional)
OPENAI_API_KEY=your_key_here
GOOGLE_PLACES_API_KEY=your_key_here
YELP_API_KEY=your_key_here

# Adjust alert thresholds
ALERT_NEGATIVE_THRESHOLD=5
ALERT_TREND_CHANGE_PERCENT=20.0
```

## Demo Mode

Demo mode is enabled by default and provides:
- 8 sample reviews (5 from Google, 3 from Yelp)
- Mix of positive, neutral, and negative sentiment
- Full sentiment analysis with keyword-based fallback
- All features work without external API keys

Perfect for testing and demonstration purposes!

## API Keys Setup

### OpenAI API
1. Sign up at https://platform.openai.com
2. Generate API key
3. Add to `.env`: `OPENAI_API_KEY=sk-...`

**Fallback**: If not provided, uses keyword-based sentiment analysis

### Google Places API
1. Create project at https://console.cloud.google.com
2. Enable Places API
3. Create credentials (API key)
4. Add to `.env`: `GOOGLE_PLACES_API_KEY=...`

### Yelp Fusion API
1. Create app at https://www.yelp.com/developers
2. Get API key
3. Add to `.env`: `YELP_API_KEY=...`

## Usage Examples

### Fetch Reviews (Demo Mode)

```bash
# Get all demo reviews with sentiment analysis
curl http://localhost:8000/reviews/

# Get review summary
curl http://localhost:8000/reviews/stats/summary
```

### Extract Keywords

```bash
# Get top 10 keywords
curl http://localhost:8000/analysis/keywords

# Get keywords from negative reviews only
curl "http://localhost:8000/analysis/keywords?sentiment_filter=negative"
```

### Check for Alerts

```bash
# Check all alerts
curl http://localhost:8000/alerts/check-alerts

# Get trend analysis
curl http://localhost:8000/alerts/trends

# Get recent negative reviews
curl http://localhost:8000/alerts/negative-reviews?days=7
```

### With Real APIs

```bash
# Fetch Google reviews
curl "http://localhost:8000/reviews/?google_place_id=ChIJN1t_tDeuEmsRUsoyG83frY4"

# Fetch Yelp reviews
curl "http://localhost:8000/reviews/?yelp_business_id=WavvLdfdP6g8aZTtbBQHTw"
```

## Testing

```bash
# Run tests
pytest

# Run with coverage
pytest --cov=src --cov-report=html

# Run specific test
pytest tests/test_sentiment.py -v
```

## Production Deployment

### Environment Variables

```bash
DEMO_MODE=false
DEBUG=false
OPENAI_API_KEY=your_production_key
GOOGLE_PLACES_API_KEY=your_production_key
YELP_API_KEY=your_production_key
DATABASE_URL=postgresql://user:pass@host:5432/feedbackpulse
```

### Docker Production Build

```bash
# Build production image
docker build -t feedbackpulse:prod .

# Run with production config
docker run -d \
  --name feedbackpulse \
  -p 8000:8000 \
  --env-file .env.production \
  feedbackpulse:prod
```

### Health Check

```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "demo_mode": false,
  "services": {
    "openai": "available",
    "google_places": "available",
    "yelp": "available"
  }
}
```

## Architecture

```
feedbackpulse/
├── src/
│   ├── main.py              # FastAPI application
│   ├── config.py            # Settings & configuration
│   ├── models/              # Pydantic models
│   │   ├── review.py
│   │   ├── sentiment.py
│   │   └── trend.py
│   ├── services/            # Business logic
│   │   ├── google_reviews.py
│   │   ├── yelp.py
│   │   ├── sentiment.py
│   │   ├── keyword_extractor.py
│   │   └── trend_detector.py
│   ├── api/                 # API endpoints
│   │   ├── reviews.py
│   │   ├── analysis.py
│   │   └── alerts.py
│   └── aggregator/          # Multi-source collector
│       └── collector.py
└── tests/                   # Test suite
```

## Roadmap

### Phase 1 (Current)
- ✅ Multi-source review aggregation
- ✅ Sentiment analysis
- ✅ Keyword extraction
- ✅ Trend detection
- ✅ Alert system
- ✅ Demo mode

### Phase 2
- [ ] Database persistence (PostgreSQL)
- [ ] Historical trend tracking
- [ ] Email/webhook alerts
- [ ] React frontend dashboard
- [ ] Custom survey integration
- [ ] Support ticket integration

### Phase 3
- [ ] Real-time monitoring
- [ ] Automated response suggestions
- [ ] Competitor analysis
- [ ] Custom report generation
- [ ] Mobile app

## License

MIT License - see LICENSE file for details

## Contributing

Contributions welcome! Please open an issue or submit a pull request.

## Contact

For questions or support, please open an issue on GitHub.

---

**Built with FastAPI, OpenAI, and Python**
