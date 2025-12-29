let minSeen = Infinity;
let maxSeen = -Infinity;

const ARC_START = -90;   // far left of semi-circle
const ARC_END   =  90;   // far right of semi-circle
const ARC_SWEEP = ARC_END - ARC_START; // 180

const needle = document.getElementById("needle");
const valueText = document.getElementById("valueText");

function updateGauge(value) {
  minSeen = Math.min(minSeen, value);
  maxSeen = Math.max(maxSeen, value);

  if (minSeen === maxSeen) maxSeen += 1;

  const percent = Math.max(
    0,
    Math.min(1, (value - minSeen) / (maxSeen - minSeen))
  );

  const angle = ARC_START + percent * ARC_SWEEP;

  needle.style.transform = `rotate(${angle}deg)`;
  valueText.innerText = value.toFixed(1);
}



/* TEST ONLY */
function simulate() {
  const v = Math.random() * 200;
  updateGauge(v);
}

/* Initial value */
updateGauge(27.3);
