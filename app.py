from flask import Flask
from application.database import db
from application.config import LocalConfig
from application.models import Customer, Item, Bill, Bill_x_Items, custom_customer_price


def create_app():
    app = Flask(__name__)
    app.config.from_object(LocalConfig)
    db.init_app(app)
    app.app_context().push()

    return app

app = create_app()

if __name__ == "__main__":
    app.run()
