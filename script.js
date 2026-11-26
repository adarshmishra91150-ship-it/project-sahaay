// 1. Initial Vendor Data ($50 to $200 loan requirements)
const initialVendors = [
  { id: 1, name: "Lakshmi Devi", business: "Vegetable Cart", dailyRevenue: "$18 / day", loanNeeded: 100, funded: 50, purpose: "Buy fresh wholesale seasonal vegetables without daily moneylender fees." },
  { id: 2, name: "Meena Kumari", business: "Flower Stall", dailyRevenue: "$15 / day", loanNeeded: 75, funded: 25, purpose: "Purchase bulk marigold & jasmine garlands for morning temple rush." },
  { id: 3, name: "Sunita Bai", business: "Tea Kiosk", dailyRevenue: "$24 / day", loanNeeded: 150, funded: 75, purpose: "Upgrade tea urn, milk stock, and eco-friendly paper cups." },
  { id: 4, name: "Kavita Rani", business: "Vegetable Cart", dailyRevenue: "$20 / day", loanNeeded: 125, funded: 25, purpose: "Repair wooden pushcart wheels and expand leafy greens inventory." },
  { id: 5, name: "Radha Devi", business: "Flower Stall", dailyRevenue: "$14 / day", loanNeeded: 50, funded: 0, purpose: "Working capital for festival flower baskets and storage crates." },
  { id: 6, name: "Anita Sharma", business: "Tea Kiosk", dailyRevenue: "$28 / day", loanNeeded: 200, funded: 100, purpose: "Add snack counter (samosa & biscuits) to double morning earnings." }
];

// 2. Wallet & State Variables
let walletBalance = 150;
let totalLent = 0;
let totalRepaid = 0;
let currentFilter = "All";
let vendors = JSON.parse(JSON.stringify(initialVendors));
let activeLoans = [];

// 3. Render Full Page
function renderApp() {
  document.getElementById("walletBalance").textContent = "$" + walletBalance;
  document.getElementById("totalLent").textContent = "$" + totalLent;
  document.getElementById("totalRepaid").textContent = "$" + totalRepaid;

  renderVendorCards();
  populateVendorDropdown();
  renderRepaymentTimeline();
}

