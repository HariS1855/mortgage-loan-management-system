// Authentication handling (Login and Registration)
document.addEventListener("DOMContentLoaded", () => {
    
    // LOGIN FORM SUBMISSION
    const loginForm = document.getElementById("login-form");
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            
            // Check form validity
            if (!loginForm.checkValidity()) {
                e.stopPropagation();
                loginForm.classList.add("was-validated");
                return;
            }

            const email = document.getElementById("email").value;
            const password = document.getElementById("password").value;

            try {
                const data = await apiFetch("/api/auth/login", {
                    method: "POST",
                    body: JSON.stringify({ email, password })
                });

                if (data) {
                    // Extract JWT and Role with fallback check
                    const token = data.token || data.jwtToken || data.accessToken;
                    const role = data.role || (data.roles && data.roles[0]) || "ROLE_CUSTOMER";
                    const userName = data.name || data.userName || data.username || email.split("@")[0];
                    const userEmail = data.email || email;

                    if (token) {
                        localStorage.setItem("token", token);
                        localStorage.setItem("role", role);
                        localStorage.setItem("userName", userName);
                        localStorage.setItem("userEmail", userEmail);

                        showToast("Login successful! Redirecting...", "success");

                        // Redirect based on role
                        setTimeout(() => {
                            if (role === "ROLE_ADMIN") {
                                window.location.href = "admin-dashboard.html";
                            } else {
                                window.location.href = "customer-dashboard.html";
                            }
                        }, 1000);
                    } else {
                        showToast("Authentication failed: No token received.", "danger");
                    }
                }
            } catch (err) {
                // apiFetch already handles toasts for network issues/exceptions
                console.error("Login Error:", err);
            }
        });
    }

    // REGISTRATION FORM SUBMISSION
    const registerForm = document.getElementById("register-form");
    if (registerForm) {
        registerForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            if (!registerForm.checkValidity()) {
                e.stopPropagation();
                registerForm.classList.add("was-validated");
                return;
            }

            const name = document.getElementById("name").value;
            const email = document.getElementById("email").value;
            const password = document.getElementById("password").value;
            const adminKey = document.getElementById("adminKey").value;

            // Construct payload
            const payload = {
                name,
                email,
                password
            };

            // Only attach adminKey if it has a value
            if (adminKey && adminKey.trim() !== "") {
                payload.adminKey = adminKey.trim();
            }

            try {
                const response = await apiFetch("/api/auth/register", {
                    method: "POST",
                    body: JSON.stringify(payload)
                });

                // Check standard register responses (usually strings or JSON object with success/message)
                showToast("Account created successfully! Redirecting to login...", "success");
                
                setTimeout(() => {
                    window.location.href = "login.html";
                }, 2000);
                
            } catch (err) {
                console.error("Registration Error:", err);
            }
        });
    }

    // LOGOUT BUTTON HANDLER
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", (e) => {
            e.preventDefault();
            
            // Confirm logout
            const confirmLogout = confirm("Are you sure you want to log out?");
            if (confirmLogout) {
                logout();
            }
        });
    }
});
