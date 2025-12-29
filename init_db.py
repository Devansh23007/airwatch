import sqlite3

db = sqlite3.connect("aqi_data.db")
cur = db.cursor()

cur.execute("""
CREATE TABLE IF NOT EXISTS readings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    building TEXT,
    aqi INTEGER,
    temperature REAL,
    humidity INTEGER,
    co REAL,
    nox REAL,
    so2 REAL,
    co2 REAL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
)
""")

db.commit()
db.close()

print("Database initialized successfully")
