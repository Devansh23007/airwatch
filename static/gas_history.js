document.addEventListener("DOMContentLoaded", () => {

  const table = document.getElementById("historyTable");

  function loadHistory() {
    fetch(`/api/gas/${BUILDING}/${GAS}`)
      .then(res => res.json())
      .then(data => {

        if (!data.history || data.history.length === 0) {
          table.innerHTML = `<tr><td colspan="2">No data available</td></tr>`;
          return;
        }

        table.innerHTML = "";
        data.history.forEach(row => {
          table.innerHTML += `
            <tr>
              <td>${row.time}</td>
              <td>${row.value}</td>
            </tr>
          `;
        });
      })
      .catch(() => {
        table.innerHTML = `<tr><td colspan="2">Error loading data</td></tr>`;
      });
  }

  loadHistory();
  setInterval(loadHistory, 4000); // auto-refresh history ONLY
});
