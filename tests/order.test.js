const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const { Order } = require('../src/models/Order');
const { processPendingOrders } = require('../src/jobs/orderStatusJob');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Order.deleteMany({});
});

describe('Order Processing System API', () => {
  const samplePayload = {
    customerId: 'cust_101',
    items: [
      { productId: 'prod_1', name: 'Wireless Mouse', quantity: 2, price: 799 },
      { productId: 'prod_2', name: 'Mechanical Keyboard', quantity: 1, price: 2499 }
    ]
  };

  test('POST /api/orders - creates an order and computes totalAmount', async () => {
    const res = await request(app).post('/api/orders').send(samplePayload);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.customerId).toBe('cust_101');
    expect(res.body.data.totalAmount).toBe(4097);
    expect(res.body.data.status).toBe('PENDING');
  });

  test('POST /api/orders - returns 400 on invalid payload', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({ customerId: '', items: [] });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('GET /api/orders/:id - retrieves order details and handles invalid/missing IDs', async () => {
    const created = await request(app).post('/api/orders').send(samplePayload);
    const orderId = created.body.data._id;

    const res = await request(app).get(`/api/orders/${orderId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data._id).toBe(orderId);

    const invalidRes = await request(app).get('/api/orders/invalid-id');
    expect(invalidRes.statusCode).toBe(400);

    const missingId = new mongoose.Types.ObjectId();
    const notFoundRes = await request(app).get(`/api/orders/${missingId}`);
    expect(notFoundRes.statusCode).toBe(404);
  });

  test('GET /api/orders - lists orders and filters by status', async () => {
    await request(app).post('/api/orders').send(samplePayload);
    await Order.create({
      customerId: 'cust_102',
      items: [{ productId: 'prod_3', quantity: 1, price: 500 }],
      totalAmount: 500,
      status: 'SHIPPED'
    });

    const allRes = await request(app).get('/api/orders');
    expect(allRes.statusCode).toBe(200);
    expect(allRes.body.count).toBe(2);

    const shippedRes = await request(app).get('/api/orders?status=SHIPPED');
    expect(shippedRes.statusCode).toBe(200);
    expect(shippedRes.body.count).toBe(1);
    expect(shippedRes.body.data[0].status).toBe('SHIPPED');

    const badFilterRes = await request(app).get('/api/orders?status=UNKNOWN');
    expect(badFilterRes.statusCode).toBe(400);
  });

  test('Background Job - moves PENDING orders to PROCESSING', async () => {
    const created = await request(app).post('/api/orders').send(samplePayload);
    const orderId = created.body.data._id;

    const jobResult = await processPendingOrders();
    expect(jobResult.modifiedCount).toBe(1);

    const updated = await Order.findById(orderId);
    expect(updated.status).toBe('PROCESSING');
  });

  test('PATCH /api/orders/:id/cancel - cancels PENDING order and blocks non-PENDING order', async () => {
    const created = await request(app).post('/api/orders').send(samplePayload);
    const orderId = created.body.data._id;

    // Cancel while PENDING -> succeeds
    const cancelRes = await request(app).patch(`/api/orders/${orderId}/cancel`);
    expect(cancelRes.statusCode).toBe(200);
    expect(cancelRes.body.data.status).toBe('CANCELLED');

    // Attempt cancel again when CANCELLED -> fails with 400
    const secondCancelRes = await request(app).patch(`/api/orders/${orderId}/cancel`);
    expect(secondCancelRes.statusCode).toBe(400);
  });
});
