from flask import request, Blueprint
from flask_restful import Api, Resource, reqparse
from application.models import db, BillxItems, Bill, Item, Customer


billxitems_bp = Blueprint("billxitems_api", "__name__")
api = Api(billxitems_bp)


parser = reqparse.RequestParser()
parser.add_argument('bill_id', type=int, required=True, help='Bill ID is required')
parser.add_argument('item_id', type=int, required=True, help='Item ID is required')
parser.add_argument('quantity', type=float, required=True, help='Quantity is required')
parser.add_argument("price", type=float, required=False)

class BillxItemsResource(Resource):
    def get(self, id=None):
        if id:
            billxitem = BillxItems.query.get(id)
            if not billxitem:
                return {'message': 'BillxItem not found'}, 404
            return {
                'id': billxitem.id,
                'bill_id': billxitem.bill_id,
                'item_id': billxitem.item_id,
                'quantity': billxitem.quantity
            }
        else:
            billxitems = BillxItems.query.all()
            return [{
                'id': b.id,
                'bill_id': b.bill_id,
                'item_id': b.item_id,
                'quantity': b.quantity,
                "price": b.price
            } for b in billxitems]

    def post(self):
        args = parser.parse_args()
        bill = Bill.query.get(args['bill_id'])
        item = Item.query.get(args['item_id'])
        if not bill or not item:
            return {'message': 'Bill or Item not found'}, 404
        
        # Check for duplicate (assuming you have a 'size' field, add it if needed)
        existing = BillxItems.query.filter_by(
            bill_id=args['bill_id'],
            item_id=args['item_id']
            # size=args.get('size')  # Uncomment if you have a size field
        ).first()
        if existing:
            return {'message': 'Duplicate item for this bill already exists', 'id': existing.id}, 409

        try: 
            billxitem = BillxItems(
                bill_id=args['bill_id'],
                item_id=args['item_id'],
                quantity=args['quantity'],
                price=args['price']         
            )
            db.session.add(billxitem)
            db.session.commit()
            return {'message': 'BillxItem created', 'id': billxitem.id}, 201
        except Exception as e:
            db.session.rollback()
            return {"message": str(e)}, 500 #Internal error


    def put(self, id):
        billxitem = BillxItems.query.get(id)
        if not billxitem:
            return {'message': 'BillxItem not found'}, 404
        args = parser.parse_args()

        try:
            billxitem.bill_id = args['bill_id']
            billxitem.item_id = args['item_id']
            billxitem.quantity = args['quantity']
            billxitem.price = args["price"]
            db.session.commit()

            #Updating increamentor and total in bill


            return {'message': 'BillxItem updated'}
        except Exception as e:
            db.session.rollback()
            return {"message": str(e)}, 500 #Internal error


    def delete(self, id):
        billxitem = BillxItems.query.get(id)
        if not billxitem:
            return {'message': 'BillxItem not found'}, 404
        
        try:
            db.session.delete(billxitem)
            db.session.commit()
            return {'message': 'BillxItem deleted'}
        except Exception as e:
            db.session.rollback()
            return {"message": str(e)}, 500 #Internal error

api.add_resource(BillxItemsResource, '/billxitems', '/billxitems/<int:id>')