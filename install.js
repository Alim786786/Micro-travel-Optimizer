const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('🚀 Installing Micro-Commute Optimizer...')
console.log('========================================')

try {
  // Check if Node.js is available
  console.log('📦 Checking Node.js...')
  const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim()
  console.log(`✅ Node.js ${nodeVersion} found`)

  // Install dependencies
  console.log('📦 Installing dependencies...')
  execSync('npm install', { stdio: 'inherit' })
  console.log('✅ Dependencies installed')

  // Create .env.local if it doesn't exist
  const envPath = path.join(__dirname, '.env.local')
  if (!fs.existsSync(envPath)) {
    const envContent = `# Replicate API
REPLICATE_API_TOKEN=

# Routing Provider (ors|mapbox)
ROUTING_PROVIDER=ors

# OpenRouteService API
ORS_API_KEY=

# Mapbox API
MAPBOX_TOKEN=
`
    fs.writeFileSync(envPath, envContent)
    console.log('✅ Created .env.local file')
  } else {
    console.log('⚠️  .env.local already exists')
  }

  console.log('')
  console.log('🎉 Installation complete!')
  console.log('')
  console.log('Next steps:')
  console.log('1. Add your API keys to .env.local')
  console.log('2. Run: npm run dev')
  console.log('3. Open http://localhost:3000')
  console.log('')
  console.log('Get API keys:')
  console.log('- Replicate: https://replicate.com')
  console.log('- OpenRouteService: https://openrouteservice.org')
  console.log('- Mapbox: https://mapbox.com (optional)')

} catch (error) {
  console.error('❌ Installation failed:', error.message)
  console.log('')
  console.log('Please ensure Node.js is installed and try again.')
  console.log('Download from: https://nodejs.org/')
  process.exit(1)
}
