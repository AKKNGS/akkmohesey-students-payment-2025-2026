// 🔥 ដាក់ URL របស់អ្នកនៅទីនេះ (ត្រូវប្រាកដថាបាន Deploy ថ្មី)
const API_URL = "https://script.google.com/macros/s/AKfycbzHbeiK7LPCCTuiPkcdmf24nbiUuL0o3dxO-p-Bld-_wXaWZG4Y2BaSNK-7M1mLYRTVNw/exec";

let allData = [], filteredData = [], currentPage = 1;
const rowsPerPage = 20; let currentUserRole = "";

document.addEventListener("DOMContentLoaded", () => {
    const isLogged = sessionStorage.getItem("isLoggedIn");
    if(isLogged === "true") {
        currentUserRole = sessionStorage.getItem("userRole");
        document.getElementById("loginOverlay").style.display = "none";
        document.getElementById("mainApp").style.display = "flex";
        document.getElementById("userDisplay").innerText = sessionStorage.getItem("username");
        fetchData();
    } else {
        document.getElementById("loginOverlay").style.display = "flex";
    }
    
    document.getElementById("searchInput").addEventListener("input", filterData);
    document.getElementById("classFilter").addEventListener("change", filterData);
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

function logout() { sessionStorage.clear(); location.reload(); }

async function fetchData() {
    try {
        const res = await fetch(API_URL);
        const data = await res.json();
        const unique = new Map();
        data.forEach(item => { if(item.id) unique.set(item.id, item); });
        allData = Array.from(unique.values());
        filteredData = [...allData];
        
        setupDropdown(allData);
        updateDashboard(allData);
        renderPagination();
    } catch(e) { console.error(e); }
}

function renderPagination() {
    const tbody = document.getElementById("studentTableBody");
    tbody.innerHTML = "";
    
    const start = (currentPage - 1) * rowsPerPage;
    const pageData = filteredData.slice(start, start + rowsPerPage);

    if(pageData.length === 0) { tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">No Data</td></tr>`; return; }

    pageData.forEach(s => {
        let statusClass = s.status && s.status.toLowerCase().includes("paid") ? "status-paid" : "status-partial";
        let btns = currentUserRole === "admin" ? `
            <div style="display:flex; gap:10px;">
                <button class="edit-btn" onclick="openEdit('${s.id}')"><i class="fas fa-edit"></i></button>
                <button class="print-btn" onclick="printReceipt('${s.id}')"><i class="fas fa-print"></i></button>
            </div>` : `<span style="color:#aaa; font-size:12px;">View Only</span>`;
            
        let tr = `<tr>
            <td>${s.id}</td><td style="font-weight:bold">${s.name}</td><td>${s.classRoom}</td>
            <td>${s.schoolFee}</td><td style="color:blue">${s.totalPaid}</td>
            <td><span class="${statusClass}">${s.status}</span></td><td>${btns}</td>
        </tr>`;
        tbody.innerHTML += tr;
    });
    
    document.getElementById("pageIndicator").innerText = `Page ${currentPage}`;
    document.getElementById("btnPrev").disabled = currentPage === 1;
    document.getElementById("btnNext").disabled = (start + rowsPerPage) >= filteredData.length;
}

function changePage(step) { currentPage += step; renderPagination(); }

// --- FIXED MODAL FUNCTION ---
function openEdit(id) {
    const s = allData.find(x => x.id === id);
    if(!s) return;
    
    // បង្ហាញ Modal ដោយប្រើ Flex (ដោះស្រាយបញ្ហាមើលមិនឃើញ)
    document.getElementById("editModal").style.display = "flex";
    
    document.getElementById("edit-id").value = s.id;
    document.getElementById("edit-class").value = s.classRoom;
    document.getElementById("edit-name").value = s.name;
    document.getElementById("edit-first-pay").value = s.firstPayment;
    document.getElementById("edit-second-pay").value = s.secondPayment;
    document.getElementById("edit-total-pay").value = s.totalPaid;
    document.getElementById("edit-status").value = s.status ? s.status.trim() : "";
}

function closeModal() { document.getElementById("editModal").style.display = "none"; }

// --- FIXED PRINT FUNCTION ---
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

// ... (Functions filterData, updateDashboard, setupDropdown, calculateTotal, editForm submit នៅដដែល) ...
// ដើម្បីកុំឱ្យកូដវែងពេក សូម Copy ផ្នែក logic ដែលនៅសល់ពីកូដចាស់មកដាក់នៅទីនេះ
// ឬគ្រាន់តែប្រើ Function ជំនួយដូចខាងក្រោម៖

function filterData() {
    let txt = document.getElementById("searchInput").value.toLowerCase();
    let cls = document.getElementById("classFilter").value;
    filteredData = allData.filter(s => (s.name.toLowerCase().includes(txt) || s.id.toLowerCase().includes(txt)) && (cls==="all" || s.classRoom===cls));
    currentPage = 1; renderPagination(); updateDashboard(filteredData);
}

function updateDashboard(data) {
    document.getElementById("totalStudents").innerText = data.length;
    document.getElementById("totalPaidStatus").innerText = data.filter(s=>s.status && s.status.toLowerCase().includes("paid")).length;
    document.getElementById("totalPartialStatus").innerText = data.filter(s=>s.status && s.status.toLowerCase().includes("partial")).length;
    // (Calculation Logic for money...)
}

function setupDropdown(data) {
    let cls = [...new Set(data.map(d=>d.classRoom))].sort();
    let sel = document.getElementById("classFilter");
    sel.innerHTML = '<option value="all">ថ្នាក់ទាំងអស់</option>';
    cls.forEach(c => sel.innerHTML += `<option value="${c}">${c}</option>`);
}

function calculateTotal() {
    // Logic បូកលុយ
}

document.getElementById("editForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    // Logic Save to API
    alert("Saved (Demo)");
    closeModal();
});

function switchView(view) {
    ['dashboard', 'students', 'settings'].forEach(v => document.getElementById('view-'+v).style.display='none');
    document.getElementById('view-'+view).style.display='block';
    
    // Update Mobile Menu
    document.querySelectorAll('.mobile-nav .nav-item').forEach(el => el.classList.remove('active'));
    let mob = document.getElementById('mob-'+view);
    if(mob) mob.classList.add('active');
}
