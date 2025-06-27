from flask import Blueprint, request, jsonify
from flask_restful import Api, Resource
from datetime import datetime
from application.models import Bill
from application.database import db
from datetime import datetime, timedelta

statistics_bp = Blueprint('statistics', __name__)
api = Api(statistics_bp)

class HourlySales(Resource):
    def get(self):
        # Get date from query param, default to today
        date_str = request.args.get('date')
        if date_str:
            date = datetime.strptime(date_str, "%Y-%m-%d").date()
        else:
            date = datetime.now().date()

        # Set shop open/close hours (customize as needed)
        open_hour = 8
        close_hour = 23

        # Query all bills for the day
        bills = Bill.query.filter(
            db.func.date(Bill.date) == date
        ).all()

        # Aggregate sales per hour
        sales = {}
        for hour in range(open_hour, close_hour + 1):
            sales[hour] = 0

        for bill in bills:
            bill_hour = bill.date.hour
            if open_hour <= bill_hour <= close_hour:
                sales[bill_hour] += bill.total_price or 0

        # Only show up to current hour if today
        now = datetime.now()
        if date == now.date():
            close_hour = min(close_hour, now.hour)

        return jsonify({
            "open_hour": open_hour,
            "close_hour": close_hour,
            "sales": sales
        })

class DailySales(Resource):
    def get(self):
        days = int(request.args.get('days', 7))
        today = datetime.now().date()
        labels = []
        sales = []
        for i in range(days-1, -1, -1):
            day = today - timedelta(days=i)
            total = db.session.query(db.func.sum(Bill.total_price)).filter(
                db.func.date(Bill.date) == day
            ).scalar() or 0
            labels.append(day.strftime('%Y-%m-%d'))
            sales.append(float(total))
        return jsonify({"labels": labels, "sales": sales})

class MonthlySales(Resource):
    def get(self):
        months = int(request.args.get('months', 12))
        now = datetime.now()
        labels = []
        sales = []
        for i in range(months-1, -1, -1):
            year = (now.year if now.month - i > 0 else now.year - 1)
            month = (now.month - i - 1) % 12 + 1
            label = f"{year}-{month:02d}"
            total = db.session.query(db.func.sum(Bill.total_price)).filter(
                db.extract('year', Bill.date) == year,
                db.extract('month', Bill.date) == month
            ).scalar() or 0
            labels.append(label)
            sales.append(float(total))
        return jsonify({"labels": labels, "sales": sales})

api.add_resource(MonthlySales, '/api/sales/monthly')
api.add_resource(DailySales, '/api/sales/daily')
api.add_resource(HourlySales, '/api/sales/hourly')