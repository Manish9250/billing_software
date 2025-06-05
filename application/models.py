from datetime import datetime, timezone
from .database import db
import pytz


india = pytz.timezone('Asia/Kolkata')
now = datetime.now(india)  # Localized time

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
    retail_price = db.Column(db.Float, nullable=False)
    alert_quantity = db.Column(db.Float, default=0.0) #Alert quantity of item.
    buy_date = db.Column(db.DateTime, default=lambda: datetime.now()) #Buy date of item.
    expiry_duration = db.Column(db.Integer) #Expiry duration in number of months of item.

    def __repr__(self):
        return f'<Item {self.name}>'
    
    def to_dict(self):
        return {
                "id": self.id,
                "name": self.name,
                "size": self.size,
                "quantity": self.quantity,
                "buy_price": self.buy_price,
                "wholesale_price": self.wholesale_price,
                "retail_price": self.retail_price,
                "alert_quantity": self.alert_quantity,
                "buy_date": self.buy_date.isoformat() if self.buy_date else None,
                "expiry_duration": self.expiry_duration 
                }
    
class Bill(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(db.Integer, db.ForeignKey('customer.id'), nullable=False)
    no_of_items = db.Column(db.Integer, nullable=True, default=0)
    total_price = db.Column(db.Float, default=0.0) #Total price of bill.
    date = db.Column(db.DateTime, default=lambda: datetime.now())

    customer = db.relationship('Customer', backref=db.backref('bill', lazy=True))

    def __repr__(self):
        return f'<Bill {self.id}>'
    
    def to_dict(self):
        return {
            "id": self.id,
            "customer_id": self.customer_id,
            "no_of_items": self.no_of_items,
            "total_price": self.total_price,
            "date": self.date.isoformat() if self.date else None 
        }
    
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
    
    def to_dict(self):
        return {
            "id": self.id,
            "customer_id": self.customer_id,
            "item_id": self.item_id,
            "price": self.price
        }