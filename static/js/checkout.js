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
const form = document.getElementById("checkoutForm");
const summary = document.getElementById("checkoutSummary");
let currentUser = null;
let cart = [];
function getCartKey(uid) {
    return `temCart_${uid}`;
}
function formatPrice(price) {
    return Number(price || 0).toLocaleString("en-US") + " VND";
}
function getTotal() {
    return cart.reduce((total, item) => {
        return total + Number(item.price || 0) * Number(item.quantity || 0);
    }, 0);
}
function loadCart(uid) {
    cart = JSON.parse(localStorage.getItem(getCartKey(uid)) || "[]");
}
function renderSummary() {
    if (cart.length === 0) {
        summary.innerHTML = `
            <div class="checkout-summary">
                <h2>YOUR ORDER</h2>
                <p>Your cart is empty.</p>
                <a href="shop.html" class="cart-shop-btn">SHOP NOW</a>
            </div>
        `;
        form.style.display = "none";
        return;
    }
    form.style.display = "block";
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
    `;
}
async function payWithWallet(uid, total) {
    const walletRef = doc(db, "wallets", uid);
    const walletSnap = await getDoc(walletRef);
    if (!walletSnap.exists()) {
        throw new Error("WALLET_NOT_FOUND");
    }
    const walletData = walletSnap.data();
    const balance = Number(walletData.balance || 0);
    if (balance < total) {
        throw new Error("INSUFFICIENT_BALANCE");
    }
    const newBalance = balance - total;
    await updateDoc(walletRef, {
        balance: newBalance,
        updatedAt: serverTimestamp()
    });
    await addDoc(collection(db, "wallets", uid, "transactions"), {
        type: "PAYMENT",
        title: "Order Payment",
        amount: total,
        createdAt: serverTimestamp()
    });
}
form.addEventListener("submit", async event => {
    event.preventDefault();
    if (!currentUser) {
        alert("Please sign in before placing an order.");
        window.location.href = "signin.html";
        return;
    }
    loadCart(currentUser.uid);
    if (cart.length === 0) {
        alert("Your cart is empty.");
        return;
    }
    const fullName = document.getElementById("fullName").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const address = document.getElementById("address").value.trim();
    const note = document.getElementById("note").value.trim();
    const paymentInput = document.querySelector('input[name="payment"]:checked');
    const payment = paymentInput ? paymentInput.value : "COD";
    const total = getTotal();
    if (!fullName || !phone || !address) {
        alert("Please fill in all shipping information.");
        return;
    }
    const placeOrderBtn = form.querySelector(".place-order-btn");
    try {
        placeOrderBtn.disabled = true;
        placeOrderBtn.textContent = "PROCESSING...";
        if (payment === "WALLET") {
            try {
                await payWithWallet(currentUser.uid, total);
            } catch (error) {
                if (error.message === "WALLET_NOT_FOUND") {
                    alert("Your TÉM Wallet has not been created yet.");
                    window.location.href = "wallet.html";
                    return;
                }
                if (error.message === "INSUFFICIENT_BALANCE") {
                    alert("Insufficient wallet balance.");
                    window.location.href = "wallet.html";
                    return;
                }
                throw error;
            }
        }
        const orderData = {
            userId: currentUser.uid,
            customer: {
                name: fullName,
                phone: phone,
                address: address
            },
            items: cart,
            total: total,
            paymentMethod: payment,
            paymentStatus: payment === "WALLET" ? "PAID" : "PENDING",
            note: note,
            status: "PENDING",
            createdAt: serverTimestamp()
        };
        const orderRef = await addDoc(collection(db, "orders"), orderData);
        localStorage.removeItem(getCartKey(currentUser.uid));
        alert(`Order ${orderRef.id} placed successfully.`);
        window.location.href = "index.html";
    } catch (error) {
        console.error("Cannot create order:", error);
        alert("Cannot place order. Please try again.");
    } finally {
        placeOrderBtn.disabled = false;
        placeOrderBtn.textContent = "PLACE ORDER";
    }
});
onAuthStateChanged(auth, user => {
    if (!user) {
        currentUser = null;
        alert("Please sign in before checkout.");
        window.location.href = "signin.html";
        return;
    }
    currentUser = user;
    loadCart(user.uid);
    renderSummary();
});