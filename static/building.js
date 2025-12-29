document.addEventListener("DOMContentLoaded", () => {

  /* ================= BASIC REFERENCES ================= */

  const gasGrid = document.getElementById("gasGrid");

  const aqiValueEl = document.getElementById("aqiValue");
  const tempValueEl = document.getElementById("tempValue");
  const humidityValueEl = document.getElementById("humidityValue");
  const waterFillEl = document.getElementById("waterFill");

  /* ================= GAS CONFIG ================= */

  const GASES = [
    { key: "SO2", unit: "ppm" },
    { key: "NOx", unit: "ppm" },
    { key: "CO", unit: "ppm" },
    { key: "Methane", unit: "ppm" },
    { key: "Ammonia", unit: "ppm" },
    { key: "CO2", unit: "ppm" },
    { key: "Hydrogen", unit: "ppm" },
    { key: "Benzene", unit: "ppm" },
    { key: "LPG", unit: "ppm" },
    { key: "Butane", unit: "ppm" },
    { key: "Natural Gas", unit: "ppm" }
  ];
const GAS_ZONES = {
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
};

  /* ================= GAUGE STATE ================= */

  const gasState = {};   // min / max tracking per gas

  const ARC_START = -90;
  const ARC_SWEEP = 180;

  /* ================= CREATE GAUGES ================= */

  function createGauges() {
    gasGrid.innerHTML = "";

    GASES.forEach(gas => {
      gasState[gas.key] = { min: Infinity, max: -Infinity };

      const card = document.createElement("div");
      card.className = "gauge-card";

      card.innerHTML = `
        <div class="gauge-clip">
          <div class="gauge">

            <div class="arc"></div>

            <div class="needle-wrapper">
              <div class="needle-container" id="needle-${gas.key}">
                <div class="needle"></div>
              </div>
              <div class="center-dot"></div>
            </div>

            <div class="gauge-text">
              <div class="gas-name">${gas.key}</div>
              <div class="gas-value">
                <span id="value-${gas.key}">--</span> ${gas.unit}
              </div>
            </div>

          </div>
        </div>
      `;

      /* CLICK → GAS DETAIL PAGE */
      card.addEventListener("click", () => {
        window.location.href = `/gas/${window.BUILDING}/${gas.key}`;
      });

      gasGrid.appendChild(card);
    });
  }

  /* ================= UPDATE ONE GAUGE ================= */

function updateGauge(gasKey, value) {
  const zones = GAS_ZONES[gasKey];
  if (!zones) return;

  /*
    zones = [g, gy, y, yr]
    Anything > yr is FULL RED
  */

  let percent;

  if (value <= zones[0]) {
    // GREEN
    percent = value / zones[0] * 0.25;
  }
  else if (value <= zones[1]) {
    // GREEN → YELLOW
    percent =
      0.25 +
      ((value - zones[0]) / (zones[1] - zones[0])) * 0.25;
  }
  else if (value <= zones[2]) {
    // YELLOW
    percent =
      0.50 +
      ((value - zones[1]) / (zones[2] - zones[1])) * 0.25;
  }
  else if (value <= zones[3]) {
    // YELLOW → RED
    percent =
      0.75 +
      ((value - zones[2]) / (zones[3] - zones[2])) * 0.25;
  }
  else {
    // 🔥 FULL RED (TOUCH ARC END)
    percent = 1.0;
  }

  // Clamp safety
  percent = Math.max(0, Math.min(1, percent));

  const angle = ARC_START + percent * ARC_SWEEP;

  const needle = document.getElementById(`needle-${gasKey}`);
  const valueEl = document.getElementById(`value-${gasKey}`);

  if (needle) needle.style.transform = `rotate(${angle}deg)`;
  if (valueEl) valueEl.innerText = value.toFixed(1);
}


  /* ================= FETCH & UPDATE ================= */

  function updateBuilding() {
    fetch(`/api/building/${window.BUILDING}`)
      .then(res => res.json())
      .then(data => {

        /* ---------- TOP METRICS ---------- */

        if (aqiValueEl && data.AQI !== undefined) {
          aqiValueEl.innerText = data.AQI;
        }

        if (tempValueEl && data.Temperature !== undefined) {
          tempValueEl.innerText = `${data.Temperature}°C`;
        }

        if (humidityValueEl && data.Humidity !== undefined) {
          humidityValueEl.innerText = `${data.Humidity}%`;
          if (waterFillEl) {
            waterFillEl.style.height = `${data.Humidity}%`;
          }
        }

        /* ---------- GAS GAUGES ---------- */

        GASES.forEach(gas => {
          if (data[gas.key] !== undefined) {
            updateGauge(gas.key, Number(data[gas.key]));
          }
        });
      })
      .catch(err => console.error("Building update error:", err));
  }

  /* ================= INIT ================= */

  createGauges();
  updateBuilding();
  setInterval(updateBuilding, 3000);

});
