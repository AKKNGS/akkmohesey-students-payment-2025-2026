// 🔥 ដាក់ URL របស់អ្នកនៅទីនេះ
const API_URL = "https://script.google.com/macros/s/AKfycbzHbeiK7LPCCTuiPkcdmf24nbiUuL0o3dxO-p-Bld-_wXaWZG4Y2BaSNK-7M1mLYRTVNw/exec";

let allData = [], filtered = [], page = 1;
const perPage = 20; let role = "";

document.addEventListener("DOMContentLoaded", () => {
    if(sessionStorage.getItem("isLogged") === "true") {
        document.getElementById("loginOverlay").style.display = "none";
        document.getElementById("mainApp").style.display = "flex";
        role = sessionStorage.getItem("role");
        document.getElementById("userDisplay").innerText = sessionStorage.getItem("user");
        fetchData();
    }
});

function handleLogin() {
    let u = document.getElementById("loginUser").value;
    let p = document.getElementById("loginPass").value;
    if ((u==="admin" || u==="staff") && p==="123") {
        sessionStorage.setItem("isLogged", "true");
        sessionStorage.setItem("user", u);
        sessionStorage.setItem("role", u==="admin" ? "admin" : "viewer");
        location.reload();
    } else { document.getElementById("loginError").style.display = "block"; }
}
function logout() { sessionStorage.clear(); location.reload(); }

async function fetchData() {
    try {
        let res = await fetch(API_URL);
        let data = await res.json();
        let map = new Map();
        data.forEach(i => { if(i.id) map.set(i.id, i); });
        allData = Array.from(map.values());
        filtered = [...allData];
        render(); updateDash();
    } catch(e) { console.error(e); }
}

function render() {
    let tbody = document.getElementById("studentTableBody");
    tbody.innerHTML = "";
    let start = (page-1)*perPage;
    let end = start + perPage;
    let list = filtered.slice(start, end);
    
    list.forEach(s => {
        let cls = s.status?.includes("Paid") ? "status-paid" : "status-partial";
        let btns = role==="admin" ? 
            `<button class="edit-btn" onclick="openEdit('${s.id}')"><i class="fas fa-edit"></i></button>
             <button class="print-btn" onclick="printReceipt('${s.id}')"><i class="fas fa-print"></i></button>` : `<small>View Only</small>`;
        
        tbody.innerHTML += `<tr>
            <td>${s.id}</td><td><b>${s.name}</b></td><td>${s.classRoom}</td>
            <td>${s.schoolFee}</td><td style="color:blue">${s.totalPaid}</td>
            <td><span class="${cls}">${s.status}</span></td><td>${btns}</td>
        </tr>`;
    });
    document.getElementById("pageIndicator").innerText = page;
}

function changePage(d) { page += d; render(); }

// --- FIXED MODAL ---
function openEdit(id) {
    let s = allData.find(x => x.id === id);
    if(!s) return;
    
    // ប្រើ style.display = 'flex' ដើម្បីឱ្យវាលេចឡើង
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

function calcTotal() {
    let p1 = parseFloat(document.getElementById("edit-first-pay").value.replace(/[^0-9]/g, '')) || 0;
    let p2 = parseFloat(document.getElementById("edit-second-pay").value.replace(/[^0-9]/g, '')) || 0;
    document.getElementById("edit-total-pay").value = (p1 + p2).toLocaleString() + " KHR";
}

document.getElementById("editForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    alert("Saved (Demo)!"); closeModal();
});

// --- FIXED PRINT ---
function printReceipt(id) {
    let s = allData.find(x => x.id === id);
    if(!s) return;
    
    document.getElementById("pDate").innerText = new Date().toLocaleDateString();
    document.getElementById("pName").innerText = s.name;
    document.getElementById("pID").innerText = s.id;
    document.getElementById("pClass").innerText = s.classRoom;
    
    document.getElementById("pFee").innerText = s.schoolFee;
    document.getElementById("pPay1").innerText = s.firstPayment || "0";
    document.getElementById("pPay2").innerText = s.secondPayment || "0";
    document.getElementById("pTotal").innerText = s.totalPaid;
    document.getElementById("pBalance").innerText = s.balance;
    
    window.print();
}

function updateDash() { 
    document.getElementById("totalStudents").innerText = allData.length;
    // ... Add more stats if needed
}
function switchView(v) {
    ['dashboard','students','settings'].forEach(id=>document.getElementById('view-'+id).style.display='none');
    document.getElementById('view-'+v).style.display='block';
}
document.getElementById("searchInput").addEventListener("input", (e) => {
    let txt = e.target.value.toLowerCase();
    filtered = allData.filter(s => s.name.toLowerCase().includes(txt) || s.id.toLowerCase().includes(txt));
    render();
});
