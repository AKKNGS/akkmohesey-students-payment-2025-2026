// 🔥 ដាក់ URL Apps Script ថ្មីនៅទីនេះ
const API_URL = "https://script.google.com/macros/s/AKfycbzyDtDhF40P_XLSAXnDcPS0FTO_ycVyvHVRj9tKjsVhUxBjTlFt3mNbRfYU13JVU7pl9w/exec";

let allData = [];
let currentPage = 1;
const rowsPerPage = 20;

// 1. Initialize
document.addEventListener("DOMContentLoaded", () => {
    if (sessionStorage.getItem("logged") === "true") {
        document.getElementById("loginOverlay").style.display = "none";
        document.getElementById("mainApp").style.display = "flex";
        document.getElementById("userDisplay").innerText = sessionStorage.getItem("user");
        fetchData();
    }
});

// 2. Login Logic
function handleLogin() {
    let u = document.getElementById("loginUser").value;
    let p = document.getElementById("loginPass").value;
    if ((u === "admin" || u === "staff") && p === "123") {
        sessionStorage.setItem("logged", "true");
        sessionStorage.setItem("user", u);
        location.reload();
    } else {
        document.getElementById("loginError").style.display = "block";
    }
}
function logout() { sessionStorage.clear(); location.reload(); }

// 3. Fetch & Clean Data (The Fix for '0' values)
async function fetchData() {
    try {
        let res = await fetch(API_URL);
        let data = await res.json();
        
        // Filter empty rows and map properly
        allData = data.filter(r => r.id).map(r => ({
            ...r,
            // សំខាន់៖ បំប្លែងតម្លៃទៅជាលេខសុទ្ធសម្រាប់ការគណនា
            feeVal: parseNum(r.schoolFee),
            pay1Val: parseNum(r.firstPayment),
            pay2Val: parseNum(r.secondPayment)
        }));

        updateDashboard();
        renderTable();
    } catch (e) { console.error("Fetch Error:", e); }
}

// 4. Robust Dashboard Logic
function updateDashboard() {
    // Count Students
    document.getElementById("d-total").innerText = allData.length;
    
    // Count Paid/Partial (Case insensitive check)
    let paid = allData.filter(s => s.status && s.status.toLowerCase().includes("paid")).length;
    let partial = allData.filter(s => s.status && s.status.toLowerCase().includes("partial")).length;
    document.getElementById("d-paid").innerText = paid;
    document.getElementById("d-partial").innerText = partial;

    // Sum Money (Using cleaned values)
    let totalIncome = allData.reduce((acc, s) => acc + s.feeVal, 0);
    let totalPay1 = allData.reduce((acc, s) => acc + s.pay1Val, 0);
    let totalPay2 = allData.reduce((acc, s) => acc + s.pay2Val, 0);

    document.getElementById("d-income").innerText = formatMoney(totalIncome);
    document.getElementById("d-pay1").innerText = formatMoney(totalPay1);
    document.getElementById("d-pay2").innerText = formatMoney(totalPay2);
}

// 5. Table Render
function renderTable() {
    let tbody = document.getElementById("tableBody");
    tbody.innerHTML = "";
    
    let start = (currentPage - 1) * rowsPerPage;
    let list = allData.slice(start, start + rowsPerPage);

    list.forEach(s => {
        let statusClass = s.status && s.status.toLowerCase().includes("paid") ? "status-paid" : "status-partial";
        let role = sessionStorage.getItem("user");
        let btns = role === "admin" ? `
            <button class="action-btn" style="background:#4361ee" onclick="openModal('${s.id}')"><i class="fas fa-edit"></i></button>
            <button class="action-btn" style="background:#10b981" onclick="printReceipt('${s.id}')"><i class="fas fa-print"></i></button>
        ` : `<small>View Only</small>`;

        tbody.innerHTML += `
            <tr>
                <td>${s.id}</td><td><b>${s.name}</b></td><td>${s.classRoom}</td>
                <td>${s.schoolFee}</td><td>${s.totalPaid}</td>
                <td><span class="${statusClass}">${s.status}</span></td>
                <td>${btns}</td>
            </tr>`;
    });
    document.getElementById("pageIndicator").innerText = currentPage;
}

// 6. Modal Functions (Fixed Display)
function openModal(id) {
    let s = allData.find(x => x.id === id);
    if (!s) return;
    
    document.getElementById("editModal").style.display = "flex"; // Using Flex to center
    document.getElementById("m-name").value = s.name;
    document.getElementById("m-pay1").value = s.firstPayment;
    document.getElementById("m-pay2").value = s.secondPayment;
    document.getElementById("m-status").value = s.status;
}
function closeModal() { document.getElementById("editModal").style.display = "none"; }

// 7. Print Function (Fixed Data Mapping)
function printReceipt(id) {
    let s = allData.find(x => x.id === id);
    if (!s) return;

    document.getElementById("p-name").innerText = s.name;
    document.getElementById("p-id").innerText = s.id;
    document.getElementById("p-class").innerText = s.classRoom;
    document.getElementById("p-fee").innerText = s.schoolFee;
    document.getElementById("p-pay1").innerText = s.firstPayment || "0";
    document.getElementById("p-pay2").innerText = s.secondPayment || "0";
    document.getElementById("p-total").innerText = s.totalPaid;
    document.getElementById("p-bal").innerText = s.balance;

    window.print();
}

// Utilities
function parseNum(str) {
    if (!str) return 0;
    return parseFloat(str.toString().replace(/[^0-9.]/g, '')) || 0;
}
function formatMoney(num) {
    return num.toLocaleString('en-US') + " KHR";
}
function switchView(v) {
    ['dashboard','students','settings'].forEach(id => document.getElementById('view-'+id).style.display='none');
    document.getElementById('view-'+v).style.display='block';
}
function changePage(n) { currentPage += n; renderTable(); }

