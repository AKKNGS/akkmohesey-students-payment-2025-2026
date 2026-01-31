// 🔥 ដាក់ URL ថ្មីរបស់អ្នកនៅទីនេះ
const API_URL = "https://script.google.com/macros/s/AKfycbxuaSA1qRHOvTRvriKl1F76e-FU9maGdBFd7ubMCBhDmzkldPpIBRyclCskntkKiyL6eg/exec";

let allData = [];

document.addEventListener("DOMContentLoaded", () => {
    fetchData(); // ទាញទិន្នន័យភ្លាមៗ
});

async function fetchData() {
    try {
        console.log("កំពុងទាញទិន្នន័យ...");
        let res = await fetch(API_URL);
        let data = await res.json();
        
        console.log("ទិន្នន័យ:", data);

        // Processing Data
        allData = data.map(item => {
            return {
                ...item,
                // សម្អាតលេខ (ឧ: "600,000 KHR" -> 600000)
                valFee: cleanMoney(item.schoolFee),
                valPay1: cleanMoney(item.firstPayment),
                valPay2: cleanMoney(item.secondPayment),
                valTotal: cleanMoney(item.totalPaid)
            };
        });

        updateDashboard();
        // renderTable(); // ហៅ function renderTable របស់អ្នក (បើមាន)
        
    } catch(e) { 
        console.error("Error:", e); 
    }
}

// Function សំខាន់សម្រាប់ដោះស្រាយបញ្ហា Dashboard = 0
function cleanMoney(str) {
    if (!str) return 0;
    let clean = String(str).replace(/[^0-9.]/g, ''); // លុបអក្សរ KHR និង , ចោល
    return parseFloat(clean) || 0;
}

function formatMoney(num) {
    return num.toLocaleString('en-US') + " KHR";
}

function updateDashboard() {
    // 1. បង្ហាញចំនួនសិស្ស
    document.getElementById("totalStudents").innerText = allData.length;
    
    // 2. រាប់ Status (ការពារ Error)
    let paid = 0, partial = 0;
    allData.forEach(s => {
        let status = s.status ? s.status.toLowerCase() : "";
        if(status.includes("paid")) paid++;
        else partial++; // បើមិនមែន Paid គឺ Partial ទាំងអស់
    });

    document.getElementById("totalPaidStatus").innerText = paid;
    document.getElementById("totalPartialStatus").innerText = partial;

    // 3. បូកលុយ
    let income = allData.reduce((acc, item) => acc + item.valFee, 0);
    let pay1 = allData.reduce((acc, item) => acc + item.valPay1, 0);
    let pay2 = allData.reduce((acc, item) => acc + item.valPay2, 0);

    document.getElementById("totalSchoolFee").innerText = formatMoney(income);
    document.getElementById("totalFirstPay").innerText = formatMoney(pay1);
    document.getElementById("totalSecondPay").innerText = formatMoney(pay2);
}

// ... (ដាក់កូដ Render Table និងមុខងារផ្សេងៗរបស់អ្នកនៅខាងក្រោមនេះ)
function renderPagination() {
    const tbody = document.getElementById("studentTableBody");
    tbody.innerHTML = "";
    const start = (currentPage-1)*rowsPerPage;
    const pageData = filteredData.slice(start, start+rowsPerPage);
    
    if(pageData.length === 0) { tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">No Data</td></tr>`; return; }

    pageData.forEach(s => {
        let statusClass = s.status && s.status.toLowerCase().includes("paid") ? "status-paid" : "status-partial";
        let btns = currentUserRole === "admin" ? `
            <button class="edit-btn" onclick="openEdit('${s.id}')"><i class="fas fa-edit"></i></button>
            <button class="print-btn" onclick="printReceipt('${s.id}')"><i class="fas fa-print"></i></button>` 
            : `<span style="color:#aaa;">View Only</span>`;
        
        let tr = `<tr>
            <td>${s.id}</td><td style="font-weight:bold">${s.name}</td><td>${s.classRoom}</td>
            <td>${s.schoolFee}</td><td style="color:blue">${s.totalPaid}</td>
            <td><span class="${statusClass}">${s.status}</span></td><td>${btns}</td>
        </tr>`;
        tbody.innerHTML += tr;
    });
    document.getElementById("pageIndicator").innerText = `Page ${currentPage}`;
    document.getElementById("btnPrev").disabled = currentPage===1;
    document.getElementById("btnNext").disabled = (start+rowsPerPage)>=filteredData.length;
}

function changePage(step) { currentPage += step; renderPagination(); }

// --- PRINT FUNCTION ---
function printReceipt(id) {
    const s = allData.find(x => x.id === id);
    if(!s) return;
    
    document.getElementById("printDate").innerText = new Date().toLocaleDateString('km-KH');
    document.getElementById("printName").innerText = s.name;
    document.getElementById("printID").innerText = s.id;
    document.getElementById("printClass").innerText = s.classRoom;
    document.getElementById("printFee").innerText = s.schoolFee;
    document.getElementById("printPay1").innerText = s.firstPayment || "0";
    document.getElementById("printPay2").innerText = s.secondPayment || "0";
    document.getElementById("printTotal").innerText = s.totalPaid;
    document.getElementById("printBalance").innerText = s.balance;
    
    window.print();
}

function openEdit(id) {
    const s = allData.find(x => x.id === id);
    if(!s) return;
    document.getElementById("editModal").style.display = "flex"; // Fix: Use flex to center
    document.getElementById("edit-id").value = s.id;
    document.getElementById("edit-class").value = s.classRoom;
    document.getElementById("edit-name").value = s.name;
    document.getElementById("edit-first-pay").value = s.firstPayment;
    document.getElementById("edit-second-pay").value = s.secondPayment;
    document.getElementById("edit-total-pay").value = s.totalPaid;
    document.getElementById("edit-status").value = s.status;
}
function closeModal() { document.getElementById("editModal").style.display = "none"; }

// Add missing helper functions here (filterData, updateDashboard, etc.) from your previous code...
// For brevity, I assume you copy them back. Key addition is printReceipt() above.
function filterData() {
    const search = document.getElementById("searchInput").value.toLowerCase();
    const cls = document.getElementById("classFilter").value;
    filteredData = allData.filter(s => (s.name.toLowerCase().includes(search) || s.id.toLowerCase().includes(search)) && (cls==="all" || s.classRoom===cls));
    updateDashboard(filteredData); currentPage = 1; renderPagination();
}
function updateDashboard(data) {
    document.getElementById("totalStudents").innerText = data.length;
    // ... Add other calc logic here
}
function setupDropdown(data) {
    const cls = [...new Set(data.map(d => d.classRoom))].sort();
    const sel = document.getElementById("classFilter");
    sel.innerHTML = '<option value="all">ថ្នាក់ទាំងអស់</option>';
    cls.forEach(c => sel.innerHTML += `<option value="${c}">${c}</option>`);
}
function toggleTheme(isDark) {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}
function loadTheme() {
    if(localStorage.getItem('theme') === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.getElementById("themeSwitch").checked = true;
    }
}
function switchView(view) {
    ['dashboard', 'students', 'settings'].forEach(v => document.getElementById('view-'+v).style.display = 'none');
    document.getElementById('view-'+view).style.display = 'block';
}




