"use strict";

// Customer Service Data Query
// Main application functionality

const STORAGE_KEY = "customerServiceRequests";

const customerForm = document.getElementById("customerForm");
const customerName = document.getElementById("customerName");
const customerEmail = document.getElementById("customerEmail");
const customerIssue = document.getElementById("customerIssue");
const priorityInput = document.getElementById("priority");
const searchInput = document.getElementById("searchInput");
const requestTable = document.getElementById("requestTable");
const exportButton = document.getElementById("exportButton");

// Synthetic demonstration records
const sampleRequests = [
    {
        id: "CSR-1001",
        name: "Ama Mensah",
        email: "ama@example.com",
        issue: "Unable to reset password",
        priority: "High",
        status: "Open",
        createdAt: new Date().toISOString()
    },
    {
        id: "CSR-1002",
        name: "Kojo Asare",
        email: "kojo@example.com",
        issue: "Payment confirmation",
        priority: "Normal",
        status: "Pending",
        createdAt: new Date().toISOString()
    },
    {
        id: "CSR-1003",
        name: "Esi Owusu",
        email: "esi@example.com",
        issue: "Update account details",
        priority: "Urgent",
        status: "Resolved",
        createdAt: new Date().toISOString()
    }
];

// Load saved requests from this browser.
function loadRequests() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);

        if (saved === null) {
            return sampleRequests;
        }

        const parsed = JSON.parse(saved);

        if (!Array.isArray(parsed)) {
            throw new Error("Invalid saved data");
        }

        return parsed;
    } catch (error) {
        console.error("Unable to load requests:", error);
        return sampleRequests;
    }
}

let requests = loadRequests();

// Save requests in browser storage.
function saveRequests() {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(requests)
        );
        return true;
    } catch (error) {
        console.error("Unable to save requests:", error);
        showMessage(
            "Unable to save data. Check your browser storage.",
            true
        );
        return false;
    }
}

// Create an accessible feedback message.
function showMessage(message, isError = false) {
    let messageBox = document.getElementById("appMessage");

    if (!messageBox) {
        messageBox = document.createElement("p");
        messageBox.id = "appMessage";
        messageBox.setAttribute("role", "status");
        messageBox.setAttribute("aria-live", "polite");

        customerForm.before(messageBox);
    }

    messageBox.textContent = message;
    messageBox.style.padding = "10px";
    messageBox.style.margin = "12px 0";
    messageBox.style.borderRadius = "8px";
    messageBox.style.background = isError
        ? "#fee2e2"
        : "#dcfce7";
    messageBox.style.color = isError
        ? "#991b1b"
        : "#166534";
}

// Escape values before displaying them as HTML.
function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => {
        const replacements = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return replacements[character];
    });
}

// Update dashboard statistics.
function updateDashboard() {
    const uniqueCustomers = new Set(
        requests.map(request => request.email.toLowerCase())
    );

    const openRequests = requests.filter(
        request => request.status === "Open"
    );

    const resolvedRequests = requests.filter(
        request => request.status === "Resolved"
    );

    document.getElementById("customerCount").textContent =
        uniqueCustomers.size;

    document.getElementById("requestCount").textContent =
        openRequests.length;

    document.getElementById("resolvedCount").textContent =
        resolvedRequests.length;
}

