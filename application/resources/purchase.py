from flask_restful import Resource, reqparse, Api
from flask import request, Blueprint
from application.models import db, Purchase, Item
from sqlalchemy import desc


purchase_bp = Blueprint('purchase_api', __name__)
api = Api(purchase_bp)
# Parser for POST/PUT
purchase_parser = reqparse.RequestParser()
purchase_parser.add_argument('item_id', type=int, required=True, help='Item ID is required')
purchase_parser.add_argument('quantity', type=float, required=True, help='Quantity is required')
purchase_parser.add_argument('buy_price', type=float, required=True, help='Buy price is required')
purchase_parser.add_argument('sell_price', type=float, required=False)
purchase_parser.add_argument('date', type=str, required=False)

class PurchaseListResource(Resource):
    def get(self):
        item_id = request.args.get('item_id', type=int)
        query = Purchase.query
        if item_id:
            query = query.filter_by(item_id=item_id)
        purchases = query.order_by(desc(Purchase.date)).all()
        return [p.to_dict() for p in purchases], 200

    def post(self):
        args = purchase_parser.parse_args()
        try:
            
            purchase = Purchase(
                item_id=args['item_id'],
                quantity=args['quantity'],
                buy_price=args['buy_price'],
                sell_price=args.get('sell_price'),
            )
            db.session.add(purchase)
            # Update item quantity
            item = Item.query.get(args['item_id'])
            if item:
                item.quantity += args['quantity']
            db.session.commit()
            return purchase.to_dict(), 201
        except Exception as e:
            db.session.rollback()
            return {"error": str(e)}, 400

class PurchaseResource(Resource):
    def get(self, purchase_id):
        purchase = Purchase.query.get_or_404(purchase_id)
        return purchase.to_dict(), 200

    def put(self, purchase_id):
        purchase = Purchase.query.get_or_404(purchase_id)
        args = purchase_parser.parse_args()
        # Optionally adjust item quantity if quantity changes
        old_quantity = purchase.quantity
        purchase.item_id = args['item_id']
        purchase.quantity = args['quantity']
        purchase.buy_price = args['buy_price']
        purchase.sell_price = args.get('sell_price')
        if args.get('date'):
            purchase.date = args['date']
        # Update item quantity if changed
        item = Item.query.get(args['item_id'])
        if item:
            item.quantity += (args['quantity'] - old_quantity)
        db.session.commit()
        return purchase.to_dict(), 200

    def delete(self, purchase_id):
        purchase = Purchase.query.get_or_404(purchase_id)
        # Adjust item quantity
        item = Item.query.get(purchase.item_id)
        if item:
            item.quantity -= purchase.quantity
        db.session.delete(purchase)
        db.session.commit()
        return {'result': True}, 200

# To use:
api.add_resource(PurchaseListResource, '/purchase')
api.add_resource(PurchaseResource, '/purchase/<int:purchase_id>')