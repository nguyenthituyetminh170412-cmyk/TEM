import { db, auth } from "./firebase.config.js";
import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    collection,
    addDoc,
    query,
    orderBy,
    getDocs,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Lấy các phần tử của Wallet
const walletBalance = document.getElementById("walletBalance");
const transactionList = document.getElementById("transactionList");
const addMoneyBtn = document.getElementById("addMoneyBtn");
const walletModal = document.getElementById("walletModal");
const closeWalletModal = document.getElementById("closeWalletModal");
const walletForm = document.getElementById("walletForm");
const walletAmount = document.getElementById("walletAmount");
const walletMessage = document.getElementById("walletMessage");
// Định dạng số tiền
function formatPrice(price) {
    return Number(price || 0).toLocaleString("en-US") + " VND";
}
// Tải số dư Wallet của user
async function loadWallet(uid) {
    try {
        // Mỗi user có một wallet riêng theo UID
        const walletRef = doc(db, "wallets", uid);
        const walletSnap = await getDoc(walletRef);
        // Nếu chưa có wallet thì tạo mới với số dư 0
        if (!walletSnap.exists()) {
            await setDoc(walletRef, {
                balance: 0,
                createdAt: serverTimestamp()
            });
            walletBalance.textContent = formatPrice(0);
            return;
        }
        // Lấy và hiển thị số dư
        const walletData = walletSnap.data();
        walletBalance.textContent =
            formatPrice(walletData.balance || 0);
    } catch (error) {
        // Xử lý lỗi khi tải Wallet
        console.error("Cannot load wallet:", error);
        walletBalance.textContent = "Unable to load";
    }
}
// Tải lịch sử giao dịch
async function loadTransactions(uid) {
    transactionList.innerHTML = `
        <p class="wallet-empty">
            Loading transactions...
        </p>
    `;
    try {
        // Collection giao dịch nằm bên trong wallet của user
        const transactionsRef = collection(
            db,
            "wallets",
            uid,
            "transactions"
        );
        // Sắp xếp giao dịch mới nhất lên đầu
        const q = query(
            transactionsRef,
            orderBy("createdAt", "desc")
        );
        // Lấy danh sách giao dịch
        const snapshot = await getDocs(q);
        // Nếu chưa có giao dịch
        if (snapshot.empty) {
            transactionList.innerHTML = `
                <p class="wallet-empty">
                    No transactions yet.
                </p>
            `;
            return;
        }
        transactionList.innerHTML = "";
        // Hiển thị từng giao dịch
        snapshot.forEach(transactionDoc => {
            const data = transactionDoc.data();
            // TOP_UP là tiền cộng vào Wallet
            const isCredit = data.type === "TOP_UP";
            const item = document.createElement("div");
            item.className = "transaction-item";
            item.innerHTML = `
                <div>
                    <strong>
                        ${data.title || "Transaction"}
                    </strong>
                    <span>
                        ${data.type || ""}
                    </span>
                </div>
                <strong class="${isCredit ? "transaction-credit" : "transaction-debit"}">
                    ${isCredit ? "+" : "-"}${formatPrice(data.amount)}
                </strong>
            `;
            // Thêm giao dịch vào danh sách
            transactionList.appendChild(item);
        });
    } catch (error) {
        // Xử lý lỗi khi tải lịch sử
        console.error("Cannot load transactions:", error);
        transactionList.innerHTML = `
            <p class="wallet-empty">
                Cannot load transaction history.
            </p>
        `;
    }
}
// Mở modal nạp tiền
addMoneyBtn.addEventListener("click", () => {
    walletMessage.textContent = "";
    walletAmount.value = "";
    walletModal.classList.add("active");
});
// Đóng modal
closeWalletModal.addEventListener("click", () => {
    walletModal.classList.remove("active");
});
// Click bên ngoài modal để đóng
walletModal.addEventListener("click", event => {
    if (event.target === walletModal) {
        walletModal.classList.remove("active");
    }
});
// Xử lý form nạp tiền
walletForm.addEventListener("submit", async event => {
    event.preventDefault();

    // Lấy user hiện tại
    const user = auth.currentUser;
    // Bắt buộc đăng nhập
    if (!user) {
        alert("Please sign in first.");
        window.location.href = "signin.html";
        return;
    }
    // Lấy số tiền muốn nạp
    const amount = Number(walletAmount.value);
    // Kiểm tra số tiền tối thiểu
    if (!amount || amount < 1000) {
        walletMessage.textContent =
            "Minimum amount is 1,000 VND.";
        return;
    }
    try {
        walletMessage.textContent = "Processing...";

        // Lấy Wallet của user
        const walletRef = doc(
            db,
            "wallets",
            user.uid
        );
        const walletSnap = await getDoc(walletRef);
        // Lấy số dư hiện tại
        let currentBalance = 0;
        if (walletSnap.exists()) {
            currentBalance =
                Number(walletSnap.data().balance || 0);
        }
        // Tính số dư mới
        const newBalance =
            currentBalance + amount;
        // Cập nhật số dư Wallet
        await setDoc(
            walletRef,
            {
                balance: newBalance,
                updatedAt: serverTimestamp()
            },
            {
                merge: true
            }
        );
        // Tạo giao dịch TOP_UP
        await addDoc(
            collection(
                db,
                "wallets",
                user.uid,
                "transactions"
            ),
            {
                type: "TOP_UP",
                title: "Wallet Top Up",
                amount: amount,
                createdAt: serverTimestamp()
            }
        );

        // Cập nhật giao diện sau khi nạp thành công
        walletMessage.textContent =
            "Money added successfully.";
        await loadWallet(user.uid);
        await loadTransactions(user.uid);
        // Tự đóng modal sau 0.7 giây
        setTimeout(() => {
            walletModal.classList.remove("active");
        }, 700);
    } catch (error) {
        // Xử lý lỗi khi nạp tiền
        console.error("Wallet error:", error);
        walletMessage.textContent =
            "Unable to add money. Please try again.";
    }
});
// Kiểm tra trạng thái đăng nhập
onAuthStateChanged(auth, async user => {
    // Nếu chưa đăng nhập thì chuyển sang Sign In
    if (!user) {
        window.location.href = "signin.html";
        return;
    }
    // Nếu đã đăng nhập thì tải Wallet và giao dịch
    await loadWallet(user.uid);
    await loadTransactions(user.uid);
});