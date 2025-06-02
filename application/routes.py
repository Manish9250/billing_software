from flask import current_app as app, jsonify, request, render_template


@app.route("/")
def index():
    return render_template("index.html")