from flask import request, Blueprint
from flask_restful import Resource, reqparse, Api
from application.models import db, Unpaid
from sqlalchemy import func

unpaid_money_bp = Blueprint("unpaid_money_api", "__name__")
api = Api(unpaid_money_bp)


# Parser for POST/PUT
unpaid_parser = reqparse.RequestParser()
unpaid_parser.add_argument('customer_id', type=int, required=True, help='Customer ID is required')
unpaid_parser.add_argument('add', type=float, required=False, default=0.0)
unpaid_parser.add_argument('sub', type=float, required=False, default=0.0)

class UnpaidListResource(Resource):
    def get(self):
        customer_id = request.args.get('customer_id', type=int)
        query = Unpaid.query
        if customer_id:
            query = query.filter_by(customer_id=customer_id)
        records = query.order_by(Unpaid.date.desc()).all()
        return [u.to_dict() for u in records], 200

    def post(self):
        args = unpaid_parser.parse_args()
        try:
            unpaid = Unpaid(
                customer_id=args['customer_id'],
                add=args.get('add', 0.0),
                sub=args.get('sub', 0.0)
            )
            
            db.session.add(unpaid)
            db.session.commit()
            return unpaid.to_dict(), 201
        except Exception as e:
            db.session.rollback()
            return {"message": str(e)}, 500

class UnpaidResource(Resource):
    def get(self, unpaid_id):
        unpaid = Unpaid.query.get_or_404(unpaid_id)
        return unpaid.to_dict(), 200

    def put(self, unpaid_id):
        unpaid = Unpaid.query.get_or_404(unpaid_id)
        try:
            args = unpaid_parser.parse_args()
            unpaid.add = args.get('add', unpaid.add)
            unpaid.sub = args.get('sub', unpaid.sub)
            db.session.commit()
            return unpaid.to_dict(), 200
        except Exception as e:
            db.session.rollback()
            return {"message": str(e)}, 500
        
    def delete(self, unpaid_id):
        unpaid = Unpaid.query.get_or_404(unpaid_id)
        db.session.delete(unpaid)
        db.session.commit()
        return {'result': True}, 200

api.add_resource(UnpaidListResource, '/api/unpaid')
api.add_resource(UnpaidResource, '/api/unpaid/<int:unpaid_id>')