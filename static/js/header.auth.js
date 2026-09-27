import { auth, db } from "./firebase.config.js";
import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Lấy khu vực chứa các nút đăng nhập/đăng xuất
const authButtons = document.getElementById("authButtons");

// Chỉ chạy nếu HTML có authButtons
if (authButtons) {
    // Theo dõi trạng thái đăng nhập của người dùng
    onAuthStateChanged(auth, async user => {
        // Nếu đã đăng nhập
        if (user) {
            // Mặc định người dùng không phải admin
            let isAdmin = false;
            try {
                // Lấy dữ liệu user từ Firestore bằng UID
                const userRef = doc(db, "user", user.uid);
                const userSnap = await getDoc(userRef);
                // Kiểm tra user có tồn tại trong Firestore
                if (userSnap.exists()) {
                    // Lấy dữ liệu của user
                    const userData = userSnap.data();
                    // Lấy roleId và chuẩn hóa về chữ thường
                    const roleId = String(userData.roleId || "").trim().toLowerCase();
                    // Kiểm tra role có phải admin không
                    isAdmin = roleId === "admin";
                }
            } catch (error) {
                // Hiển thị lỗi nếu không lấy được role
                console.error("Cannot check admin role:", error);
            }
            // Hiển thị các nút dành cho người đã đăng nhập
            authButtons.innerHTML = `
                <a href="cart.html" class="header-cart-btn">
                    CART
                </a>
                <a href="orders.html" class="header-auth-btn">
                    MY ORDERS
                </a>
                ${isAdmin ? `
                    <a href="admin.html" class="header-auth-btn">
                        ADMIN
                    </a>
                ` : ""}
                <button type="button" id="signOutBtn" class="header-signout-btn">
                    SIGN OUT
                </button>
            `;
            // Lấy nút SIGN OUT vừa tạo
            const signOutBtn = document.getElementById("signOutBtn");
            // Xử lý khi người dùng bấm SIGN OUT
            signOutBtn.addEventListener("click", async () => {
                try {
                    // Đăng xuất khỏi Firebase Authentication
                    await signOut(auth);
                    // Chuyển về trang chủ
                    window.location.href = "index.html";
                } catch (error) {
                    // Hiển thị lỗi nếu đăng xuất thất bại
                    console.error("Sign out error:", error);
                    alert("Unable to sign out.");
                }
            });
        } else {
            // Hiển thị các nút dành cho người chưa đăng nhập
            authButtons.innerHTML = `
                <a href="cart.html" class="header-cart-btn">
                    CART
                </a>
                <a href="orders.html" class="header-auth-btn">
                    MY ORDERS
                </a>
                <a href="signin.html" class="header-auth-btn">
                    SIGN IN
                </a>
                <a href="signup.html" class="header-auth-btn">
                    SIGN UP
                </a>
            `;
        }
    });
}