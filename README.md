# E-Commerce Order Processing System (Node.js)

A production-structured REST API for order creation, tracking, cancellation, status lifecycle management, and automated background processing.

## Project Structure

```text
order-processing-system/
├── src/
│   ├── config/
│   │   └── db.js                 # MongoDB connection setup
│   ├── controllers/
│   │   └── orderController.js    # Business logic & atomic updates
│   ├── jobs/
│   │   └── orderStatusJob.js     # node-cron job (PENDING -> PROCESSING every 5 mins)
│   ├── middleware/
│   │   ├── errorHandler.js       # Centralized operational & Mongoose error handler
│   │   └── validateOrder.js      # Request payload, ObjectId, and query validators
│   ├── models/
│   │   └── Order.js              # Mongoose schema & status enums
│   ├── routes/
│   │   └── orderRoutes.js        # Express route definitions
│   ├── utils/
│   │   ├── AppError.js           # Custom operational Error class
│   │   └── asyncHandler.js       # Async route wrapper to catch promise rejections
│   ├── app.js                    # Express app setup
│   └── server.js                 # Entry point & graceful shutdown
├── tests/
│   └── order.test.js             # Jest + Supertest + In-Memory MongoDB integration tests
├── .env.example
├── .gitignore
└── package.json
```

## Setup & Running Locally

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```

3. **Start the server**
   ```bash
   npm run dev
   ```

4. **Run automated tests**
   ```bash
   npm test
   ```

## API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/orders` | Create a new order (`customerId`, `items[]`) |
| `GET` | `/api/orders` | List all orders (`?status=PENDING&page=1&limit=20`) |
| `GET` | `/api/orders/:id` | Fetch single order details by ID |
| `PATCH` | `/api/orders/:id/status` | Advance status (`PROCESSING` -> `SHIPPED` -> `DELIVERED`) |
| `PATCH` | `/api/orders/:id/cancel` | Cancel an order (allowed only when `PENDING`) |
