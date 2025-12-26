# InvoiceBot

Automated receipt processing with OCR and AI-powered expense categorization. Upload or email receipts, get expense entries in QuickBooks/Xero.

## Problem

Small businesses photograph receipts and manually enter them into accounting software. It's tedious, error-prone, and often delayed until tax season panic.

## Solution

InvoiceBot uses OCR to extract text from receipts, AI to categorize and structure the data, and automatically creates expense entries in your accounting software.

## Features

- **Multiple input methods** - Upload, drag-drop, or email receipts
- **Smart extraction** - Vendor, amount, date, category auto-detected
- **Confidence scoring** - Low-confidence items flagged for review
- **Human review queue** - Verify before syncing to accounting
- **Multi-platform** - QuickBooks Online and Xero integration

## Tech Stack

- Python 3.11+
- FastAPI (web interface)
- Google Cloud Vision API (OCR)
- OpenAI GPT-4 (categorization)
- QuickBooks/Xero API
- SQLite (receipt archive)

## Quick Start

```bash
# Clone the repo
git clone https://github.com/itsjessedev/invoicebot.git
cd invoicebot

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy and configure environment
cp .env.example .env
# Edit .env with your API keys

# Run the application
python -m src.main
```

## Demo Mode

Run with sample receipts (no API keys needed):

```bash
DEMO_MODE=true python -m src.main
```

## Configuration

See `.env.example` for all options:

- Google Cloud Vision credentials
- OpenAI API key
- QuickBooks/Xero OAuth credentials
- Email inbox settings (for email-in receipts)

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Dashboard UI |
| `/api/receipts` | GET | List all receipts |
| `/api/receipts` | POST | Upload new receipt |
| `/api/receipts/{id}` | GET | Get receipt details |
| `/api/receipts/{id}/approve` | POST | Approve and sync |
| `/api/queue` | GET | Items pending review |

## Project Structure

```
invoicebot/
├── src/
│   ├── api/           # FastAPI routes
│   ├── services/      # OCR, AI, accounting integrations
│   ├── utils/         # Helpers, email processing
│   └── main.py        # Application entry
├── tests/             # Unit tests
├── uploads/           # Temporary upload storage
└── docker-compose.yml # Container deployment
```

## Workflow

1. **Upload** - Drag-drop receipt image or email to expenses@yourdomain.com
2. **Extract** - OCR reads text, AI identifies vendor/amount/date/category
3. **Review** - Low-confidence items appear in review queue
4. **Sync** - Approved expenses push to QuickBooks/Xero

## Results

> "Reduced expense entry time from 2 hours per week to 5 minutes. Our bookkeeper is thrilled."

## License

MIT
