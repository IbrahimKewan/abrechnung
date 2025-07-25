// script.js
const form = document.getElementById("expenseForm");
const monthlyOverview = document.getElementById("monthlyOverview");
const yearlyOverview = document.getElementById("yearlyOverview");
const yearlySummary = document.getElementById("yearlySummary");
const monthlyDetail = document.getElementById("monthlyDetail");
const toggleBtn = document.getElementById("toggleViewBtn");
const viewTitle = document.getElementById("viewTitle");

let isYearly = false;

async function checkLogin() {
    const password = document.getElementById("passwordInput").value;
    const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
    });

    const result = await res.json();
    if (result.success) {
        document.getElementById("login").classList.add("hidden");
        document.getElementById("app").classList.remove("hidden");
    } else {
        alert("Falsches Passwort");
    }
}

async function loadData() {
    const res = await fetch("/api/ausgaben");
    return await res.json();
}

async function saveData(data) {
    await fetch("/api/ausgaben", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
}

async function deleteEntry(index, monthKey) {
    const data = await loadData();
    const grouped = groupByMonth(data);
    const entries = grouped[monthKey] || [];
    const entryToDelete = entries[index];

    await fetch("/api/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            date: entryToDelete.date,
            title: entryToDelete.title,
            amount: entryToDelete.amount,
        }),
    });

    await renderMonthlyOverview();
    await renderYearlyOverview();
    if (isYearly) await showMonthDetail(monthKey);
}

function groupByMonth(data) {
    return data.reduce((acc, entry) => {
        const date = new Date(entry.date);
        const key = `${date.getFullYear()}-${(date.getMonth() + 1)
            .toString()
            .padStart(2, "0")}`;
        if (!acc[key]) acc[key] = [];
        acc[key].push(entry);
        return acc;
    }, {});
}

function getCategoryColor(category) {
    switch (category) {
        case "Gehalt":
            return "bg-green-100 text-green-700";
        case "Miete":
            return "bg-red-100 text-red-700";
        case "Lebensmittel":
            return "bg-yellow-100 text-yellow-700";
        case "Auto":
            return "bg-blue-100 text-blue-700";
        case "Freizeit":
            return "bg-purple-100 text-purple-700";
        case "Sonstiges":
        default:
            return "bg-gray-100 text-gray-700";
    }
}

async function renderMonthlyOverview() {
    const data = await loadData();
    const grouped = groupByMonth(data);
    const currentMonthKey = new Date().toISOString().slice(0, 7);
    const entries = (grouped[currentMonthKey] || []).slice().reverse(); // Neueste oben
    monthlyOverview.innerHTML = "";

    let total = entries.reduce((sum, e) => sum + parseFloat(e.amount), 0);

    const detail = entries
        .map((e, i) => {
            const amountClass =
                e.amount < 0 ? "text-red-600" : "text-green-600";
            const categoryClass = getCategoryColor(e.category);
            return `
        <div class="bg-white shadow p-4 rounded-xl border fade-in">
          <div class="flex justify-between items-center">
            <div class="space-y-1">
              <div class="flex items-center gap-2 text-lg font-semibold text-gray-800">
                <i class="ph ph-currency-circle-euro text-blue-500"></i> ${
                    e.title
                }
              </div>
              <div class="text-sm ${amountClass} font-bold">
                €${(e.amount >= 0 ? "" : "-") + Math.abs(e.amount).toFixed(2)}
              </div>
              <div class="text-sm text-gray-500">
                <span class="${categoryClass} px-2 py-1 rounded-full text-xs font-medium inline-block">
                  ${e.category}
                </span>
                • ${e.costType} •
                <span class="${
                    e.paid === "Ja" ? "text-green-600" : "text-red-600"
                }">
                  Bezahlt: ${e.paid}
                </span>
              </div>
              <div class="text-xs text-gray-400">${new Date(
                  e.date
              ).toLocaleString()}</div>
              <div class="text-sm italic text-gray-600">${e.description}</div>
            </div>
            <button onclick="deleteEntry(${i}, '${currentMonthKey}')" class="text-red-500 hover:text-red-700 text-xl">
              <i class="ph ph-trash"></i>
            </button>
          </div>
        </div>`;
        })
        .join("");

    monthlyOverview.innerHTML = `
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-lg font-semibold text-blue-700 flex items-center gap-2">
        <i class="ph ph-calendar-check"></i> Aktueller Monat: ${currentMonthKey}
      </h3>
      <div class="text-md font-semibold text-gray-800 bg-blue-50 py-1 px-3 rounded-lg">
        <i class="ph ph-coins text-yellow-500"></i> €${total.toFixed(2)}
      </div>
    </div>
    ${detail}
  `;
}

