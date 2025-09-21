# Micro-Commute Optimizer

An AI-powered commute optimization tool that learns from your daily routine and creates efficient multi-stop travel plans.

## Features

- **Natural Language Input**: Describe your day in plain English
- **AI-Powered Parsing**: Uses Replicate's LLM to extract constraints from text
- **Multi-Modal Routing**: Supports driving, walking, and transit options
- **Time Window Optimization**: Respects arrival time constraints
- **Alternative Plans**: Generates "Faster" and "Cheaper" alternatives
- **Preference Learning**: Adapts to your preferences over time
- **Real-time Map**: Visualize your optimized route

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **AI**: Replicate (Meta Llama 3.1 70B)
- **Routing**: OpenRouteService or Mapbox
- **Optimization**: Greedy algorithm with 2-opt refinement
- **Testing**: Vitest

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm or pnpm
- API keys for Replicate and routing provider

### Installation

1. **Install dependencies:**
   ```bash
   node install.js
   # or
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env.local` file in the root directory:
   ```env
   # Replicate API
   REPLICATE_API_TOKEN=your_replicate_token_here
   
   # Routing Provider (ors|mapbox)
   ROUTING_PROVIDER=ors
   
   # OpenRouteService API
   ORS_API_KEY=your_ors_key_here
   
   # Mapbox API (if using mapbox)
   MAPBOX_TOKEN=your_mapbox_token_here
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

4. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Getting API Keys

#### Replicate API
1. Sign up at [replicate.com](https://replicate.com)
2. Go to your account settings
3. Generate an API token
4. Add it to your `.env.local` file

#### OpenRouteService API
1. Sign up at [openrouteservice.org](https://openrouteservice.org)
2. Create a new project
3. Copy your API key
4. Add it to your `.env.local` file

#### Mapbox API (Alternative)
1. Sign up at [mapbox.com](https://mapbox.com)
2. Go to your account page
3. Create a new access token
4. Add it to your `.env.local` file

## Usage

### Example Input

Try this example to test the system:

> "I leave from 285 Yonge St at 2:40 pm, pick up my sister at Jarvis Collegiate around 3:15 (not later than 3:25), then No Frills for 20 minutes, prefer subway, and be home near Donlands by 6."

### How It Works

1. **Parse**: The AI extracts constraints from your natural language input
2. **Geocode**: Missing coordinates are resolved using the routing provider
3. **Optimize**: A greedy algorithm finds the best route considering time windows and preferences
4. **Refine**: 2-opt optimization improves the initial solution
5. **Explain**: AI generates a friendly summary with alternatives

### API Endpoints

- `POST /api/parse` - Convert text to structured constraints
- `POST /api/plan` - Generate optimized travel plan
- `POST /api/explain` - Create human-readable explanation

## Development

### Running Tests

```bash
npm test
# or
pnpm test
```

### Building for Production

```bash
npm run build
# or
pnpm build
```

### Project Structure

```
app/
  page.tsx                    # Main chat interface
  api/parse/route.ts         # Text parsing endpoint
  api/plan/route.ts          # Route optimization endpoint
  api/explain/route.ts       # Explanation generation endpoint
components/
  ChatBox.tsx               # Text input component
  StopsEditor.tsx           # Constraint editing interface
  PlanCard.tsx              # Results display
  MapView.tsx               # Route visualization
  PreferenceToggles.tsx     # User preference controls
lib/
  schema.ts                 # Zod type definitions
  replicate.ts              # AI client
  routing/                  # Routing provider implementations
  optimize/                 # Optimization algorithms
  scoring.ts                # Preference learning
```

## Algorithm Details

### Greedy Optimization

1. Start at origin or earliest time-constrained stop
2. Score each unvisited stop based on:
   - Travel time
   - Time window penalties (early/late arrival)
   - Mode preferences
   - Stop priority
3. Select the best-scoring stop
4. Repeat until all stops are visited

### 2-Opt Refinement

1. Try swapping segments of the route
2. Keep improvements that reduce total time
3. Repeat until no more improvements found

### Preference Learning

The system learns from your choices:
- Accepted plans influence future scoring
- Mode overrides adjust preference weights
- Dropped stops increase time sensitivity

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
1. Check the GitHub issues page
2. Create a new issue with detailed description
3. Include your environment setup and error logs
