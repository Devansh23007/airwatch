from flask import Flask, render_template, jsonify
import random

app = Flask(__name__)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/building/<name>")
def building(name):
    return render_template("building.html", building=name)

@app.route("/api/building/<name>")
def building_data(name):
    return jsonify({
        "SO2": round(random.uniform(0.05, 0.5), 2),
        "NOx": round(random.uniform(10, 120), 1),
        "CO": round(random.uniform(1, 20), 1),
        "Methane": round(random.uniform(300, 1800), 1),
        "Ammonia": round(random.uniform(1, 40), 1),
        "CO2": random.randint(400, 1200),
        "Hydrogen": round(random.uniform(10, 300), 1),
        "Benzene": round(random.uniform(0.1, 2.5), 2),
        "LPG": round(random.uniform(50, 400), 1),
        "Butane": round(random.uniform(50, 400), 1),
        "Natural Gas": round(random.uniform(100, 600), 1),
        "Temperature": round(random.uniform(18, 40), 1),
        "Humidity": random.randint(30, 90)
    })

if __name__ == "__main__":
    app.run(debug=True)