// Display customer service requests.
function displayRequests() {
    updateDashboard();

    const searchTerm = searchInput.value
        .trim()
        .toLowerCase();

    const filteredRequests = requests.filter(request => {
        return [
            request.id,
            request.name,
            request.email,
            request.issue,
            request.priority,
            request.status
        ].some(value =>
            String(value).toLowerCase().includes(searchTerm)
        );
    });

    if (filteredRequests.length === 0) {
        requestTable.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    No matching requests found.
                </td>
            </tr>
        `;
        return;
    }

    requestTable.innerHTML = filteredRequests.map(request => `
        <tr>
            <td>${escapeHTML(request.id)}</td>

            <td>${escapeHTML(request.name)}</td>

            <td>${escapeHTML(request.email)}</td>

            <td>${escapeHTML(request.issue)}</td>

            <td>
                <span class="badge priority-${escapeHTML(
                    request.priority.toLowerCase()
                )}">
                    ${escapeHTML(request.priority)}
                </span>
            </td>

            <td>
                <span class="badge status-${escapeHTML(
                    request.status.toLowerCase()
                )}">
                    ${escapeHTML(request.status)}
                </span>
            </td>

            <td>
                ${
                    request.status !== "Resolved"
                    ? `
                        <button
                            type="button"
                            data-action="resolve"
                            data-id="${escapeHTML(request.id)}">
                            Resolve
                        </button>
                    `
                    : `
                        <button
                            type="button"
                            data-action="reopen"
                            data-id="${escapeHTML(request.id)}">
                            Reopen
                        </button>
                    `
                }

                <button
                    type="button"
                    data-action="delete"
                    data-id="${escapeHTML(request.id)}">
                    Delete
                </button>
            </td>
        </tr>
    `).join("");
}

// Add a new customer service request.
customerForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const name = customerName.value.trim();
    const email = customerEmail.value.trim().toLowerCase();
    const issue = customerIssue.value.trim();
    const priority = priorityInput.value;

    if (name.length < 2) {
        showMessage(
            "Please enter the customer's full name.",
            true
        );
        return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showMessage(
            "Please enter a valid email address.",
            true
        );
        return;
    }

    if (issue.length < 3) {
        showMessage(
            "Please describe the service issue.",
            true
        );
        return;
    }

    if (!["Normal", "High", "Urgent"].includes(priority)) {
        showMessage("Select a valid priority.", true);
        return;
    }

    const duplicate = requests.some(request =>
        request.email.toLowerCase() === email &&
        request.issue.toLowerCase() === issue.toLowerCase() &&
        request.status !== "Resolved"
    );

    if (duplicate) {
        showMessage(
            "This customer already has a matching unresolved request.",
            true
        );
        return;
    }

    const newRequest = {
        id: "CSR-" + Date.now(),
        name,
        email,
        issue,
        priority,
        status: "Open",
        createdAt: new Date().toISOString()
    };

    requests.unshift(newRequest);

    if (!saveRequests()) {
        requests.shift();
        return;
    }

    customerForm.reset();
    displayRequests();

    showMessage("Customer request added successfully.");
});

// Search requests while typing.
searchInput.addEventListener("input", displayRequests);

// Handle Resolve, Reopen and Delete actions.
requestTable.addEventListener("click", function(event) {
    const button = event.target.closest("button[data-action]");

    if (!button) {
        return;
    }

    const requestId = button.dataset.id;
    const action = button.dataset.action;

    const request = requests.find(
        item => item.id === requestId
    );

    if (!request) {
        showMessage("Request not found.", true);
        return;
    }

    if (action === "delete") {
        const confirmed = window.confirm(
            "Are you sure you want to delete this request?"
        );

        if (!confirmed) {
            return;
        }

        const previousRequests = requests;
        requests = requests.filter(
            item => item.id !== requestId
        );

        if (!saveRequests()) {
            requests = previousRequests;
            return;
        }

        showMessage("Request deleted successfully.");
    }

    if (action === "resolve" || action === "reopen") {
        const previousStatus = request.status;

        request.status = action === "resolve"
            ? "Resolved"
            : "Open";

        if (!saveRequests()) {
            request.status = previousStatus;
            return;
        }

        showMessage(
            "Request status updated to " + request.status + "."
        );
    }

    displayRequests();
});

// Escape CSV cells and prevent spreadsheet formulas
// from being interpreted as formulas.
function csvCell(value) {
    let text = String(value ?? "");

    if (/^[\s]*[=+\-@]/.test(text)) {
        text = "'" + text;
    }

    return '"' + text.replace(/"/g, '""') + '"';
}

// Export currently filtered requests to CSV.
exportButton.addEventListener("click", function() {
    const searchTerm = searchInput.value
        .trim()
        .toLowerCase();

    const filteredRequests = requests.filter(request =>
        [
            request.id,
            request.name,
            request.email,
            request.issue,
            request.priority,
            request.status
        ].some(value =>
            String(value).toLowerCase().includes(searchTerm)
        )
    );

    const headings = [
        "Ticket ID",
        "Customer Name",
        "Email",
        "Issue",
        "Priority",
        "Status",
        "Created At"
    ];

    const rows = filteredRequests.map(request => [
        request.id,
        request.name,
        request.email,
        request.issue,
        request.priority,
        request.status,
        request.createdAt
    ]);

    const csv = "\uFEFF" + [
        headings,
        ...rows
    ].map(row =>
        row.map(csvCell).join(",")
    ).join("\r\n");

    const blob = new Blob(
        [csv],
        { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);
    const downloadLink = document.createElement("a");

    downloadLink.href = url;
    downloadLink.download = "customer-service-requests.csv";

    document.body.appendChild(downloadLink);
    downloadLink.click();
    downloadLink.remove();

    URL.revokeObjectURL(url);

    showMessage(
        "CSV export created for " +
        filteredRequests.length +
        " request(s)."
    );
});

// Initialize the application.
saveRequests();
displayRequests();