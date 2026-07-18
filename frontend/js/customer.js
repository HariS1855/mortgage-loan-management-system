// Customer Operations Controller
document.addEventListener("DOMContentLoaded", () => {
    
    const role = getRole();
    if (role !== "ROLE_CUSTOMER") return; // Security guard match

    // Welcome title on dashboard
    const welcomeName = document.getElementById("welcome-name");
    if (welcomeName) {
        welcomeName.textContent = getUserName();
    }

    // 1. CUSTOMER DASHBOARD & PORTFOLIO PAGES
    const recentLoansBody = document.getElementById("recent-loans-body");
    const portfolioLoansBody = document.getElementById("loans-portfolio-body");
    
    // Check if we are on Dashboard or My Loans portfolio page
    if (recentLoansBody || portfolioLoansBody) {
        fetchCustomerLoans();
    }

    async function fetchCustomerLoans() {
        try {
            const loans = await apiFetch("/api/loan/my-loans", { method: "GET" });
            if (loans) {
                // Populate Dashboard Stat Cards
                updateDashboardStats(loans);

                // Sort loans: newest first (assume higher ID or date, or just reverse)
                const sortedLoans = Array.isArray(loans) ? [...loans].reverse() : [];

                // Render in Dashboard (Limit to 5)
                if (recentLoansBody) {
                    renderLoansTable(sortedLoans.slice(0, 5), recentLoansBody, true);
                }

                // Render in My Loans (Full list)
                if (portfolioLoansBody) {
                    renderLoansTable(sortedLoans, portfolioLoansBody, false);
                }
            }
        } catch (err) {
            console.error("Fetch Loans Error:", err);
            const errorMsg = `<tr><td colspan="7" class="text-center text-danger py-4"><i class="bi bi-exclamation-octagon-fill me-2"></i>Failed to retrieve loans from server.</td></tr>`;
            if (recentLoansBody) recentLoansBody.innerHTML = errorMsg.replace("7", "5");
            if (portfolioLoansBody) portfolioLoansBody.innerHTML = errorMsg;
        }
    }

    function updateDashboardStats(loans) {
        if (!Array.isArray(loans)) return;

        const total = loans.length;
        const approved = loans.filter(l => String(l.status).toUpperCase() === "APPROVED").length;
        const pending = loans.filter(l => String(l.status).toUpperCase() === "PENDING").length;
        const rejected = loans.filter(l => String(l.status).toUpperCase() === "REJECTED").length;

        const statTotal = document.getElementById("stat-total");
        const statApproved = document.getElementById("stat-approved");
        const statPending = document.getElementById("stat-pending");
        const statRejected = document.getElementById("stat-rejected");

        if (statTotal) statTotal.textContent = total;
        if (statApproved) statApproved.textContent = approved;
        if (statPending) statPending.textContent = pending;
        if (statRejected) statRejected.textContent = rejected;
    }

    function renderLoansTable(loans, tbodyElement, isShortList = false) {
        tbodyElement.innerHTML = "";
        
        if (loans.length === 0) {
            const cols = isShortList ? 5 : 7;
            tbodyElement.innerHTML = `<tr><td colspan="${cols}" class="text-center text-secondary py-4">No active loans found. Create an application to get started.</td></tr>`;
            return;
        }

        loans.forEach(loan => {
            const status = String(loan.status).toUpperCase();
            
            // Status Badge Selection
            let badgeClass = "badge-pending";
            if (status === "APPROVED") badgeClass = "badge-approved";
            if (status === "REJECTED") badgeClass = "badge-rejected";

            // Eligibility Display
            let eligibilityHtml = "";
            if (!isShortList) {
                // Heuristic: check true/false or string
                const isEligible = loan.eligible === true || loan.eligibility === true || String(loan.eligible).toUpperCase() === "ELIGIBLE";
                eligibilityHtml = isEligible 
                    ? `<span class="text-success"><i class="bi bi-patch-check-fill me-1"></i>Eligible</span>`
                    : `<span class="text-danger"><i class="bi bi-patch-exclamation-fill me-1"></i>Not Eligible</span>`;
            }

            // Date formatting
            let appDateStr = "N/A";
            if (loan.applicationDate || loan.createdAt) {
                const rawDate = new Date(loan.applicationDate || loan.createdAt);
                appDateStr = isNaN(rawDate) ? (loan.applicationDate || loan.createdAt) : rawDate.toLocaleDateString('en-US', {
                    year: 'numeric', month: 'short', day: 'numeric'
                });
            }

            const amountStr = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(loan.loanAmount || loan.amount);

            // Table Row Creation
            const tr = document.createElement("tr");
            
            if (isShortList) {
                // Dashboard Short Table
                tr.innerHTML = `
                    <td class="fw-semibold">#${loan.id}</td>
                    <td>${loan.loanType || 'Mortgage'}</td>
                    <td class="fw-bold text-primary">${amountStr}</td>
                    <td><span class="badge ${badgeClass} px-3 py-2 rounded-pill">${status}</span></td>
                    <td>
                        <a href="my-loans.html" class="btn btn-sm btn-outline-primary"><i class="bi bi-eye"></i> View</a>
                    </td>
                `;
            } else {
                // My Loans Full Table
                // Only approved loans can navigate to payment.html with a loanId. Let's make "View Payment" click-through and show payment page.
                const viewPaymentBtn = status === "APPROVED" 
                    ? `<a href="payment.html?loanId=${loan.id}" class="btn btn-sm btn-primary px-3"><i class="bi bi-credit-card me-1"></i> Pay EMI</a>`
                    : `<button class="btn btn-sm btn-outline-secondary px-3" disabled><i class="bi bi-lock me-1"></i> Pay EMI</button>`;

                tr.innerHTML = `
                    <td class="fw-semibold">#${loan.id}</td>
                    <td>${loan.loanType || 'Mortgage'}</td>
                    <td class="fw-bold text-primary">${amountStr}</td>
                    <td>${eligibilityHtml}</td>
                    <td>${appDateStr}</td>
                    <td><span class="badge ${badgeClass} px-3 py-2 rounded-pill">${status}</span></td>
                    <td class="text-end">
                        ${viewPaymentBtn}
                    </td>
                `;
            }
            tbodyElement.appendChild(tr);
        });
    }

    // 2. APPLY LOAN FORM & ELIGIBILITY VERIFICATION
    const loanForm = document.getElementById("loan-application-form");
    const checkEligibilityBtn = document.getElementById("check-eligibility-btn");
    
    if (loanForm) {
        
        // Form validations values dynamically check helper
        function getFormValues() {
            return {
                loanType: document.getElementById("loanType").value,
                loanAmount: parseFloat(document.getElementById("loanAmount").value),
                salary: parseFloat(document.getElementById("salary").value),
                age: parseInt(document.getElementById("age").value),
                employmentType: document.getElementById("employmentType").value,
                purpose: document.getElementById("purpose").value
            };
        }

        function validateInputs(values) {
            let isValid = true;
            
            if (!values.loanType) isValid = false;
            if (isNaN(values.loanAmount) || values.loanAmount <= 0) isValid = false;
            
            if (isNaN(values.salary) || values.salary < 25000) {
                document.getElementById("salary").classList.add("is-invalid");
                isValid = false;
            } else {
                document.getElementById("salary").classList.remove("is-invalid");
            }

            if (isNaN(values.age) || values.age < 21) {
                document.getElementById("age").classList.add("is-invalid");
                isValid = false;
            } else {
                document.getElementById("age").classList.remove("is-invalid");
            }

            if (!values.employmentType) isValid = false;
            if (!values.purpose || values.purpose.length < 10) isValid = false;

            return isValid;
        }

        // CHECK ELIGIBILITY BUTTON
        if (checkEligibilityBtn) {
            checkEligibilityBtn.addEventListener("click", async () => {
                const values = getFormValues();
                
                // Trigger Bootstrap validations visually
                loanForm.classList.add("was-validated");

                if (!validateInputs(values)) {
                    showToast("Please correct the form fields before checking eligibility.", "warning");
                    return;
                }

                try {
                    const result = await apiFetch("/api/loan/check", {
                        method: "POST",
                        body: JSON.stringify(values)
                    });

                    if (result !== null) {
                        displayEligibilityBanner(result);
                    }
                } catch (err) {
                    console.error("Eligibility Check Error:", err);
                }
            });
        }

        // APPLY LOAN FORM SUBMISSION
        loanForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const values = getFormValues();
            loanForm.classList.add("was-validated");

            if (!validateInputs(values)) {
                showToast("Please ensure all fields are correct before applying.", "warning");
                return;
            }

            // Double check validation parameters explicitly
            if (values.salary < 25000 || values.age < 21 || values.loanAmount <= 0) {
                showToast("Loan parameters do not meet basic requirements.", "danger");
                return;
            }

            try {
                const response = await apiFetch("/api/loan/apply", {
                    method: "POST",
                    body: JSON.stringify(values)
                });

                if (response) {
                    showToast("Application submitted successfully! Redirecting...", "success");
                    
                    // Clear values and redirect
                    setTimeout(() => {
                        window.location.href = "my-loans.html";
                    }, 2000);
                }
            } catch (err) {
                console.error("Apply Loan Error:", err);
            }
        });

        // Banner Rendering Helper
        function displayEligibilityBanner(data) {
            const banner = document.getElementById("eligibility-banner");
            const icon = document.getElementById("eligibility-icon");
            const title = document.getElementById("eligibility-title");
            const text = document.getElementById("eligibility-text");

            if (!banner) return;

            // Handle boolean, status field or eligible boolean in object
            let eligible = false;
            let explanation = "Based on your criteria, you qualify for this mortgage application.";
            
            if (typeof data === "boolean") {
                eligible = data;
            } else if (data && typeof data.eligible !== "undefined") {
                eligible = data.eligible;
                if (data.message) explanation = data.message;
            } else if (data && typeof data.eligibility !== "undefined") {
                eligible = data.eligibility;
                if (data.message) explanation = data.message;
            } else if (data && data.status) {
                eligible = String(data.status).toUpperCase() === "ELIGIBLE" || String(data.status).toUpperCase() === "APPROVED";
            }

            banner.classList.remove("d-none", "alert-success", "alert-danger", "alert-warning");
            icon.className = "bi fs-4";

            if (eligible) {
                banner.classList.add("alert-success");
                icon.classList.add("bi-check-circle-fill");
                title.textContent = "Eligible for Mortgage";
                text.textContent = explanation || "Congratulations! Your credit score, age, and salary parameters qualify for the requested loan.";
            } else {
                banner.classList.add("alert-danger");
                icon.classList.add("bi-exclamation-triangle-fill");
                title.textContent = "Not Eligible";
                text.textContent = data.message || "Apologies. The requested loan amount exceeds standard debt-to-income limits for your salary tier or age brackets.";
            }

            // Scroll to banner smoothly
            banner.scrollIntoView({ behavior: "smooth" });
        }
    }
});
