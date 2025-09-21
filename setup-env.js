const fs = require('fs')
const path = require('path')

const envContent = `# Replicate API
REPLICATE_API_TOKEN=

# Routing Provider (ors|mapbox)
ROUTING_PROVIDER=ors

# OpenRouteService API
ORS_API_KEY=

# Mapbox API
MAPBOX_TOKEN=
`

const envPath = path.join(__dirname, '.env.local')

if (!fs.existsSync(envPath)) {
  fs.writeFileSync(envPath, envContent)
  console.log('✅ Created .env.local file')
  console.log('📝 Please add your API keys to .env.local')
} else {
  console.log('⚠️  .env.local already exists')
}

console.log('\n🚀 Next steps:')
console.log('1. Add your API keys to .env.local')
console.log('2. Run: npm install')
console.log('3. Run: npm run dev')
