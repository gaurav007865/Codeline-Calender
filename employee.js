console.log("role:", localStorage.getItem("role"));
console.log("emp:", localStorage.getItem("emp"));


let empHolidays = [];
let empWeekOffs = [];
let empCurrentMonth = new Date().getMonth();
let empCurrentYear = new Date().getFullYear();
let empApprovedLeaves = [];
// ... existing global variables
let allEmployees = []; // To store all employees for the dropdown
// ...
// admin.js

// === Global Variables for Pagination ===
let adminCurrentLeavePage = 1;
const LEAVES_PER_PAGE = 4; // 4 notifications per page
let filteredAdminLeaves = []; // List of pending leaves to be paginated
// ======================================



function getCleanDate(dateInput) {
  if (!dateInput) return '';
  // If already yyyy-mm-dd string
  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    return dateInput;
  }
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) {
      return String(dateInput).substring(0, 10);
    }
    // Use LOCAL getters to avoid UTC shift
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (e) {
    return String(dateInput).substring(0, 10);
  }
}

// -----------------------------------------------------------------------------------


// Wait for DOM
window.onload = () => {
  if(localStorage.getItem("role") !== "employee") logout();
  let emp = JSON.parse(localStorage.getItem("emp"));
  document.getElementById("emp-name").textContent = emp[1];

  // Auto-fill leave form details
  document.getElementById("leave-id").value = emp[0];
  document.getElementById("leave-name").value = emp[1];
  document.getElementById("leave-email").value = emp[2];
  document.getElementById("leave-id").readOnly = true;
  document.getElementById("leave-name").readOnly = true;
  document.getElementById("leave-email").readOnly = true;

  loadEmployeeData(emp, () => {
    renderEmployeeEvents();
    renderEmployeeLeaves(emp[0]);
    renderEmployeeCalendar(emp);
renderRemainingLeaves(emp[0]); // ✅ NEW CALL HERE
loadWeekOffExchanges(emp[0]);


  });
};

function logout() {
  localStorage.clear();
  window.location.href = "index.html";
}

