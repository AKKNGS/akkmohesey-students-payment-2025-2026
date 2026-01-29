// ដាក់ URL ថ្មីរបស់អ្នកនៅទីនេះ បន្ទាប់ពី Deploy ម្តងទៀត
const API_URL = "https://script.google.com/macros/s/AKfycbzHbeiK7LPCCTuiPkcdmf24nbiUuL0o3dxO-p-Bld-_wXaWZG4Y2BaSNK-7M1mLYRTVNw/exec";

let allStudents = [];

document.addEventListener("DOMContentLoaded", () => {
    fetchData();
    
    // Search Listener
    document.getElementById("searchInput").addEventListener("input", (e) => {
        filterData(e.target.value, document.getElementById("classFilter").value);
    });

    // Class Filter Listener
    document.getElementById("classFilter").addEventListener("change", (e) => {
        filterData(document.getElementById("searchInput").value, e.target.value);
    });
});

async function fetchData() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        
        allStudents = data;
        
        // Setup dropdown ថ្នាក់
        setupClassFilter(data);
        
        // បង្ហាញទិន្នន័យ
        updateDashboard(data);
        renderTable(data);
        
    } catch (error) {
        console.error("Error fetching data:", error);
        document.getElementById("studentTableBody").innerHTML = 
            `<tr><td colspan="9" style="color:red; text-align:center;">
                បរាជ័យក្នុងការទាញទិន្នន័យ! សូមពិនិត្យមើល URL ឬ Internet របស់អ្នក។
            </td></tr>`;
    }
}

// ... (កូដ fetchData នៅដដែល) ...

function updateDashboard(data) {
    // 1. ចំនួនសិស្ស
    document.getElementById("totalStudents").innerText = data.length;
    document.getElementById("totalPaidStatus").innerText = data.filter(s => s.status && s.status.toLowerCase().includes("paid")).length;
    document.getElementById("totalPartialStatus").innerText = data.filter(s => s.status && s.status.toLowerCase().includes("partial")).length;

    // 2. គណនាលុយ (Function ជំនួយនៅខាងក្រោម)
    let totalFee = 0;
    let totalFirst = 0;
    let totalSecond = 0;

    data.forEach(s => {
        totalFee += parseCurrency(s.schoolFee);
        // *ចំណាំ: អ្នកត្រូវប្រាកដថា s.firstPayment និង s.secondPayment ត្រូវបានទាញមកពី Google Sheet (មើលជំហានក្រោយ)
        totalFirst += parseCurrency(s.firstPayment); 
        totalSecond += parseCurrency(s.secondPayment);
    });

    document.getElementById("totalSchoolFee").innerText = formatCurrency(totalFee);
    document.getElementById("totalFirstPay").innerText = formatCurrency(totalFirst);
    document.getElementById("totalSecondPay").innerText = formatCurrency(totalSecond);
}

// Function បំប្លែង "600,000 KHR" ទៅជាលេខ 600000
function parseCurrency(str) {
    if (!str) return 0;
    // លុបចោលអក្សរ KHR, $, និង comma (,)
    let cleanStr = str.toString().replace(/[^0-9.]/g, ''); 
    return parseFloat(cleanStr) || 0;
}

// Function បំប្លែងលេខ 600000 ទៅជា "600,000 KHR"
function formatCurrency(num) {
    return num.toLocaleString('en-US') + " KHR";
}

// --- Theme Switcher Logic ---
const toggleSwitch = document.querySelector('.theme-switch input[type="checkbox"]');
const currentTheme = localStorage.getItem('theme');

if (currentTheme) {
    document.body.classList.add(currentTheme);
    if (currentTheme === 'dark-mode') {
        toggleSwitch.checked = true;
    }
}

