from flask_restful import Resource, Api, reqparse, request
from ..models import Customer
from ..database import db

api = Api()

# Resources
class CustomerList(Resource): #For listing and creating customers
    def get(self):
        query = Customer.query
        name = request.args.get('name')
        phone = request.args.get('phone')

        if name:
            query = query.filter(Customer.name.ilike(f"%{name}%"))
        if phone:
            query = query.filter(Customer.phone.ilike(f"%{phone}%"))

        customers = query.all()
        return [{
            "id": c.id,
            "name": c.name,
            "phone": c.phone,
            "unpaid_money": c.unpaid_money,
            "type": c.type
        } for c in customers], 200

    def post(self):
        data = request.get_json(force=True)  # <-- get JSON body
        name = data.get('name')
        phone = data.get('phone')
        cust_type = data.get('type', 1)
        unpaid_money = data.get('unpaid_money', 0.0)

        if name and phone:
            try:
                existing_customer = Customer.query.filter_by(name=name).first()
                if existing_customer:
                    return {"message": "Customer already exists"}, 400

                customer = Customer(
                    name=name,
                    phone=phone,
                    type=cust_type,
                    unpaid_money=unpaid_money
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
        
        data = request.get_json(force=True)  # <-- get JSON body
        name = data.get('name')
        phone = data.get('phone')
        cust_type = data.get('type', 0)
        unpaid_money = data.get('unpaid_money', 0.0)
        try:

            if name:
                customer.name = name
            if phone:
                customer.phone = phone
            if unpaid_money:
                customer.unpaid_money = unpaid_money
            if cust_type is not None:
                customer.type = cust_type

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
