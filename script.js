// 🔥 ដាក់ URL ថ្មីដែលអ្នកទើបតែ Deploy នៅទីនេះ (កុំភ្លេចដូរ!)
const API_URL = "https://script.google.com/macros/s/AKfycbxFkj2sHuPmcm2SzQGvltiFdKqpFZeJqr8ke8cTYps6525l9HDOz1z1YUHTA140o9vHpw/exec";

let allData = [];
let currentPage = 1;
const rowsPerPage = 20;

// 1. ចាប់ផ្តើមកម្មវិធី
document.addEventListener("DOMContentLoaded", () => {
    if(sessionStorage.getItem("isLogged") === "true") {
        document.getElementById("loginOverlay").style.display = "none";
        document.getElementById("mainApp").style.display = "flex";
        document.getElementById("userDisplay").innerText = sessionStorage.getItem("user");
        fetchData();
    }
});

// 2. Login
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

// 3. ទាញទិន្នន័យ (Fetch Data) - កែសម្រួលថ្មី
async function fetchData() {
    try {
        console.log("Fetching data from URL...");
        let res = await fetch(API_URL);
        let data = await res.json();
        
        console.log("Data received:", data); // មើលក្នុង Console (F12) ថាតើទិន្នន័យចូលមកឬអត់

        // Data Processing: បំប្លែង "600,000 KHR" ទៅជាលេខ
        allData = data.filter(d => d.id).map(item => {
            return {
                ...item,
                valFee: cleanMoney(item.schoolFee),
                valPay1: cleanMoney(item.firstPayment),
                valPay2: cleanMoney(item.secondPayment),
                valTotal: cleanMoney(item.totalPaid)
            };
        });

        updateDashboard();
        renderTable();
    } catch(e) { 
        console.error("Error fetching data:", e); 
        alert("មានបញ្ហាក្នុងការទាញទិន្នន័យ! សូមពិនិត្យមើល URL របស់អ្នក។");
    }
}

// Function សម្អាតលេខ (សំខាន់បំផុត!)
function cleanMoney(str) {
    if (!str) return 0;
    // បំប្លែងទៅជា String ហើយលុបអ្វីដែលមិនមែនជាលេខ
    let clean = String(str).replace(/[^0-9.]/g, ''); 
    return parseFloat(clean) || 0;
}

function formatMoney(num) {
    return num.toLocaleString('en-US') + " KHR";
}

// 4. Update Dashboard
function updateDashboard() {
    document.getElementById("totalStudents").innerText = allData.length;
    
    let paid = allData.filter(s => s.status && s.status.toLowerCase().includes("paid")).length;
    let partial = allData.filter(s => s.status && s.status.toLowerCase().includes("partial")).length;
    
    document.getElementById("totalPaidStatus").innerText = paid;
    document.getElementById("totalPartialStatus").innerText = partial;

    // បូកលុយ
    let totalFee = allData.reduce((acc, curr) => acc + curr.valFee, 0);
    let totalPay1 = allData.reduce((acc, curr) => acc + curr.valPay1, 0);
    let totalPay2 = allData.reduce((acc, curr) => acc + curr.valPay2, 0);

    document.getElementById("totalSchoolFee").innerText = formatMoney(totalFee);
    document.getElementById("totalFirstPay").innerText = formatMoney(totalPay1);
    document.getElementById("totalSecondPay").innerText = formatMoney(totalPay2);
}

// 5. Render Table
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

// 6. Modal & Print
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
    document.getElementById("printPay1").innerText = s.firstPayment || "0";
    document.getElementById("printPay2").innerText = s.secondPayment || "0";
    document.getElementById("printTotal").innerText = s.totalPaid;
    document.getElementById("printBalance").innerText = s.balance;
    document.getElementById("printDate").innerText = new Date().toLocaleDateString();
    window.print();
}

function switchView(view) {
    ['dashboard','students','settings'].forEach(id => document.getElementById('view-'+id).style.display='none');
    document.getElementById('view-'+view).style.display='block';
}
