# Tech Analyst

<p align="center">
  <img src="./assets/bright-data-logo.png" alt="Bright Data Logo" width="200"/>
</p>

<p align="center">
  <strong>AI-Powered Market Research & Competitive Intelligence Platform</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#demo">Demo</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#api-reference">API</a> •
  <a href="#contributing">Contributing</a>
</p>

---

## Overview

Tech Analyst is an AI-powered competitive intelligence tool that automatically discovers, analyzes, and ranks companies within any market sector. It leverages **Bright Data's web scraping infrastructure** and **Google Gemini AI** to provide comprehensive market analysis with industry-standard visualizations.

Enter a market sector (e.g., "AI Code Assistants", "Cloud Database Providers"), and Tech Analyst will:

1. **Discover** relevant companies through intelligent search queries
2. **Extract** pricing, documentation, and company information from their websites
3. **Score** companies on feature depth, innovation, positioning, and pricing maturity
4. **Visualize** results using Gartner Magic Quadrant, Forrester Wave, and GigaOm Radar charts

---

## Demo

<p align="center">
  <img src="./assets/screenshot.png" alt="Tech Analyst UI Screenshot" width="800"/>
</p>

---

## Features

- **Automated Company Discovery** — AI-generated search queries find relevant companies in any market sector
- **Intelligent Web Extraction** — Automatically scrapes pricing pages, documentation, and about sections
- **Multi-Factor Scoring** — Algorithmic evaluation based on features, innovation, market positioning, and pricing
- **Industry-Standard Charts** — Interactive Gartner Magic Quadrant, Forrester Wave, and GigaOm Radar visualizations
- **Session History** — Save and revisit previous market analyses
- **CSV Export** — Download comprehensive analysis reports
- **Real-time Progress** — Live streaming updates as analysis progresses
- **Rate Limiting** — Built-in IP-based usage limits (5 free analyses per day)

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 16, React 19, Tailwind CSS 4, Recharts |
| **Backend** | Next.js API Routes, TypeScript |
| **AI/ML** | LangChain, LangGraph, Google Gemini 2.5 Flash |
| **Web Scraping** | Bright Data MCP (Model Context Protocol) |
| **Database** | MongoDB |
| **UI Components** | Radix UI, Lucide Icons |

