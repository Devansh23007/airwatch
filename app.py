from flask import Flask, render_template, jsonify, send_file
import random, threading, time, sqlite3
import csv
import os
from datetime import datetime

app = Flask(__name__)

# ===================== GLOBAL DATA =====================

BUILDING_DATA = {
    "Anviksha": {},
    "SOT": {},
    "SOS": {}
}

# ===================== DATABASE INIT =====================

def init_db():
    with sqlite3.connect("aqi_data.db") as db:
        cur = db.cursor()
        cur.execute("""
        CREATE TABLE IF NOT EXISTS readings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            building TEXT,

            aqi REAL,
            temperature REAL,
            humidity REAL,

            so2 REAL,
            nox REAL,
            co REAL,
            methane REAL,
            ammonia REAL,
            co2 REAL,
            hydrogen REAL,
            benzene REAL,
            lpg REAL,
            butane REAL,
            natural_gas REAL
        )
        """)
        db.commit()

init_db()

# ===================== AQI LOGIC =====================

def calculate_aqi(d):
    aqi = (
        d.get("CO2", 0) / 4 +
        d.get("CO", 0) * 2 +
        d.get("NOx", 0) * 1.5 +
        d.get("SO2", 0) * 10
    )
    return min(500, round(aqi))

# ===================== GAS GENERATION =====================

def generate_gas_data():
    return {
        "SO2": round(random.uniform(0.05, 1.0), 2),
        "NOx": round(random.uniform(10, 100), 1),
        "CO": round(random.uniform(1, 50), 1),
        "Methane": round(random.uniform(300, 2000), 1),
        "Ammonia": round(random.uniform(1, 50), 1),
        "CO2": random.randint(400, 2000),
        "Hydrogen": round(random.uniform(10, 200), 1),
        "Benzene": round(random.uniform(0.1, 5), 2),
        "LPG": round(random.uniform(50, 500), 1),
        "Butane": round(random.uniform(50, 500), 1),
        "Natural Gas": round(random.uniform(100, 1000), 1),
        "Temperature": round(random.uniform(18, 40), 1),
        "Humidity": random.randint(30, 90)
    }

# ===================== SAVE TO DB =====================

