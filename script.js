// កំណត់លេខសម្ងាត់របស់អ្នកនៅទីនេះ
const SECRET_PASS = "admin123"; 

document.addEventListener("DOMContentLoaded", () => {
    // ពិនិត្យមើលថាតើធ្លាប់ Login ឬនៅ?
    if(sessionStorage.getItem("isLoggedIn") === "true") {
        document.getElementById("loginOverlay").style.display = "none";
        loadTheme();
        fetchData(); // ទាញទិន្នន័យតែពេល Login ត្រូវ
    } else {
        // បើមិនទាន់ Login ទេ កុំទាន់ទាញទិន្នន័យ
        console.log("Please login first");
    }
});

function checkLogin() {
    const input = document.getElementById("adminPass").value;
    const errorMsg = document.getElementById("loginError");

    if(input === SECRET_PASS) {
        // បើត្រូវ
        sessionStorage.setItem("isLoggedIn", "true"); // រក្សាទុក status
        document.getElementById("loginOverlay").style.display = "none";
        fetchData(); // ចាប់ផ្តើមទាញទិន្នន័យ
    } else {
        // បើខុស
        errorMsg.style.display = "block";
    }
}

// មុខងារ Logout (ដាក់ក្នុងប៊ូតុងណាមួយក្នុង Sidebar)
function logout() {
    sessionStorage.removeItem("isLoggedIn");
    location.reload(); // Refresh ទំព័រ
}

// 🔥 ដាក់ URL ថ្មីរបស់អ្នកនៅទីនេះ (ត្រូវ Deploy New Version ក្នុង Apps Script ជាមុនសិន)
const API_URL = "https://script.google.com/macros/s/AKfycbzHbeiK7LPCCTuiPkcdmf24nbiUuL0o3dxO-p-Bld-_wXaWZG4Y2BaSNK-7M1mLYRTVNw/exec";

let allData = [];

document.addEventListener("DOMContentLoaded", () => {
    loadTheme();
    fetchData();

    document.getElementById("searchInput").addEventListener("input", filterData);
    document.getElementById("classFilter").addEventListener("change", filterData);
    document.getElementById("themeSwitch").addEventListener("change", (e) => toggleTheme(e.target.checked));
});

async function fetchData() {
    try {
        const res = await fetch(API_URL);
        const data = await res.json();
        
        // Remove duplicates based on ID
        const unique = new Map();
        data.forEach(item => { if(item.id) unique.set(item.id, item); });
        allData = Array.from(unique.values());

        setupDropdown(allData);
        updateDashboard(allData);
        renderTable(allData);
    } catch (err) {
        console.error(err);
        document.getElementById("studentTableBody").innerHTML = `<tr><td colspan="8" style="color:red; text-align:center;">បរាជ័យក្នុងការទាញទិន្នន័យ</td></tr>`;
    }
}

function updateDashboard(data) {
    document.getElementById("totalStudents").innerText = data.length;
    
    // Count Status (Case insensitive check)
    document.getElementById("totalPaidStatus").innerText = data.filter(s => s.status && s.status.toLowerCase().includes("paid")).length;
    document.getElementById("totalPartialStatus").innerText = data.filter(s => s.status && s.status.toLowerCase().includes("partial")).length;

    // Sum Financials
    let sumFee = 0, sumFirst = 0, sumSecond = 0;
    data.forEach(s => {
        sumFee += parseCurrency(s.schoolFee);
        sumFirst += parseCurrency(s.firstPayment);
        sumSecond += parseCurrency(s.secondPayment);
    });

    document.getElementById("totalSchoolFee").innerText = formatCurrency(sumFee);
    document.getElementById("totalFirstPay").innerText = formatCurrency(sumFirst);
    document.getElementById("totalSecondPay").innerText = formatCurrency(sumSecond);
}

