# Billing Software API Documentation

This document describes the REST API endpoints implemented in the `application/resources/` folder.

---

## Authentication

> **Note:** No authentication is implemented.
---

## Customer APIs

### Create Customer

- **POST** `/api/customers`
- **Body:**
    ```json
    {
      "name": "Amit",
      "mobile": "9876543210",
      "flag": "Retail" // or "Wholesale"
    }
    ```
- **Response:**  
    `201 Created`  
    ```json
    {
      "id": 1,
      "name": "Amit",
      "mobile": "9876543210",
      "flag": "Retail",
      "unpaid_money": 0
    }
    ```

---

### Get All Customers

- **GET** `/api/customers`
- **Query Params:**  
    - `search` (optional): search by name, mobile, or id
- **Response:**  
    `200 OK`  
    ```json
    [
      {
        "id": 1,
        "name": "Amit",
        "mobile": "9876543210",
        "flag": "Retail",
        "unpaid_money": 0
      },
      ...
    ]
    ```

---

### Update Customer

- **PUT** `/api/customers/<customer_id>`
- **Body:** (any updatable field)
    ```json
    {
      "name": "Amit Kumar",
      "mobile": "9876543210"
    }
    ```
- **Response:**  
    `200 OK`  
    Updated customer object

---

### Update Unpaid Money

- **PUT** `/api/customers/<customer_id>/unpaid_money`
- **Body:**
    ```json
    {
      "unpaid_money": 200
    }
    ```
- **Response:**  
    `200 OK`  
    Updated customer object

---

### Delete Customer

- **DELETE** `/api/customers/<customer_id>`
- **Response:**  
    `204 No Content`

---

## Item APIs

### Create Item

- **POST** `/api/items`
- **Body:**
    ```json
    {
      "name": "Sugar",
      "weight": "1kg",
      "buy_price": 40,
      "wholesale_price": 45,
      "retail_price": 50,
      "qty": 100,
      "alert_qty": 10,
      "last_buy_date": "2025-08-25",
      "expiry_period": "6 months"
    }
    ```
- **Response:**  
    Created item object

---

### Get All Items

- **GET** `/api/items`
- **Query Params:**  
    - `search` (optional): by name, id, etc.
- **Response:**  
    List of items

---

### Update Item

- **PUT** `/api/items/<item_id>`
- **Body:** (any updatable field)
- **Response:**  
    Updated item object

---

### Delete Item

- **DELETE** `/api/items/<item_id>`
- **Response:**  
    `204 No Content`

---

## Bill APIs

### Create Bill

- **POST** `/api/bills`
- **Body:**
    ```json
    {
      "customer_id": 1,
      "bill_date": "2025-08-25",
      "total_amt": 500
    }
    ```
- **Response:**  
    Created bill object

---

### Get All Bills

- **GET** `/api/bills`
- **Query Params:**  
    - `search` (optional): by customer, date, etc.
- **Response:**  
    List of bills

---

### Update Bill

- **PUT** `/api/bills/<bill_id>`
- **Body:** (any updatable field)
- **Response:**  
    Updated bill object

---

### Delete Bill

- **DELETE** `/api/bills/<bill_id>`
- **Response:**  
    `204 No Content`

---

## BillxItem APIs

### Add Item to Bill

- **POST** `/api/billxitems`
- **Body:**
    ```json
    {
      "bill_id": 1,
      "item_name": "Sugar",
      "qty": 2,
      "price_at_that_time": 50
    }
    ```
- **Response:**  
    Created billxitem object

---

### Get Bill Items

- **GET** `/api/billxitems?bill_id=1`
- **Response:**  
    List of items in the bill

---

### Update BillxItem

- **PUT** `/api/billxitems/<billxitem_id>`
- **Body:** (any updatable field)
- **Response:**  
    Updated billxitem object

---

### Delete BillxItem

- **DELETE** `/api/billxitems/<billxitem_id>`
- **Response:**  
    `204 No Content`

---

## Custom Customer Price APIs

### Set Custom Price

- **POST** `/api/custom_customer_price`
- **Body:**
    ```json
    {
      "customer_id": 1,
      "item_id": 2,
      "custom_price": 48
    }
    ```
- **Response:**  
    Created custom price object

---

### Get Custom Prices

- **GET** `/api/custom_customer_price?customer_id=1`
- **Response:**  
    List of custom prices for the customer

---

### Update Custom Price

- **PUT** `/api/custom_customer_price/<id>`
- **Body:** (new price)
    ```json
    {
      "custom_price": 47
    }
    ```
- **Response:**  
    Updated custom price object

---

### Delete Custom Price

- **DELETE** `/api/custom_customer_price/<id>`
- **Response:**  
    `204 No Content`

---

## Purchase APIs

### Bulk Purchase (Inventory Update)

- **POST** `/api/purchase`
- **Body:**  
    ```json
    {
      "items": [
        {"item_id": 1, "qty": 50, "buy_price": 40, "date": "2025-08-25"},
        ...
      ]
    }
    ```
- **Response:**  
    Bulk update result

---

## Statistics APIs

### Get Sales Statistics

- **GET** `/api/statistics/sales`
- **Query Params:**  
    - `from`, `to` (date range)
- **Response:**  
    Sales statistics data

---

### Get Inventory Statistics

- **GET** `/api/statistics/inventory`
- **Response:**  
    Inventory statistics data

---

## Unpaid Money APIs

### Get Unpaid Money List

- **GET** `/api/unpaid_money`
- **Response:**  
    List of customers with unpaid balances

---

## Error Responses

- All endpoints return standard HTTP status codes.
- Error responses are in JSON:
    ```json
    {
      "error": "Description of the error"
    }
    ```

---

## Notes

- All endpoints accept and return JSON.
- For more details on request/response fields, see the backend code in `application/resources/`.

---
