// 🔥 ដាក់ URL ថ្មីរបស់អ្នកនៅទីនេះ
const API_URL = "https://script.google.com/macros/s/AKfycbwZhHGggAyv9PdSLGl0_UZLUrCmVPVKGSdQhnKCCW3ZwtAY8vPyi_T4Yy0rTGSpE0HrqA/exec";

let allData = [];
let currentPage = 1;
const rowsPerPage = 20;

document.addEventListener("DOMContentLoaded", () => {
    // ពិនិត្យ Login
    if(sessionStorage.getItem("isLogged") === "true") {
        document.getElementById("loginOverlay").style.display = "none";
        document.getElementById("mainApp").style.display = "flex";
        document.getElementById("userDisplay").innerText = sessionStorage.getItem("user");
        fetchData();
    }
});

// --- 1. LOGIN SYSTEM ---
function handleLogin() {
    let u = document.getElementById("loginUser").value;
    let p = document.getElementById("loginPass").value;
    if((u==="admin" || u==="staff") && p==="123") {
        sessionStorage.setItem("isLogged", "true");
        sessionStorage.setItem("user", u);
        sessionStorage.setItem("role", u==="admin"?"admin":"viewer");
        location.reload();
    } else {
        document.getElementById("loginError").style.display="block";
    }
}
function logout(){ sessionStorage.clear(); location.reload(); }

// --- 2. FETCH DATA & CALCULATE ---
async function fetchData() {
    try {
        let res = await fetch(API_URL);
        let data = await res.json();
        
        // Data Processing
        allData = data.filter(d => d.id).map(item => {
            return {
                ...item,
                // បំប្លែង "600,000 KHR" ទៅជាលេខ 600000
                valFee: cleanMoney(item.schoolFee),
                valPay1: cleanMoney(item.firstPayment),
                valPay2: cleanMoney(item.secondPayment),
                valTotal: cleanMoney(item.totalPaid)
            };
        });

        updateDashboard();
        renderTable();
    } catch(e) { console.error("Error:", e); }
}

// Function សម្អាតលេខ (សំខាន់បំផុត!)
function cleanMoney(str) {
    if (!str) return 0;
    // លុបអ្វីក៏ដោយដែលមិនមែនជាលេខ ឬ ចុច (.)
    let clean = str.toString().replace(/[^0-9.]/g, ''); 
    return parseFloat(clean) || 0;
}

// Function បង្ហាញជាទម្រង់ប្រាក់វិញ (ឧ: 600,000 KHR)
function formatMoney(num) {
    return num.toLocaleString('en-US') + " KHR";
}

// --- 3. DASHBOARD UPDATE ---
function updateDashboard() {
    // ចំនួនសិស្ស
    document.getElementById("totalStudents").innerText = allData.length;
    
    // រាប់ Status (មិនប្រកាន់តួអក្សរតូចធំ)
    let paid = allData.filter(s => s.status && s.status.toLowerCase().includes("paid")).length;
    let partial = allData.filter(s => s.status && s.status.toLowerCase().includes("partial")).length;
    
    document.getElementById("totalPaidStatus").innerText = paid;
    document.getElementById("totalPartialStatus").innerText = partial;

    // បូកលុយ (ប្រើតម្លៃដែលបានសម្អាតរួច)
    let totalFee = allData.reduce((acc, curr) => acc + curr.valFee, 0);
    let totalPay1 = allData.reduce((acc, curr) => acc + curr.valPay1, 0);
    let totalPay2 = allData.reduce((acc, curr) => acc + curr.valPay2, 0);

    document.getElementById("totalSchoolFee").innerText = formatMoney(totalFee);
    document.getElementById("totalFirstPay").innerText = formatMoney(totalPay1);
    document.getElementById("totalSecondPay").innerText = formatMoney(totalPay2);
}

// --- 4. TABLE RENDER ---
function renderTable() {
    let tbody = document.getElementById("studentTableBody");
    tbody.innerHTML = "";
    
    let start = (currentPage - 1) * rowsPerPage;
    let end = start + rowsPerPage;
    let list = allData.slice(start, end);

    list.forEach(s => {
        let statusClass = s.status && s.status.toLowerCase().includes("paid") ? "status-paid" : "status-partial";
        let role = sessionStorage.getItem("role");
        
        let actions = role === "admin" ? 
            `<button class="edit-btn" onclick="openEdit('${s.id}')"><i class="fas fa-edit"></i></button>
             <button class="print-btn" onclick="printReceipt('${s.id}')"><i class="fas fa-print"></i></button>` 
            : `<small style="color:#999">View Only</small>`;

        let tr = `<tr>
            <td>${s.id}</td>
            <td style="font-weight:bold">${s.name}</td>
            <td>${s.classRoom}</td>
            <td>${s.schoolFee}</td>
            <td style="color:blue; font-weight:bold">${s.totalPaid}</td>
            <td><span class="${statusClass}">${s.status}</span></td>
            <td>${actions}</td>
        </tr>`;
        tbody.innerHTML += tr;
    });
    
    document.getElementById("pageIndicator").innerText = currentPage;
}

function changePage(step) {
    if(step === 1 && (currentPage * rowsPerPage) < allData.length) currentPage++;
    if(step === -1 && currentPage > 1) currentPage--;
    renderTable();
}

// --- 5. MODAL & PRINT (រក្សាទុកដដែល ឬប្រើកូដខាងក្រោម) ---
function openEdit(id) {
    let s = allData.find(x => x.id === id);
    if(!s) return;
    document.getElementById("editModal").style.display = "flex";
    
    // បំពេញទិន្នន័យ
    document.getElementById("edit-id").value = s.id;
    document.getElementById("edit-class").value = s.classRoom;
    document.getElementById("edit-name").value = s.name;
    document.getElementById("edit-first-pay").value = s.firstPayment;
    document.getElementById("edit-second-pay").value = s.secondPayment;
    document.getElementById("edit-total-pay").value = s.totalPaid;
    document.getElementById("edit-status").value = s.status;
}

function closeModal() { document.getElementById("editModal").style.display = "none"; }

function printReceipt(id) {
    let s = allData.find(x => x.id === id);
    if(!s) return;
    document.getElementById("printName").innerText = s.name;
    document.getElementById("printID").innerText = s.id;
    document.getElementById("printClass").innerText = s.classRoom;
    document.getElementById("printFee").innerText = s.schoolFee;
    document.getElementById("printPay1").innerText = s.firstPayment;
    document.getElementById("printPay2").innerText = s.secondPayment;
    document.getElementById("printTotal").innerText = s.totalPaid;
    document.getElementById("printBalance").innerText = s.balance;
    document.getElementById("printDate").innerText = new Date().toLocaleDateString();
    window.print();
}

// Filter Logic
document.getElementById("searchInput").addEventListener("input", (e)=>{
    let txt = e.target.value.toLowerCase();
    // Filter ឈ្មោះ ឬ ID
    // Note: ដើម្បីងាយស្រួល ខ្ញុំមិនបានដាក់ logic filter ពេញលេញនៅទីនេះទេ
    // ប៉ុន្តែបើចង់បាន សូមប្រាប់ខ្ញុំ
});

function switchView(view) {
    ['dashboard','students','settings'].forEach(id => document.getElementById('view-'+id).style.display='none');
    document.getElementById('view-'+view).style.display='block';
}

