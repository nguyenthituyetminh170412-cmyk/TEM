// IMPORT FIREBASE
// Lấy Authentication, Firestore và các hàm dùng để đăng ký, đăng nhập, cập nhật thông tin user
import {
    auth,
    db,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile,
    setDoc,
    doc,
    serverTimestamp
} from "./firebase.config.js";
// FORM ĐĂNG KÝ
// Lấy form signup và xử lý khi người dùng tạo tài khoản
const signupForm = document.getElementById("signupForm");
if (signupForm) {
    signupForm.addEventListener("submit", async function (event) {
        event.preventDefault(); // ngăn form reload trang
        // LẤY DỮ LIỆU TỪ FORM ĐĂNG KÝ
        // trim() xóa khoảng trắng thừa ở đầu và cuối
        const name = document.getElementById("signupName").value.trim();
        const email = document.getElementById("signupEmail").value.trim();
        const password = document.getElementById("signupPassword").value;
        const message = document.getElementById("signupMessage");
        // TẠO TÀI KHOẢN FIREBASE
        // try/catch dùng để xử lý trường hợp Firebase trả về lỗi
        try {
            message.textContent = "Creating account...";
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                email,
                password
            ); // tạo tài khoản bằng email + password
            const user = userCredential.user; // lấy thông tin user vừa đăng ký
            // CẬP NHẬT TÊN HIỂN THỊ FIREBASE AUTH
            // displayName là tên được lưu trực tiếp trong Firebase Authentication
            await updateProfile(user, {
                displayName: name
            });
            // TẠO DOCUMENT USER TRONG FIRESTORE
            // Lưu thêm thông tin của user vào collection "user"
            await setDoc(doc(db, "user", user.uid), { // user.uid dùng làm ID document
                displayName: name,
                email: email,
                roleId: "user", // tài khoản đăng ký bình thường luôn có quyền user
                walletBalance: 0, // số dư ví ban đầu
                createdAt: serverTimestamp() // thời gian được lấy từ server Firestore
            });
            // ĐĂNG KÝ THÀNH CÔNG
            message.textContent = "Account created successfully!";
            signupForm.reset(); // xóa dữ liệu trong form
            setTimeout(function () { // chờ 1 giây trước khi chuyển trang
                window.location.href = "signin.html"; // chuyển sang trang đăng nhập
            }, 1000);
        } catch (error) {
            console.error(error); // in lỗi ra Console để kiểm tra
            message.textContent = getErrorMessage(error.code); // đổi mã lỗi Firebase thành thông báo dễ hiểu
        }
    });
}
// FORM ĐĂNG NHẬP
// Lấy form signin và xử lý khi người dùng đăng nhập
const signinForm = document.getElementById("signinForm");
if (signinForm) {
    signinForm.addEventListener("submit", async function (event) {
        event.preventDefault(); // ngăn form reload trang
        // LẤY DỮ LIỆU ĐĂNG NHẬP
        const email = document.getElementById("signinEmail").value.trim();
        const password = document.getElementById("signinPassword").value;
        const message = document.getElementById("signinMessage");
        // ĐĂNG NHẬP FIREBASE
        try {
            message.textContent = "Signing in...";
            await signInWithEmailAndPassword(
                auth,
                email,
                password
            ); // kiểm tra email + password với Firebase Authentication
            message.textContent = "Sign in successful!";
            setTimeout(function () { // chờ 1 giây rồi chuyển trang
                window.location.href = "index.html";
            }, 1000);
        } catch (error) {
            console.error(error);
            message.textContent = getErrorMessage(error.code); // xử lý mã lỗi
        }
    });
}
// XỬ LÝ THÔNG BÁO LỖI
// Chuyển mã lỗi Firebase thành câu thông báo dễ hiểu cho người dùng
function getErrorMessage(errorCode) {
    switch (errorCode) { // kiểm tra từng loại mã lỗi
        case "auth/email-already-in-use":
            return "This email is already in use.";
        case "auth/invalid-email":
            return "Please enter a valid email address.";
        case "auth/weak-password":
            return "Password must be at least 6 characters.";
        case "auth/invalid-credential":
            return "Incorrect email or password.";
        case "auth/user-not-found":
            return "Account not found.";
        case "auth/wrong-password":
            return "Incorrect password.";
        case "auth/too-many-requests":
            return "Too many attempts. Please try again later.";
        case "auth/network-request-failed":
            return "Network error. Please check your connection.";
        case "permission-denied":
            return "You do not have permission to access Firestore.";
        default:
            return "Something went wrong: " + errorCode; // lỗi chưa được định nghĩa
    }
}