async function renderYearlyOverview() {
    const data = await loadData();
    const grouped = groupByMonth(data);
    const monthNames = [
        "Januar",
        "Februar",
        "März",
        "April",
        "Mai",
        "Juni",
        "Juli",
        "August",
        "September",
        "Oktober",
        "November",
        "Dezember",
    ];

    const yearData = {};
    for (const key in grouped) {
        const [year, month] = key.split("-");
        const label = `${monthNames[parseInt(month) - 1]} ${year}`;
        const total = grouped[key].reduce(
            (sum, e) => sum + parseFloat(e.amount),
            0
        );
        yearData[key] = { label, total };
    }

    yearlySummary.innerHTML = Object.entries(yearData)
        .map(
            ([key, info]) => `
    <button onclick="showMonthDetail('${key}')"
            class="bg-white border hover:border-blue-600 shadow rounded-lg px-4 py-3 text-sm font-semibold text-gray-700 flex flex-col items-center">
      <span>${info.label}</span>
      <span class="text-blue-600 font-bold">€${info.total.toFixed(2)}</span>
    </button>
  `
        )
        .join("");
}

async function showMonthDetail(monthKey) {
    const data = await loadData();
    const grouped = groupByMonth(data);
    const entries = (grouped[monthKey] || []).reverse();

    let monthlySum = 0;
    const detailHTML = entries
        .map((e) => {
            monthlySum += e.amount;
            return `
      <div class="bg-white shadow-md p-4 rounded-xl border fade-in">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div class="text-lg font-bold text-gray-800 flex items-center gap-2">
            <i class="ph ph-currency-circle-euro text-green-500"></i> ${e.title}
          </div>
          <div class="text-sm text-gray-500">€${
              (e.amount >= 0 ? "" : "-") + Math.abs(e.amount).toFixed(2)
          }</div>
        </div>
        <div class="text-sm text-gray-500 mt-1">${e.category} • ${
                e.costType
            } • <span class="${
                e.paid === "Ja" ? "text-green-600" : "text-red-600"
            }">Bezahlt: ${e.paid}</span></div>
        <div class="text-xs text-gray-400 mt-1">${new Date(
            e.date
        ).toLocaleString()}</div>
        <div class="text-sm italic text-gray-600 mt-1">${e.description}</div>
      </div>`;
        })
        .join("");

    monthlyDetail.innerHTML = `
    <h3 class="text-xl font-semibold text-blue-700 flex items-center gap-2">
      <i class="ph ph-calendar"></i> Details für ${monthKey}
    </h3>
    ${detailHTML}
    <div class="text-right text-md font-semibold text-gray-800 mt-2 bg-blue-50 py-2 px-3 rounded-lg inline-block ml-auto w-fit">
      <i class="ph ph-coins text-yellow-500"></i> Monatssumme: €${monthlySum.toFixed(
          2
      )}
    </div>
  `;
    monthlyDetail.classList.remove("hidden");
    monthlyDetail.scrollIntoView({ behavior: "smooth" });
}

if (form) {
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const newEntry = {
            date: new Date().toISOString(),
            category: document.getElementById("category").value,
            title: document.getElementById("title").value,
            amount: parseFloat(document.getElementById("amount").value),
            paid: document.getElementById("paid").value,
            costType: document.getElementById("type").value,
            description: document.getElementById("description").value,
        };
        const data = await loadData();
        data.push(newEntry);
        await saveData(data);
        await renderMonthlyOverview();
        await renderYearlyOverview();
        form.reset();
    });
}

toggleBtn.addEventListener("click", () => {
    isYearly = !isYearly;
    if (isYearly) {
        yearlyOverview.classList.remove("hidden");
        monthlyOverview.classList.add("hidden");
        viewTitle.innerHTML =
            '<i class="ph ph-calendar-blank text-blue-600"></i> Jahresübersicht';
        toggleBtn.textContent = "Monatsübersicht anzeigen";
    } else {
        yearlyOverview.classList.add("hidden");
        monthlyOverview.classList.remove("hidden");
        viewTitle.innerHTML =
            '<i class="ph ph-calendar text-blue-600"></i> Monatsübersicht';
        toggleBtn.textContent = "Jahresübersicht anzeigen";
    }
});

renderMonthlyOverview();
renderYearlyOverview();
