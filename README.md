# Laxmi Store Billing Software

A tab-based, single-screen billing and inventory management app for retail and wholesale stores.

## Features

- **Billing**: Supports both Retail and Wholesale customers.
- **Inventory Management**: Manage stock, categories, expiry, and alert quantities.
- **Variable Pricing**: Custom prices for different customers.
- **Unpaid Money Tracking**: Track and update unpaid balances for customers.
- **Custom Customer Price**: Set and update custom prices per customer and item.
- **Purchase Bill**: (Planned) Bulk update inventory via purchase bills.
- **Dashboard**: Tab-based navigation, instant access to old bills, and built-in calculator.
- **Notifications**: Success/error notifications with sound.
- **Bill Printing**: Print bills directly to ESC/POS printers.
- **Bill History**: Search and view previous bills.
- **Statistics**: Sales and inventory analytics (planned/future).

## Tech Stack

- **Backend**: Python, Flask, Flask-RESTful, SQLAlchemy
- **Frontend**: Vue.js (CDN), Bootstrap 5, Chart.js
- **Database**: SQLite (default, see `instance/local.db`)
- **Printing**: ESC/POS printer integration

## Folder Structure

- `application/` - Flask backend, models, API resources
- `static/` - Frontend JS components, scripts, sounds
- `templates/` - HTML templates
- `instance/` - SQLite database
- `plan.md` - Project plan, features, and API documentation

## Main Entities

- **Customer**: ID, Name, Mobile, Type (Retail/Wholesale), Unpaid Money
- **Item**: ID, Name, Category, Size, Buy Price, Wholesale/Retail Price, Quantity, Alert Quantity, Expiry
- **Bill**: ID, Customer, Date, Total Amount
- **BillxItem**: Bill-Item mapping, Quantity, Price at time
- **Custom Customer Price**: Customer, Item, Custom Price

## API Endpoints

- Customers: Create, update, search, unpaid money management
- Items: CRUD, search, category, purchase history
- Bills: CRUD, search, print, finalize
- BillxItems: CRUD
- Custom Prices: CRUD

See [API.md](API.md) for detailed API and feature planning.

## Setup

1. **Clone the repository**
2. **Install dependencies**
   - Python packages: see `requirements.txt`
   - Node.js not required (uses CDN for frontend)
3. **Run the Flask app**
   - Make sure `instance/local.db` exists (auto-created on first run)
   - Start the server:  
     ```sh
     python app.py
     ```
4. **Access the app**
   - Open [http://localhost:5000](http://localhost:5000) in your browser

## Future Features

- Reward system for customers
- Advanced analytics and statistics
- Purchase bill with bulk inventory update
- In-cell calculator and quantity/amount interconversion
- Detailed unpaid money history

## Known Issues

- If a user saves a bill without entering items, the bill may be blank.
- Purchase bill feature is not fully implemented.

---

**For more details, see [plan.md](plan.md) or [API.md](API.md).**

---
