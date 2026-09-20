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

const walletBalance = document.getElementById("walletBalance");
const transactionList = document.getElementById("transactionList");

const addMoneyBtn = document.getElementById("addMoneyBtn");
const walletModal = document.getElementById("walletModal");
const closeWalletModal = document.getElementById("closeWalletModal");
const walletForm = document.getElementById("walletForm");
const walletAmount = document.getElementById("walletAmount");
const walletMessage = document.getElementById("walletMessage");

function formatPrice(price) {
    return Number(price || 0).toLocaleString("en-US") + " VND";
}

async function loadWallet(uid) {
    try {
        const walletRef = doc(db, "wallets", uid);
        const walletSnap = await getDoc(walletRef);

        if (!walletSnap.exists()) {
            await setDoc(walletRef, {
                balance: 0,
                createdAt: serverTimestamp()
            });

            walletBalance.textContent = formatPrice(0);
            return;
        }

        const walletData = walletSnap.data();

        walletBalance.textContent =
            formatPrice(walletData.balance || 0);

    } catch (error) {
        console.error("Cannot load wallet:", error);
        walletBalance.textContent = "Unable to load";
    }
}

async function loadTransactions(uid) {
    transactionList.innerHTML = `
        <p class="wallet-empty">
            Loading transactions...
        </p>
    `;

    try {
        const transactionsRef = collection(
            db,
            "wallets",
            uid,
            "transactions"
        );

        const q = query(
            transactionsRef,
            orderBy("createdAt", "desc")
        );

        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            transactionList.innerHTML = `
                <p class="wallet-empty">
                    No transactions yet.
                </p>
            `;
            return;
        }

        transactionList.innerHTML = "";

        snapshot.forEach(transactionDoc => {

            const data = transactionDoc.data();

            const isCredit =
                data.type === "TOP_UP";

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

            transactionList.appendChild(item);
        });

    } catch (error) {
        console.error("Cannot load transactions:", error);

        transactionList.innerHTML = `
            <p class="wallet-empty">
                Cannot load transaction history.
            </p>
        `;
    }
}

addMoneyBtn.addEventListener("click", () => {
    walletMessage.textContent = "";
    walletAmount.value = "";
    walletModal.classList.add("active");
});

closeWalletModal.addEventListener("click", () => {
    walletModal.classList.remove("active");
});

walletModal.addEventListener("click", event => {
    if (event.target === walletModal) {
        walletModal.classList.remove("active");
    }
});

walletForm.addEventListener("submit", async event => {

    event.preventDefault();

    const user = auth.currentUser;

    if (!user) {
        alert("Please sign in first.");
        window.location.href = "signin.html";
        return;
    }

    const amount = Number(walletAmount.value);

    if (!amount || amount < 1000) {
        walletMessage.textContent =
            "Minimum amount is 1,000 VND.";
        return;
    }

    try {

        walletMessage.textContent = "Processing...";

        const walletRef = doc(
            db,
            "wallets",
            user.uid
        );

        const walletSnap = await getDoc(walletRef);

        let currentBalance = 0;

        if (walletSnap.exists()) {
            currentBalance =
                Number(walletSnap.data().balance || 0);
        }

        const newBalance =
            currentBalance + amount;

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

        walletMessage.textContent =
            "Money added successfully.";

        await loadWallet(user.uid);
        await loadTransactions(user.uid);
        setTimeout(() => {
            walletModal.classList.remove("active");
        }, 700);
    } catch (error) {
        console.error("Wallet error:", error);
        walletMessage.textContent =
            "Unable to add money. Please try again.";
    }
});
onAuthStateChanged(auth, async user => {
    if (!user) {
        window.location.href = "signin.html";
        return;
    }

    await loadWallet(user.uid);
    await loadTransactions(user.uid);
});