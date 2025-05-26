from flask import request, Blueprint
from flask_restful import Resource, Api
from application.models import db, Bill

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
        
        
api.add_resource(BillListResource, '/bills')
api.add_resource(BillResource, '/bills/<int:bill_id>')