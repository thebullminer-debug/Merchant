# CollectiMarket - Collectibles Price Tracking Platform

## Overview

CollectiMarket is a comprehensive price tracking platform for collectibles that functions like a stock market tracker for physical goods. The application aggregates real-time pricing data from multiple marketplaces and provides historical trends, market analytics, and price monitoring for watches, trading cards, vinyl records, and other collectible items. Users can track price movements, view market statistics, and make informed decisions about collectible investments.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client-side is built with React and TypeScript using Vite as the build tool. The application uses a modern component-based architecture with:
- **UI Framework**: Radix UI components with shadcn/ui styling system
- **Styling**: Tailwind CSS with dark theme support and custom CSS variables
- **State Management**: TanStack Query for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Charts**: Chart.js for price visualization and trend analysis
- **Component Structure**: Organized into pages, components, and UI primitives with clear separation of concerns

### Backend Architecture
The server follows a Node.js Express architecture with TypeScript:
- **Framework**: Express.js with middleware for JSON parsing, logging, and error handling
- **API Design**: RESTful endpoints organized by resource type (categories, collectibles, prices)
- **Data Layer**: Service-based architecture with storage abstraction and business logic separation
- **Database Access**: Drizzle ORM for type-safe database operations
- **Development Setup**: Vite integration for hot module replacement in development

### Database Design
PostgreSQL database with Drizzle ORM provides:
- **Schema Management**: Type-safe schema definitions with automatic TypeScript type generation
- **Data Models**: Users, categories, collectibles, price history, median prices, and watchlists
- **Indexing Strategy**: Performance optimization for search operations on names, categories, and brands
- **Price Tracking**: Separate tables for raw price data and calculated median prices with historical retention
- **Relationships**: Foreign key relationships between collectibles, categories, and price data

### Data Collection and Processing
The application includes automated data collection services:
- **Web Scraping**: Puppeteer-based scraper for eBay and other marketplace data
- **Price Calculation**: Service for computing median prices, percentage changes, and market trends
- **Data Validation**: Schema validation using Zod for input sanitization and type safety
- **Background Processing**: Scheduled tasks for daily price calculations and data aggregation

### Authentication and Security
While authentication components are present in the UI, the current implementation focuses on data aggregation and display. The architecture supports future authentication integration with:
- **Session Management**: Cookie-based session storage setup
- **User Management**: Database schema includes user tables and watchlist functionality
- **API Security**: Input validation and error handling throughout the API layer

## External Dependencies

### Database Infrastructure
- **PostgreSQL**: Primary database using Neon serverless PostgreSQL for scalable data storage
- **Drizzle ORM**: Type-safe database access layer with migration support
- **Connection Pooling**: Neon serverless connection management for optimal performance

### UI and Styling Libraries
- **Radix UI**: Comprehensive accessible component library for complex UI interactions
- **Tailwind CSS**: Utility-first CSS framework with custom design system
- **Lucide React**: Consistent icon library for UI elements
- **Chart.js**: Data visualization library for price charts and market analytics

### Development and Build Tools
- **Vite**: Fast build tool and development server with React plugin
- **TypeScript**: Type safety across the entire application stack
- **TanStack Query**: Server state management with caching and background refetching
- **Puppeteer**: Headless browser automation for web scraping marketplace data

### External Services Integration
- **eBay API**: Data scraping from eBay sold listings for price discovery
- **Multiple Marketplaces**: Architecture supports additional marketplace integrations
- **Replit Integration**: Development environment optimization with Replit-specific plugins and banners

The application is designed to scale with additional marketplace integrations and supports real-time price tracking across multiple collectible categories with comprehensive historical data retention and analysis capabilities.

# Replit Dependency Removal Instructions
🏠 Steps to Run CollectiMarket on Your PC (Without Replit)
## 1. Remove Replit-Specific Dependencies
In package.json, remove these lines:
```
"@replit/vite-plugin-cartographer": "^0.3.0",
"@replit/vite-plugin-runtime-error-modal": "^0.0.3",
```
In vite.config.ts, replace lines 1-17 with:
```
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
export default defineConfig({
  plugins: [react()],
  // ... rest stays the same
```
## 2. Set Up Local PostgreSQL Database
Install PostgreSQL on your PC:

**Windows:** (Download from postgresql.org)

**Mac:** ```brew install postgresql```

**Linux:** ```sudo apt install postgresql```

Create a database:
```
createdb collectimarket
```
Set environment variable in .env file:
```
DATABASE_URL=postgresql://username:password@localhost:5432/collectimarket
NODE_ENV=development
```
## 3. Install & Run
On your PC:

### Install dependencies
```npm install```
### Push database schema
```npm run db:push```
### Start development
```npm run dev```

That's it! Your CollectiMarket will run on http://localhost:5000

## 4. Optional: Replace Neon with Local PostgreSQL
If you want to remove Neon dependency entirely:

In server/db.ts, you might need to replace:
```
import { neon } from '@neondatabase/serverless';
```
With standard PostgreSQL client:
```
import pg from 'pg';
```
## 📋 Summary:
* Remove 2 Replit plugins from package.json
* Update vite.config.ts (remove Replit imports)
* Install PostgreSQL locally
* Create .env file with DATABASE_URL
* Run npm install && npm run db:push && npm run dev

Your CollectiMarket will be 100% independent and run perfectly on your PC!


