document.addEventListener("DOMContentLoaded", () => {

  const valueEl = document.getElementById("gasValue");
  const statusEl = document.getElementById("gasStatus");
  const canvas = document.getElementById("gasChart");

  if (!valueEl || !statusEl || !canvas) {
    console.error("Gas detail elements missing");
    return;
  }

  const ctx = canvas.getContext("2d");
  let chart = null;

  function loadGasData() {
    fetch(`/api/gas/${BUILDING}/${GAS}`)
      .then(res => res.json())
      .then(data => {

        /* ---------- VALUE & STATUS ---------- */
        valueEl.innerText = data.current.toFixed(1);
        statusEl.innerText = data.status;
        statusEl.className = `status-badge ${data.status.toLowerCase()}`;

        const labels = data.history.map(h => h.time);
        const values = data.history.map(h => h.value);

        /* ---------- CHART ---------- */
        if (!chart) {
          chart = new Chart(ctx, {
            type: "line",
            data: {
              labels,
              datasets: [{
                label: GAS,
                data: values,
                borderColor: "#facc15",
                backgroundColor: "rgba(250,204,21,0.25)",
                borderWidth: 3,
                tension: 0.45,
                fill: true,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointBackgroundColor: "#fde047",
                pointBorderWidth: 0
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              animation: false,   // 🔥 prevents flicker
              plugins: {
                legend: {
                  labels: { color: "#93c5fd" }
                }
              },
              scales: {
                x: {
                  grid: { display: false },
                  ticks: { color: "#94a3b8" }
                },
                y: {
                  grid: { display: false },
                  ticks: { color: "#94a3b8" }
                }
              }
            }
          });
        } else {
          chart.data.labels = labels;
          chart.data.datasets[0].data = values;
          chart.update();
        }
      })
      .catch(err => console.error("Gas refresh error:", err));
  }

  /* ---------- INITIAL LOAD ---------- */
  loadGasData();

  /* ---------- AUTO REFRESH (LIVE) ---------- */
  setInterval(loadGasData, 3000);   // same as backend update
});
