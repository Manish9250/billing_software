from flask import Blueprint, request
from flask_restful import Api, Resource, reqparse
from application.database import db

from application.models import Item 

item_bp = Blueprint('item_api', __name__)
api = Api(item_bp)

parser = reqparse.RequestParser()

parser.add_argument('name', type=str, required=False,location='json')
parser.add_argument('size', type=str, required=False,location='json')
parser.add_argument('category', type=str, required=False,location='json')
parser.add_argument('buy_price', type=float, required=False,location='json') 
parser.add_argument('quantity', type=float, required=False,location='json')
parser.add_argument('wholesale_price', type=float, required=False,location='json')
parser.add_argument('retail_price', type=float, required=False,location='json')
parser.add_argument('alert_quantity', type=float, required=False,location='json')
parser.add_argument('expiry_duration', type=int, required=False,location='json')


class ItemResource(Resource):
    def get(self, item_id=None):
        if item_id:
            item = Item.query.get(item_id)
            if not item:
                return {'message': 'Item not found'}, 404
            return item.to_dict()
        # Search by name and size
        name = request.args.get('name')
        size = request.args.get('size')
        query = Item.query
        if name:
            query = query.filter(Item.name.ilike(f"%{name}%"))
        if size:
            query = query.filter(Item.size.ilike(f"%{size}%"))
        items = query.all()
        return [item.to_dict() for item in items]

    def post(self):
        args = parser.parse_args()
        if args["name"] and args["size"]:
            try:
                item = Item(
                    name=args['name'],
                    size=args['size'],
                    category=args.get('category', None),  # Optional field
                    quantity=args['quantity'],
                    buy_price=args["buy_price"],
                    wholesale_price=args["wholesale_price"],
                    retail_price=args["retail_price"],
                    alert_quantity=args["alert_quantity"],
                    expiry_duration=args.get("expiry_duration", 1)
                )
                db.session.add(item)
                db.session.commit()
                return item.to_dict(), 201 # Created
            except Exception as e:
                db.session.rollback()
                return {"message": str(e)}, 500 #Internal error
        
        return {"message": "Some feilds are missing"}, 400 #Bad request

    def put(self, item_id):
        item = Item.query.get(item_id)
        if not item:
            return {'message': 'Item not found'}, 404
        
        args = parser.parse_args()
        try:
            
            if args.get("name") is not None:
                item.name=args.get('name')
            if args.get("size") is not None:
                item.size=args.get('size')
            if args.get("category") is not None:
                item.category=args.get('category')
            if args.get("quantity") is not None:
                item.quantity=args.get('quantity')
            if args.get("buy_price") is not None:
                item.buy_price=args.get("buy_price")
            if args.get("wholesale_price") is not None:
                item.wholesale_price=args.get("wholesale_price")
            if args.get("retail_price") is not None:
                item.retail_price=args.get("retail_price")
            if args.get("alert_quantity") is not None:
                item.alert_quantity=args.get("alert_quantity")
            if args.get("expiry_duration") is not None:
                item.expiry_duration=args.get("expiry_duration")
        
            db.session.add(item)
            db.session.commit()
            return item.to_dict(), 200 #OK
        except Exception as e:
            db.session.rollback()
            return {"message": str(e)}, 500 #Internal error


    def delete(self, item_id):
        item = Item.query.get(item_id)
        if not item:
            return {'message': 'Item not found'}, 404
        
        try:
            db.session.delete(item)
            db.session.commit()
            return {'message': 'Item deleted'}
        except Exception as e:
            db.session.rollback()
            return {"message": str(e)}, 500 #Internal error
        
api.add_resource(
    ItemResource,
    '/items',
    '/items/<int:item_id>',
)