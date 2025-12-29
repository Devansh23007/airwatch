import sqlite3

db = sqlite3.connect("aqi_data.db")
cur = db.cursor()

cur.execute("""
SELECT building, aqi, timestamp
FROM readings
ORDER BY id DESC
LIMIT 5
""")

rows = cur.fetchall()

for row in rows:
    print(row)

db.close()
