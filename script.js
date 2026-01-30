// 🔥 ដាក់ URL ថ្មីរបស់អ្នកនៅទីនេះ (ត្រូវប្រាកដថាបាន Deploy New Version)
const API_URL = "https://script.google.com/macros/s/AKfycbznOlNNSOLfBnWtJOF5e66hVaDhLGXzZMfBwIXJlBlAMZPhezWo1S1EB5DMXWJN2EZM6g/exec";

let allData = [];

// 1. ដំណើរការពេលបើកកម្មវិធី
document.addEventListener("DOMContentLoaded", () => {
    loadTheme();
    fetchData();

    // Search Filter
    document.getElementById("searchInput").addEventListener("input", (e) => {
        filterData();
    });
    // Class Filter
    document.getElementById("classFilter").addEventListener("change", (e) => {
        filterData();
    });
    // Theme Toggle
    document.getElementById("themeSwitch").addEventListener("change", (e) => {
        toggleTheme(e.target.checked);
    });
});

// 2. ទាញទិន្នន័យពី Apps Script
async function fetchData() {
    try {
        const res = await fetch(API_URL);
        const data = await res.json();
        
        // Filter ចោលទិន្នន័យទទេ និង ID ស្ទួន
        const unique = new Map();
        data.forEach(item => {
            if(item.id) unique.set(item.id, item);
        });
        allData = Array.from(unique.values());

        setupDropdown(allData);
        updateDashboard(allData);
        renderTable(allData);
    } catch (err) {
        console.error(err);
        alert("បរាជ័យក្នុងការទាញទិន្នន័យ! សូមពិនិត្យមើល URL។");
    }
}

// 3. គណនា និងបង្ហាញលើ Dashboard Cards
function updateDashboard(data) {
    // Counts
    document.getElementById("totalStudents").innerText = data.length;
    document.getElementById("totalPaidStatus").innerText = data.filter(s => s.status && s.status.toLowerCase().includes("paid")).length;
    document.getElementById("totalPartialStatus").innerText = data.filter(s => s.status && s.status.toLowerCase().includes("partial")).length;

    // Financials (Sum)
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

// 4. បង្ហាញតារាង
function renderTable(data) {
    const tbody = document.getElementById("studentTableBody");
    tbody.innerHTML = "";
    
    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;">រកមិនឃើញទិន្នន័យ</td></tr>`;
        return;
    }

    data.forEach(student => {
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

// 5. Filter Logic
function filterData() {
    const search = document.getElementById("searchInput").value.toLowerCase();
    const cls = document.getElementById("classFilter").value;

    const filtered = allData.filter(s => {
        const matchSearch = s.name.toLowerCase().includes(search) || s.id.toLowerCase().includes(search);
        const matchClass = cls === "all" || s.classRoom === cls;
        return matchSearch && matchClass;
    });
    
    renderTable(filtered);
    updateDashboard(filtered); // Update លេខ Dashboard តាម Filter
}

function setupDropdown(data) {
    const classes = [...new Set(data.map(d => d.classRoom))].sort();
    const sel = document.getElementById("classFilter");
    sel.innerHTML = '<option value="all">ថ្នាក់ទាំងអស់</option>';
    classes.forEach(c => {
        if(c) sel.innerHTML += `<option value="${c}">${c}</option>`;
    });
}

// 6. Edit System
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
    document.getElementById("edit-status").value = student.status.trim();
}

function closeModal() {
    document.getElementById("editModal").style.display = "none";
}

// Auto Calculate Total in Form
function calculateTotal() {
    const p1 = parseCurrency(document.getElementById("edit-first-pay").value);
    const p2 = parseCurrency(document.getElementById("edit-second-pay").value);
    const total = p1 + p2;
    document.getElementById("edit-total-pay").value = formatCurrency(total);
}

// Submit Form (UPDATE)
document.getElementById("editForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.querySelector(".save-btn");
    const originalText = btn.innerText;
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
        await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        alert("ជោគជ័យ!");
        closeModal();
        fetchData(); // Reload Data
    } catch (err) {
        alert("មានបញ្ហាពេលរក្សាទុក!");
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
});

// Utilities
function parseCurrency(str) {
    if(!str) return 0;
    // លុប KHR, $, និង , ចេញ ទុកតែលេខ
    return parseFloat(str.toString().replace(/[^0-9.]/g, '')) || 0;
}

function formatCurrency(num) {
    return num.toLocaleString('en-US') + " KHR";
}

// Navigation & Theme
function switchView(view) {
    ['dashboard', 'students', 'settings'].forEach(v => {
        document.getElementById('view-' + v).style.display = 'none';
        document.getElementById('nav-' + v).classList.remove('active');
    });
    document.getElementById('view-' + view).style.display = 'block';
    document.getElementById('nav-' + view).classList.add('active');
}

function toggleTheme(isDark) {
    if(isDark) {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
    } else {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
    }
}

function loadTheme() {
    const theme = localStorage.getItem('theme');
    if(theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.getElementById("themeSwitch").checked = true;
    }
}
