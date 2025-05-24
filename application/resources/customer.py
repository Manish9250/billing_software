from flask_restful import Resource, Api, reqparse
from ..models import Customer
from ..database import db

api = Api()

# Argument parser
parser = reqparse.RequestParser()
parser.add_argument('name', type=str, required=False)
parser.add_argument('phone', type=str, required=False)
parser.add_argument('type', type=int, required=False) #Type of customer: Wholesale(0), Retail(1).
parser.add_argument('unpaid_money', type=float, required=False)

# Resources
class CustomerList(Resource): #For listing and creating customers
    def get(self):
        args = parser.parse_args()
        query = Customer.query

        if args['name']:
            query = query.filter(Customer.name.ilike(f"%{args['name']}%"))
        if args['phone']:
            query = query.filter(Customer.phone.ilike(f"%{args['phone']}%"))

        customers = query.all()
        return [{
            "id": c.id,
            "name": c.name,
            "phone": c.phone,
            "unpaid_money": c.unpaid_money
        } for c in customers], 200

    def post(self):
        args = parser.parse_args()
        if args['name'] and args['phone']:
            try:
                existing_customer = Customer.query.filter_by(name=args['name']).first()
                if existing_customer:
                    return {"message": "Customer already exists"}, 400

                customer = Customer(
                    name=args['name'],
                    phone=args['phone'],
                    type=args.get('type', 1),  # Default to Retail if not provided
                    unpaid_money=args.get('unpaid_money', 0.0)
                )
                db.session.add(customer)
                db.session.commit()
                return {"message": "Customer created", "id": customer.id, "Name": customer.name}, 201
            except Exception as e:
                db.session.rollback()
                return {"message": str(e)}, 500
            
        return {"message": "Name and phone are required"}, 400
            
class CustomerResource(Resource): #For updating and deleting a specific customer
    def put(self, customer_id):

        customer = Customer.query.get(customer_id)
        if not customer:
            return {"message": "Customer not found"}, 404
        
        args = parser.parse_args()
        try:

            if args['name']:
                customer.name = args['name']
            if args['phone']:
                customer.phone = args['phone']
            if args['unpaid_money'] is not None:
                customer.unpaid_money = args['unpaid_money']

            db.session.commit()
            return {"message": "Customer updated"}, 200
        except Exception as e:
            db.session.rollback()
            return {"message": str(e)}, 500

    def delete(self, customer_id):
        customer = Customer.query.get(customer_id)
        if not customer:
            return {"message": "Customer not found"}, 404
        try:
            db.session.delete(customer)
            db.session.commit()
            return {"message": "Customer deleted"}, 200
        except Exception as e:
            db.session.rollback()
            return {"message": str(e)}, 500

# Route binding
api.add_resource(CustomerList, '/api/customers')
api.add_resource(CustomerResource, '/api/customers/<int:customer_id>')
