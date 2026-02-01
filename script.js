const API_URL = 'https://script.google.com/macros/s/AKfycbxuaSA1qRHOvTRvriKl1F76e-FU9maGdBFd7ubMCBhDmzkldPpIBRyclCskntkKiyL6eg/exec';

const tableHead = document.querySelector('#dataTable thead');
const tableBody = document.querySelector('#dataTable tbody');
const sheetSelect = document.getElementById('sheetSelect');

sheetSelect.addEventListener('change', () => loadData(sheetSelect.value));

loadData(sheetSelect.value);

function loadData(sheet) {
  fetch(`${API_URL}?sheet=${sheet}`)
    .then(res => res.json())
    .then(data => renderTable(data));
}

function renderTable(data) {
  tableHead.innerHTML = '';
  tableBody.innerHTML = '';

  if (data.length === 0) return;

  // Header
  let tr = document.createElement('tr');
  Object.keys(data[0]).forEach(key => {
    let th = document.createElement('th');
    th.textContent = key;
    tr.appendChild(th);
  });
  tableHead.appendChild(tr);

  // Rows
  data.forEach(row => {
    let tr = document.createElement('tr');
    Object.entries(row).forEach(([key, val]) => {
      let td = document.createElement('td');
      td.textContent = val;

      if (key === 'Status') {
        td.classList.add(`status-${val}`);
      }

      tr.appendChild(td);
    });
    tableBody.appendChild(tr);
  });
}