// 4. Display Vendor Cards
function renderVendorCards() {
  const grid = document.getElementById("vendorGrid");
  grid.innerHTML = "";

  vendors.forEach(function (vendor) {
    if (currentFilter !== "All" && vendor.business !== currentFilter) return;

    const remaining = vendor.loanNeeded - vendor.funded;
    const isFullyFunded = remaining <= 0;

    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div>
        <span class="badge">${vendor.business}</span>
        <h3>${vendor.name}</h3>
        <p><strong>Daily Revenue:</strong> ${vendor.dailyRevenue}</p>
        <p>${vendor.purpose}</p>
      </div>
      <div>
        <progress value="${vendor.funded}" max="${vendor.loanNeeded}"></progress>
        <div class="progress-label">
          Funded: $${vendor.funded} / $${vendor.loanNeeded} (${isFullyFunded ? "Fully Funded!" : "$" + remaining + " left"})
        </div>
        <button class="btn-primary full-width" ${isFullyFunded ? "disabled" : ""} onclick="selectVendorForPledge(${vendor.id})">
          ${isFullyFunded ? "Goal Reached" : "Fund This Vendor ($25+)"}
        </button>
      </div>
    `;
    grid.appendChild(card);
  });
}

// 5. Category Filter Buttons
function filterVendors(category, clickedButton) {
  currentFilter = category;
  document.querySelectorAll(".filter-buttons button").forEach(btn => btn.classList.remove("active"));
  clickedButton.classList.add("active");
  renderVendorCards();
}

// 6. Populate Dropdown in Pledge Form
function populateVendorDropdown() {
  const select = document.getElementById("vendorSelect");
  select.innerHTML = "";

  vendors.forEach(function (vendor) {
    const remaining = vendor.loanNeeded - vendor.funded;
    if (remaining > 0) {
      const option = document.createElement("option");
      option.value = vendor.id;
      option.textContent = `${vendor.name} (${vendor.business} - $${remaining} needed)`;
      select.appendChild(option);
    }
  });
}

function selectVendorForPledge(vendorId) {
  const select = document.getElementById("vendorSelect");
  select.value = vendorId;
  select.scrollIntoView({ behavior: "smooth", block: "center" });
}

// 7. Submit Pledge ($25 Increments)
function submitPledge(event) {
  event.preventDefault();
  const vendorId = parseInt(document.getElementById("vendorSelect").value);
  const amount = parseInt(document.getElementById("pledgeAmount").value);
  const messageBox = document.getElementById("pledgeMessage");
  const vendor = vendors.find(v => v.id === vendorId);

  if (!vendor) return;
  const remainingNeed = vendor.loanNeeded - vendor.funded;

  if (amount > walletBalance) {
    messageBox.style.color = "#c62828";
    messageBox.textContent = "Insufficient wallet balance! Click '+ Add $50 Funds'.";
    return;
  }
  if (amount > remainingNeed) {
    messageBox.style.color = "#c62828";
    messageBox.textContent = `${vendor.name} only needs $${remainingNeed} more.`;
    return;
  }

  walletBalance -= amount;
  totalLent += amount;
  vendor.funded += amount;

  activeLoans.push({
    vendorName: vendor.name,
    business: vendor.business,
    principal: amount,
    weeklyInstallment: amount / 4,
    weeksPaid: 0
  });

  messageBox.style.color = "#1b5e20";
  messageBox.textContent = `Success! You pledged $${amount} at 0% interest to ${vendor.name}.`;
  renderApp();
}

// 8. Weekly Principal Repayment Timeline & Revolving Wallet
function renderRepaymentTimeline() {
  const list = document.getElementById("repaymentList");
  if (activeLoans.length === 0) {
    list.innerHTML = "<p class='subtext'>No active pledges yet. Fund a vendor on the left to track weekly repayments!</p>";
    return;
  }

  list.innerHTML = "";
  activeLoans.forEach(function (loan, index) {
    const isCompleted = loan.weeksPaid >= 4;
    let weeksHTML = "";
    for (let week = 1; week <= 4; week++) {
      const paidClass = week <= loan.weeksPaid ? "paid" : "";
      weeksHTML += `<div class="week-box ${paidClass}">Week ${week}<br>$${loan.weeklyInstallment.toFixed(2)}</div>`;
    }

    const item = document.createElement("div");
    item.className = "repayment-item";
    item.innerHTML = `
      <div class="repayment-top">
        <strong>${loan.vendorName} (${loan.business})</strong>
        <span>Loan: $${loan.principal} (0% Interest)</span>
      </div>
      <div class="weeks-row">${weeksHTML}</div>
      <button class="btn-secondary full-width" ${isCompleted ? "disabled" : ""} onclick="simulateWeeklyRepayment(${index})">
        ${isCompleted ? "100% Principal Repaid & Recycled!" : `Simulate Week ${loan.weeksPaid + 1} Repayment (+$${loan.weeklyInstallment.toFixed(2)} to Wallet)`}
      </button>
    `;
    list.appendChild(item);
  });
}

function simulateWeeklyRepayment(loanIndex) {
  const loan = activeLoans[loanIndex];
  if (loan.weeksPaid < 4) {
    loan.weeksPaid += 1;
    walletBalance += loan.weeklyInstallment;
    totalRepaid += loan.weeklyInstallment;
    renderApp();
  }
}

function addFunds() {
  walletBalance += 50;
  renderApp();
}

function resetDemo() {
  walletBalance = 150;
  totalLent = 0;
  totalRepaid = 0;
  currentFilter = "All";
  vendors = JSON.parse(JSON.stringify(initialVendors));
  activeLoans = [];
  document.getElementById("pledgeMessage").textContent = "";
  renderApp();
}

renderApp();