---

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB instance (local or Atlas)
- [Bright Data API Token](https://brightdata.com/)
- [Google AI API Key](https://aistudio.google.com/)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/tech-analyst.git
cd tech-analyst

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local
```

### Environment Variables

Create a `.env.local` file with the following:

```env
# Bright Data API (Required)
BRIGHT_DATA_API_TOKEN=your_bright_data_token
BRIGHT_DATA_MCP_URL=https://mcp.brightdata.com/mcp

# Google AI (Required)
GOOGLE_AI_API_KEY=your_google_ai_key

# MongoDB (Required)
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/tech-analyst

# Debug flags (Optional)
DISCOVERY_DEBUG=false
EXTRACTION_DEBUG=false
SYNTHESIS_DEBUG=false
ORCHESTRATION_DEBUG=false
ENRICHMENT_DEBUG=false

# Feature flags (Optional)
USE_RECHARTS=true
```

### Database Setup

```bash
# Test MongoDB connection
npm run test:mongo

# Initialize database indexes
npm run init:db
```

### Running the Application

```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

Access the application at `http://localhost:3000/market-analyst`

---

## Architecture

### Analysis Pipeline

Tech Analyst uses a **LangGraph state machine** to orchestrate a 5-stage analysis pipeline:

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Input                                │
│                    "AI Code Assistants"                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  1. DISCOVERY                                                    │
│  ├─ Generate search queries via AI                              │
│  ├─ Execute searches via Bright Data                            │
│  ├─ Extract company leads from results                          │
│  └─ Deduplicate to ~30 unique companies                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. ENRICHMENT                                                   │
│  ├─ Validate company information                                │
│  └─ Enrich with additional metadata                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. EXTRACTION                                                   │
│  ├─ Scrape pricing pages, docs, about sections                  │
│  ├─ Concurrent processing (max 90 jobs)                         │
│  ├─ Cache results in MongoDB (7-day TTL)                        │
│  └─ AI reflection on extracted content                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. SYNTHESIS                                                    │
│  ├─ Calculate multi-factor scores                               │
│  │   ├─ Feature Depth (10-100)                                  │
│  │   ├─ Innovation (40-95)                                      │
│  │   ├─ Positioning (45-80)                                     │
│  │   └─ Pricing Maturity (20-80)                                │
│  └─ Generate CSV export                                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  5. VISUALIZATION                                                │
│  ├─ Gartner Magic Quadrant                                      │
│  ├─ Forrester Wave                                              │
│  └─ GigaOm Radar                                                │
└─────────────────────────────────────────────────────────────────┘
```

### Project Structure

```
tech-analyst/
├── app/                      # Next.js App Router
│   ├── api/
│   │   ├── agents/           # Analysis pipeline endpoints
│   │   │   ├── orchestrator/ # Main entry point (rate-limited)
│   │   │   ├── discovery/    # Company discovery
│   │   │   ├── enrichment/   # Data enrichment
│   │   │   ├── extraction/   # Web scraping
│   │   │   ├── synthesis/    # Scoring & ranking
│   │   │   └── visualization/# Chart generation
│   │   └── sessions/         # Session management
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Main UI
│
├── components/               # React components
│   ├── charts/               # Visualization components
│   ├── company-card/         # Company result cards
│   ├── visualizations/       # Chart grid & modals
│   └── ui/                   # Reusable UI primitives
│
├── hooks/                    # Custom React hooks
│   ├── use-analysis.ts       # Main analysis orchestration
│   └── use-session-history.ts
│
├── lib/
│   ├── agents/               # AI agent logic
│   │   ├── orchestration/    # LangGraph state machine
│   │   ├── discovery/        # Search & extraction
│   │   ├── enrichment/       # Data validation
│   │   ├── extraction/       # Web scraping
│   │   ├── synthesis/        # Scoring algorithms
│   │   └── visualization/    # Chart generation
│   ├── db/                   # MongoDB utilities
│   ├── mcp/                  # Bright Data MCP client
│   └── rate-limiter.ts       # Usage limiting
│
└── scripts/                  # Database utilities
```

---

## API Reference

### Main Endpoint

#### `POST /api/agents/orchestrator`

Initiates a full market analysis. Supports Server-Sent Events (SSE) for real-time progress updates.

**Query Parameters:**
- `stream=true` — Enable SSE streaming

**Request Body:**
```json
{
  "marketSector": "AI Code Assistants"
}
```

**Response (SSE Events):**
```
event: discovery
data: {"status": "in_progress", "companies": [...]}

event: extraction
data: {"status": "in_progress", "progress": 15}

event: synthesis
data: {"status": "complete", "scores": [...]}

event: visualization
data: {"status": "complete", "charts": {...}}
```

### Other Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/agents/discovery` | POST | Company discovery only |
| `/api/agents/extraction` | POST | Web scraping/extraction |
| `/api/agents/synthesis` | POST | Scoring calculation |
| `/api/agents/visualization` | POST | Chart generation |
| `/api/sessions` | GET | List previous analyses |
| `/api/sessions/[id]` | GET | Retrieve specific analysis |

---

## Scoring Methodology

Companies are evaluated on four dimensions, each normalized to a 0-100 scale:

### Feature Depth (10-100)
- Counts distinct features and capabilities
- Rewards detailed feature descriptions

### Innovation (40-95)
- Evaluates scalability claims
- Checks for enterprise certifications (SOC2, ISO, HIPAA, GDPR, PCI)
- Counts third-party integrations

### Positioning (45-80)
| Model | Score |
|-------|-------|
| Managed Service | 80 |
| SaaS | 75 |
| Freemium | 70 |
| Open Source | 65 |
| License-based | 55 |

### Pricing Maturity (20-80)
- Based on number of pricing tiers
- Bonus for enterprise tier (+10)
- Bonus for free tier (+5)

---

## Visualizations

### Gartner Magic Quadrant
Plots companies on **Ability to Execute** vs **Completeness of Vision**, categorizing them as:
- **Leaders** — High execution, high vision
- **Challengers** — High execution, lower vision
- **Visionaries** — Lower execution, high vision
- **Niche Players** — Lower on both axes

### Forrester Wave
Evaluates vendors on **Current Offering**, **Strategy**, and **Market Presence** with weighted scoring.

### GigaOm Radar
Three-dimensional capability assessment showing innovation velocity and market maturity.

---

## Configuration

### Rate Limiting

By default, the API allows **5 analyses per IP address per day**. This can be adjusted in `lib/rate-limiter.ts`.

### Caching

Extracted company data is cached in MongoDB with a **7-day TTL** to improve performance and reduce API calls.

### Debug Mode

Enable verbose logging by setting environment variables:

```env
DISCOVERY_DEBUG=true
EXTRACTION_DEBUG=true
SYNTHESIS_DEBUG=true
ORCHESTRATION_DEBUG=true
ENRICHMENT_DEBUG=true
```

---

## Scripts

```bash
# Test MongoDB connectivity
npm run test:mongo

# Initialize database indexes
npm run init:db

# Set up rate limit TTL index
npx tsx scripts/setup-rate-limit-index.ts
```

---

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- [Bright Data](https://brightdata.com/) — Web scraping infrastructure and MCP integration
- [LangChain](https://langchain.com/) — LLM orchestration framework
- [Google Gemini](https://deepmind.google/technologies/gemini/) — AI model powering analysis
- [Recharts](https://recharts.org/) — React charting library

---

<p align="center">
  Built with Bright Data MCP
</p>
