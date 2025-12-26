document.addEventListener("DOMContentLoaded", () => {

  const grid = document.getElementById("gasGrid");
  if (!grid) return;

  const gases = [
    "SO2","NOx","CO","Methane","Ammonia","CO2",
    "Hydrogen","Benzene","LPG","Butane",
    "Natural Gas","Temperature","Humidity"
  ];

  const colors = {
    SO2:"#22d3ee", NOx:"#facc15", CO:"#ef4444",
    Methane:"#8b5cf6", Ammonia:"#34d399", CO2:"#a855f7",
    Hydrogen:"#38bdf8", Benzene:"#fb7185",
    LPG:"#f97316", Butane:"#eab308",
    "Natural Gas":"#22c55e",
    Temperature:"#f472b6", Humidity:"#60a5fa"
  };

const safeLimits = {
  SO2: 0.5,
  NOx: 100,
  CO: 9,
  Methane: 1000,
  Ammonia: 25,
  CO2: 1000,
  Hydrogen: 400,
  Benzene: 1,
  LPG: 500,
  Butane: 500,
  "Natural Gas": 500,
  Temperature: 35,
  Humidity: 70
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

  function idSafe(t){ return t.replace(/\s/g,"_"); }

  function createCard(gas){
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
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: "Time",
              color: "#94a3b8",
              font: { size: 9 }
            },
            ticks: {
              color: "#94a3b8",
              font: { size: 9 }
            },
            grid: {
              color: "rgba(255,255,255,0.05)"
            }
          },
          y: {
            display: true,
            title: {
              display: true,
              text: "Value",
              color: "#94a3b8",
              font: { size: 9 }
            },
            ticks: {
              color: "#94a3b8",
              font: { size: 9 }
            },
            grid: {
              color: "rgba(255,255,255,0.05)"
            }
          }
        }
      }
    });
  }

  gases.forEach(createCard);

  function calcAQI(d){
    return Math.min(500, Math.round(d.CO2/4 + d.CO*2 + d.NOx));
  }

  function update(){
    fetch(`/api/building/${BUILDING}`)
      .then(r => r.json())
      .then(data => {

        document.getElementById("aqiValue").innerText = calcAQI(data);

        const time = new Date().toLocaleTimeString();

        gases.forEach(gas => {
          const id = idSafe(gas);
          const val = data[gas];

          document.getElementById(`val-${id}`).innerText = val;

          history[gas].push(val);
          labels[gas].push(time);
          
          const status = getStatus(gas, val);
          const statusEl = document.getElementById(`status-${id}`);
          statusEl.innerText = status.text;
          statusEl.className = `gas-status ${status.cls}`;

          if(history[gas].length > MAX){
            history[gas].shift();
            labels[gas].shift();
          }

          charts[gas].update();
        });
      })
      .catch(err => console.error("Update error:", err));
  }

  update();
  setInterval(update, 4000);
});
