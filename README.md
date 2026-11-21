# E-Commerce Order Processing System (Node.js)

A production-structured REST API for order creation, tracking, cancellation, status lifecycle management, and automated background processing.

## Project Structure

```text
order-processing-system/
├── .github/
│   └── workflows/
│       └── ci.yml                # GitHub Actions CI/CD pipeline
├── src/
│   ├── config/
│   │   ├── db.js                 # MongoDB connection with pooling & connection events
│   │   └── index.js              # Centralized config with env var validation
│   ├── controllers/
│   │   └── orderController.js    # Business logic & atomic updates
│   ├── jobs/
│   │   └── orderStatusJob.js     # node-cron job (PENDING -> PROCESSING every 5 mins)
│   ├── middleware/
│   │   ├── errorHandler.js       # Centralized operational & Mongoose error handler
│   │   ├── requestId.js          # Request correlation ID middleware
│   │   └── validateOrder.js      # Request payload, ObjectId, and query validators
│   ├── models/
│   │   └── Order.js              # Mongoose schema & status enums
│   ├── routes/
│   │   └── orderRoutes.js        # Express route definitions (versioned /api/v1)
│   ├── utils/
│   │   ├── AppError.js           # Custom operational Error class
│   │   ├── asyncHandler.js       # Async route wrapper to catch promise rejections
│   │   └── logger.js             # Winston structured logging
│   ├── app.js                    # Express app setup with security, rate limiting, Swagger
│   └── server.js                 # Entry point & graceful shutdown
├── tests/
│   └── order.test.js             # Jest + Supertest + In-Memory MongoDB integration tests
├── .dockerignore
├── .env
├── .env.example
├.eslintrc.json
├ .prettierrc
├ .gitignore
├ Dockerfile
├ docker-compose.yml
├ package.json
└── README.md
```

## Best Practices Implemented

| Category | Practice | Implementation |
|----------|----------|----------------|
| **Code Quality** | ESLint + Prettier | `.eslintrc.json`, `.prettierrc`, `npm run lint`, `npm run format` |
| **Security** | Rate Limiting | `express-rate-limit` (configurable window & max requests) |
| **Security** | CORS Configuration | Restrictable origins via `CORS_ORIGIN` env var |
| **Security** | Helmet Headers | `helmet()` for secure HTTP headers |
| **Security** | Request Size Limits | JSON/URL-encoded body limited to 10kb |
| **Security** | Non-root Docker User | Dockerfile runs as `appuser` |
| **Observability** | Structured Logging | Winston logger with file + console transports |
| **Observability** | Request Correlation IDs | `X-Request-ID` header for distributed tracing |
| **Observability** | MongoDB Connection Events | Connected/disconnected/error/reconnected handlers |
| **Reliability** | Graceful Shutdown | SIGINT/SIGTERM/unhandledRejection/uncaughtException handling |
| **Reliability** | Force Exit Timeout | 10s timeout to prevent hanging shutdowns |
| **Reliability** | Env Validation | Startup fails fast if required env vars are missing |
| **API Design** | Versioning | All routes under `/api/v1/` |
| **API Design** | Consistent Responses | `{ success, data/message, pagination }` envelope |
| **API Design** | OpenAPI/Swagger Docs | Interactive docs at `/api-docs` |
| **API Design** | Health Check | `GET /health` endpoint |
| **Data Integrity** | Atomic Operations | `findOneAndUpdate` with conditions for cancellation |
| **Data Integrity** | Server-side Calculations | `totalAmount` computed server-side, never trusted from client |
| **Testing** | Integration Tests | Jest + Supertest + MongoDB Memory Server |
| **DevOps** | Docker Support | Multi-stage Dockerfile + docker-compose |
| **DevOps** | CI/CD Pipeline | GitHub Actions (lint, format, test, build) |

## Setup & Running Locally

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

3. **Start the server**
   ```bash
   # Development (with auto-reload)
   npm run dev

   # Production
   npm start
   ```

4. **Run automated tests**
   ```bash
   npm test
   ```

5. **Run linting**
   ```bash
   npm run lint
   npm run lint:fix       # Auto-fix fixable issues
   ```

6. **Check code formatting**
   ```bash
   npm run format:check
   npm run format         # Auto-format
   ```

7. **Run with Docker**
   ```bash
   docker-compose up --build
   ```

## API Reference

Base path: `/api/v1`

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/orders` | Create a new order (`customerId`, `items[]`) |
| `GET` | `/api/v1/orders` | List all orders (`?status=PENDING&page=1&limit=20`) |
| `GET` | `/api/v1/orders/:id` | Fetch single order details by ID |
| `PATCH` | `/api/v1/orders/:id/status` | Advance status (`PROCESSING` -> `SHIPPED` -> `DELIVERED`) |
| `PATCH` | `/api/v1/orders/:id/cancel` | Cancel an order (allowed only when `PENDING`) |
| `GET` | `/health` | Health check |
| `GET` | `/api-docs` | Swagger/OpenAPI interactive documentation |

## Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port | `5000` | Yes |
| `NODE_ENV` | Environment (`development`, `production`) | `development` | Yes |
| `LOG_LEVEL` | Winston log level (`error`, `warn`, `info`, `debug`) | `info` | No |
| `MONGO_URI` | MongoDB connection string | - | Yes |
| `CRON_SCHEDULE` | Cron expression for status job | `*/5 * * * *` | Yes |
| `CORS_ORIGIN` | Allowed CORS origin | `*` | No |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window in ms | `900000` (15 min) | No |
| `RATE_LIMIT_MAX` | Max requests per window | `100` | No |
| `LOG_DIR` | Log directory path | `logs` | No |

## License

MIT
