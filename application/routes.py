from flask import current_app as app, jsonify, request


@app.route("/")
def index():
    return jsonify({"message": "Welcome to the Flask API!"})