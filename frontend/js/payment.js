// Payment Operations Controller
document.addEventListener("DOMContentLoaded", () => {
    
    const role = getRole();
    if (role !== "ROLE_CUSTOMER") return; // Security guard match

    const loanSelect = document.getElementById("payment-loan-select");
    const noLoanView = document.getElementById("no-loan-selected-view");
    const paymentDetailsView = document.getElementById("loan-payment-details-view");
    const payEmiForm = document.getElementById("pay-emi-form");
    const emiAmountInput = document.getElementById("emi-amount-input");
    const paymentHistoryBody = document.getElementById("payment-history-body");

    // Summary Card Fields
    const summaryType = document.getElementById("summary-loan-type");
    const summaryAmount = document.getElementById("summary-loan-amount");
    const summaryDate = document.getElementById("summary-loan-date");
    const summaryStatus = document.getElementById("summary-loan-status");
    const summaryEmi = document.getElementById("summary-calculated-emi");

    let allCustomerLoans = []; // Store fetched loans local list

    // Start by fetching all customer loans
    initPaymentPage();

    async function initPaymentPage() {
        try {
            const loans = await apiFetch("/api/loan/my-loans", { method: "GET" });
            if (loans && Array.isArray(loans)) {
                // Filter: only allow payment actions on APPROVED loans
                allCustomerLoans = loans.filter(l => String(l.status).toUpperCase() === "APPROVED");
                
                populateLoanSelect(allCustomerLoans);

                // Check query parameters for URL routing (e.g. ?loanId=X)
                const urlParams = new URLSearchParams(window.location.search);
                const loanIdQuery = urlParams.get("loanId");
                
                if (loanIdQuery && loanSelect) {
                    // Check if query loan ID is approved
                    const isApproved = allCustomerLoans.some(l => String(l.id) === String(loanIdQuery));
                    if (isApproved) {
                        loanSelect.value = loanIdQuery;
                        loadSelectedLoanDetails(loanIdQuery);
                    } else {
                        showToast(`Loan #${loanIdQuery} is not approved or active yet. Payments are disabled.`, "warning");
                    }
                }
            }
        } catch (err) {
            console.error("Payment Init Error:", err);
        }
    }

    function populateLoanSelect(approvedLoans) {
        if (!loanSelect) return;
        
        loanSelect.innerHTML = "";
        
        if (approvedLoans.length === 0) {
            loanSelect.innerHTML = `<option value="" disabled selected>No active approved loans found.</option>`;
            return;
        }

        loanSelect.innerHTML = `<option value="" disabled selected>-- Select an Approved Mortgage --</option>`;
        approvedLoans.forEach(loan => {
            const amountStr = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(loan.loanAmount || loan.amount);
            loanSelect.innerHTML += `<option value="${loan.id}">Loan #${loan.id} - ${loan.loanType || 'Mortgage'} (${amountStr})</option>`;
        });

        // Set change listener
        loanSelect.addEventListener("change", (e) => {
            loadSelectedLoanDetails(e.target.value);
        });
    }

    // Load full details for selected loan ID
    async function loadSelectedLoanDetails(loanId) {
        if (!loanId) return;

        const loan = allCustomerLoans.find(l => String(l.id) === String(loanId));
        if (!loan) return;

        // Toggle UI panels
        if (noLoanView) noLoanView.classList.add("d-none");
        if (paymentDetailsView) paymentDetailsView.classList.remove("d-none");

        // Format and render summary
        const amount = loan.loanAmount || loan.amount;
        const amountStr = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
        
        let appDateStr = "N/A";
        if (loan.applicationDate || loan.createdAt) {
            const rawDate = new Date(loan.applicationDate || loan.createdAt);
            appDateStr = isNaN(rawDate) ? (loan.applicationDate || loan.createdAt) : rawDate.toLocaleDateString();
        }

        if (summaryType) summaryType.textContent = loan.loanType || "Mortgage";
        if (summaryAmount) summaryAmount.textContent = amountStr;
        if (summaryDate) summaryDate.textContent = appDateStr;
        if (summaryStatus) {
            summaryStatus.textContent = String(loan.status).toUpperCase();
            summaryStatus.className = "badge badge-approved";
        }

        // Calculate simulated EMI: e.g. 5-year repayment (60 months) with simple 6% interest markup
        // EMI = (Principal + Principal * Markup) / Terms
        const estTotalRepayable = amount * 1.12; 
        const monthlyEmi = Math.round(estTotalRepayable / 60);
        
        const emiStr = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(monthlyEmi);
        if (summaryEmi) summaryEmi.textContent = emiStr;

        // Prepopulate Pay Input Field
        if (emiAmountInput) {
            emiAmountInput.value = monthlyEmi;
        }

        // Load transaction list
        fetchPaymentHistory(loanId);
    }

    // Fetch transactions from backend
    async function fetchPaymentHistory(loanId) {
        if (!paymentHistoryBody) return;
        
        paymentHistoryBody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center text-secondary py-3">
                    <div class="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                    Retrieving transactions statement...
                </td>
            </tr>
        `;

        try {
            const payments = await apiFetch(`/api/payment/${loanId}`, { method: "GET" });
            
            paymentHistoryBody.innerHTML = "";
            
            if (payments && Array.isArray(payments) && payments.length > 0) {
                payments.forEach(payment => {
                    const payAmountStr = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(payment.amount);
                    
                    let payDateStr = "N/A";
                    const rawDate = payment.paymentDate || payment.date || payment.createdAt;
                    if (rawDate) {
                        const d = new Date(rawDate);
                        payDateStr = isNaN(d) ? rawDate : d.toLocaleDateString();
                    }

                    const payStatus = payment.status ? String(payment.status).toUpperCase() : "SUCCESS";
                    const badgeClass = payStatus === "SUCCESS" ? "badge-approved" : "badge-pending";

                    paymentHistoryBody.innerHTML += `
                        <tr>
                            <td class="fw-semibold">#${payment.id}</td>
                            <td class="fw-bold text-success">${payAmountStr}</td>
                            <td>${payDateStr}</td>
                            <td><span class="badge ${badgeClass} px-2 py-1 rounded">${payStatus}</span></td>
                        </tr>
                    `;
                });
            } else {
                paymentHistoryBody.innerHTML = `
                    <tr>
                        <td colspan="4" class="text-center text-secondary py-4">
                            No payment records found. Pay your first EMI installment above.
                        </td>
                    </tr>
                `;
            }
        } catch (err) {
            console.error("Fetch Payment History Error:", err);
            paymentHistoryBody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center text-danger py-4">
                        <i class="bi bi-exclamation-octagon-fill me-2"></i>Failed to fetch transactions statement.
                    </td>
                </tr>
            `;
        }
    }

    // Submit Simulated EMI Payment
    if (payEmiForm) {
        payEmiForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            // Set validation visually
            payEmiForm.classList.add("was-validated");

            if (!payEmiForm.checkValidity()) {
                e.stopPropagation();
                return;
            }

            const activeLoanId = loanSelect ? loanSelect.value : null;
            const amountVal = emiAmountInput ? parseFloat(emiAmountInput.value) : 0;

            if (!activeLoanId) {
                showToast("Please select a mortgage loan first.", "warning");
                return;
            }

            if (isNaN(amountVal) || amountVal <= 0) {
                showToast("Please enter a valid positive payment amount.", "danger");
                return;
            }

            // Confirm Payment
            const confirmPay = confirm(`Proceed with simulated EMI payment of $${amountVal} for Mortgage Loan #${activeLoanId}?`);
            if (!confirmPay) return;

            try {
                const payload = {
                    loanId: parseInt(activeLoanId),
                    amount: amountVal
                };

                const response = await apiFetch("/api/payment/add", {
                    method: "POST",
                    body: JSON.stringify(payload)
                });

                if (response !== null) {
                    showToast("EMI Transaction successful! Payment registered.", "success");
                    
                    // Reset validation status
                    payEmiForm.classList.remove("was-validated");
                    
                    // Refresh payment history immediately
                    fetchPaymentHistory(activeLoanId);
                }
            } catch (err) {
                console.error("Pay EMI Error:", err);
            }
        });
    }
});
