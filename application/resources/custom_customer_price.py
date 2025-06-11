from flask import request, Blueprint
from flask_restful import Resource, Api
from application.models import db, Bill, CustomCustomerPrice

custom_customer_price_bp = Blueprint("custom_customer_price_api", "__name__")
api = Api(custom_customer_price_bp)


class CustomPriceListResource(Resource):
    def get(self):
        price_list = CustomCustomerPrice.query.all()
        return [price.to_dict() for price in price_list], 200

    def post(self):
        data = request.get_json()
        item_id=data.get("item_id")
        customer_id=data.get("customer_id")
        if item_id and customer_id:
            try:
                custom_price = CustomCustomerPrice(
                    customer_id=customer_id,
                    item_id=item_id,
                    price=data.get("price")
                )
                db.session.add(custom_price)
                db.session.commit()
                return custom_price.to_dict(), 201
            except Exception as e:
                db.session.rollback()
                return {"message": str(e)}, 500 #Internal error
        return {
            "message": "Enter customer id and item id"
        }
    
class CustomPriceResource(Resource):
    def get(self, customer_id, item_id):
        if item_id:
            custom_price = CustomCustomerPrice.query.filter_by(customer_id=customer_id, item_id=item_id).first()
            if not custom_price:
                return {"message": "Custom price not found for this item"}, 404
            return custom_price.to_dict(), 200

    def delete(self, id):
        custom_price = CustomCustomerPrice.query.get(id)
        if not custom_price:
            return {"message": "Custom price record not found"}, 404
        try:
            db.session.delete(custom_price)
            db.session.commit()
            return {"message": f"Custom price:{id} deleted"}, 200
        except Exception as e:
            db.session.rollback()
            return {"message": str(e)}, 500 #Internal error
        
    def put(self, id):
        custom_price = CustomCustomerPrice.query.get(id)
        if not custom_price:
            return {"message": "Custom price record not found"}, 404
        data = request.get_json()
        for key, value in data.items():
            setattr(custom_price, key, value)
        db.session.commit()
        return custom_price.to_dict(), 200

api.add_resource(CustomPriceListResource, '/custom_prices')
api.add_resource(CustomPriceResource, '/custom_prices/<int:customer_id>/<int:item_id>', '/custom_prices/<int:id>')