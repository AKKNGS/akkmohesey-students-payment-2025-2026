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

function updateDashboard(data) {
    // 1. បង្ហាញចំនួនសិស្សសរុប
    document.getElementById("totalStudents").innerText = data.length;

    // 2. រាប់ចំនួន Paid (ប្រើ includes ដើម្បីឱ្យប្រាកដថាចាប់បានត្រឹមត្រូវ)
    const paidCount = data.filter(s => {
        // បំប្លែងទៅជាអក្សរតូចទាំងអស់ ហើយឆែកមើលថាមានពាក្យ "paid" ដែរឬទេ?
        return s.status && s.status.toString().toLowerCase().includes("paid");
    }).length;
    
    document.getElementById("totalPaid").innerText = paidCount;

    // 3. រាប់ចំនួន Partial
    const partialCount = data.filter(s => {
        // បំប្លែងទៅជាអក្សរតូចទាំងអស់ ហើយឆែកមើលថាមានពាក្យ "partial" ដែរឬទេ?
        return s.status && s.status.toString().toLowerCase().includes("partial");
    }).length;
    
    document.getElementById("totalPartial").innerText = partialCount;
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

