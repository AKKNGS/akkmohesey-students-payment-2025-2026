const API_URL = "https://script.google.com/macros/s/AKfycbxuaSA1qRHOvTRvriKl1F76e-FU9maGdBFd7ubMCBhDmzkldPpIBRyclCskntkKiyL6eg/exec";

// --- Global Variables ---
let allData = [];      
let filteredData = []; 
let currentPage = 1;   
const rowsPerPage = 20; 
let currentUserRole = ""; 

// --- 1. LOGIN & STARTUP ---
document.addEventListener("DOMContentLoaded", () => {
    // ពិនិត្យ Login
    const isLogged = sessionStorage.getItem("isLoggedIn");
    const role = sessionStorage.getItem("userRole");
    const username = sessionStorage.getItem("username");

    if(isLogged === "true") {
        currentUserRole = role;
        document.getElementById("loginOverlay").style.display = "none";
        document.getElementById("mainApp").style.display = "flex"; // បង្ហាញ App
        document.getElementById("userDisplay").innerText = `${username} (${role})`;
        
        loadTheme();
        fetchData();
    } else {
        document.getElementById("loginOverlay").style.display = "flex";
        document.getElementById("mainApp").style.display = "none";
    }

    // Event Listeners
    document.getElementById("searchInput").addEventListener("input", filterData);
    document.getElementById("classFilter").addEventListener("change", filterData);
    document.getElementById("themeSwitch").addEventListener("change", (e) => toggleTheme(e.target.checked));
    
    // ចុច Enter ដើម្បី Login
    document.getElementById("loginPass").addEventListener("keypress", function(event) {
        if (event.key === "Enter") { handleLogin(); }
    });
});

function handleLogin() {
    const u = document.getElementById("loginUser").value.trim();
    const p = document.getElementById("loginPass").value.trim();
    const err = document.getElementById("loginError");

    const users = {
        "admin": { pass: "123", role: "admin" }, 
        "staff": { pass: "123", role: "viewer" } 
    };

    if (users[u] && users[u].pass === p) {
        sessionStorage.setItem("isLoggedIn", "true");
        sessionStorage.setItem("userRole", users[u].role);
        sessionStorage.setItem("username", u);
        location.reload(); 
    } else {
        err.style.display = "block";
    }
}

function logout() {
    if(confirm("តើអ្នកពិតជាចង់ចាកចេញមែនទេ?")) {
        sessionStorage.clear();
        location.reload();
    }
}

// --- 2. DATA FETCHING ---
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
        
        currentPage = 1;
        renderPagination();

    } catch (err) {
        console.error(err);
        document.getElementById("studentTableBody").innerHTML = `<tr><td colspan="8" style="color:red; text-align:center;">បរាជ័យក្នុងការទាញទិន្នន័យ (សូមពិនិត្យ URL)</td></tr>`;
    }
}

// --- 3. PAGINATION & RENDER TABLE ---
function renderPagination() {
    const tbody = document.getElementById("studentTableBody");
    tbody.innerHTML = "";

    const totalPages = Math.ceil(filteredData.length / rowsPerPage);
    if (currentPage < 1) currentPage = 1;
    if (currentPage > totalPages && totalPages > 0) currentPage = totalPages;

    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const pageData = filteredData.slice(start, end);

    if (pageData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;">រកមិនឃើញទិន្នន័យ</td></tr>`;
        document.getElementById("pageIndicator").innerText = "Page 0 of 0";
        return;
    }

    pageData.forEach(student => {
        let statusClass = student.status && student.status.toLowerCase().includes("paid") ? "status-paid" : "status-partial";
        
        let actionButton = "";
        if (currentUserRole === "admin") {
            actionButton = `<button class="edit-btn" onclick="openEdit('${student.id}')"><i class="fas fa-edit"></i></button>`;
        } else {
            actionButton = `<span style="color:#aaa; font-size:12px;"><i class="fas fa-lock"></i> View Only</span>`;
        }

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${student.id}</td>
            <td style="font-weight:bold">${student.name}</td>
            <td>${student.classRoom}</td>
            <td>${student.schoolFee}</td>
            <td style="color:blue">${student.totalPaid}</td>
            <td style="color:red">${student.balance}</td>
            <td><span class="${statusClass}">${student.status}</span></td>
            <td>${actionButton}</td>
        `;
        tbody.appendChild(tr);
    });

    document.getElementById("pageIndicator").innerText = `Page ${currentPage} of ${totalPages}`;
    document.getElementById("btnPrev").disabled = (currentPage === 1);
    document.getElementById("btnNext").disabled = (currentPage === totalPages || totalPages === 0);
}

function changePage(step) {
    currentPage += step;
    renderPagination();
}

// --- 4. FILTERING & DASHBOARD ---
function filterData() {
    const search = document.getElementById("searchInput").value.toLowerCase();
    const cls = document.getElementById("classFilter").value;

    filteredData = allData.filter(s => {
        const matchSearch = (s.name && s.name.toLowerCase().includes(search)) || (s.id && s.id.toLowerCase().includes(search));
        const matchClass = cls === "all" || s.classRoom === cls;
        return matchSearch && matchClass;
    });
    
    updateDashboard(filteredData);
    currentPage = 1;
    renderPagination();
}

function updateDashboard(data) {
    document.getElementById("totalStudents").innerText = data.length;
    document.getElementById("totalPaidStatus").innerText = data.filter(s => s.status && s.status.toLowerCase().includes("paid")).length;
    document.getElementById("totalPartialStatus").innerText = data.filter(s => s.status && s.status.toLowerCase().includes("partial")).length;

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

// --- 5. EDIT & UTILS ---
function openEdit(id) {
    if(currentUserRole !== 'admin') { alert("គ្មានសិទ្ធិ!"); return; }
    
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

function setupDropdown(data) {
    const classes = [...new Set(data.map(d => d.classRoom))].sort();
    const sel = document.getElementById("classFilter");
    sel.innerHTML = '<option value="all">ថ្នាក់ទាំងអស់</option>';
    classes.forEach(c => { if(c) sel.innerHTML += `<option value="${c}">${c}</option>`; });
}

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

