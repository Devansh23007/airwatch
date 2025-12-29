document.addEventListener("DOMContentLoaded", () => {

  const grid = document.getElementById("gasGrid");
  if (!grid) return;

  // Gases to show charts for
  const gases = [
    "SO2","NOx","CO","Methane","Ammonia","CO2",
    "Hydrogen","Benzene","LPG","Butane","Natural Gas"
  ];

  const colors = {
    SO2:"#22d3ee", NOx:"#facc15", CO:"#ef4444",
    Methane:"#8b5cf6", Ammonia:"#34d399", CO2:"#a855f7",
    Hydrogen:"#38bdf8", Benzene:"#fb7185",
    LPG:"#f97316", Butane:"#eab308",
    "Natural Gas":"#22c55e"
  };

  const safeLimits = {
    SO2: 0.5, NOx: 100, CO: 9, Methane: 1000,
    Ammonia: 25, CO2: 1000, Hydrogen: 400,
    Benzene: 1, LPG: 500, Butane: 500,
    "Natural Gas": 500
  };

  function getStatus(gas, value) {
    const limit = safeLimits[gas];
    if (value <= limit * 0.7) return { text: "Safe", cls: "status-safe" };
    if (value <= limit) return { text: "Moderate", cls: "status-moderate" };
    return { text: "Bad", cls: "status-bad" };
  }

  const charts = {};
  const history = {};
  const labels = {};
  const MAX = 12;

  function idSafe(name) {
    return name.replace(/\s/g, "_");
  }

  // Create gas cards and charts
  gases.forEach(gas => {
    const id = idSafe(gas);

    const card = document.createElement("div");
    card.className = "gas-card";
    card.innerHTML = `
      <div class="gas-title">${gas}</div>
      <div class="gas-value" id="val-${id}">--</div>
      <div class="gas-status" id="status-${id}">--</div>
      <canvas id="cv-${id}"></canvas>
    `;
    grid.appendChild(card);

    history[gas] = [];
    labels[gas] = [];

    const ctx = document.getElementById(`cv-${id}`).getContext("2d");

    charts[gas] = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels[gas],
        datasets: [{
          data: history[gas],
          borderColor: colors[gas],
          borderWidth: 2,
          tension: 0.4,
          fill: true,
          backgroundColor: colors[gas] + "44"
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { display: true },
          y: { beginAtZero: true }
        }
      }
    });
  });

  // Fetch and update data
  function update() {
    fetch(`/api/building/${window.BUILDING}`)
      .then(res => res.json())
      .then(data => {

        // AQI
        const aqiEl = document.getElementById("aqiValue");
        if (aqiEl && typeof data.AQI === "number") {
          aqiEl.innerText = data.AQI;
        }

        // Temperature & Humidity
        const tempEl = document.getElementById("tempValue");
        if (tempEl && data.Temperature !== undefined) {
          tempEl.innerText = Number(data.Temperature) + "°C";
        }
        
        
        const hum = Number(data.Humidity);
        const humEl = document.getElementById("humidityValue");
        const water = document.getElementById("waterFill");

        if (!isNaN(hum)) {
          humEl.innerText = hum + "%";
          water.style.height = hum + "%";
        }

        const time = new Date().toLocaleTimeString();
        let tempHover = document.getElementById(`temp-${name}`);
        let humHover  = document.getElementById(`hum-${name}`);

        if (tempHover) tempHover.innerText = data.Temperature ?? "--";
        if (humHover)  humHover.innerText  = data.Humidity ?? "--";

        gases.forEach(gas => {
          const id = idSafe(gas);
          const val = Number(data[gas]);

          if (!isNaN(val)) {
            document.getElementById(`val-${id}`).innerText = val;

            history[gas].push(val);
            labels[gas].push(time);

            if (history[gas].length > MAX) {
              history[gas].shift();
              labels[gas].shift();
            }

            const status = getStatus(gas, val);
            const st = document.getElementById(`status-${id}`);
            st.innerText = status.text;
            st.className = `gas-status ${status.cls}`;

            charts[gas].update();
          } else {
            document.getElementById(`val-${id}`).innerText = "--";
          }
        });
      })
      .catch(err => console.error("Update error:", err));
  }

  update();
  setInterval(update, 4000);
});
