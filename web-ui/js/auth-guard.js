(function () {
    // Cek apakah user sudah login
    const userSession = localStorage.getItem("irrigation_user");
    const currentPage = window.location.pathname.split("/").pop() || "index.html";

    // index.html = halaman login
    const isLoginPage = currentPage === "index.html";

    // Jika tidak ada sesi dan bukan halaman login -> lempar ke login
    if (!userSession && !isLoginPage) {
        window.location.href = "index.html";
        return;
    }

    // (Opsional) Tampilkan nama user di Navbar jika elemennya ada
    if (userSession) {
        try {
            const user = JSON.parse(userSession);
            const display = document.getElementById("userNameDisplay");
            if (display) display.textContent = `Hi, ${user.username}`;
        } catch (e) {
            console.error("Invalid session");
            localStorage.removeItem("irrigation_user");
            window.location.href = "index.html";
        }
    }
})();

// Fungsi Logout global
function logout() {
    if (confirm("Are you sure you want to logout?")) {
        localStorage.removeItem("irrigation_user");
        window.location.href = "index.html";
    }
}