def save_to_db(building, data):
    with sqlite3.connect("aqi_data.db", check_same_thread=False) as db:
        cur = db.cursor()
        cur.execute("""
            INSERT INTO readings (
                building, aqi, temperature, humidity,
                so2, nox, co, methane, ammonia, co2,
                hydrogen, benzene, lpg, butane, natural_gas
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            building,
            data["AQI"],
            data["Temperature"],
            data["Humidity"],
            data["SO2"],
            data["NOx"],
            data["CO"],
            data["Methane"],
            data["Ammonia"],
            data["CO2"],
            data["Hydrogen"],
            data["Benzene"],
            data["LPG"],
            data["Butane"],
            data["Natural Gas"]
        ))
        db.commit()

# ===================== CSV PER BUILDING (UPDATED) =====================

DATA_DIR = "data"
os.makedirs(DATA_DIR, exist_ok=True)

def save_to_csv(building, data):
    file_path = os.path.join(DATA_DIR, f"{building}.csv")
    file_exists = os.path.isfile(file_path)

    with open(file_path, mode="a", newline="") as f:
        writer = csv.writer(f)

        if not file_exists:
            writer.writerow([
                "timestamp", "building",
                "AQI", "Temperature", "Humidity",
                "SO2", "NOx", "CO", "Methane", "Ammonia",
                "CO2", "Hydrogen", "Benzene",
                "LPG", "Butane", "Natural_Gas"
            ])

        writer.writerow([
            datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            building,
            data["AQI"],
            data["Temperature"],
            data["Humidity"],
            data["SO2"],
            data["NOx"],
            data["CO"],
            data["Methane"],
            data["Ammonia"],
            data["CO2"],
            data["Hydrogen"],
            data["Benzene"],
            data["LPG"],
            data["Butane"],
            data["Natural Gas"]
        ])

# ===================== BACKGROUND UPDATE =====================

def update_all():
    for b in BUILDING_DATA:
        d = generate_gas_data()
        d["AQI"] = calculate_aqi(d)
        BUILDING_DATA[b] = d
        save_to_db(b, d)
        save_to_csv(b, d)

def background():
    while True:
        update_all()
        time.sleep(3)

threading.Thread(target=background, daemon=True).start()

# ===================== ROUTES =====================

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/building/<name>")
def building(name):
    return render_template("building.html", building=name)

@app.route("/api/building/<name>")
def api_building(name):
    return jsonify(BUILDING_DATA.get(name, {}))

@app.route("/gas/<building>/<gas_name>")
def gas_detail(building, gas_name):
    return render_template("gas_detail.html", building=building, gas_name=gas_name)

@app.route("/gas/<building>/<gas_name>/history")
def gas_history(building, gas_name):
    return render_template("gas_history.html", building=building, gas_name=gas_name)

# ===================== GAS API =====================

@app.route("/api/gas/<building>/<gas_name>")
def api_gas(building, gas_name):

    data = BUILDING_DATA.get(building, {})
    value = data.get(gas_name)

    if value is None:
        return jsonify({"error": "Gas not found"}), 404

    GAS_ZONES = {
        "SO2": [0.2, 0.4, 0.6, 0.8],
        "NOx": [20, 40, 60, 80],
        "CO": [9, 15, 25, 35],
        "Methane": [500, 1000, 1500, 1800],
        "Ammonia": [10, 20, 30, 40],
        "CO2": [600, 1000, 1400, 1800],
        "Hydrogen": [40, 80, 120, 160],
        "Benzene": [1, 2, 3, 4],
        "LPG": [100, 200, 300, 400],
        "Butane": [100, 200, 300, 400],
        "Natural Gas": [200, 400, 600, 800]
    }

    zones = GAS_ZONES.get(gas_name, [])
    if zones and value <= zones[1]:
        status = "Safe"
    elif zones and value <= zones[3]:
        status = "Moderate"
    else:
        status = "Danger"

    gas_column_map = {
        "SO2": "so2",
        "NOx": "nox",
        "CO": "co",
        "Methane": "methane",
        "Ammonia": "ammonia",
        "CO2": "co2",
        "Hydrogen": "hydrogen",
        "Benzene": "benzene",
        "LPG": "lpg",
        "Butane": "butane",
        "Natural Gas": "natural_gas"
    }

    col = gas_column_map.get(gas_name)

    with sqlite3.connect("aqi_data.db") as db:
        cur = db.cursor()
        cur.execute(f"""
            SELECT timestamp, {col}
            FROM readings
            WHERE building=?
            ORDER BY timestamp DESC
            LIMIT 30
        """, (building,))
        rows = cur.fetchall()

    history = [{"time": r[0], "value": r[1]} for r in rows if r[1] is not None]

    return jsonify({
        "gas": gas_name,
        "unit": "ppm",
        "current": value,
        "status": status,
        "history": history[::-1]
    })

# ===================== BUILDING HISTORY =====================

@app.route("/history/<building>")
def history(building):
    return render_template("history.html", building=building)

@app.route("/api/history/<building>")
def api_history(building):
    with sqlite3.connect("aqi_data.db") as db:
        cur = db.cursor()
        cur.execute("""
            SELECT timestamp, aqi, temperature, humidity
            FROM readings
            WHERE building=?
            ORDER BY timestamp DESC
            LIMIT 30
        """, (building,))
        rows = cur.fetchall()

    return jsonify([
        {
            "timestamp": r[0],
            "AQI": r[1],
            "Temperature": r[2],
            "Humidity": r[3]
        } for r in rows
    ])

@app.route("/download/<building>/csv")
def download_building_csv(building):
    file_path = os.path.join("data", f"{building}.csv")

    if not os.path.exists(file_path):
        return "CSV file not found", 404

    return send_file(
        file_path,
        mimetype="text/csv",
        as_attachment=True,
        download_name=f"{building}_history.csv"
    )
# ===================== RUN =====================

if __name__ == "__main__":
    app.run(debug=True, use_reloader=False)
