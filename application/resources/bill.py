from flask import request, Blueprint
from flask_restful import Resource, Api
from application.models import db, Bill, Item, BillxItems
import os

bill_bp = Blueprint("bill_api", "__name__")
api = Api(bill_bp)

class BillListResource(Resource):
    def get(self):
        bills = Bill.query.all()
        return [bill.to_dict() for bill in bills], 200

    def post(self):
        data = request.get_json()
        customer_id=data.get("customer_id")
        if customer_id:
            try:
                bill = Bill(
                    customer_id=customer_id
                )
                db.session.add(bill)
                db.session.commit()
                return bill.to_dict(), 201
            except Exception as e:
                db.session.rollback()
                return {"message": str(e)}, 500 #Internal error
        return {
            "message": "Enter customer id"
        }

class BillResource(Resource):
    def get(self, bill_id):
        bill = Bill.query.get(bill_id)
        if not bill:
            return {"message": "Bill not found"}
        return bill.to_dict(), 200

    #No need to update a bill
    def put(self, bill_id):
        bill = Bill.query.get(bill_id)
        if not bill:
            return {"message": "Bill not found"}
        data = request.get_json()
        for key, value in data.items():
            setattr(bill, key, value)
        db.session.commit()
        return bill.to_dict(), 200

    def delete(self, bill_id):
        bill = Bill.query.get(bill_id)
        if not bill:
            return {"message": "Bill not found"}
        try:
            db.session.delete(bill)
            db.session.commit()
            return {"message": f"Bill:{bill_id} deleted"}, 200
        except Exception as e:
                db.session.rollback()
                return {"message": str(e)}, 500 #Internal error
        

class BillFinalizeResource(Resource):
    def post(self, bill_id):
        bill = Bill.query.get(bill_id)
        if not bill:
            return {"message": "Bill not found"}, 404

        # Update number of items and total price
        bill_items = BillxItems.query.filter_by(bill_id=bill_id).all()
        bill.no_of_items = len(bill_items)
        bill.total_price = sum([item.price * item.quantity for item in bill_items])

        # Subtract quantities from Item table
        for bxi in bill_items:
            item = Item.query.get(bxi.item_id)
            if item:
                item.quantity -= bxi.quantity

        db.session.commit()
        return {"message": "Bill finalized", "bill": bill.to_dict()}, 200


class BillPrintResource(Resource):
    def post(self, bill_id):
        bill = Bill.query.get(bill_id)
        if not bill:
            return {"message": "Bill not found"}, 404

        # Fetch bill items
        bill_items = BillxItems.query.filter_by(bill_id=bill_id).all()
        lines = []
        lines.append(f"Bill #{bill.id} - Customer: {bill.customer_id}")
        lines.append("====================================")
        total = 0
        for bxi in bill_items:
            item = Item.query.get(bxi.item_id)
            line = f"{item.name} x {bxi.quantity} @ {bxi.price} = {bxi.quantity * bxi.price}"
            lines.append(line)
            total += bxi.quantity * bxi.price
        lines.append("====================================")
        lines.append(f"Total: {total}")
        bill_text = "\n".join(lines)

        # Write to a temporary file
        temp_path = f"/tmp/bill_{bill.id}.txt"
        with open(temp_path, "w") as f:
            f.write(bill_text)

        # Print using lpr (Linux)
        try:
            os.system(f"lpr {temp_path}")
            return {"message": "Bill sent to printer"}, 200
        except Exception as e:
            return {"message": f"Print failed: {str(e)}"}, 500


api.add_resource(BillListResource, '/bills')
api.add_resource(BillResource, '/bills/<int:bill_id>')
api.add_resource(BillFinalizeResource, '/bills/<int:bill_id>/finalize')
api.add_resource(BillPrintResource, '/bills/<int:bill_id>/print')