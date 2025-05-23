from datetime import datetime, timezone
from .database import db

class Customer(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False, unique=True)
    phone = db.Column(db.Integer, nullable=False)
    type = db.Column(db.Integer, nullable=False) #Type of customer: Wholesale(0), Retail(1).
    unpaid_money = db.Column(db.Float, default=0.0) #Unpaid money of customer.

    def __repr__(self):
        return f'<Customer {self.name}>'
    
class Item(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    size = db.Column(db.String(50), nullable=False)
    buy_price = db.Column(db.Float, nullable=False)
    quantity = db.Column(db.Float, nullable=False) # Quantity of item in stock.
    wholesale_price = db.Column(db.Float, nullable=False)
    alert_quantity = db.Column(db.Float, default=0.0) #Alert quantity of item.
    buy_date = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc)) #Buy date of item.
    expiry_duration = db.Column(db.Integer) #Expiry duration in number of months of item.

    def __repr__(self):
        return f'<Item {self.name}>'
    
class Bill(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(db.Integer, db.ForeignKey('customer.id'), nullable=False)
    item_id = db.Column(db.Integer, db.ForeignKey('item.id'), nullable=False)
    no_of_items = db.Column(db.Integer, nullable=False)
    total_price = db.Column(db.Float, nullable=False) #Total price of bill.
    date = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    customer = db.relationship('Customers', backref=db.backref('bill', lazy=True))
    item = db.relationship('Items', backref=db.backref('bill', lazy=True))

    def __repr__(self):
        return f'<Bill {self.id}>'
    
class BillxItems(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    bill_id = db.Column(db.Integer, db.ForeignKey('bill.id'), nullable=False)
    item_id = db.Column(db.Integer, db.ForeignKey('item.id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    price = db.Column(db.Float, nullable=False) #Price of item in bill at that time.

    bill = db.relationship('Bill', backref=db.backref('bill_x_items', lazy=True))
    item = db.relationship('Item', backref=db.backref('bill_x_items', lazy=True))

    def __repr__(self):
        return f'<Bill_x_Items {self.id}>'
    
class CustomCustomerPrice(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(db.Integer, db.ForeignKey('customer.id'), nullable=False)
    item_id = db.Column(db.Integer, db.ForeignKey('item.id'), nullable=False)
    price = db.Column(db.Float, nullable=False) #Custom price of item for customer.

    customer = db.relationship('Customer', backref=db.backref('custom_customer_price', lazy=True))
    item = db.relationship('Item', backref=db.backref('custom_customer_price', lazy=True))

    def __repr__(self):
        return f'<Custom_Customer_Price {self.id}>'