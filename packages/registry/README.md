# PRMP Registry Backend

Central package registry for prompts, agents, and cursor rules.

## Features

- 🔐 **GitHub OAuth Authentication** - Secure user authentication via GitHub
- 📦 **Package Management** - Publish, search, and download packages
- 🔍 **Full-Text Search** - Powered by PostgreSQL's built-in search
- ⚡ **Redis Caching** - Fast response times with intelligent caching
- 📊 **Download Statistics** - Track package popularity and trends
- 🏷️ **Tags & Categories** - Organize packages for easy discovery
- ⭐ **Ratings & Reviews** - Community feedback system
- 🔑 **API Tokens** - Secure CLI authentication
- 📝 **Swagger Documentation** - Interactive API docs at `/docs`

## Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: Fastify
- **Database**: PostgreSQL 15+ (with pg_trgm extension)
- **Cache**: Redis 7+
- **Storage**: S3-compatible object storage
- **Search**: PostgreSQL full-text search

## Getting Started

### Prerequisites

- Node.js 20+
- Docker and Docker Compose (for local development)
- OR manually: PostgreSQL 15+, Redis 7+, S3-compatible storage

### Quick Start with Docker

From the **project root** (not the registry directory):

```bash
# Start all services (PostgreSQL, Redis, MinIO, Registry)
docker compose up -d

# Run migrations
cd packages/registry
npm run migrate
```

The registry will be available at http://localhost:3111

### Manual Setup (without Docker)

If you prefer to run services manually:

1. Install dependencies:
```bash
cd packages/registry
npm install
```

2. Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
DATABASE_URL=postgresql://prpm:prpm@localhost:5432/prpm
REDIS_URL=redis://localhost:6379
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
JWT_SECRET=your-super-secret-jwt-key
S3_BUCKET=your-bucket-name
S3_ACCESS_KEY_ID=your_access_key
S3_SECRET_ACCESS_KEY=your_secret_key
```

3. Create the database:

```bash
createdb prpm
```

4. Run migrations:

```bash
npm run migrate
```

This will:
- Create all tables and indexes
- Set up triggers and functions
- Add initial seed data

### Development

Start the development server with hot reload:

```bash
npm run dev
```

The server will be available at:
- API: http://localhost:3111
- Swagger Docs: http://localhost:3111/docs
- Health Check: http://localhost:3111/health

### Production Build

```bash
npm run build
npm start
```

## API Documentation

Interactive API documentation is available at `/docs` when the server is running.

### Key Endpoints

#### Authentication
- `GET /api/v1/auth/github` - Initiate GitHub OAuth
- `GET /api/v1/auth/github/callback` - OAuth callback
- `GET /api/v1/auth/me` - Get current user
- `POST /api/v1/auth/token` - Generate API token

#### Packages
- `GET /api/v1/packages` - List packages
- `GET /api/v1/packages/:id` - Get package details
- `GET /api/v1/packages/:id/:version` - Get specific version
- `POST /api/v1/packages` - Publish package (auth required)
- `DELETE /api/v1/packages/:id/:version` - Unpublish (auth required)
- `GET /api/v1/packages/:id/stats` - Download statistics

#### Search
- `GET /api/v1/search?q=query` - Full-text search
- `GET /api/v1/search/trending` - Trending packages
- `GET /api/v1/search/featured` - Featured packages
- `GET /api/v1/search/tags` - List all tags
- `GET /api/v1/search/categories` - List categories

#### Users
- `GET /api/v1/users/:username` - User profile
- `GET /api/v1/users/:username/packages` - User's packages

## Database Schema

See `migrations/001_initial_schema.sql` for the complete schema.

### Key Tables

- **users** - User accounts and authentication
- **organizations** - Organization accounts
- **packages** - Package metadata
- **package_versions** - Versioned package releases
- **package_stats** - Download statistics
- **package_reviews** - Ratings and reviews
- **access_tokens** - API authentication tokens
- **audit_log** - Audit trail

## Caching Strategy

Redis is used for caching:

- **Package listings**: 5 minutes
- **Package details**: 5 minutes
- **Package versions**: 1 hour (immutable)
- **Search results**: 5 minutes
- **Trending/Featured**: 1 hour
- **Tags/Categories**: 1 hour

Caches are automatically invalidated on:
- Package publish/unpublish
- Package metadata updates
- Version releases

## Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## Deployment

### Docker

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

### Environment Variables

Required in production:

```env
NODE_ENV=production
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=random-secure-secret
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
S3_BUCKET=...
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
```

## Monitoring

Health check endpoint: `GET /health`

```json
{
  "status": "ok",
  "timestamp": "2025-10-17T20:00:00.000Z",
  "version": "1.0.0"
}
```

## Security

- All passwords are hashed
- API tokens are SHA-256 hashed
- JWT tokens for session management
- Rate limiting (configurable)
- CORS enabled (configurable origins)
- SQL injection protection via parameterized queries

## Contributing

See main project [CONTRIBUTING.md](../CONTRIBUTING.md)

## License

MIT
