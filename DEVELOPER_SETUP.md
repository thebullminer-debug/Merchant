# CollectiMarket - Developer Setup

## Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Git

## Local Setup
```bash
# Clone repository
git clone [your-github-repo-url]
cd collectimarket

# Install dependencies
npm install

# Environment Variables
cp .env.example .env
# Add your DATABASE_URL and other secrets

# Database Setup
npm run db:push

# Start development server
npm run dev
```

## Database Schema
The project uses:
- PostgreSQL with Drizzle ORM
- Pre-seeded with categories and sample collectibles
- OHLCV price tracking system

## Architecture
- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Charts**: Chart.js for price visualization

## Key Features
- Stock exchange quality price charts
- Real-time price tracking
- Auction data collection system
- 22 luxury watches including $55M Graff Diamonds Hallucination

## API Endpoints
- `/api/collectibles` - Manage collectibles
- `/api/categories` - Product categories  
- `/api/ticks` - Price data ingestion
- `/api/candles` - OHLCV chart data

## Development Notes
- Uses shadcn/ui components
- TanStack Query for state management
- Wouter for routing
- Built-in dark mode support