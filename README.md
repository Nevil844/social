# 🎮 Gather Clone - Multiplayer Virtual Workspace

A modern, feature-rich multiplayer virtual workspace inspired by Gather Town, built with React, Node.js, and WebRTC.

![Gather Clone](https://img.shields.io/badge/Status-Active-green)
![Docker](https://img.shields.io/badge/Docker-Ready-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)

## ✨ Features

### 🎯 Core Functionality
- **Real-time Multiplayer Movement** - Smooth 4-directional character movement with arrow keys or WASD
- **Proximity-based Interactions** - Chat and video calls activate when players are nearby
- **Realistic Human Avatars** - Diverse, detailed SVG characters with multiple customization options
- **Room-based System** - Create public/private rooms with custom settings
- **Multiple Beautiful Maps** - 6 stunning environments (Office, Park, Café, Campus, Beach, Space Station)

### 🎨 Visual Design
- **Modern UI/UX** - Glassmorphism design with beautiful gradients and animations
- **Full-screen Responsive** - Scales perfectly across all devices and screen sizes
- **3D-like Graphics** - Enhanced visual effects with shadows, highlights, and textures
- **Smooth Animations** - Phaser.js powered movement and interactions

### 🔧 Technical Features
- **WebRTC Video Calls** - Integrated Daily.co for high-quality video communication
- **Real-time Chat** - Proximity-based messaging system
- **Socket.IO** - Real-time multiplayer synchronization
- **Docker Ready** - Containerized for easy deployment
- **Production Optimized** - Multi-stage Docker builds with health checks

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Docker & Docker Compose
- Git

### 🐳 Run with Docker (Recommended)

```bash
# Clone the repository
git clone <your-repo-url>
cd gather-clone

# Build and run with Docker Compose
docker-compose up --build

# Access the app
open http://localhost:3001
```

### 🛠️ Development Setup

```bash
# Install dependencies
npm install
cd server && npm install
cd ../client && npm install

# Run development servers
npm run dev
```

This starts:
- Backend server on `http://localhost:3001`
- Frontend development server on `http://localhost:5173`

## 📁 Project Structure

```
gather-clone/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── App.jsx     # Main application component
│   │   │   ├── Game.jsx    # Phaser.js game engine
│   │   │   ├── Landing.jsx # Landing page & room browser
│   │   │   ├── Avatar.jsx  # Human avatar component
│   │   │   ├── ProximityUI.jsx # Chat & player interactions
│   │   │   └── VideoCall.jsx   # Daily.co video integration
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── server/                 # Node.js backend
│   ├── server.js          # Main server file
│   ├── healthcheck.js     # Docker health check
│   └── package.json
├── docker-compose.yml     # Docker orchestration
├── Dockerfile            # Multi-stage production build
└── package.json          # Root package coordination
```

## 🎮 How to Play

1. **Join or Create a Room**
   - Enter a room code for private rooms
   - Browse public rooms
   - Create your own custom room

2. **Move Around**
   - Use arrow keys or WASD to move your character
   - Navigate through beautiful 3D-like environments

3. **Interact with Others**
   - Get close to other players (proximity detection)
   - Start video calls or chat when nearby
   - Enjoy real-time multiplayer experiences

## 🗺️ Available Maps

| Map | Description | Theme |
|-----|-------------|-------|
| 🏢 **Modern Office** | Corporate workspace with meeting rooms | Professional |
| 🌳 **Central Park** | Outdoor park with gardens and ponds | Nature |
| ☕ **Cozy Café** | Warm coffee shop atmosphere | Social |
| 🎓 **University Campus** | Academic environment with library | Educational |
| 🏖️ **Tropical Beach** | Beachside paradise with palm trees | Relaxation |
| 🚀 **Space Station** | Futuristic sci-fi environment | Innovation |

## 🛡️ Environment Variables

Create a `.env` file in the server directory:

```env
NODE_ENV=production
PORT=3001
DAILY_API_KEY=your_daily_api_key_here
```

### 🎥 Video Call Setup

To enable video calls, you need a Daily.co API key:

1. **Get API Key**: Visit [Daily.co Dashboard](https://dashboard.daily.co/developers)
2. **Create Account**: Sign up for a free Daily.co account
3. **Generate Key**: Create a new API key in the developers section
4. **Add to .env**: Place your API key in the server `.env` file

**Note**: Without the API key, video calls will run in demo mode with limited functionality.

### 🔧 API Key Configuration

The Daily.co API key enables:
- ✅ Real video call rooms
- ✅ Automatic room cleanup
- ✅ Participant management
- ✅ Recording capabilities (optional)
- ✅ Advanced room settings

**Demo Mode** (no API key):
- ⚠️ Limited functionality
- ⚠️ Demo room URLs
- ⚠️ No room cleanup

## 🐳 Docker Commands

```bash
# Build and run production
docker-compose up --build

# Run in background
docker-compose up -d

# View logs
docker logs gather-clone-gather-clone-1 -f

# Stop containers
docker-compose down

# Development mode
docker-compose --profile dev up
```

## 🚀 Deployment

### Cloud Platforms
- **Heroku**: `git push heroku main`
- **Railway**: Deploy directly from GitHub
- **DigitalOcean**: Use Docker image
- **AWS ECS**: Deploy containerized application

### Manual Deployment
```bash
# Build Docker image
docker build -t gather-clone .

# Run in production
docker run -p 3001:3001 -e NODE_ENV=production gather-clone
```

## 🎯 Technical Stack

### Frontend
- **React 18** - Modern UI library
- **Vite** - Fast build tool and dev server
- **Phaser.js** - 2D game engine for character movement
- **Tailwind CSS** - Utility-first styling
- **Socket.IO Client** - Real-time communication

### Backend
- **Node.js** - JavaScript runtime
- **Express** - Web application framework
- **Socket.IO** - Real-time bidirectional communication
- **UUID** - Unique identifier generation

### Infrastructure
- **Docker** - Containerization
- **Daily.co** - WebRTC video calling
- **Alpine Linux** - Lightweight container base

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by [Gather Town](https://gather.town)
- Built with ❤️ using modern web technologies
- Thanks to the open-source community

## 📧 Support

If you have any questions or need help, please open an issue on GitHub.

---

**Made with ❤️ by [Your Name]** 