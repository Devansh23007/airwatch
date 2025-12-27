from flask import Flask, render_template, jsonify
import random
import threading
import time

app = Flask(__name__)

# =========================================================
# GLOBAL STATE (SINGLE SOURCE OF TRUTH)
# =========================================================
BUILDING_DATA = {
    "Anviksha": {},
    "SOT": {},
    "SOS": {}
}

# =========================================================
# AQI CALCULATION FUNCTION
# =========================================================
def calculate_aqi(d):
    """
    Custom composite AQI model for campus monitoring
    """
    aqi = (
        d.get("CO2", 0) / 4 +
        d.get("CO", 0) * 2 +
        d.get("NOx", 0) * 1.5 +
        d.get("SO2", 0) * 10
    )
    return min(500, round(aqi))


# =========================================================
# GAS DATA GENERATION (REPLACE LATER WITH REAL SENSORS)
# =========================================================
def generate_gas_data():
    return {
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
    }


# =========================================================
# UPDATE ALL BUILDINGS TOGETHER
# =========================================================
def update_all_buildings():
    for building in BUILDING_DATA:
        data = generate_gas_data()
        data["AQI"] = calculate_aqi(data)
        BUILDING_DATA[building] = data


# =========================================================
# BACKGROUND UPDATER (EVERY 3 SECONDS)
# =========================================================
def background_updater():
    while True:
        update_all_buildings()
        time.sleep(3)

threading.Thread(target=background_updater, daemon=True).start()


# =========================================================
# ROUTES
# =========================================================
@app.route("/")
def index():
    return render_template("index.html")


@app.route("/building/<name>")
def building_page(name):
    return render_template("building.html", building=name)


@app.route("/api/building/<name>")
def building_data(name):
    return jsonify(BUILDING_DATA.get(name, {}))


# =========================================================
# RUN APP (RELOADER DISABLED – IMPORTANT)
# =========================================================
if __name__ == "__main__":
    app.run(debug=True, use_reloader=False)
