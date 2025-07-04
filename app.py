from flask import Flask
from application.database import db
from application.config import LocalConfig
from application.models import Customer, Item, Bill, BillxItems, CustomCustomerPrice
from application.resources.customer import * 
from application.resources.item import item_bp
from application.resources.bill import bill_bp
from application.resources.billxitems import billxitems_bp
from application.resources.custom_customer_price import custom_customer_price_bp
from application.resources.unpaid_money import unpaid_money_bp
from application.resources.purchase import purchase_bp
from application.resources.statistics import statistics_bp


def create_app():
    app = Flask(__name__)
    app.config.from_object(LocalConfig)
    db.init_app(app)
    api.init_app(app)
    app.app_context().push()

    return app

app = create_app()
app.register_blueprint(item_bp, url_prefix='/api')
app.register_blueprint(bill_bp, url_prefix='/api')
app.register_blueprint(billxitems_bp, url_prefix='/api')
app.register_blueprint(custom_customer_price_bp, url_prefix='/api')
app.register_blueprint(unpaid_money_bp, url_prefix='/api')
app.register_blueprint(purchase_bp, url_prefix='/api')
app.register_blueprint(statistics_bp)

from application.routes import *

with  app.app_context():
    db.create_all() #It works only once or when  database is not present.

if __name__ == "__main__":
    app.run()
