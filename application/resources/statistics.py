from flask import Blueprint, request, jsonify
from flask_restful import Api, Resource
from datetime import datetime, timedelta
from application.models import Bill
from application.database import db

statistics_bp = Blueprint('statistics', __name__)
api = Api(statistics_bp)

# --- Helper function to compute profit for a bill ---
def compute_bill_profit(bill):
    profit = 0
    for bxi in bill.bill_x_items:
        if bxi.item and bxi.price is not None and bxi.item.buy_price is not None:
            profit += (bxi.price - bxi.item.buy_price) * bxi.quantity
    return profit

# --- Hourly Sales and Profit ---
class HourlySales(Resource):
    def get(self):
        date_str = request.args.get('date')
        bill_type = request.args.get('type', 'both')
        if date_str:
            date = datetime.strptime(date_str, "%Y-%m-%d").date()
        else:
            date = datetime.now().date()

        open_hour = 8
        close_hour = 23

        # Filter by bill type
        query = Bill.query.filter(db.func.date(Bill.date) == date)
        if bill_type == 'retail':
            query = query.filter(Bill.customer.has(type=1))
        elif bill_type == 'wholesale':
            query = query.filter(Bill.customer.has(type=0))
        bills = query.all()

        sales = {h: 0 for h in range(open_hour, close_hour + 1)}
        profit = {h: 0 for h in range(open_hour, close_hour + 1)}

        for bill in bills:
            bill_hour = bill.date.hour
            if open_hour <= bill_hour <= close_hour:
                sales[bill_hour] += bill.total_price or 0
                profit[bill_hour] += compute_bill_profit(bill)

        now = datetime.now()
        if date == now.date():
            close_hour = min(close_hour, now.hour)

        return jsonify({
            "open_hour": open_hour,
            "close_hour": close_hour,
            "sales": sales,
            "profit": profit
        })

# --- Daily Sales and Profit ---
class DailySales(Resource):
    def get(self):
        days = int(request.args.get('days', 7))
        bill_type = request.args.get('type', 'both')
        today = datetime.now().date()
        labels = []
        sales = []
        profit = []
        for i in range(days-1, -1, -1):
            day = today - timedelta(days=i)
            query = Bill.query.filter(db.func.date(Bill.date) == day)
            if bill_type == 'retail':
                query = query.filter(Bill.customer.has(type=1))
            elif bill_type == 'wholesale':
                query = query.filter(Bill.customer.has(type=0))
            bills = query.all()
            total = sum(bill.total_price or 0 for bill in bills)
            total_profit = sum(compute_bill_profit(bill) for bill in bills)
            labels.append(day.strftime('%Y-%m-%d'))
            sales.append(float(total))
            profit.append(float(total_profit))
        return jsonify({"labels": labels, "sales": sales, "profit": profit})

# --- Monthly Sales and Profit ---
class MonthlySales(Resource):
    def get(self):
        months = int(request.args.get('months', 12))
        bill_type = request.args.get('type', 'both')
        now = datetime.now()
        labels = []
        sales = []
        profit = []
        for i in range(months-1, -1, -1):
            year = (now.year if now.month - i > 0 else now.year - 1)
            month = (now.month - i - 1) % 12 + 1
            label = f"{year}-{month:02d}"
            query = Bill.query.filter(
                db.extract('year', Bill.date) == year,
                db.extract('month', Bill.date) == month
            )
            if bill_type == 'retail':
                query = query.filter(Bill.customer.has(type=1))
            elif bill_type == 'wholesale':
                query = query.filter(Bill.customer.has(type=0))
            bills = query.all()
            total = sum(bill.total_price or 0 for bill in bills)
            total_profit = sum(compute_bill_profit(bill) for bill in bills)
            labels.append(label)
            sales.append(float(total))
            profit.append(float(total_profit))
        return jsonify({"labels": labels, "sales": sales, "profit": profit})

# --- Register resources ---
api.add_resource(MonthlySales, '/api/sales/monthly')
api.add_resource(DailySales, '/api/sales/daily')
api.add_resource(HourlySales, '/api/sales/hourly')