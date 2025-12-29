document.addEventListener("DOMContentLoaded", () => {

  const historyBody = document.getElementById("historyBody");

  function loadHistory() {
    fetch(`/api/history/${window.BUILDING}`)
      .then(res => res.json())
      .then(rows => {
        historyBody.innerHTML = "";

        rows.forEach(row => {
          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td>${row.timestamp}</td>
            <td>${row.AQI}</td>
            <td>${row.Temperature ?? "--"}</td>
            <td>${row.Humidity ?? "--"}</td>
          `;
          historyBody.appendChild(tr);
        });
      })
      .catch(err => console.error("History error:", err));
  }

  // Initial load
  loadHistory();

  // Auto refresh every 10 seconds (NOW IT WORKS)
  setInterval(loadHistory, 10000);
});