function renderTable(data) {
    const tbody = document.getElementById("studentTableBody");
    tbody.innerHTML = "";
    
    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;">រកមិនឃើញទិន្នន័យ</td></tr>`;
        return;
    }

    data.slice(0, 100).forEach(student => { // Show first 100 to avoid lag
        let statusClass = student.status && student.status.toLowerCase().includes("paid") ? "status-paid" : "status-partial";
        
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${student.id}</td>
            <td style="font-weight:bold">${student.name}</td>
            <td>${student.classRoom}</td>
            <td>${student.schoolFee}</td>
            <td style="color:blue">${student.totalPaid}</td>
            <td style="color:red">${student.balance}</td>
            <td><span class="${statusClass}">${student.status}</span></td>
            <td><button class="edit-btn" onclick="openEdit('${student.id}')"><i class="fas fa-edit"></i></button></td>
        `;
        tbody.appendChild(tr);
    });
}

function filterData() {
    const search = document.getElementById("searchInput").value.toLowerCase();
    const cls = document.getElementById("classFilter").value;

    const filtered = allData.filter(s => {
        const matchSearch = (s.name && s.name.toLowerCase().includes(search)) || (s.id && s.id.toLowerCase().includes(search));
        const matchClass = cls === "all" || s.classRoom === cls;
        return matchSearch && matchClass;
    });
    
    renderTable(filtered);
    updateDashboard(filtered);
}

function setupDropdown(data) {
    const classes = [...new Set(data.map(d => d.classRoom))].sort();
    const sel = document.getElementById("classFilter");
    sel.innerHTML = '<option value="all">ថ្នាក់ទាំងអស់</option>';
    classes.forEach(c => { if(c) sel.innerHTML += `<option value="${c}">${c}</option>`; });
}

// Edit Logic
function openEdit(id) {
    const student = allData.find(s => s.id === id);
    if(!student) return;

    document.getElementById("editModal").style.display = "block";
    document.getElementById("edit-id").value = student.id;
    document.getElementById("edit-class").value = student.classRoom;
    document.getElementById("edit-name").value = student.name;
    document.getElementById("edit-first-pay").value = student.firstPayment;
    document.getElementById("edit-second-pay").value = student.secondPayment;
    document.getElementById("edit-total-pay").value = student.totalPaid;
    document.getElementById("edit-status").value = student.status ? student.status.trim() : "";
}

function closeModal() { document.getElementById("editModal").style.display = "none"; }

function calculateTotal() {
    const p1 = parseCurrency(document.getElementById("edit-first-pay").value);
    const p2 = parseCurrency(document.getElementById("edit-second-pay").value);
    document.getElementById("edit-total-pay").value = formatCurrency(p1 + p2);
}

document.getElementById("editForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.querySelector(".save-btn");
    const oldText = btn.innerText;
    btn.innerText = "កំពុងរក្សាទុក...";
    btn.disabled = true;

    const payload = {
        id: document.getElementById("edit-id").value,
        classRoom: document.getElementById("edit-class").value,
        firstPayment: document.getElementById("edit-first-pay").value,
        secondPayment: document.getElementById("edit-second-pay").value,
        totalPaid: document.getElementById("edit-total-pay").value,
        status: document.getElementById("edit-status").value
    };

    try {
        await fetch(API_URL, { method: 'POST', body: JSON.stringify(payload) });
        alert("ជោគជ័យ!");
        closeModal();
        fetchData(); 
    } catch (err) { alert("មានបញ្ហា!"); } 
    finally { btn.innerText = oldText; btn.disabled = false; }
});

// Utilities
function parseCurrency(str) { return parseFloat((str || "0").toString().replace(/[^0-9.]/g, '')) || 0; }
function formatCurrency(num) { return num.toLocaleString('en-US') + " KHR"; }

function switchView(view) {
    ['dashboard', 'students', 'settings'].forEach(v => {
        document.getElementById('view-' + v).style.display = 'none';
        document.getElementById('nav-' + v).classList.remove('active');
    });
    document.getElementById('view-' + view).style.display = 'block';
    document.getElementById('nav-' + view).classList.add('active');
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