function formatDate(dateInput) {
  let dt = new Date(dateInput);
  let year = dt.getFullYear();
  let month = String(dt.getMonth() + 1).padStart(2, '0');
  let day = String(dt.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}


function getData(callback) {
  fetch(`${apiURL}?action=getData`)
    .then(res => res.json())
    .then(callback)
    .catch(() => callback({ holidays: [], weekoffs: [], employees: [] }));
}

function loadEmployeeData(emp, callback) {
  getData(data => {
    empHolidays = [];
    for(let i=1;i<data.holidays.length;i++) {
      empHolidays.push({
        date: getCleanDate(data.holidays[i][0]), // Use getCleanDate here too
        name: data.holidays[i][1],
        type: data.holidays[i][2]
      });
    }
    empWeekOffs = [];
    for(let i=1;i<data.weekoffs.length;i++) {
      if(data.weekoffs[i][1] === emp[1]) {
        empWeekOffs.push({
          date: getCleanDate(data.weekoffs[i][0]), // Use getCleanDate here too
          reason: data.weekoffs[i][2]
        });
      }
    }

// ✅ NEW: Store all employees and populate dropdown
        allEmployees = data.employees.slice(1);
        populateEmployeeDropdown(emp[0], emp[4]);


    if(callback) callback();
  });
}

function renderEmployeeEvents() {
  let rows = [];
  // --- NAYI LINE ---
  // Aaj ki date ko YYYY-MM-DD format mein prapt karein
  const today = getCleanDate(new Date()); 

  for(let h of empHolidays) {
    // --- NAYA IF CONDITION ---
    // Sirf tabhi row add karein jab event ki date aaj ya aaj ke baad ki hai
    if (h.date >= today) { 
      rows.push(`<tr><td>${h.date}</td><td>${h.name}</td><td>${h.type || '-'}</td></tr>`);
    } // --- NAYA IF CONDITION END ---
  }

  for(let w of empWeekOffs) {
    // --- NAYA IF CONDITION ---
    // Yahan bhi check karein ki weekoff ki date aaj ya aaj ke baad ki hai
    if (w.date >= today) { 
      rows.push(`<tr><td>${w.date}</td><td>Week Off</td><td>${w.reason || '-'}</td></tr>`);
    } // --- NAYA IF CONDITION END ---
  }

  document.getElementById("emp-events").innerHTML =
    "<tr><th>Date</th><th>Event</th><th>Type</th></tr>" + rows.join('');
}
function renderEmployeeCalendar(emp, month = empCurrentMonth, year = empCurrentYear) {
  const calendarDays = document.getElementById('empCalendarDays');
  const monthYear = document.getElementById('empMonthYear');
  calendarDays.innerHTML = '';

  const date = new Date(year, month, 1);
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const firstDay = date.getDay();

  monthYear.textContent = date.toLocaleString('default', {month:'long', year:'numeric'});

  for(let i=0; i < firstDay; i++) {
    const blank = document.createElement('div');
    blank.classList.add('inactive');
    calendarDays.appendChild(blank);
  }
  for(let d=1; d <= daysInMonth; d++) {
  const cell = document.createElement('div');
  let dt = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;

  let cellContent = `<div>${d}</div>`;

  let holiday = empHolidays.find(h => h.date === dt);
  if(holiday) {
    cell.classList.add('holiday');
    cellContent += `<div class="holiday-type">${holiday.type}</div>`;
    cell.setAttribute('title', `${holiday.name} (${holiday.type || '-'})`);
  }

  let weekOffDay = empWeekOffs.find(w => w.date === dt);
  if(weekOffDay) {
    cell.classList.add('weekoff');
    cell.setAttribute('title', `Week Off (${weekOffDay.reason || '-'})`);
  }
  if(emp[4]) {
    let cellDay = new Date(dt).toLocaleString('en-US', {weekday: 'long'}).toLowerCase();
    let empWeekOffDay = emp[4].trim().toLowerCase();
    if(cellDay === empWeekOffDay) {
      cell.classList.add('weekoff');
      cell.setAttribute('title', `Standard Week Off (${emp[4]})`);
    }
  }
  if(empApprovedLeaves && empApprovedLeaves.includes(dt)){
    cell.classList.add('leave');
    cell.setAttribute('title', `Leave Approved`);
  }
  if(year === new Date().getFullYear() && month === new Date().getMonth() && d === new Date().getDate()) {
    cell.classList.add('today');
  }
  cell.innerHTML = cellContent;
  calendarDays.appendChild(cell);
}

}

document.getElementById('empPrevMonth').onclick = () => {
  empCurrentMonth--;
  if(empCurrentMonth < 0) {
    empCurrentMonth = 11;
    empCurrentYear--;
  }
  renderEmployeeCalendar(JSON.parse(localStorage.getItem("emp")), empCurrentMonth, empCurrentYear);
};

document.getElementById('empNextMonth').onclick = () => {
  empCurrentMonth++;
  if(empCurrentMonth > 11) {
    empCurrentMonth = 0;
    empCurrentYear++;
  }
  renderEmployeeCalendar(JSON.parse(localStorage.getItem("emp")), empCurrentMonth, empCurrentYear);
};

function applyLeave() {
  let emp = JSON.parse(localStorage.getItem("emp"));
  let id = document.getElementById("leave-id").value;
  let name = document.getElementById("leave-name").value;
  let email = document.getElementById("leave-email").value;
  let date = document.getElementById("leave-date").value.substring(0,10); // Should be YYYY-MM-DD
  let type = document.getElementById("leave-type").value;
  fetch(`${apiURL}?action=applyLeave&id=${id}&name=${name}&email=${email}&date=${date}&type=${type}`)
    .then(res => res.json())
    .then(json => {
      document.getElementById("leave-msg").textContent = json.message;
      if(json.success) {
        renderEmployeeLeaves(id);
renderRemainingLeaves(id);
        document.getElementById("leave-date").value = '';
        document.getElementById("leave-type").value = '';
      }
    });
}

// --- MODIFIED: Uses getCleanDate to correctly format the date from the API response ---
function renderEmployeeLeaves(empId) {
  fetch(`${apiURL}?action=getLeaves&id=${empId}`)
    .then(res => res.json())
    .then(leaves => {
      let rows = leaves.map(leave => {
        const leaveDate = getCleanDate(leave[4]); // Use the new function here!
        return `<tr><td>${leave[3]}</td><td>${leaveDate}</td><td>${leave[5]}</td></tr>`;
      }).join('');
      
      document.getElementById("emp-leave-table").innerHTML =
        "<table><tr><th>Type</th><th>Date</th><th>Status</th></tr>" + rows + "</table>";
      
      // Update empApprovedLeaves using the new function too
      empApprovedLeaves = leaves.filter(leave => leave[5] === "Approved").map(leave => getCleanDate(leave[4]));
      
      renderEmployeeCalendar(JSON.parse(localStorage.getItem("emp")), empCurrentMonth, empCurrentYear);
    });
}


// employee.js

// --- MODIFIED FUNCTION: Fetches and Renders Remaining Leaves (Using Cards) ---
function renderRemainingLeaves(empId) {
    const container = document.getElementById("leaves-summary");
    container.innerHTML = '<div class="loading-text">Loading...</div>';

    fetch(`${apiURL}?action=getRemainingLeaves&id=${empId}`)
        .then(res => res.json())
        .then(data => {
            if (data.success && data.limits) {
                const limits = data.limits;
                
                const clRemaining = limits.casual.total - limits.casual.used;
                const plRemaining = limits.privilege.total - limits.privilege.used;
                const slRemaining = limits.sick.total - limits.sick.used;
                
                // Helper function to get the status class (for CSS styling)
                const getStatusClass = (remaining, total) => {
                    if (remaining === 0) return 'fully-used';
                    if (remaining <= 1) return 'low-remaining';
                    return 'high-remaining';
                };
                
                const summaryHTML = `
                    <div class="leaves-grid">
                        
                                                <div class="leave-card ${getStatusClass(clRemaining, limits.casual.total)}">
                            <h4>Casual Leave (CL)</h4>
                            <p class="remaining-count">${clRemaining}</p>
                            <p class="total-count">/ ${limits.casual.total}</p>
                        </div>
                        
                                                <div class="leave-card ${getStatusClass(plRemaining, limits.privilege.total)}">
                            <h4>Privilege Leave (PL)</h4>
                            <p class="remaining-count">${plRemaining}</p>
                            <p class="total-count">/ ${limits.privilege.total}</p>
                        </div>
                        
                                                <div class="leave-card ${getStatusClass(slRemaining, limits.sick.total)}">
                            <h4>Sick Leave (SL)</h4>
                            <p class="remaining-count">${slRemaining}</p>
                            <p class="total-count">/ ${limits.sick.total}</p>
                        </div>

                    </div> 
                    <div class="unlimited-notice">
                        <strong>Paid/Unpaid Leaves:</strong> Unlimited 
                    </div>
                `;
                container.innerHTML = summaryHTML;
            } else {
                container.innerHTML = `<p style="color:red;">Error fetching leave limits.</p>`;
            }
        })
        .catch(err => {
            container.innerHTML = `<p style="color:red;">Network error: ${err.message}</p>`;
        });
}


// --------------------------------------------------------------------------
// ✅ NAYA FUNCTION: Populates the Employee dropdown for exchange
// --------------------------------------------------------------------------
function populateEmployeeDropdown(currentEmpId, currentEmpWO) {
    const select = document.getElementById('target-emp-id');
    const woDisplay = document.getElementById('requester-wo-display');

    select.innerHTML = '<option value="">-- Select Employee --</option>';
    woDisplay.textContent = currentEmpWO;

    allEmployees.forEach(emp => {
        const empId = emp[0];
        const empName = emp[1];
        const empWO = emp[4];

        // Only show other employees and those who have a different Week Off
        if (empId !== currentEmpId && empWO !== currentEmpWO) {
            const option = document.createElement('option');
            option.value = empId;
            option.textContent = `${empName} (Current WO: ${empWO})`;
            select.appendChild(option);
        }
    });
}

// --------------------------------------------------------------------------
// ✅ NAYA FUNCTION: Sends the Week Off Exchange request
// --------------------------------------------------------------------------
function createWeekOffExchange() {
    const emp = JSON.parse(localStorage.getItem("emp"));
    const requesterId = emp[0];
    const targetId = document.getElementById('target-emp-id').value;
    const msgBox = document.getElementById('exchange-msg');
    const btn = document.getElementById('send-exchange-btn');
    const originalText = btn.textContent;

    if (!targetId) {
        msgBox.textContent = "Please select an employee to exchange with.";
        msgBox.style.color = "red";
        return;
    }

    btn.textContent = "Sending...";
    btn.disabled = true;
    msgBox.textContent = "";

    fetch(`${apiURL}?action=createWeekOffExchange&requesterId=${requesterId}&targetId=${targetId}`)
        .then(res => res.json())
        .then(json => {
            if (json.success) {
                msgBox.textContent = `Success! Request sent to the employee. Effective from: ${json.effectiveDate}`;
                msgBox.style.color = "green";
                document.getElementById('target-emp-id').value = ''; // Reset dropdown
                loadWeekOffExchanges(requesterId); // Refresh lists
            } else {
                msgBox.textContent = `Error: ${json.message || "Failed to send request."}`;
                msgBox.style.color = "red";
            }
        })
        .catch(err => {
            msgBox.textContent = `Network Error: ${err.message}`;
            msgBox.style.color = "red";
        })
        .finally(() => {
            btn.textContent = originalText;
            btn.disabled = false;
        });
}

// --------------------------------------------------------------------------
// ✅ NAYA FUNCTION: Loads and separates Incoming and Sent Exchanges
// --------------------------------------------------------------------------
// --------------------------------------------------------------------------
// ✅ UPDATED FUNCTION: Loads and separates Incoming and Sent Exchanges
// (Added robust error checking for non-array/empty JSON responses)
// --------------------------------------------------------------------------
function loadWeekOffExchanges(currentEmpId) {
    const incomingArea = document.getElementById('incoming-exchanges');
    const sentArea = document.getElementById('sent-exchanges');

    // Show loading state
    incomingArea.innerHTML = '<p class="loading-text">Loading incoming requests...</p>';
    sentArea.innerHTML = '<p class="loading-text">Loading sent requests...</p>';

    fetch(`${apiURL}?action=getWeekOffExchanges&type=all&empId=${currentEmpId}`)
        .then(res => {
            // Step 1: Check for successful HTTP status (e.g., 200 OK)
            if (!res.ok) {
                // If status is not 200-299, throw an error to be caught below
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            // Step 2: Attempt to parse the response as JSON
            return res.json();
        })
        .then(data => {
            
            // 🛑 FIX 1: Ensure 'data' is an array before attempting to filter
            if (!Array.isArray(data)) {
                 console.error("API did not return an array for exchanges:", data);
                 // If not an array, treat it as an empty list to prevent crashes
                 data = []; 
            }

            // Step 3: Filtering logic (Only runs if data is an array)
            const incoming = data.filter(ex => ex.targetId == currentEmpId && ex.status === 'Pending');
            const sent = data.filter(ex => ex.requesterId == currentEmpId);

            renderIncomingExchanges(incoming, incomingArea, currentEmpId);
            renderSentExchanges(sent, sentArea);
        })
        .catch(err => {
            // This catch block handles network errors, JSON parsing errors, 
            // and the error thrown if res.ok is false.
            console.error("Error fetching Week Off exchange requests:", err);
            
            // 🛑 FIX 2: Display clear error messages in the UI
            incomingArea.innerHTML = '<p style="color:red;">Error fetching requests. Check console for details.</p>';
            sentArea.innerHTML = '<p style="color:red;">Error fetching requests. Check console for details.</p>';
        });
}

// Call this new function when the page loads
// Find the `window.onload` section and add the call:
/*
// Inside window.onload, after loadEmployeeData:
loadEmployeeData(emp, () => {
    // ... existing calls ...
    renderRemainingLeaves(emp[0]); 
    loadWeekOffExchanges(emp[0]); // ✅ ADD THIS LINE
});
*/

// --------------------------------------------------------------------------
// ✅ NAYA FUNCTION: Renders requests where the current user is the TARGET (needs action)
// --------------------------------------------------------------------------
function renderIncomingExchanges(incoming, container, targetEmpId) {
    if (incoming.length === 0) {
        container.innerHTML = '<p class="placeholder-text">No pending exchange requests.</p>';
        return;
    }

    const listHTML = incoming.map(ex => {
        const btnHTML = `
            <button class="approve-btn" onclick="updateExchangeStatus(event, ${ex.requestId}, 'Approved', '${targetEmpId}', '${ex.requesterName}')">Accept</button>
            <button class="reject-btn" onclick="updateExchangeStatus(event, ${ex.requestId}, 'Rejected', '${targetEmpId}', '${ex.requesterName}')">Decline</button>
        `;
        return `
            <div class="exchange-item pending">
                <p>
                    <strong>${ex.requesterName}</strong> (${ex.requesterId}) wants to swap their 
                    <span class="original-wo">${ex.requesterWO}</span> with your 
                    <span class="original-wo">${ex.targetWO}</span>.
                </p>
                <p class="effective-date">Effective from: **${ex.effectiveDate}**</p>
                <div class="exchange-actions">${btnHTML}</div>
            </div>
        `;
    }).join('');

    container.innerHTML = `<div class="exchange-list">${listHTML}</div>`;
}

// --------------------------------------------------------------------------
// ✅ NAYA FUNCTION: Renders requests where the current user is the REQUESTER (history)
// --------------------------------------------------------------------------
function renderSentExchanges(sent, container) {
    if (sent.length === 0) {
        container.innerHTML = '<p class="placeholder-text">No sent requests.</p>';
        return;
    }

    const listHTML = sent.map(ex => {
        const statusClass = ex.status.toLowerCase();
        return `
            <div class="exchange-item ${statusClass}">
                <span class="exchange-status status-${statusClass}">${ex.status}</span>
                <p>
                    Requested exchange with <strong>${ex.targetName}</strong> (${ex.targetId}).
                </p>
                <p>
                    Your original WO: ${ex.requesterWO} | Their original WO: ${ex.targetWO}
                </p>
                <p class="effective-date">Effective from: **${ex.effectiveDate}**</p>
            </div>
        `;
    }).join('');

    container.innerHTML = `<div class="exchange-list">${listHTML}</div>`;
}
// --------------------------------------------------------------------------
// ✅ NAYA FUNCTION: Target Employee handles the request (Accept/Decline)
// --------------------------------------------------------------------------
// employee.js

function updateExchangeStatus(e, requestId, status, employeeId, requesterName) {
    const btn = e.target;
    const originalText = btn.textContent;
    const confirmMsg = (status === 'Approved') 
        ? `Are you sure you want to accept the Week Off exchange with ${requesterName}? Your Week Off will change permanently from the effective date.`
        : `Are you sure you want to decline the request from ${requesterName}?`;

    if (!confirm(confirmMsg)) {
        // Restore button state if confirmation is cancelled
        const actionGroup = btn.parentElement;
        Array.from(actionGroup.children).forEach(b => b.disabled = false);
        return; 
    }

    // Disable all buttons in the action group
    const actionGroup = btn.parentElement;
    Array.from(actionGroup.children).forEach(b => b.disabled = true);
    btn.textContent = "Processing...";

    fetch(`${apiURL}?action=updateWeekOffExchangeStatus&requestId=${requestId}&status=${status}&employeeId=${employeeId}`)
        .then(res => res.json())
        .then(json => {
            if (json.success) {
                alert(json.message);

                // ✅ FIX: Reload ALL data after approval/rejection
                let emp = JSON.parse(localStorage.getItem("emp"));

                // Call loadEmployeeData to fetch all data again, including the NEW Week Off
                loadEmployeeData(emp, () => {
                     // After data is reloaded successfully:
                     renderEmployeeEvents();
                     renderEmployeeLeaves(emp[0]);
                     renderEmployeeCalendar(emp);
                     renderRemainingLeaves(emp[0]);
                     loadWeekOffExchanges(emp[0]); // Refresh exchange lists
                     // The WO display will be updated via populateEmployeeDropdown in loadEmployeeData
                });
                
            } else {
                alert(`Operation failed: ${json.message || "Unknown error"}`);
                // If operation failed, just refresh the lists and restore buttons
                loadWeekOffExchanges(employeeId);
            }
        })
        .catch(err => {
            console.error("Network error during status update:", err);
            alert("Network error: Could not complete the action. Check console for details. ❌");
            
            // Restore buttons manually on network error
            Array.from(actionGroup.children).forEach(b => b.disabled = false);
            btn.textContent = originalText;
            
            // Still refresh exchange lists just in case
            loadWeekOffExchanges(employeeId);
        });
}