// Monthly Modal
const monthlyModal = document.getElementById("monthlyGraphModal");
const monthlyIcon = document.getElementById("monthlyGraphIcon");
const closeMonthlyBtn = document.querySelector(".close-monthly");

monthlyIcon.onclick = function () {
  monthlyModal.style.display = "block";
  drawMonthlyChart();
};
closeMonthlyBtn.onclick = function () {
  monthlyModal.style.display = "none";
};

// Login Logic
document.getElementById("loginBtn").addEventListener("click", function () {
  const meterId = document.getElementById("meterId").value.trim();
  const password = document.getElementById("password").value.trim();

  if (meterId === "" || password === "") {
    alert("Please enter both Smart Meter ID and Password.");
    return;
  }

  alert(`Welcome! Smart Meter ID: ${meterId}`);
  document.getElementById("login-screen").style.display = "none";
  document.getElementById("reading-screen").style.display = "block";
  startReadings();
});

// Energy and Cost
let totalEnergy = 0;   // in kWh
const costPerUnit = 7; // ₹ per kWh
let lastEnergy = null;

// Simulated real-time readings
function startReadings() {
  setInterval(() => {
    const voltage = (220 + Math.random() * 5).toFixed(2);
    const current = (5 + Math.random() * 1).toFixed(2);
    const power = (voltage * current).toFixed(2); // W
    const apparentPower = (voltage * current * 1.05).toFixed(2);
    const reactivePower = (Math.random() * 500).toFixed(2);

    // Energy calculation
    const energyIncrement = (power * (1 / 3600)) / 1000; // kWh (per sec)
    totalEnergy += energyIncrement;
    const totalCost = (totalEnergy * costPerUnit).toFixed(2);

    // Theft detection
    let theftMsg = "";
    if (energyIncrement < 0) {
      theftMsg = "⚠️ Negative usage detected! Possible meter tampering.";
    } else if (lastEnergy !== null && energyIncrement < lastEnergy * 0.5) {
      theftMsg = "⚠️ Sudden drop (>50%) in usage detected! Possible theft or tampering.";
    }
    lastEnergy = energyIncrement;
    const theftAlert = document.getElementById("theft-alert");
    if (theftMsg) {
      theftAlert.textContent = theftMsg;
      theftAlert.style.display = "block";
    } else {
      theftAlert.style.display = "none";
    }

    // Update readings
    document.getElementById("voltage").textContent = voltage;
    document.getElementById("current").textContent = current;
    document.getElementById("power").textContent = power;
    document.getElementById("apparent").textContent = apparentPower;
    document.getElementById("reactive").textContent = reactivePower;
    document.getElementById("energy").textContent = totalEnergy.toFixed(4);
    document.getElementById("cost").textContent = totalCost;
  }, 1000);
}

// Graph modal logic
const modal = document.getElementById("graphModal");
const icon = document.getElementById("graphIcon");
const closeBtn = document.querySelector(".close");

const yearlyModal = document.getElementById("yearlyGraphModal");
const yearlyIcon = document.getElementById("yearlyGraphIcon");
const closeYearlyBtn = document.querySelector(".close-yearly");

icon.onclick = function () {
  modal.style.display = "block";
  drawChart();
};
closeBtn.onclick = function () {
  modal.style.display = "none";
};

yearlyIcon.onclick = function () {
  yearlyModal.style.display = "block";
  drawYearlyChart();
};
closeYearlyBtn.onclick = function () {
  yearlyModal.style.display = "none";
};

window.onclick = function (e) {
  if (e.target == modal) modal.style.display = "none";
  if (e.target == monthlyModal) monthlyModal.style.display = "none";
  if (e.target == yearlyModal) yearlyModal.style.display = "none";
};

// Draw monthly electricity usage chart
function drawMonthlyChart() {
  const ctx = document.getElementById("monthlyChart").getContext("2d");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const electricity = months.map(() => (Math.random() * 800 + 1200).toFixed(0));
  const costPerUnit = 7; // ₹ per kWh
  const costs = electricity.map(e => (e * costPerUnit).toFixed(0));

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: months,
      datasets: [
        {
          label: "Electricity Used (kWh)",
          data: electricity,
          backgroundColor: "#17a2b8",
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "top" },
        datalabels: {
          anchor: 'end',
          align: 'start',
          color: '#333',
          font: { weight: 'bold' },
          formatter: (value, context) => `₹${costs[context.dataIndex]}`
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const val = context.parsed.y;
              const cost = costs[context.dataIndex];
              return `Value: ${val} kWh, Cost: ₹${cost}`;
            }
          }
        }
      }
    },
    plugins: [ChartDataLabels]
  });
}

// Draw weekly usage chart
function drawChart() {
  const ctx = document.getElementById("readingChart").getContext("2d");
  const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun","Week Total"];
  const usage = Array.from({ length: 8 }, () => (Math.random() * 20 + 10).toFixed(2)); // kWh per day
  const costPerUnit = 7; // ₹ per kWh
  const costs = usage.map(e => (e * costPerUnit).toFixed(0));
  new Chart(ctx, {
    type: "bar",
    data: {
      labels: days,
      datasets: [
        {
          label: "Usage (kWh)",
          data: usage,
          backgroundColor: "#007bff",
        },
        {
          label: "Voltage (V)",
          data: Array.from({ length: 8 }, () => (220 + Math.random() * 5).toFixed(0)),
          backgroundColor: "#ffc107",
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "top" },
        datalabels: {
          anchor: 'end',
          align: 'start',
          color: '#333',
          font: { weight: 'bold' },
          formatter: (value, context) => `₹${costs[context.dataIndex]}`
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const val = context.parsed.y;
              const cost = costs[context.dataIndex];
              return `Value: ${val} kWh, Cost: ₹${cost}`;
            }
          }
        }
      }
    },
    plugins: [ChartDataLabels]
  });
}

// Draw yearly electricity usage chart
function drawYearlyChart() {
  const ctx = document.getElementById("yearlyChart").getContext("2d");
  const years = [2021, 2022, 2023, 2024, 2025];
  const electricity = years.map(() => (Math.random() * 9000 + 1000).toFixed(0));
  const costPerUnit = 7; // ₹ per kWh
  const costs = electricity.map(e => (e * costPerUnit).toFixed(0));

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: years,
      datasets: [
        {
          label: "Electricity Used (kWh)",
          data: electricity,
          backgroundColor: "#28a745",
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "top" },
        datalabels: {
          anchor: 'end',
          align: 'start',
          color: '#333',
          font: { weight: 'bold' },
          formatter: (value, context) => `₹${costs[context.dataIndex]}`
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const val = context.parsed.y;
              const cost = costs[context.dataIndex];
              return `Value: ${val} kWh, Cost: ₹${cost}`;
            }
          }
        }
      }
    },
    plugins: [ChartDataLabels]
  });
}