// 🔥 ដាក់ URL ថ្មីដែលអ្នកទើបតែ Deploy នៅទីនេះ
const API_URL = "https://script.google.com/macros/s/AKfycbxFkj2sHuPmcm2SzQGvltiFdKqpFZeJqr8ke8cTYps6525l9HDOz1z1YUHTA140o9vHpw/exec";

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
    // Login សាកល្បង
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

// --- 2. FETCH DATA & CALCULATE (FIXED) ---
async function fetchData() {
    try {
        let res = await fetch(API_URL);
        let data = await res.json();
        
        // Data Processing: បោសសម្អាតទិន្នន័យ
        allData = data.filter(d => d.id).map(item => {
            return {
                ...item,
                // បំប្លែង "600,000 KHR" ទៅជាលេខ 600000 ដើម្បីអាចបូកបាន
                valFee: cleanMoney(item.schoolFee),
                valPay1: cleanMoney(item.firstPayment),
                valPay2: cleanMoney(item.secondPayment),
                valTotal: cleanMoney(item.totalPaid)
            };
        });

        updateDashboard();
        renderTable();
    } catch(e) { console.error("Error fetching data:", e); }
}

// Function សម្អាតលេខ (The Magic Fix!) 
function cleanMoney(str) {
    if (!str) return 0;
    // លុបអ្វីក៏ដោយដែលមិនមែនជាលេខ (0-9) ឬ ចុច (.)
    // ឧទាហរណ៍: "600,000 KHR" -> "600000"
    let clean = str.toString().replace(/[^0-9.]/g, ''); 
    return parseFloat(clean) || 0;
}

// Function បង្ហាញជាទម្រង់ប្រាក់វិញ (ដាក់ KHR វិញពេលបង្ហាញ)
function formatMoney(num) {
    return num.toLocaleString('en-US') + " KHR";
}

// --- 3. DASHBOARD UPDATE ---
function updateDashboard() {
    // 1. បង្ហាញចំនួនសិស្ស
    document.getElementById("totalStudents").innerText = allData.length;
    
    // 2. រាប់ Status (Paid/Partial)
    let paid = allData.filter(s => s.status && s.status.toLowerCase().includes("paid")).length;
    let partial = allData.filter(s => s.status && s.status.toLowerCase().includes("partial")).length;
    
    document.getElementById("totalPaidStatus").innerText = paid;
    document.getElementById("totalPartialStatus").innerText = partial;

    // 3. បូកលុយ (ប្រើតម្លៃដែលបាន cleanMoney រួច)
    let totalFee = allData.reduce((acc, curr) => acc + curr.valFee, 0);
    let totalPay1 = allData.reduce((acc, curr) => acc + curr.valPay1, 0);
    let totalPay2 = allData.reduce((acc, curr) => acc + curr.valPay2, 0);

    // បង្ហាញផលបូកនៅលើកាត
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

// --- 5. MODAL & PRINT ---
function openEdit(id) {
    let s = allData.find(x => x.id === id);
    if(!s) return;
    document.getElementById("editModal").style.display = "flex";
    
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

function switchView(view) {
    ['dashboard','students','settings'].forEach(id => document.getElementById('view-'+id).style.display='none');
    document.getElementById('view-'+view).style.display='block';
}
