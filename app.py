from flask import Flask
from application.database import db
from application.config import LocalConfig
from application.models import Customer, Item, Bill, BillxItems, CustomCustomerPrice
from application.resources import * 


def create_app():
    app = Flask(__name__)
    app.config.from_object(LocalConfig)
    db.init_app(app)
    api.init_app(app)
    app.app_context().push()

    return app

app = create_app()

from application.routes import *

with  app.app_context():
    db.create_all() #It works only once or when  database is not present.

if __name__ == "__main__":
    app.run()
