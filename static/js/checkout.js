// IMPORT FIREBASE FIRESTORE VÀ AUTH
import { db, auth } from "./firebase.config.js";
import {
    collection,
    addDoc,
    doc,
    getDoc,
    updateDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
// LẤY CÁC PHẦN TỬ HTML
const form = document.getElementById("checkoutForm");
const summary = document.getElementById("checkoutSummary");
// LƯU USER VÀ GIỎ HÀNG HIỆN TẠI
let currentUser = null;
let cart = [];
// TẠO KEY GIỎ HÀNG THEO USER
function getCartKey(uid) {
    return `temCart_${uid}`; // mỗi user có một giỏ hàng riêng
}
// ĐỊNH DẠNG GIÁ TIỀN
function formatPrice(price) {
    return Number(price || 0).toLocaleString("en-US") + " VND"; // thêm dấu phân cách hàng nghìn
}
// TÍNH TỔNG TIỀN
function getTotal() {
    return cart.reduce((total, item) => {
        return total + Number(item.price || 0) * Number(item.quantity || 0);
    }, 0); // reduce() cộng tổng tiền của tất cả sản phẩm
}
// LẤY GIỎ HÀNG TỪ LOCAL STORAGE
function loadCart(uid) {
    cart = JSON.parse(localStorage.getItem(getCartKey(uid)) || "[]"); // JSON.parse chuyển chuỗi thành mảng
}
// HIỂN THỊ TÓM TẮT ĐƠN HÀNG
function renderSummary() {
    // KIỂM TRA GIỎ HÀNG TRỐNG
    if (cart.length === 0) {
        summary.innerHTML = `
            <div class="checkout-summary">
                <h2>YOUR ORDER</h2>
                <p>Your cart is empty.</p>
                <a href="shop.html" class="cart-shop-btn">SHOP NOW</a>
            </div>
        `;
        form.style.display = "none"; // ẩn form khi giỏ hàng trống
        return;
    }
    form.style.display = "block"; // hiện form khi có sản phẩm
    summary.innerHTML = `
        <div class="checkout-summary">
            <h2>YOUR ORDER</h2>
            ${cart.map(item => `
                <div class="summary-item">
                    <span>${item.name} × ${item.quantity}</span>
                    <strong>${formatPrice(Number(item.price || 0) * Number(item.quantity || 0))}</strong>
                </div>
            `).join("")}
            <hr>
            <div class="summary-total">
                <span>TOTAL</span>
                <strong>${formatPrice(getTotal())}</strong>
            </div>
        </div>
    `; // map() tạo HTML cho từng sản phẩm
}
// THANH TOÁN BẰNG TÉM WALLET
async function payWithWallet(uid, total) {
    const walletRef = doc(db, "wallets", uid); // lấy document wallet theo UID
    const walletSnap = await getDoc(walletRef); // lấy dữ liệu wallet từ Firestore
    // KIỂM TRA WALLET
    if (!walletSnap.exists()) {
        throw new Error("WALLET_NOT_FOUND"); // tạo lỗi riêng để xử lý
    }
    const walletData = walletSnap.data(); // lấy dữ liệu trong document
    const balance = Number(walletData.balance || 0); // lấy số dư, không có thì = 0
    // KIỂM TRA SỐ DƯ
    if (balance < total) {
        throw new Error("INSUFFICIENT_BALANCE"); // báo lỗi nếu không đủ tiền
    }
    // TÍNH SỐ DƯ MỚI
    const newBalance = balance - total;
    // CẬP NHẬT SỐ DƯ WALLET
    await updateDoc(walletRef, {
        balance: newBalance,
        updatedAt: serverTimestamp() // lấy thời gian từ server Firestore
    });
    // TẠO LỊCH SỬ GIAO DỊCH
    await addDoc(collection(db, "wallets", uid, "transactions"), {
        type: "PAYMENT",
        title: "Order Payment",
        amount: total,
        createdAt: serverTimestamp()
    }); // addDoc() tự tạo ID cho transaction
}
// XỬ LÝ FORM ĐẶT HÀNG
form.addEventListener("submit", async event => {
    event.preventDefault(); // ngăn form reload trang
    // KIỂM TRA ĐĂNG NHẬP
    if (!currentUser) {
        alert("Please sign in before placing an order.");
        window.location.href = "signin.html";
        return;
    }
    // LẤY GIỎ HÀNG MỚI NHẤT
    loadCart(currentUser.uid);
    // KIỂM TRA GIỎ HÀNG
    if (cart.length === 0) {
        alert("Your cart is empty.");
        return;
    }
    // LẤY THÔNG TIN GIAO HÀNG
    const fullName = document.getElementById("fullName").value.trim(); // trim() xóa khoảng trắng đầu cuối
    const phone = document.getElementById("phone").value.trim();
    const address = document.getElementById("address").value.trim();
    const note = document.getElementById("note").value.trim();
    // LẤY PHƯƠNG THỨC THANH TOÁN
    const paymentInput = document.querySelector('input[name="payment"]:checked'); // lấy radio đang được chọn
    const payment = paymentInput ? paymentInput.value : "COD"; // nếu chưa chọn thì mặc định COD
    const total = getTotal();
    // KIỂM TRA THÔNG TIN BẮT BUỘC
    if (!fullName || !phone || !address) {
        alert("Please fill in all shipping information.");
        return;
    }
    // LẤY NÚT ĐẶT HÀNG
    const placeOrderBtn = form.querySelector(".place-order-btn");
    try {
        // KHÓA NÚT TRONG KHI ĐANG XỬ LÝ
        placeOrderBtn.disabled = true; // không cho bấm nhiều lần
        placeOrderBtn.textContent = "PROCESSING...";
        // THANH TOÁN BẰNG WALLET
        if (payment === "WALLET") {
            try {
                await payWithWallet(currentUser.uid, total); // trừ tiền trong wallet
            } catch (error) {
                // WALLET CHƯA ĐƯỢC TẠO
                if (error.message === "WALLET_NOT_FOUND") {
                    alert("Your TÉM Wallet has not been created yet.");
                    window.location.href = "wallet.html";
                    return;
                }
                // SỐ DƯ KHÔNG ĐỦ
                if (error.message === "INSUFFICIENT_BALANCE") {
                    alert("Insufficient wallet balance.");
                    window.location.href = "wallet.html";
                    return;
                }
                throw error; // chuyển lỗi khác ra catch bên ngoài
            }
        }
        // TẠO DỮ LIỆU ĐƠN HÀNG
        const orderData = {
            userId: currentUser.uid, // UID xác định đơn hàng thuộc user nào
            customer: {
                name: fullName,
                phone: phone,
                address: address
            },
            items: cart,
            total: total,
            paymentMethod: payment,
            paymentStatus: payment === "WALLET" ? "PAID" : "PENDING", // toán tử ? : dùng để chọn 1 trong 2 giá trị
            note: note,
            status: "PENDING",
            createdAt: serverTimestamp() // thời gian tạo đơn từ server
        };
        // TẠO DOCUMENT ĐƠN HÀNG TRONG FIRESTORE
        const orderRef = await addDoc(collection(db, "orders"), orderData); // addDoc() tự tạo ID đơn
        // XÓA GIỎ HÀNG SAU KHI ĐẶT HÀNG
        localStorage.removeItem(getCartKey(currentUser.uid)); // xóa cart của user hiện tại
        alert(`Order ${orderRef.id} placed successfully.`); // orderRef.id là ID đơn hàng
        // CHUYỂN VỀ TRANG HOME
        window.location.href = "index.html";
    } catch (error) {
        console.error("Cannot create order:", error); // xem lỗi trong Console
        alert("Cannot place order. Please try again.");
    } finally {
        // MỞ LẠI NÚT SAU KHI XỬ LÝ
        placeOrderBtn.disabled = false;
        placeOrderBtn.textContent = "PLACE ORDER";
    }
});
// KIỂM TRA TRẠNG THÁI ĐĂNG NHẬP
onAuthStateChanged(auth, user => {
    // CHƯA ĐĂNG NHẬP
    if (!user) {
        currentUser = null;
        alert("Please sign in before checkout.");
        window.location.href = "signin.html";
        return;
    }
    // ĐÃ ĐĂNG NHẬP
    currentUser = user; // lưu user hiện tại
    loadCart(user.uid); // lấy giỏ hàng của user
    renderSummary(); // hiển thị tóm tắt đơn hàng
});