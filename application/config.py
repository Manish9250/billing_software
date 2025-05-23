class Config():
    DEBUG = True
    SQLALCHEMY_TRACK_MODIFICATIONS = True


class LocalConfig(Config):
    SQLALCHEMY_DATABASE_URI = 'sqlite:///local.db'
    DEBUG = True

    