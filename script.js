let parsedData = [];
let headers = [];
let chartInstance = null;

const fileInput = document.getElementById("csvFile");
const uploadBtn = document.getElementById("uploadBtn");
const selectorSection = document.getElementById("selector-section");
const xSelect = document.getElementById("xSelect");
const ySelectContainer = document.getElementById("ySelectContainer");
const generateBtn = document.getElementById("generateBtn");
const chartTypeSelect = document.getElementById("chartTypeSelect");
const conclusionDiv = document.getElementById("conclusion");

// Fallback palette for "other" parameters (hex values)
const otherColors = [
  "#e6194b","#3cb44b","#ffe119","#4363d8","#f58231",
  "#911eb4","#46f0f0","#f032e6","#bcf60c","#fabebe",
  "#008080","#e6beff","#9a6324","#fffac8","#800000",
  "#aaffc3","#808000","#ffd8b1","#000075","#808080"
];

// Explicit hex mapping for named colors so we can append opacity reliably
const namedHex = {
  red: "#ff0000",
  blue: "#0000ff",
  yellow: "#ffff00",
  gray: "#808080"
};

uploadBtn.addEventListener("click", () => {
  const file = fileInput.files[0];
  if (!file) {
    alert("Please select a CSV file first!");
    return;
  }

  Papa.parse(file, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
    complete: function (results) {
      parsedData = results.data.filter(row => Object.keys(row).length > 1);
      if (!parsedData.length) {
        alert("No data found in CSV!");
        return;
      }
      headers = Object.keys(parsedData[0]);

      // Populate selectors
      xSelect.innerHTML = headers.map(h => `<option value="${h}">${h}</option>`).join("");
      ySelectContainer.innerHTML = headers
        .map(h => `<label><input type="checkbox" value="${h}"> ${h}</label>`)
        .join("");

      selectorSection.classList.remove("hidden");
      alert("✅ File uploaded successfully! Now select columns and chart type.");
    },
  });
});

/**
 * Determine color hex for a given header key.
 * Priority of checks:
 *  1) Explicit bracket/suffix/prefix markers like "(R)", "[B]", "_Y", "-N"
 *  2) Token match: exact token equals r/red, b/blue, y/yellow, n/neutral
 *  3) Fallback to otherColors palette
 */
function getColorHexForKey(key, otherIndexRef) {
  const raw = String(key || "");
  const trimmed = raw.trim();

  // 1) check bracket or trailing single-letter markers like (R), [B], _R, -Y
  // pattern examples: "Pressure (R)", "temp_R", "VALUE-B", "X [Y]"
  const bracketMatch = trimmed.match(/\((R|B|Y|N)\)$/i) || trimmed.match(/\[(R|B|Y|N)\]$/i);
  if (bracketMatch) {
    const ch = bracketMatch[1].toUpperCase();
    if (ch === "R") return namedHex.red;
    if (ch === "B") return namedHex.blue;
    if (ch === "Y") return namedHex.yellow;
    if (ch === "N") return namedHex.gray;
  }

  // check suffix/prefix patterns like "_R", "-B", "R_", "B-"
  const suffixMatch = trimmed.match(/[_\-\.\s]([RBYN])$/i) || trimmed.match(/^([RBYN])[_\-\.\s]/i);
  if (suffixMatch) {
    const ch = suffixMatch[1].toUpperCase();
    if (ch === "R") return namedHex.red;
    if (ch === "B") return namedHex.blue;
    if (ch === "Y") return namedHex.yellow;
    if (ch === "N") return namedHex.gray;
  }

  // 2) normalize and split into tokens by non-alphanumeric chars
  const tokens = trimmed
    .replace(/\s+/g, " ")
    .split(/[^A-Za-z0-9]+/)
    .map(t => t.toLowerCase())
    .filter(Boolean);

  // token-level exact matches (strong match)
  if (tokens.includes("red") || tokens.includes("r")) return namedHex.red;
  if (tokens.includes("blue") || tokens.includes("b")) return namedHex.blue;
  if (tokens.includes("yellow") || tokens.includes("y")) return namedHex.yellow;
  if (tokens.includes("neutral") || tokens.includes("n") || tokens.includes("gray") || tokens.includes("grey")) return namedHex.gray;

  // 3) fallback to palette
  const color = otherColors[otherIndexRef.value % otherColors.length];
  otherIndexRef.value++;
  return color;
}

