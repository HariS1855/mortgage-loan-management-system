// API configuration and global utilities
const BASE_URL = "http://localhost:8081";

// Auth Storage Helpers
function getToken() {
    return localStorage.getItem("token");
}

function getRole() {
    return localStorage.getItem("role");
}

function getUserName() {
    return localStorage.getItem("userName") || "User";
}

function getUserEmail() {
    return localStorage.getItem("userEmail") || "";
}

function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    window.location.href = "login.html";
}

// Global API Fetch Wrapper
async function apiFetch(endpoint, options = {}) {
    showSpinner();
    const token = getToken();
    
    // Set headers
    options.headers = {
        ...options.headers,
    };
    
    if (token) {
        options.headers["Authorization"] = `Bearer ${token}`;
    }
    
    if (options.body && !(options.body instanceof FormData)) {
        options.headers["Content-Type"] = "application/json";
    }

    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, options);
        
        // Handle unauthorized / expired tokens
        if (response.status === 401) {
            hideSpinner();
            localStorage.removeItem("token");
            localStorage.removeItem("role");
            window.location.href = "login.html";
            return null;
        }
        
        // Handle forbidden access
        if (response.status === 403) {
            hideSpinner();
            showAccessDeniedDialog();
            return null;
        }

        // Handle negative network status
        if (!response.ok) {
            let errorMessage = "An error occurred";
            try {
                const errData = await response.json();
                errorMessage = errData.message || errData.error || errorMessage;
            } catch (e) {
                // Not JSON
            }
            throw new Error(errorMessage);
        }

        hideSpinner();
        
        // Parse and return JSON (or text if not json)
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            return await response.json();
        } else {
            return await response.text();
        }
    } catch (error) {
        hideSpinner();
        showToast(error.message || "Failed to connect to the server.", "danger");
        throw error;
    }
}

// Spinner toggling
function showSpinner() {
    let loader = document.getElementById("loader-overlay");
    if (!loader) {
        loader = document.createElement("div");
        loader.id = "loader-overlay";
        loader.innerHTML = `
            <div class="spinner-border text-primary" style="width: 3rem; height: 3rem;" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        `;
        document.body.appendChild(loader);
    }
    loader.style.display = "flex";
    loader.style.opacity = "1";
}

function hideSpinner() {
    const loader = document.getElementById("loader-overlay");
    if (loader) {
        loader.style.opacity = "0";
        setTimeout(() => {
            loader.style.display = "none";
        }, 150);
    }
}

// Dynamic Toast Notifications
function showToast(message, type = "info") {
    let container = document.getElementById("toast-container-custom");
    if (!container) {
        container = document.createElement("div");
        container.id = "toast-container-custom";
        container.className = "toast-container-custom";
        document.body.appendChild(container);
    }

    const toastId = "toast-" + Date.now();
    const bgClass = type === "success" ? "bg-success text-white" : 
                    type === "danger" ? "bg-danger text-white" : 
                    type === "warning" ? "bg-warning text-dark" : "bg-dark text-white";
    
    const iconClass = type === "success" ? "bi-check-circle-fill" :
                      type === "danger" ? "bi-exclamation-triangle-fill" :
                      type === "warning" ? "bi-exclamation-circle-fill" : "bi-info-circle-fill";

    const toastHtml = `
        <div id="${toastId}" class="toast align-items-center ${bgClass} border-0 shadow-lg" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body d-flex align-items-center gap-2">
                    <i class="bi ${iconClass}"></i>
                    <span>${message}</span>
                </div>
                <button type="button" class="btn-close btn-close-white m-auto me-2" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
    `;

    container.insertAdjacentHTML("beforeend", toastHtml);
    const toastElement = document.getElementById(toastId);
    const bsToast = new bootstrap.Toast(toastElement, { delay: 4000 });
    bsToast.show();

    // Remove from DOM when hidden
    toastElement.addEventListener("hidden.bs.toast", () => {
        toastElement.remove();
    });
}

// Show Access Denied Dialog
function showAccessDeniedDialog() {
    const modalId = "accessDeniedModal";
    let modalEl = document.getElementById(modalId);
    
    if (!modalEl) {
        const modalHtml = `
            <div class="modal fade" id="${modalId}" tabindex="-1" aria-labelledby="${modalId}Label" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content glass-panel">
                        <div class="modal-header border-0">
                            <h5 class="modal-title text-danger d-flex align-items-center gap-2" id="${modalId}Label">
                                <i class="bi bi-shield-lock-fill"></i> Access Denied
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body py-4">
                            <p class="mb-0 text-secondary">You do not have permission to access this resource or perform this action. Please contact an administrator or switch accounts.</p>
                        </div>
                        <div class="modal-footer border-0">
                            <button type="button" class="btn btn-primary" data-bs-dismiss="modal">Acknowledge</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML("beforeend", modalHtml);
        modalEl = document.getElementById(modalId);
    }
    
    const bsModal = new bootstrap.Modal(modalEl);
    bsModal.show();
}

// Session Auth Guards
function guardPage(requiredRole) {
    const token = getToken();
    const role = getRole();
    
    if (!token) {
        window.location.href = "login.html";
        return false;
    }
    
    if (requiredRole && role !== requiredRole) {
        // Redirect to their respective dashboards if they have the wrong dashboard open
        if (role === "ROLE_ADMIN") {
            window.location.href = "admin-dashboard.html";
        } else if (role === "ROLE_CUSTOMER") {
            window.location.href = "customer-dashboard.html";
        } else {
            window.location.href = "login.html";
        }
        return false;
    }
    
    return true;
}

// Sidebar toggle logic for mobile
document.addEventListener("DOMContentLoaded", () => {
    const sidebarToggle = document.getElementById("sidebar-toggle");
    const sidebar = document.querySelector(".sidebar");
    const mainContent = document.querySelector(".main-content");
    
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener("click", () => {
            sidebar.classList.toggle("show");
            if (mainContent) {
                mainContent.classList.toggle("sidebar-open");
            }
        });
    }
    
    // Set active link in sidebar based on current HTML file
    const path = window.location.pathname;
    const page = path.split("/").pop();
    if (page) {
        const activeLink = document.querySelector(`.sidebar-menu a[href="${page}"]`);
        if (activeLink) {
            activeLink.parentElement.classList.add("active");
        }
    }
    
    // Populate user profile info in navbar if elements exist
    const navUserName = document.getElementById("nav-user-name");
    const navUserEmail = document.getElementById("nav-user-email");
    if (navUserName) navUserName.textContent = getUserName();
    if (navUserEmail) navUserEmail.textContent = getUserEmail();
});
