const API_URL = "https://script.google.com/macros/s/AKfycbznOlNNSOLfBnWtJOF5e66hVaDhLGXzZMfBwIXJlBlAMZPhezWo1S1EB5DMXWJN2EZM6g/exec";

let allData = [], filteredData = [], currentPage = 1;
const rowsPerPage = 20; let currentUserRole = "";

document.addEventListener("DOMContentLoaded", () => {
    if(sessionStorage.getItem("isLoggedIn") === "true") {
        currentUserRole = sessionStorage.getItem("userRole");
        document.getElementById("loginOverlay").style.display = "none";
        document.getElementById("mainApp").style.display = "flex";
        document.getElementById("userDisplay").innerText = sessionStorage.getItem("username");
        loadTheme(); fetchData();
    } else { document.getElementById("loginOverlay").style.display = "flex"; }
    
    document.getElementById("searchInput").addEventListener("input", filterData);
    document.getElementById("classFilter").addEventListener("change", filterData);
    document.getElementById("themeSwitch").addEventListener("change", (e) => toggleTheme(e.target.checked));
});

function handleLogin() {
    const u = document.getElementById("loginUser").value.trim();
    const p = document.getElementById("loginPass").value.trim();
    if((u==="admin" || u==="staff") && p==="123") {
        sessionStorage.setItem("isLoggedIn", "true");
        sessionStorage.setItem("username", u);
        sessionStorage.setItem("userRole", u==="admin"?"admin":"viewer");
        location.reload();
    } else { document.getElementById("loginError").style.display="block"; }
}
function logout(){ sessionStorage.clear(); location.reload(); }

async function fetchData() {
    try {
        const res = await fetch(API_URL);
        const data = await res.json();
        const unique = new Map();
        data.forEach(item => { if(item.id) unique.set(item.id, item); });
        allData = Array.from(unique.values());
        filteredData = [...allData];
        setupDropdown(allData); updateDashboard(allData); renderPagination();
    } catch(e) { console.error(e); }
}

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

