# 🚀 Micro-Commute Optimizer

> **AI-Powered Route Planning for Urban Commuters**

An intelligent web application that transforms natural language descriptions of your daily schedule into optimized multi-stop routes. Built with Next.js, TypeScript, and advanced AI integration, this tool helps urban commuters navigate complex itineraries efficiently.

![Micro-Commute Optimizer](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![Next.js](https://img.shields.io/badge/Next.js-14.0.0-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.2.0-blue)
![AI Powered](https://img.shields.io/badge/AI-Powered-purple)

## ✨ Features

### 🧠 **Natural Language Processing**
- **Smart Text Parsing**: Describe your day in plain English
- **Constraint Extraction**: Automatically identifies locations, times, and preferences
- **Time Window Management**: Handles complex scheduling requirements

### 🗺️ **Advanced Route Optimization**
- **Multi-Modal Transportation**: Supports driving, transit, and walking
- **Greedy Algorithm**: Fast initial route generation
- **2-Opt Improvement**: Advanced optimization for better solutions
- **Real-time Geocoding**: Precise location mapping with fallback systems

### 🎯 **Intelligent Planning**
- **Multiple Alternatives**: Faster and cheaper route options
- **Preference Scoring**: Customizable mode priorities and constraints
- **Feasibility Analysis**: Automatic detection of scheduling conflicts
- **Interactive Maps**: Visual route representation with Leaflet

### 🎨 **Modern UI/UX**
- **Responsive Design**: Beautiful gradient interfaces with Tailwind CSS
- **Real-time Feedback**: Loading states and error handling
- **Interactive Components**: Drag-and-drop stop editing
- **Mobile-First**: Optimized for all device sizes

## 🛠️ Tech Stack

### **Frontend**
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **React Leaflet** - Interactive mapping
- **Zod** - Runtime type validation

### **Backend & APIs**
- **Next.js API Routes** - Serverless functions
- **Replicate AI** - Natural language processing
- **Mapbox Geocoding** - Location services
- **OpenRouteService** - Routing calculations

### **Algorithms & Optimization**
- **Greedy Algorithm** - Initial route construction
- **2-Opt Improvement** - Route optimization
- **Preference Scoring** - Multi-criteria decision making
- **Travel Time Matrix** - Efficient distance calculations

### **Development Tools**
- **Vitest** - Unit testing framework
- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixes

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Mapbox API key (optional, for enhanced geocoding)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/micro-commute-optimizer.git
   cd micro-commute-optimizer
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   npm run install-deps
   ```

3. **Environment setup**
   ```bash
   npm run setup
   ```
   This will create a `.env.local` file with required environment variables.

4. **Configure API keys** (optional)
   ```bash
   # Add to .env.local
   MAPBOX_TOKEN=your_mapbox_token_here
   REPLICATE_API_TOKEN=your_replicate_token_here
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📖 Usage Examples

### Example Input
```
I leave from 285 Yonge St at 2:40 pm, pick up my sister at Jarvis Collegiate around 3:15 (not later than 3:25), then No Frills for 20 minutes, prefer subway, and be home near Donlands by 6.
```

### Generated Output
- **Optimized Route**: Multi-stop itinerary with precise timing
- **Transportation Modes**: Automatic mode selection based on preferences
- **Alternative Options**: Faster (driving-focused) and cheaper (transit-focused) routes
- **Interactive Map**: Visual representation with markers and route lines
- **Feasibility Analysis**: Automatic detection of scheduling conflicts

## 🏗️ Architecture

### **Component Structure**
```
components/
├── ChatBox.tsx          # Natural language input
├── StopsEditor.tsx      # Interactive stop management
├── PlanCard.tsx         # Route display and alternatives
├── MapView.tsx          # Interactive mapping
└── PreferenceToggles.tsx # User preference controls
```

### **API Routes**
```
app/api/
├── parse/route.ts       # Natural language processing
├── plan/route.ts        # Route optimization
├── explain/route.ts     # AI-powered explanations
└── config/route.ts      # Configuration management
```

### **Core Libraries**
```
lib/
├── schema.ts            # Type definitions and validation
├── optimize/            # Route optimization algorithms
│   ├── greedy.ts        # Greedy algorithm implementation
│   └── twoOpt.ts        # 2-opt improvement algorithm
├── routing/             # Transportation routing
│   ├── mapbox.ts        # Mapbox integration
│   └── ors.ts           # OpenRouteService integration
├── geocoding.ts         # Location services
├── scoring.ts           # Preference scoring system
└── replicate.ts         # AI integration
```

## 🧪 Testing

Run the test suite:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

## 🚀 Deployment

### **Vercel (Recommended)**
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### **Manual Deployment**
```bash
npm run build
npm start
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### **Development Workflow**
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📊 Performance

- **Route Generation**: < 2 seconds for typical urban routes
- **Geocoding**: < 500ms per location with caching
- **Map Rendering**: Optimized with dynamic imports
- **Bundle Size**: < 500KB gzipped

## 🔧 Configuration

### **Environment Variables**
```bash
# Required
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional (for enhanced features)
MAPBOX_TOKEN=your_mapbox_token
REPLICATE_API_TOKEN=your_replicate_token
ROUTING_PROVIDER=ors  # or 'mapbox'
```

### **Customization Options**
- Transportation mode preferences
- Optimization algorithm parameters
- UI theme and styling
- API provider selection

## 📈 Roadmap

- [ ] **Real-time Transit Data**: Integration with GTFS feeds
- [ ] **Machine Learning**: Personalized route recommendations
- [ ] **Mobile App**: React Native implementation
- [ ] **Offline Support**: Service worker for offline functionality
- [ ] **Multi-language**: Internationalization support
- [ ] **API Access**: Public API for third-party integrations

## 🐛 Known Issues

- Geocoding accuracy depends on location name specificity
- Transit routing requires additional API configuration
- Mobile map performance can be improved with WebGL rendering

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenStreetMap** contributors for map data
- **Mapbox** for geocoding services
- **Replicate** for AI model hosting
- **Leaflet** community for mapping components

## 📞 Support

- **Documentation**: [Wiki](https://github.com/yourusername/micro-commute-optimizer/wiki)
- **Issues**: [GitHub Issues](https://github.com/yourusername/micro-commute-optimizer/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/micro-commute-optimizer/discussions)

---

<div align="center">

**Built with ❤️ for urban commuters**

[⭐ Star this repo](https://github.com/yourusername/micro-commute-optimizer) • [🐛 Report Bug](https://github.com/yourusername/micro-commute-optimizer/issues) • [💡 Request Feature](https://github.com/yourusername/micro-commute-optimizer/issues)

</div>