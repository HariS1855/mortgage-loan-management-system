// Admin Dashboard & Loan Management Controller
let allAdminLoans = []; // Store fetched loans for local search/filtering
let statusChartInstance = null;
let monthlyChartInstance = null;

document.addEventListener("DOMContentLoaded", () => {
    
    const role = getRole();
    if (role !== "ROLE_ADMIN") return; // Security guard match

    const adminRecentBody = document.getElementById("admin-recent-loans-body");
    const adminLoansTableBody = document.getElementById("admin-loans-table-body");
    
    // Search and filters elements
    const filterSearch = document.getElementById("filter-search");
    const filterStatus = document.getElementById("filter-status");
    const filterType = document.getElementById("filter-type");

    // Fetch and initialize
    if (adminRecentBody || adminLoansTableBody) {
        fetchAdminLoans();
    }

    // Attach search and filter event listeners
    if (filterSearch) filterSearch.addEventListener("input", applyFilters);
    if (filterStatus) filterStatus.addEventListener("change", applyFilters);
    if (filterType) filterType.addEventListener("change", applyFilters);

    async function fetchAdminLoans() {
        try {
            const data = await apiFetch("/api/admin/loans", { method: "GET" });
            if (data && Array.isArray(data)) {
                allAdminLoans = data;
                
                // Refresh statistics counters
                updateAdminStats(allAdminLoans);

                // Render charts if canvas elements exist
                renderCharts(allAdminLoans);

                // Populate recent pending loans on Dashboard
                if (adminRecentBody) {
                    const pendingLoans = allAdminLoans.filter(l => String(l.status).toUpperCase() === "PENDING");
                    // Show newest pending first
                    renderAdminTable([...pendingLoans].reverse(), adminRecentBody, true);
                }

                // Populate all loans table on Manage page
                if (adminLoansTableBody) {
                    renderAdminTable([...allAdminLoans].reverse(), adminLoansTableBody, false);
                }
            }
        } catch (err) {
            console.error("Fetch Admin Loans Error:", err);
            const errMsg = `<tr><td colspan="7" class="text-center text-danger py-4"><i class="bi bi-exclamation-octagon-fill me-2"></i>Failed to fetch applications database from backend.</td></tr>`;
            if (adminRecentBody) adminRecentBody.innerHTML = errMsg;
            if (adminLoansTableBody) adminLoansTableBody.innerHTML = errMsg;
        }
    }

    function updateAdminStats(loans) {
        const total = loans.length;
        const approved = loans.filter(l => String(l.status).toUpperCase() === "APPROVED").length;
        const pending = loans.filter(l => String(l.status).toUpperCase() === "PENDING").length;
        const rejected = loans.filter(l => String(l.status).toUpperCase() === "REJECTED").length;

        const statTotal = document.getElementById("admin-stat-total");
        const statApproved = document.getElementById("admin-stat-approved");
        const statPending = document.getElementById("admin-stat-pending");
        const statRejected = document.getElementById("admin-stat-rejected");

        if (statTotal) statTotal.textContent = total;
        if (statApproved) statApproved.textContent = approved;
        if (statPending) statPending.textContent = pending;
        if (statRejected) statRejected.textContent = rejected;
    }

    // Render Admin Table List
    function renderAdminTable(loans, tbodyElement, isDashboardView = false) {
        tbodyElement.innerHTML = "";

        if (loans.length === 0) {
            tbodyElement.innerHTML = `<tr><td colspan="7" class="text-center text-secondary py-4">No loan applications match this filter criteria.</td></tr>`;
            return;
        }

        loans.forEach(loan => {
            const status = String(loan.status).toUpperCase();
            
            let badgeClass = "badge-pending";
            if (status === "APPROVED") badgeClass = "badge-approved";
            if (status === "REJECTED") badgeClass = "badge-rejected";

            // Identify customer name and email (safely handle nested user object if present)
            const customerName = loan.customerName || (loan.user && loan.user.name) || loan.name || "N/A";
            const customerEmail = loan.customerEmail || (loan.user && loan.user.email) || loan.email || "N/A";

            const amountStr = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(loan.loanAmount || loan.amount);
            const salaryStr = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(loan.salary);

            // Eligibility Display
            const isEligible = loan.eligible === true || loan.eligibility === true || String(loan.eligible).toUpperCase() === "ELIGIBLE";
            const eligibilityHtml = isEligible 
                ? `<span class="text-success"><i class="bi bi-patch-check-fill me-1"></i>Yes</span>`
                : `<span class="text-danger"><i class="bi bi-patch-exclamation-fill me-1"></i>No</span>`;

            // Action Buttons
            let actionsHtml = "";
            if (isDashboardView) {
                // Dashboard actions
                actionsHtml = `
                    <button class="btn btn-sm btn-success me-1 px-2 approve-btn" data-id="${loan.id}"><i class="bi bi-check-lg"></i> Approve</button>
                    <button class="btn btn-sm btn-danger px-2 reject-btn" data-id="${loan.id}"><i class="bi bi-x-lg"></i> Reject</button>
                `;
            } else {
                // Manage page actions
                const decisionBtns = status === "PENDING"
                    ? `
                        <button class="btn btn-sm btn-success me-1 approve-btn" data-id="${loan.id}"><i class="bi bi-check-lg"></i></button>
                        <button class="btn btn-sm btn-danger me-1 reject-btn" data-id="${loan.id}"><i class="bi bi-x-lg"></i></button>
                      `
                    : "";

                actionsHtml = `
                    <div class="d-flex justify-content-end align-items-center">
                        ${decisionBtns}
                        <button class="btn btn-sm btn-outline-primary view-details-btn" data-id="${loan.id}"><i class="bi bi-eye-fill"></i> Details</button>
                    </div>
                `;
            }

            const tr = document.createElement("tr");
            
            if (isDashboardView) {
                tr.innerHTML = `
                    <td class="fw-semibold">#${loan.id}</td>
                    <td>
                        <div class="fw-semibold">${customerName}</div>
                        <div class="text-secondary small" style="font-size: 0.75rem;">${customerEmail}</div>
                    </td>
                    <td>${loan.loanType || 'Mortgage'}</td>
                    <td class="fw-bold text-primary">${amountStr}</td>
                    <td>${salaryStr}</td>
                    <td><span class="badge ${badgeClass} px-3 py-2 rounded-pill">${status}</span></td>
                    <td class="text-end">${actionsHtml}</td>
                `;
            } else {
                tr.innerHTML = `
                    <td class="fw-semibold">#${loan.id}</td>
                    <td>
                        <div class="fw-semibold">${customerName}</div>
                        <div class="text-secondary small" style="font-size: 0.75rem;">${customerEmail}</div>
                    </td>
                    <td>${loan.loanType || 'Mortgage'}</td>
                    <td class="fw-bold text-primary">${amountStr}</td>
                    <td>${eligibilityHtml}</td>
                    <td><span class="badge ${badgeClass} px-3 py-2 rounded-pill">${status}</span></td>
                    <td class="text-end">${actionsHtml}</td>
                `;
            }

            tbodyElement.appendChild(tr);
        });

        // Attach event handlers to buttons dynamically
        attachActionHandlers(tbodyElement);
    }

    function attachActionHandlers(parentContainer) {
        // Approve Button Click
        parentContainer.querySelectorAll(".approve-btn").forEach(btn => {
            btn.addEventListener("click", async (e) => {
                const id = btn.getAttribute("data-id");
                if (confirm(`Are you sure you want to APPROVE mortgage application #${id}?`)) {
                    await approveLoan(id);
                }
            });
        });

        // Reject Button Click
        parentContainer.querySelectorAll(".reject-btn").forEach(btn => {
            btn.addEventListener("click", async (e) => {
                const id = btn.getAttribute("data-id");
                if (confirm(`Are you sure you want to REJECT mortgage application #${id}?`)) {
                    await rejectLoan(id);
                }
            });
        });

        // View Details Modal Button Click
        parentContainer.querySelectorAll(".view-details-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const id = btn.getAttribute("data-id");
                const loan = allAdminLoans.find(l => String(l.id) === String(id));
                if (loan) {
                    showLoanDetailsModal(loan);
                }
            });
        });
    }

    // Approve API Request
    async function approveLoan(id) {
        try {
            const data = await apiFetch(`/api/admin/approve/${id}`, { method: "PUT" });
            showToast(`Application #${id} approved successfully!`, "success");
            fetchAdminLoans(); // Automatically refresh data and sync dashboard stats & charts
        } catch (err) {
            console.error("Approve API Error:", err);
        }
    }

    // Reject API Request
    async function rejectLoan(id) {
        try {
            const data = await apiFetch(`/api/admin/reject/${id}`, { method: "PUT" });
            showToast(`Application #${id} rejected successfully!`, "danger");
            fetchAdminLoans(); // Automatically refresh data and sync dashboard stats & charts
        } catch (err) {
            console.error("Reject API Error:", err);
        }
    }

    // Modal populate and show
    function showLoanDetailsModal(loan) {
        const modalEl = document.getElementById("loanDetailsModal");
        if (!modalEl) return;

        const customerName = loan.customerName || (loan.user && loan.user.name) || loan.name || "N/A";
        const customerEmail = loan.customerEmail || (loan.user && loan.user.email) || loan.email || "N/A";
        const amountStr = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(loan.loanAmount || loan.amount);
        const salaryStr = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(loan.salary);

        document.getElementById("detail-cust-name").textContent = customerName;
        document.getElementById("detail-cust-email").textContent = customerEmail;
        document.getElementById("detail-cust-age").textContent = loan.age || "N/A";
        document.getElementById("detail-cust-salary").textContent = salaryStr;
        document.getElementById("detail-cust-emp").textContent = loan.employmentType || "N/A";
        
        document.getElementById("detail-loan-id").textContent = `#${loan.id}`;
        document.getElementById("detail-loan-type").textContent = loan.loanType || "Mortgage";
        document.getElementById("detail-loan-amount").textContent = amountStr;
        
        const isEligible = loan.eligible === true || loan.eligibility === true || String(loan.eligible).toUpperCase() === "ELIGIBLE";
        const eligEl = document.getElementById("detail-loan-eligibility");
        eligEl.innerHTML = isEligible 
            ? `<span class="badge bg-success-subtle text-success px-2 py-1"><i class="bi bi-patch-check-fill me-1"></i>System Approved</span>`
            : `<span class="badge bg-danger-subtle text-danger px-2 py-1"><i class="bi bi-patch-exclamation-fill me-1"></i>System Flagged</span>`;
            
        const status = String(loan.status).toUpperCase();
        let badgeClass = "badge-pending";
        if (status === "APPROVED") badgeClass = "badge-approved";
        if (status === "REJECTED") badgeClass = "badge-rejected";
        document.getElementById("detail-loan-status").innerHTML = `<span class="badge ${badgeClass} px-3 py-1.5 rounded-pill">${status}</span>`;

        document.getElementById("detail-loan-purpose").textContent = loan.purpose || "No details provided.";

        // Populate Action Buttons inside modal based on status
        const footerActionContainer = document.getElementById("modal-action-buttons");
        if (footerActionContainer) {
            if (status === "PENDING") {
                footerActionContainer.innerHTML = `
                    <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Close</button>
                    <button type="button" class="btn btn-danger modal-reject-btn"><i class="bi bi-x-circle me-1"></i>Reject</button>
                    <button type="button" class="btn btn-success modal-approve-btn"><i class="bi bi-check-circle me-1"></i>Approve</button>
                `;
                
                // Add modal click actions
                const bsModal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
                
                footerActionContainer.querySelector(".modal-approve-btn").addEventListener("click", async () => {
                    if (confirm(`Approve application #${loan.id}?`)) {
                        bsModal.hide();
                        await approveLoan(loan.id);
                    }
                });
                
                footerActionContainer.querySelector(".modal-reject-btn").addEventListener("click", async () => {
                    if (confirm(`Reject application #${loan.id}?`)) {
                        bsModal.hide();
                        await rejectLoan(loan.id);
                    }
                });
            } else {
                footerActionContainer.innerHTML = `<button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Close</button>`;
            }
        }

        const modal = new bootstrap.Modal(modalEl);
        modal.show();
    }

    // Apply Local Search/Filters
    function applyFilters() {
        const query = filterSearch ? filterSearch.value.toLowerCase().trim() : "";
        const statusVal = filterStatus ? filterStatus.value.toUpperCase() : "ALL";
        const typeVal = filterType ? filterType.value : "ALL";

        const filtered = allAdminLoans.filter(loan => {
            const customerName = (loan.customerName || (loan.user && loan.user.name) || loan.name || "").toLowerCase();
            const customerEmail = (loan.customerEmail || (loan.user && loan.user.email) || loan.email || "").toLowerCase();
            const loanType = loan.loanType || "";
            const status = String(loan.status).toUpperCase();

            // Name/Email Match
            const matchesQuery = query === "" || customerName.includes(query) || customerEmail.includes(query);
            // Status Match
            const matchesStatus = statusVal === "ALL" || status === statusVal;
            // Type Match
            const matchesType = typeVal === "ALL" || loanType === typeVal;

            return matchesQuery && matchesStatus && matchesType;
        });

        if (adminLoansTableBody) {
            renderAdminTable(filtered, adminLoansTableBody, false);
        }
    }

    // Chart.js Operations
    function renderCharts(loans) {
        const pieCanvas = document.getElementById("statusDistributionChart");
        const barCanvas = document.getElementById("monthlyApplicationsChart");

        // Status Distribution Pie Chart
        if (pieCanvas) {
            const approved = loans.filter(l => String(l.status).toUpperCase() === "APPROVED").length;
            const pending = loans.filter(l => String(l.status).toUpperCase() === "PENDING").length;
            const rejected = loans.filter(l => String(l.status).toUpperCase() === "REJECTED").length;

            if (statusChartInstance) {
                statusChartInstance.destroy();
            }

            statusChartInstance = new Chart(pieCanvas, {
                type: 'doughnut',
                data: {
                    labels: ['Approved', 'Pending', 'Rejected'],
                    datasets: [{
                        data: [approved, pending, rejected],
                        backgroundColor: ['#22C55E', '#F59E0B', '#EF4444'],
                        borderWidth: 0,
                        hoverOffset: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                boxWidth: 12,
                                font: { family: 'Poppins', size: 12 }
                            }
                        }
                    },
                    cutout: '65%'
                }
            });
        }

        // Monthly Applications Bar Chart
        if (barCanvas) {
            // Count monthly frequencies
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const monthlyCounts = Array(12).fill(0);

            loans.forEach(loan => {
                const dateVal = loan.applicationDate || loan.createdAt;
                if (dateVal) {
                    const d = new Date(dateVal);
                    if (!isNaN(d)) {
                        monthlyCounts[d.getMonth()] += 1;
                    }
                } else {
                    // Fallback to current month if date is null/missing
                    monthlyCounts[new Date().getMonth()] += 1;
                }
            });

            if (monthlyChartInstance) {
                monthlyChartInstance.destroy();
            }

            monthlyChartInstance = new Chart(barCanvas, {
                type: 'bar',
                data: {
                    labels: months,
                    datasets: [{
                        label: 'Loan Applications',
                        data: monthlyCounts,
                        backgroundColor: '#2563EB',
                        borderRadius: 6,
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { color: '#E2E8F0' },
                            ticks: { precision: 0 }
                        },
                        x: {
                            grid: { display: false }
                        }
                    },
                    plugins: {
                        legend: { display: false }
                    }
                }
            });
        }
    }
});