generateBtn.addEventListener("click", () => {
  const xKey = xSelect.value;
  const selectedY = [...ySelectContainer.querySelectorAll("input:checked")].map(cb => cb.value);
  const chartType = chartTypeSelect.value;

  if (!xKey || selectedY.length === 0) {
    alert("Please select X-axis and at least one Y-axis parameter.");
    return;
  }

  const labels = parsedData.map(row => row[xKey] !== undefined ? String(row[xKey]) : "");
  const ctx = document.getElementById("dataChart").getContext("2d");

  if (chartInstance) chartInstance.destroy();

  // index holder object because JS numbers are passed by value
  const otherIndexRef = { value: 0 };

  // Build datasets (special handling for pie/doughnut could be added later)
  const datasets = selectedY.map(key => {
    const data = parsedData.map(row => row[key] !== undefined ? row[key] : null);

    const colorHex = getColorHexForKey(key, otherIndexRef);

    return {
      label: key,
      data: data,
      borderColor: colorHex,
      // safe background (append opacity hex if hex string length is 7)
      backgroundColor: (colorHex.length === 7 ? (colorHex + "66") : colorHex),
      fill: chartType === "line" ? false : true,
      tension: 0.4,
      borderWidth: 2,
      pointRadius: 3
    };
  });

  // If user selected pie/doughnut and multiple Y parameters, Chart.js expects a single dataset.
  // We'll create a single dataset where each selected Y becomes one slice sized by the sum of its values.
  if (chartType === "pie" || chartType === "doughnut") {
    const sliceData = datasets.map(ds => {
      // compute numeric total for that series, ignoring non-numeric
      return ds.data.reduce((acc, v) => acc + (typeof v === "number" && !isNaN(v) ? v : 0), 0);
    });
    const sliceBackgrounds = datasets.map(ds => ds.borderColor);
    // single dataset with each selectedY as a label/slice
    chartInstance = new Chart(ctx, {
      type: chartType,
      data: {
        labels: selectedY,
        datasets: [{
          label: "Slices",
          data: sliceData,
          backgroundColor: sliceBackgrounds,
          borderColor: sliceBackgrounds,
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { labels: { color: "#f8f9fa" } },
          title: { display: true, text: "CSV Data Visualization (Pie/Doughnut)", color: "#00d1ff" }
        }
      }
    });
  } else {
    // Normal chart types: line, bar, etc. (multiple datasets allowed)
    chartInstance = new Chart(ctx, {
      type: chartType,
      data: { labels, datasets },
      options: {
        responsive: true,
        plugins: {
          legend: { labels: { color: "#f8f9fa" } },
          title: {
            display: true,
            text: "CSV Data Visualization",
            color: "#00d1ff"
          }
        },
        scales: {
          x: { ticks: { color: "#ddd" }, title: { display: true, text: xKey, color: "#00d1ff" } },
          y: { ticks: { color: "#ddd" }, title: { display: true, text: "Values", color: "#00d1ff" } }
        }
      }
    });
  }

  // Compute conclusion (works for line/bar etc; for pie we used sums)
  const allValues = (chartType === "pie" || chartType === "doughnut")
    ? datasets.map((ds, i) => datasets[i].data.reduce((a,b)=> a + (typeof b === "number" && !isNaN(b) ? b : 0), 0))
    : datasets.flatMap(ds => ds.data.filter(v => typeof v === "number" && !isNaN(v)));

  const maxVal = allValues.length ? Math.max(...allValues) : null;
  const minVal = allValues.length ? Math.min(...allValues) : null;
  const highLabel = maxVal !== null ? (chartType === "pie" || chartType === "doughnut" ? selectedY[allValues.indexOf(maxVal)] : labels[(datasets.flatMap(ds=>ds.data)).indexOf(maxVal)]) : "-";
  const lowLabel = minVal !== null ? (chartType === "pie" || chartType === "doughnut" ? selectedY[allValues.indexOf(minVal)] : labels[(datasets.flatMap(ds=>ds.data)).indexOf(minVal)]) : "-";

  conclusionDiv.innerHTML = `📈 <b>Conclusion:</b> Highest reading = <b>${maxVal}</b> at <b>${highLabel}</b>, 
  Lowest reading = <b>${minVal}</b> at <b>${lowLabel}</b>. Colors assigned: R=Red, B=Blue, Y=Yellow, N=Gray, others unique.`;
  conclusionDiv.classList.remove("hidden");
});
