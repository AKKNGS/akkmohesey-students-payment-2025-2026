// ជំនួសកន្លែងនេះដោយ Web App URL ដែលអ្នកបានពី Apps Script
const API_URL = "https://script.google.com/macros/s/AKfycbzHbeiK7LPCCTuiPkcdmf24nbiUuL0o3dxO-p-Bld-_wXaWZG4Y2BaSNK-7M1mLYRTVNw/exec";

let allStudents = [];

// ដំណើរការពេលបើក Website
document.addEventListener("DOMContentLoaded", () => {
    fetchData();
    
    // Search listener
    document.getElementById("searchInput").addEventListener("input", (e) => {
        filterData(e.target.value, document.getElementById("classFilter").value);
    });

    // Class Filter listener
    document.getElementById("classFilter").addEventListener("change", (e) => {
        filterData(document.getElementById("searchInput").value, e.target.value);
    });
});

async function fetchData() {
    try {
        const response = await fetch(API_URL);
        const rawData = await response.json();

        // --- កូដថ្មី៖ ច្រោះយកតែ ID មិនស្ទួន (Remove Duplicates) ---
        // បើមាន ID ដូចគ្នា វាបូកបញ្ចូលតែមួយ
        const uniqueDataMap = new Map();
        rawData.forEach(student => {
            if (student.id && student.id !== "") {
                uniqueDataMap.set(student.id, student);
            }
        });
        const uniqueData = Array.from(uniqueDataMap.values());
        
        allStudents = uniqueData; // ប្រើទិន្នន័យដែលច្រោះរួច
        // ----------------------------------------------------

        setupClassFilter(allStudents);
        updateDashboard(allStudents);
        renderTable(allStudents);
        
    } catch (error) {
        console.error("Error fetching data:", error);
        // ... error handling
    }
}

function setupClassFilter(data) {
    const classes = [...new Set(data.map(item => item.sheetName))]; // យកឈ្មោះថ្នាក់ដែលមិនស្ទួន
    const select = document.getElementById("classFilter");
    
    classes.sort().forEach(cls => {
        const option = document.createElement("option");
        option.value = cls;
        option.innerText = cls;
        select.appendChild(option);
    });
}

function updateDashboard(data) {
    document.getElementById("totalStudents").innerText = data.length;
    document.getElementById("totalPaid").innerText = data.filter(s => s.status === "Paid").length;
    document.getElementById("totalPartial").innerText = data.filter(s => s.status === "Partial").length;
}

function renderTable(data) {
    const tbody = document.getElementById("studentTableBody");
    tbody.innerHTML = "";

    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;">រកមិនឃើញទិន្នន័យ</td></tr>`;
        return;
    }

    data.forEach(student => {
        const tr = document.createElement("tr");
        
        // ពិនិត្យ Status ដើម្បីដាក់ពណ៌
        let statusClass = student.status === "Paid" ? "status-paid" : "status-partial";
        
        tr.innerHTML = `
            <td>${student.id}</td>
            <td style="font-weight:bold;">${student.name}</td>
            <td>${student.gender}</td>
            <td>${student.classRoom}</td>
            <td>${student.schoolFee}</td>
            <td style="color:blue">${student.totalPaid}</td>
            <td style="color:red">${student.balance}</td>
            <td><span class="${statusClass}">${student.status}</span></td>
            <td><button class="edit-btn" onclick="editStudent('${student.id}')"><i class="fas fa-edit"></i></button></td>
        `;
        tbody.appendChild(tr);
    });
}

function filterData(searchTerm, classFilter) {
    const filtered = allStudents.filter(student => {
        const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              student.id.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesClass = classFilter === "all" || student.sheetName === classFilter;
        
        return matchesSearch && matchesClass;
    });
    renderTable(filtered);
    updateDashboard(filtered);
}

function editStudent(id) {
    alert("មុខងារកែប្រែនឹងត្រូវបន្ថែមនៅពេលក្រោយសម្រាប់ ID: " + id);
    // នៅត្រង់នេះ អ្នកអាចបង្កើត Popup Modal ដើម្បីបញ្ចូលលុយ ហើយហៅទៅ function doPost ក្នុង Apps Script

}

function switchView(viewName) {
    // 1. លាក់គ្រប់ Section ទាំងអស់
    document.getElementById('view-dashboard').style.display = 'none';
    document.getElementById('view-students').style.display = 'none';
    document.getElementById('view-payments').style.display = 'none';
    document.getElementById('view-settings').style.display = 'none';

    // 2. បង្ហាញតែ Section ដែលបានជ្រើសរើស
    document.getElementById('view-' + viewName).style.display = 'block';

    // 3. Update ពណ៌លើ Menu (Active Class)
    // ដក class 'active' ពីគ្រប់ menu
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => item.classList.remove('active'));

    // ដាក់ class 'active' លើ menu ដែលកំពុងចុច
    document.getElementById('nav-' + viewName).classList.add('active');
}

