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

const API_URL = "https://script.google.com/macros/s/AKfycbzHbeiK7LPCCTuiPkcdmf24nbiUuL0o3dxO-p-Bld-_wXaWZG4Y2BaSNK-7M1mLYRTVNw/exec";

// --- Global Variables ---
let allData = [];      // ទិន្នន័យសិស្សទាំងអស់
let filteredData = []; // ទិន្នន័យដែលកំពុងបង្ហាញ (ក្រោយ Filter)
let currentPage = 1;   // ទំព័របច្ចុប្បន្ន
const rowsPerPage = 20; // ចំនួនសិស្សក្នុង ១ ទំព័រ (កែត្រង់នេះបើចង់បានតិចឬច្រើន)
let currentUserRole = ""; // 'admin' ឬ 'viewer'

// --- 1. LOGIN & STARTUP ---
document.addEventListener("DOMContentLoaded", () => {
    // ពិនិត្យមើលថាតើ Login ហើយឬនៅ?
    const isLogged = sessionStorage.getItem("isLoggedIn");
    const role = sessionStorage.getItem("userRole");
    const username = sessionStorage.getItem("username");

    if(isLogged === "true") {
        currentUserRole = role;
        document.getElementById("loginOverlay").style.display = "none";
        document.getElementById("userInfo").innerText = `User: ${username} (${role})`;
        
        loadTheme();
        fetchData(); // ទាញទិន្នន័យ
    } else {
        // បើមិនទាន់ Login បង្ហាញផ្ទាំង Login
        document.getElementById("loginOverlay").style.display = "flex";
    }

    // Event Listeners
    document.getElementById("searchInput").addEventListener("input", filterData);
    document.getElementById("classFilter").addEventListener("change", filterData);
    document.getElementById("themeSwitch").addEventListener("change", (e) => toggleTheme(e.target.checked));
});

function checkLogin() {
    const u = document.getElementById("loginUser").value.trim();
    const p = document.getElementById("loginPass").value.trim();
    const err = document.getElementById("loginError");

    // កំណត់ User និង Password (Hardcoded សម្រាប់ការសាកល្បង)
    // អ្នកអាចបន្ថែម User ទៀតនៅទីនេះ
    const users = {
        "admin": { pass: "123", role: "admin" }, // កែបាន
        "staff": { pass: "123", role: "viewer" } // មើលបានតែប៉ុណ្ណោះ
    };

    if (users[u] && users[u].pass === p) {
        // Login ជោគជ័យ
        sessionStorage.setItem("isLoggedIn", "true");
        sessionStorage.setItem("userRole", users[u].role);
        sessionStorage.setItem("username", u);
        
        // Reload ដើម្បីចូលផ្ទាំងដើម
        location.reload(); 
    } else {
        // Login បរាជ័យ
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
        
        // Remove duplicates
        const unique = new Map();
        data.forEach(item => { if(item.id) unique.set(item.id, item); });
        allData = Array.from(unique.values());
        
        // ចាប់ផ្តើមដោយបង្ហាញទិន្នន័យទាំងអស់
        filteredData = [...allData]; 

        setupDropdown(allData);
        updateDashboard(allData);
        
        // Render ជាមួយ Pagination
        currentPage = 1;
        renderPagination();

    } catch (err) {
        console.error(err);
        document.getElementById("studentTableBody").innerHTML = `<tr><td colspan="8" style="color:red; text-align:center;">បរាជ័យក្នុងការទាញទិន្នន័យ</td></tr>`;
    }
}

