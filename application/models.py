from datetime import datetime, timezone
from .database import db
import pytz
from sqlalchemy import func


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
    
    def get_unpaid_money(self):
        result = db.session.query(
            func.coalesce(func.sum(Unpaid.add), 0) - func.coalesce(func.sum(Unpaid.sub), 0)
        ).filter(Unpaid.customer_id == self.id).first()
        amt = result[0] if result else 0.0
        self.unpaid_money = amt  # Update the customer's unpaid money
        return amt

class Item(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    size = db.Column(db.String(50), nullable=False)
    category = db.Column(db.String(50)) #Category of item.
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
                "category": self.category,
                "quantity": self.quantity,
                "buy_price": self.buy_price,
                "wholesale_price": self.wholesale_price,
                "retail_price": self.retail_price,
                "alert_quantity": self.alert_quantity,
                "buy_date": self.buy_date.isoformat() if self.buy_date else None,
                "expiry_duration": self.expiry_duration 
                }
    
    def recompute_quantity(self):
        """Recompute and update this item's quantity from all purchases and sales."""
        purchase_sum = db.session.query(func.coalesce(func.sum(Purchase.quantity), 0)).filter_by(item_id=self.id).scalar()
        sold_sum = db.session.query(func.coalesce(func.sum(BillxItems.quantity), 0)).filter_by(item_id=self.id).scalar()
        self.quantity = (purchase_sum or 0) - (sold_sum or 0)
        db.session.commit()
    
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
            "customer_name": self.customer.name if self.customer else None,
            "customer_phone": self.customer.phone if self.customer else None,
            "customer_type": self.customer.type if self.customer else None,
            "unpaid_money": self.customer.get_unpaid_money() if self.customer else None,
            "no_of_items": self.no_of_items,
            "total_price": self.total_price,
            "date": self.date.isoformat() if self.date else None,
            "items": self.items_json()  # Include items in the bill
        }
    def items_json(self):
        """Return all BillxItems for this bill as a list of dicts (JSON serializable)."""
        return [
            {
                "id": bxi.id,
                "item_id": bxi.item_id,
                "item_name": bxi.item.name if bxi.item else None,
                "item_size": bxi.item.size if bxi.item else None,
                "quantity": bxi.quantity,
                "price": bxi.price
            }
            for bxi in self.bill_x_items
        ]
    
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
    
class Unpaid(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(db.Integer, db.ForeignKey('customer.id'), nullable=False)
    add = db.Column(db.Float, nullable=True, default=0.0) 
    sub = db.Column(db.Float, nullable=True, default=0.0) 
    date = db.Column(db.DateTime, default=lambda: datetime.now())

    customer = db.relationship('Customer', backref=db.backref('unpaid_money_records', lazy=True))

    def __repr__(self):
        return f'<Unpaid_Money {self.id}>'
    
    def to_dict(self):
        return {
            "id": self.id,
            "customer_id": self.customer_id,
            "add": self.add,
            "sub": self.sub,
            "date": self.date.isoformat() if self.date else None
        }
    
class Purchase(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    item_id = db.Column(db.Integer, db.ForeignKey('item.id'), nullable=False)
    quantity = db.Column(db.Float, nullable=False)  # Inward quantity
    buy_price = db.Column(db.Float, nullable=False)  # Buy price at that time
    sell_price = db.Column(db.Float, nullable=True)  # Sell price at that time (optional)
    date = db.Column(db.DateTime, default=lambda: datetime.now())

    item = db.relationship('Item', backref=db.backref('purchases', lazy=True))

    def __repr__(self):
        return f'<Purchase {self.id} - Item {self.item_id}>'

    def to_dict(self):
        return {
            "id": self.id,
            "item_id": self.item_id,
            "item_name": self.item.name if self.item else None,
            "quantity": self.quantity,
            "buy_price": self.buy_price,
            "sell_price": self.sell_price,
            "date": self.date.isoformat() if self.date else None
        }