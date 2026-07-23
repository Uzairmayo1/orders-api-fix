# Orders API

An Express and MySQL REST API with JWT authentication and order management.

## Setup

1. Create a MySQL database and tables with `schema.sql`.
2. Copy `.env.example` to `.env` and fill in the connection details and JWT secret.
3. Run `npm install`.
4. Run `npm start`.

The server starts at `http://localhost:3000` by default. Check it with `GET /health`.

## Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/api/auth/register` | Create a user and return a token |
| POST | `/api/auth/login` | Sign in and return a token |
| GET | `/api/orders` | List the signed-in user's orders |
| POST | `/api/orders` | Create an order |
| GET | `/api/orders/:id` | Get an order |
| PATCH | `/api/orders/:id` | Update an order |
| DELETE | `/api/orders/:id` | Delete an order |

Send the JWT on protected endpoints:

```http
Authorization: Bearer <token>
```

Create an order with:

```json
{
  "productName": "Wireless keyboard",
  "quantity": 2,
  "status": "pending"
}
```