toggleSwitch.addEventListener('change', function(e) {
    if (e.target.checked) {
        document.body.classList.add('dark-mode');
        localStorage.setItem('theme', 'dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
        localStorage.setItem('theme', 'light-mode');
    }
});

// --- Modal & Edit Logic ---
// (ហៅ function នេះពេលចុចប៊ូតុង Edit ក្នុងតារាង)
function openEditModal(student) {
    const modal = document.getElementById("editModal");
    modal.style.display = "block";
    
    document.getElementById("edit-id").value = student.id;
    document.getElementById("edit-class").value = student.classRoom; // ឈ្មោះ Sheet (Grade2A)
    document.getElementById("edit-name").value = student.name;
    document.getElementById("edit-first-pay").value = student.firstPayment;
    document.getElementById("edit-second-pay").value = student.secondPayment;
    document.getElementById("edit-total-pay").value = student.totalPaid;
    document.getElementById("edit-status").value = student.status.trim();
}

// បិទ Modal
document.querySelector(".close").onclick = function() {
    document.getElementById("editModal").style.display = "none";
}

// Handle Form Submit (Save Data)
document.getElementById("editForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const saveBtn = document.querySelector(".save-btn");
    saveBtn.innerText = "កំពុងរក្សាទុក...";

    const updatedData = {
        id: document.getElementById("edit-id").value,
        classRoom: document.getElementById("edit-class").value,
        firstPayment: document.getElementById("edit-first-pay").value,
        secondPayment: document.getElementById("edit-second-pay").value,
        totalPaid: document.getElementById("edit-total-pay").value,
        status: document.getElementById("edit-status").value
    };

    // ហៅទៅ Google Apps Script (doPost)
    await fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify(updatedData)
    });

    alert("រក្សាទុកជោគជ័យ!");
    saveBtn.innerText = "រក្សាទុក (Save)";
    document.getElementById("editModal").style.display = "none";
    fetchData(); // ទាញទិន្នន័យថ្មីមកបង្ហាញ
});

function renderTable(data) {
    const tbody = document.getElementById("studentTableBody");
    tbody.innerHTML = "";

    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;">រកមិនឃើញទិន្នន័យ</td></tr>`;
        return;
    }

    data.forEach(student => {
        const tr = document.createElement("tr");
        
        // កំណត់ Status សាមញ្ញ
        let statusText = student.status ? student.status.toString() : "";
        let statusLower = statusText.toLowerCase();
        let statusClass = "";
        
        if(statusLower.includes("paid")) {
            statusClass = "status-paid";
        } else if (statusLower.includes("partial")) {
            statusClass = "status-partial";
        }

        tr.innerHTML = `
            <td>${student.id}</td>
            <td style="font-weight:bold;">${student.name}</td>
            <td>${student.gender}</td>
            <td>${student.classRoom}</td>
            <td>${student.schoolFee}</td>
            <td style="color:blue">${student.totalPaid}</td>
            <td style="color:red">${student.balance}</td>
            <td><span class="${statusClass}">${statusText}</span></td>
            <td>
                <button class="edit-btn"><i class="fas fa-edit"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function setupClassFilter(data) {
    // យកឈ្មោះថ្នាក់ពីទិន្នន័យជាក់ស្តែង
    const classes = [...new Set(data.map(item => item.classRoom))]; 
    const select = document.getElementById("classFilter");
    
    // លុប Options ចាស់ចោល (ទុកតែ "All")
    select.innerHTML = '<option value="all">ថ្នាក់ទាំងអស់ (All Classes)</option>';

    classes.sort().forEach(cls => {
        if(cls){ // ការពារកុំឱ្យយកថ្នាក់ទទេ
            const option = document.createElement("option");
            option.value = cls;
            option.innerText = cls;
            select.appendChild(option);
        }
    });
}

function filterData(searchTerm, classFilter) {
    const filtered = allStudents.filter(student => {
        const matchesSearch = (student.name && student.name.toLowerCase().includes(searchTerm.toLowerCase())) || 
                              (student.id && student.id.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesClass = classFilter === "all" || student.classRoom === classFilter;
        
        return matchesSearch && matchesClass;
    });
    renderTable(filtered);
    updateDashboard(filtered); // Update លេខ Dashboard ពេល Filter ដែរ
}

// Function សម្រាប់ប្តូរផ្ទាំង (ដូចការស្នើសុំមុន)
function switchView(viewName) {
    const sections = ['dashboard', 'students', 'payments', 'settings'];
    sections.forEach(sec => {
        const el = document.getElementById('view-' + sec);
        if(el) el.style.display = 'none';
        
        const nav = document.getElementById('nav-' + sec);
        if(nav) nav.classList.remove('active');
    });

    const activeEl = document.getElementById('view-' + viewName);
    if(activeEl) activeEl.style.display = 'block';
    
    const activeNav = document.getElementById('nav-' + viewName);
    if(activeNav) activeNav.classList.add('active');
}