// --- 3. PAGINATION & RENDER TABLE ---
function renderPagination() {
    const tbody = document.getElementById("studentTableBody");
    tbody.innerHTML = "";

    // គណនាចំនួនទំព័រសរុប
    const totalPages = Math.ceil(filteredData.length / rowsPerPage);
    
    // ការពារកុំឱ្យ currentPage លើស
    if (currentPage < 1) currentPage = 1;
    if (currentPage > totalPages && totalPages > 0) currentPage = totalPages;

    // កាត់ទិន្នន័យតាមទំព័រ (Slice)
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const pageData = filteredData.slice(start, end);

    if (pageData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;">រកមិនឃើញទិន្នន័យ</td></tr>`;
        document.getElementById("pageIndicator").innerText = "Page 0 of 0";
        return;
    }

    // Render ជួរតារាង
    pageData.forEach(student => {
        let statusClass = student.status && student.status.toLowerCase().includes("paid") ? "status-paid" : "status-partial";
        
        // Role Logic: បើជា admin បង្ហាញប៊ូតុង Edit, បើ viewer មិនបង្ហាញ
        let actionButton = "";
        if (currentUserRole === "admin") {
            actionButton = `<button class="edit-btn" onclick="openEdit('${student.id}')"><i class="fas fa-edit"></i></button>`;
        } else {
            actionButton = `<span style="color:#ccc; font-size:12px;"><i class="fas fa-lock"></i> Read Only</span>`;
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

    // Update ប៊ូតុង Next/Prev
    document.getElementById("pageIndicator").innerText = `Page ${currentPage} of ${totalPages}`;
    document.getElementById("btnPrev").disabled = (currentPage === 1);
    document.getElementById("btnNext").disabled = (currentPage === totalPages || totalPages === 0);
}

function changePage(step) {
    currentPage += step;
    renderPagination();
}

// --- 4. FILTERING ---
function filterData() {
    const search = document.getElementById("searchInput").value.toLowerCase();
    const cls = document.getElementById("classFilter").value;

    filteredData = allData.filter(s => {
        const matchSearch = (s.name && s.name.toLowerCase().includes(search)) || (s.id && s.id.toLowerCase().includes(search));
        const matchClass = cls === "all" || s.classRoom === cls;
        return matchSearch && matchClass;
    });
    
    // Update Dashboard តាម Filter
    updateDashboard(filteredData);
    
    // Reset ទៅទំព័រទី ១ វិញពេល Filter
    currentPage = 1;
    renderPagination();
}

// ... (Code ផ្សេងៗដូចជា setupDropdown, updateDashboard, openEdit, editForm submit, Utilities រក្សាទុកដដែល) ...
// សូមចម្លងកូដ edit logic, parseCurrency, formatCurrency ពី script ចាស់មកដាក់បន្តនៅខាងក្រោមនេះ
// (កុំភ្លេចដាក់កូដ editForm ឱ្យដំណើរការតែពេល role === 'admin' ក្នុង backend ផងបើអាច ប៉ុន្តែក្នុង frontend យើងបិទប៊ូតុងហើយ)

// --- កូដជំនួយពីផ្នែកមុន (សង្ខេប) ---
function updateDashboard(data) {
    document.getElementById("totalStudents").innerText = data.length;
    // ... (កូដគណនាលុយដដែល) ...
    // កុំភ្លេចដាក់កូដគណនាដូចមុន
}

function setupDropdown(data) {
    const classes = [...new Set(data.map(d => d.classRoom))].sort();
    const sel = document.getElementById("classFilter");
    sel.innerHTML = '<option value="all">ថ្នាក់ទាំងអស់</option>';
    classes.forEach(c => { if(c) sel.innerHTML += `<option value="${c}">${c}</option>`; });
}

// Edit Logic (ដាក់ដដែល)
function openEdit(id) {
    // ... copy ពីកូដចាស់ ...
    // បន្ថែម: ការពារសុវត្ថិភាពម្តងទៀត
    if(currentUserRole !== 'admin') {
        alert("អ្នកមិនមានសិទ្ធិកែប្រែទេ!");
        return;
    }
    // ...
}
// ... (closeModal, calculateTotal, editForm Listener, parseCurrency, formatCurrency, switchView, toggleTheme, loadTheme - COPY ពីកូដចាស់មកដាក់) ...
    
    // Update Dashboard តាម Filter
    updateDashboard(filteredData);
    
    // Reset ទៅទំព័រទី ១ វិញពេល Filter
    currentPage = 1;
    renderPagination();
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



