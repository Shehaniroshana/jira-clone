# JiraFlow - Enterprise Project Management

A full-stack project management application inspired by Jira, built with modern technologies.

## 🎯 Features

- **Authentication & Authorization**: JWT-based secure authentication with modern animated login pages
- **Project Management**: Create and manage multiple projects with dashboard analytics
- **Kanban Boards**: Advanced drag-and-drop task management with optimistic updates via `@hello-pangea/dnd`
- **Sprint Management**: Plan and track sprints, move issues to backlog/active sprints
- **Advanced Issue Tracking**: 
  - Rich issue details with subtasks & progress tracking
  - Linked issues (blocks, relates to, etc.)
  - Time tracking and estimation
  - Activity timeline & Comments
  - Labels and Assignees
- **Strategic Roadmap**: Visual timeline planning with neon-glowing Gantt charts
- **Real-time Updates**: Socket.io integration for instant collaboration
- **Interactive UI**:
  - **Neural Flow** backgrounds with interactive physics
  - **Ultra-Glass** aesthetics with global transparency
  - Smooth animations (Framer Motion)
  - Responsive Dashboard with Recharts
- **File Attachments**: Upload and manage files
- **User Management**: Role-based access control with avatar support

## 🏗️ Tech Stack

### Backend
- **Language**: Go 1.21+
- **Framework**: Fiber (Express-inspired web framework)
- **Database**: PostgreSQL
- **ORM**: GORM
- **Authentication**: JWT
- **Real-time**: Gorilla WebSocket
- **Validation**: go-playground/validator

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS (Glassmorphism & Neon effects)
- **UI Components**: Radix UI primitives & Custom Components
- **Animations**: Framer Motion & Three.js (@react-three/fiber)
- **State Management**: Zustand
- **API Client**: Axios
- **Drag & Drop**: @hello-pangea/dnd
- **Data Visualization**: Recharts
- **Real-time**: Socket.io Client

## 📁 Project Structure

```
Jira_clone/
├── backend/                 # Go backend
│   ├── cmd/
│   │   └── api/            # Application entry point
│   ├── internal/
│   │   ├── config/         # Configuration
│   │   ├── database/       # Database connection
│   │   ├── handlers/       # HTTP handlers
│   │   ├── middleware/     # Middleware
│   │   ├── models/         # Database models
│   │   ├── repository/     # Data access layer
│   │   ├── services/       # Business logic
│   │   ├── utils/          # Utilities
│   │   └── websocket/      # WebSocket handlers
│   ├── migrations/         # Database migrations
│   └── go.mod
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom hooks
│   │   ├── store/         # State management
│   │   ├── services/      # API services
│   │   ├── types/         # TypeScript types
│   │   └── lib/           # Utilities
│   └── package.json
├── docker-compose.yml      # Docker setup
└── .env.example           # Environment variables template
```

## 🚀 Getting Started

### Prerequisites
- Go 1.21 or higher
- Node.js 18 or higher
- PostgreSQL 14 or higher
- Docker (optional)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd Jira_clone
```

2. **Setup Backend**
```bash
cd backend
cp .env.example .env
# Edit .env with your database credentials
go mod download
go run cmd/api/main.go
```

3. **Setup Frontend**
```bash
npm install
npm run dev
```

This installs frontend dependencies from the project root using npm workspaces.

Or run the frontend commands directly from root:

```bash
npm run dev
```

4. **Using Docker (Alternative)**
```bash
docker-compose up -d
```

### Environment Variables

#### Backend (.env)
```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=jira_clone
JWT_SECRET=your-secret-key
PORT=8080
FRONTEND_URL=http://localhost:5173
```

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:8080
VITE_WS_URL=ws://localhost:8080/ws
```

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Project Endpoints
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Issue Endpoints
- `GET /api/projects/:id/issues` - List project issues
- `POST /api/projects/:id/issues` - Create issue
- `GET /api/issues/:id` - Get issue details
- `PUT /api/issues/:id` - Update issue
- `DELETE /api/issues/:id` - Delete issue

### Sprint Endpoints
- `GET /api/projects/:id/sprints` - List project sprints
- `POST /api/projects/:id/sprints` - Create sprint
- `PUT /api/sprints/:id` - Update sprint
- `DELETE /api/sprints/:id` - Delete sprint

## 🎨 UI Components

Built with shadcn/ui for a premium, accessible design:
- Button, Input, Select, Textarea
- Dialog, Dropdown, Popover
- Card, Badge, Avatar
- Table, Tabs, Toast
- Calendar, Date Picker
- Command Palette

## 🔒 Security Features

- Password hashing with bcrypt
- JWT token authentication
- CORS protection
- SQL injection prevention
- XSS protection
- Rate limiting

## 📦 Database Schema

- **users** - User accounts and profiles
- **projects** - Project information
- **issues** - Tasks and issues
- **sprints** - Sprint management
- **comments** - Issue comments
- **attachments** - File uploads
- **activity_logs** - Audit trail

## 🧪 Testing

```bash
# Backend tests
cd backend
go test ./...

# Frontend tests
cd frontend
npm run test
```

## 📝 License

MIT License

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
