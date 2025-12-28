# FinBoard 📊

> A powerful, customizable financial dashboard for real-time market data visualization and portfolio management.

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-16.1-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19.2-61dafb?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38bdf8?style=flat-square&logo=tailwind-css)
![Zustand](https://img.shields.io/badge/Zustand-5.0-orange?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

[Demo](#) • [Documentation](#-usage) • [Features](#-features) • [API Setup](#-api-integration-examples)

</div>

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#-features)
- [Demo & Screenshots](#-demo--screenshots)
- [Getting Started](#-getting-started)
- [API Integration Examples](#-api-integration-examples)
- [Usage Guide](#-usage)
- [Architecture](#️-architecture)
- [Security](#-security)
- [Performance](#-performance)
- [Development](#-development)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

## Overview

FinBoard is a **modern, production-ready financial dashboard builder** that empowers users to create custom real-time finance monitoring dashboards by connecting to various financial APIs. Built with Next.js 16 and TypeScript, it provides enterprise-grade security, real-time data visualization, and an intuitive drag-and-drop interface.

### Why FinBoard?

- 🎯 **Zero Configuration**: Start monitoring your financial data in minutes
- 🔌 **Universal API Support**: Connect to any REST API - Alpha Vantage, Finnhub, Yahoo Finance, or custom endpoints
- 🎨 **Fully Customizable**: Build your perfect dashboard with drag-and-drop widgets
- 🔒 **Enterprise Security**: AES-256-GCM encryption for data at rest
- ⚡ **Real-Time Ready**: WebSocket and Socket.IO support for live updates
- 📱 **Responsive Design**: Works flawlessly on desktop, tablet, and mobile

## ✨ Features

### 🎯 Flexible Widget System

Build your perfect dashboard with three powerful widget types:

- **📊 Card Widgets**: Display key financial metrics and KPIs in an elegant card format

  - Watchlist tracking
  - Market gainers/losers
  - Performance indicators
  - Custom financial data cards

- **📋 Table Widgets**: Show detailed tabular data with advanced functionality

  - Sortable columns (click headers to sort)
  - Custom field selection
  - Responsive layout
  - Support for large datasets

- **📈 Chart Widgets**: Visualize time-series data with professional charts
  - **Line Charts**: Track price movements and trends
  - **Candlestick Charts**: OHLC (Open, High, Low, Close) visualization
  - Multiple time intervals (Daily, Weekly, Monthly)
  - Interactive tooltips and legends

### 🔌 Universal API Integration

Connect to any financial API with ease:

- **Flexible Endpoint Configuration**: Support for any REST API endpoint
- **Automatic Field Discovery**: AI-powered JSON structure analysis
- **Smart Type Inference**: Automatic detection of data types (string, number, date, nested objects)
- **Multiple Authentication Methods**:
  - 🔑 Bearer Token (OAuth 2.0)
  - 🔐 API Key (custom headers)
  - 👤 Basic Authentication (username/password)
  - 🌐 No Authentication (public endpoints)

**Supported APIs** (and many more):

- Alpha Vantage
- Finnhub
- Yahoo Finance
- IndianAPI
- Polygon.io
- Any custom REST API with JSON response

### ⚡ Real-Time Updates

Never miss a market movement:

- **🔴 WebSocket Support**: True real-time data streaming
- **🔵 Socket.IO Integration**: Bidirectional event-based communication
- **🔄 Smart Polling**: Configurable refresh intervals (1s to 24h)
- **♻️ Auto Reconnection**: Exponential backoff strategy for reliable connections
- **📡 Connection State Management**: Visual indicators for connection status
- **⚠️ Rate Limiting**: Intelligent API quota management

### 🎨 Customizable Experience

Design your dashboard your way:

- **🎯 Drag & Drop**: Intuitive widget repositioning with `react-grid-layout`
- **📐 Resizable Widgets**: Adjust widget size to fit your data
- **📱 Responsive Grid**: Adapts seamlessly to any screen size
- **🌓 Dark/Light Theme**: System-aware theme with manual toggle
- **🎨 Field Formatting**:
  - Currency (USD, EUR, GBP, etc.)
  - Percentages with custom precision
  - Decimal places control
  - Date formatting options

### 🔒 Enterprise Security

Your data is protected:

- **🔐 AES-256-GCM Encryption**: Military-grade encryption for localStorage
- **✅ Data Integrity**: Authentication tags prevent tampering
- **🔑 Secure Key Management**: Environment-based encryption keys
- **🛡️ No Server Storage**: All data stored locally and encrypted
- **🔒 API Key Protection**: Credentials stored securely

### 📦 Template Gallery

Get started instantly:

- **⚡ Quick Start Templates**: Pre-configured dashboards for common use cases
- **📊 Live Stock Quote Template**: Real-time stock monitoring
- **📈 Historical Data Template**: Time-series analysis charts
- **🎯 Custom Templates**: Save and share your own configurations
- **💾 Import/Export**:
  - Export widget configurations as encrypted JSON
  - Import and share dashboards across teams
  - Backup your entire dashboard setup

### 🎯 Advanced Features

- **🔍 JSON Explorer**: Interactive field tree for complex API responses
- **🏷️ Custom Naming**: User-defined widget titles and descriptions
- **🔄 API Endpoint Switching**: Change data sources without recreating widgets
- **📊 Data Caching**: Optimize API calls and reduce redundant requests
- **⚡ Lazy Loading**: Improved performance with code splitting
- **🎭 Loading States**: Comprehensive handling of loading, error, and empty states
- **🔔 Toast Notifications**: Real-time feedback for user actions

## 📸 Demo & Screenshots

### Dashboard Overview

_A fully customizable financial dashboard with real-time widgets_

### Widget Creation Wizard

_3-step process to connect and configure any financial API_

### Template Gallery

_Pre-built templates for instant dashboard setup_

> **Note**: Add screenshots of your application here to showcase the UI

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: 20.x or higher ([Download](https://nodejs.org/))
- **Package Manager**: npm, yarn, pnpm, or bun
- **API Key**: Get a free key from your preferred financial data provider

### Quick Start (5 minutes)

#### 1. Clone the repository

```bash
git clone https://github.com/ujjwallsrivastavaa/finboard.git
cd finboard
```

#### 2. Install dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

#### 3. Set up environment variables

Create a `.env.local` file in the root directory:

```env
# Required: 32-character encryption key for localStorage
# Generate with: openssl rand -hex 16
NEXT_PUBLIC_STORAGE_ENCRYPTION_KEY=your-32-character-encryption-key-here

# Optional: Default API configurations
NEXT_PUBLIC_DEFAULT_API_TIMEOUT=10000
```

**Generate your encryption key:**

```bash
# On macOS/Linux
openssl rand -hex 16

# On Windows (PowerShell)
[System.Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

#### 4. Run the development server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

#### 5. Open your browser

Navigate to [http://localhost:3000](http://localhost:3000) to see the application.

---

## 🔌 API Integration Examples

### Alpha Vantage (Recommended for Beginners)

**Free Tier**: 25 requests/day

1. **Get your API key**: [https://www.alphavantage.co/support/#api-key](https://www.alphavantage.co/support/#api-key)
2. **Example Endpoint**:
   ```
   https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=IBM&apikey=YOUR_API_KEY
   ```
3. **Widget Configuration in FinBoard**:
   - API Endpoint: Paste the URL above with your API key
   - Authentication Type: `No Authentication` (key in URL)
   - Refresh Interval: `30000` (30 seconds, respects rate limits)

### Finnhub

**Free Tier**: 60 calls/minute

1. **Get your API key**: [https://finnhub.io/register](https://finnhub.io/register)
2. **Example Endpoint**:
   ```
   https://finnhub.io/api/v1/quote?symbol=AAPL
   ```
3. **Widget Configuration**:
   - API Endpoint: `https://finnhub.io/api/v1/quote?symbol=AAPL`
   - Authentication Type: `API Key`
   - Header Name: `X-Finnhub-Token`
   - API Key: `YOUR_API_KEY`

### Polygon.io

**Free Tier**: 5 API calls/minute

1. **Get your API key**: [https://polygon.io/dashboard/signup](https://polygon.io/dashboard/signup)
2. **Example Endpoint**:
   ```
   https://api.polygon.io/v2/aggs/ticker/AAPL/prev?apiKey=YOUR_API_KEY
   ```
3. **Widget Configuration**:
   - API Endpoint: Paste URL with your API key
   - Authentication Type: `No Authentication` (key in URL)

### Using Sample Data (No API Key Required)

Perfect for testing and development:

1. **Stock Quote Data**:

   - Endpoint: `/data/stock-quote.json`
   - Authentication: None
   - Returns: Real-time quote format

2. **Historical Data**:
   - Endpoint: `/data/stock-historical.json`
   - Authentication: None
   - Returns: Time-series data for charts

### Custom API Setup

Connect any REST API:

```json
{
  "endpoint": "https://your-api.com/financial-data",
  "method": "GET",
  "authentication": {
    "type": "bearer",
    "token": "your-jwt-token"
  }
}
```

### Handling Rate Limits

**Best Practices**:

- ✅ Use refresh intervals longer than API minimums
- ✅ Alpha Vantage: Minimum 30 seconds (25 calls/day)
- ✅ Finnhub: Can poll every second (60/min limit)
- ✅ FinBoard automatically caches responses
- ✅ Error messages show when limits are reached

---

## 📖 Usage

### Creating a Widget

1. **Navigate to Dashboard**: Click "Get Started" or go to `/dashboard`

2. **Add Widget**: Click the "+" button to open the widget creation dialog

3. **Configure API Connection** (Step 1):

   - Enter widget title
   - Provide API endpoint URL
   - (Optional) Configure WebSocket URL for real-time updates
   - (Optional) Set polling refresh interval
   - (Optional) Add authentication credentials

4. **Select Fields** (Step 2):

   - Click "Test Connection" to discover available fields
   - Browse the hierarchical field tree
   - Select fields to display in your widget
   - Reorder fields via drag & drop

5. **Format Fields** (Step 3):

   - Choose display format for each field (currency, percentage, decimals)
   - Customize decimal places
   - Configure field-specific settings

6. **Save**: Your widget appears on the dashboard with live data

### Using Templates

1. Click the "Templates" button on the dashboard
2. Browse available templates (Live Stock Quote, Historical Data, etc.)
3. Select a template to instantly add pre-configured widgets
4. Edit any widget to customize for your APIs

### Managing Widgets

- **Move**: Drag widgets to reposition
- **Resize**: Drag widget corners to resize
- **Edit**: Click the edit icon to modify configuration
- **Delete**: Click the delete icon to remove
- **Export**: Save widget configuration as JSON
- **Import**: Load widget configurations from JSON files

## 🏗️ Architecture

### Tech Stack

| Category         | Technology                      |
| ---------------- | ------------------------------- |
| Framework        | Next.js 16 (App Router)         |
| Language         | TypeScript 5                    |
| UI Library       | React 19                        |
| State Management | Zustand with persist middleware |
| Styling          | Tailwind CSS 4                  |
| Components       | Radix UI + shadcn/ui            |
| Forms            | React Hook Form + Zod           |
| Charts           | lightweight-charts              |
| Real-time        | Socket.IO Client                |
| Layout           | react-grid-layout               |
| Animations       | Framer Motion                   |

### Project Structure

```
finboard/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Landing page
│   ├── layout.tsx                # Root layout
│   ├── globals.css               # Global styles
│   └── dashboard/
│       └── page.tsx              # Main dashboard page
├── components/
│   ├── AddWidgetDialog/          # Multi-step widget creation wizard
│   │   ├── index.tsx             # Main dialog component
│   │   ├── steps/                # Wizard steps (Config, Fields, Formatting)
│   │   └── components/           # Field selectors and formatters
│   ├── TemplateGallery/          # Pre-built dashboard templates
│   ├── widgets/                  # Widget implementations
│   │   ├── Card.tsx              # Card widget
│   │   ├── Table.tsx             # Table widget
│   │   └── charts/               # Chart widgets
│   ├── ui/                       # Reusable UI components (shadcn)
│   ├── ThemeProvider.tsx         # Theme context provider
│   └── ThemeToggle.tsx           # Dark/Light mode toggle
├── lib/
│   ├── services/                 # Business logic
│   │   ├── apiService.ts         # API fetching, polling, WebSocket
│   │   └── fieldDiscoveryService.ts  # Field analysis and tree building
│   ├── store/                    # Zustand stores
│   │   ├── useDashboardStore.ts  # Dashboard state management
│   │   └── useThemeStore.ts      # Theme preferences
│   ├── types/                    # TypeScript definitions
│   │   ├── widget.ts             # Widget types
│   │   ├── field.ts              # Field types
│   │   ├── api.ts                # API types
│   │   ├── dashboard.ts          # Dashboard types
│   │   └── index.ts              # Type exports
│   ├── utils/                    # Utility functions
│   │   ├── encryption.ts         # AES-256-GCM encryption
│   │   ├── dataTransform.ts      # Data flattening and transformation
│   │   └── formatters.ts         # Value formatting utilities
│   ├── constants/                # Configuration constants
│   ├── templates/                # Dashboard templates
│   └── hooks/                    # Custom React hooks
├── public/
│   └── data/                     # Sample JSON data files
└── [config files]                # Next.js, TypeScript, Tailwind configs
```

## 🔐 Security

### Encryption

FinBoard uses AES-256-GCM encryption to secure all data stored in localStorage:

- **Algorithm**: AES-256-GCM (Galois/Counter Mode)
- **Key Size**: 256 bits (32 bytes)
- **IV**: Random 12-byte initialization vector per encryption
- **Authentication**: Built-in authentication tags for integrity verification

### Key Management

The encryption key must be set via environment variable:

```bash
# Generate a secure key
openssl rand -hex 16

# Add to .env.local
NEXT_PUBLIC_STORAGE_ENCRYPTION_KEY=<your-generated-key>
```

⚠️ **Important**:

- Keep your encryption key secure
- Never commit `.env.local` to version control
- Changing the key will invalidate existing stored data

## 🧪 Development

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

### Type Safety

The project maintains strict TypeScript configuration:

- All components are fully typed
- Discriminated unions for widget configs
- Runtime validation with Zod schemas
- Type guards for safe narrowing

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

**Built with ❤️ using Next.js and TypeScript**

Created by Ujjwal Srivastava

- GitHub: [@ujjwallsrivastavaa](https://github.com/ujjwallsrivastavaa)
- LinkedIn: [Ujjwal Srivastava](https://linkedin.com/in/ujjwallsrivastavaa)

</div>
