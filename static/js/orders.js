import { db, auth } from "./firebase.config.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const ordersContainer =
    document.getElementById("ordersContainer");

function formatPrice(price) {
    return Number(price || 0).toLocaleString("en-US") + " VND";
}

function formatDate(timestamp) {
    if (!timestamp) {
        return "—";
    }

    const date = timestamp.toDate();

    return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });
}

function getStatusClass(status) {
    return String(status || "")
        .toLowerCase()
        .replace(/\s+/g, "-");
}

function renderOrders(orders) {
    if (orders.length === 0) {
        ordersContainer.innerHTML = `
            <div class="empty-orders-box">
                <span>00</span>
                <h3>No Orders Yet</h3>
                <p>You haven't placed any orders with TÉM.</p>
                <a href="shop.html" class="cart-shop-btn">
                    SHOP NOW
                </a>
            </div>
        `;
        return;
    }

    ordersContainer.innerHTML = `
        <div class="orders-list">

            ${orders.map(order => {

                const items = Array.isArray(order.items)
                    ? order.items
                    : [];

                const itemCount = items.reduce(
                    (total, item) =>
                        total + Number(item.quantity || 0),
                    0
                );

                return `
                    <article class="order-card">

                        <div class="order-top">

                            <div>
                                <p class="order-label">
                                    ORDER
                                </p>

                                <h2>
                                    #${order.id.slice(0, 8).toUpperCase()}
                                </h2>

                                <p class="order-date">
                                    ${formatDate(order.createdAt)}
                                </p>
                            </div>

                            <span class="order-status ${getStatusClass(order.status)}">
                                ${order.status || "PENDING"}
                            </span>

                        </div>

                        <div class="order-items">

                            ${items.map(item => `
                                <div class="order-item">

                                    <div class="order-item-image">
                                        <img
                                            src="../static/img/${item.image || ""}"
                                            alt="${item.name || ""}"
                                        >
                                    </div>

                                    <div class="order-item-info">

                                        <h3>
                                            ${item.name || "Product"}
                                        </h3>

                                        <p>
                                            Size:
                                            ${item.size || "N/A"}
                                        </p>

                                        <p>
                                            Quantity:
                                            ${item.quantity || 0}
                                        </p>

                                    </div>

                                    <strong>
                                        ${formatPrice(
                                            Number(item.price || 0) *
                                            Number(item.quantity || 0)
                                        )}
                                    </strong>

                                </div>
                            `).join("")}

                        </div>

                        <div class="order-bottom">

                            <div class="order-payment">

                                <p>
                                    ${itemCount}
                                    ITEM${itemCount !== 1 ? "S" : ""}
                                </p>

                                <p>
                                    PAYMENT:
                                    ${order.paymentMethod || "COD"}
                                </p>

                                <p>
                                    ${order.paymentStatus || "PENDING"}
                                </p>

                            </div>

                            <div class="order-total">
                                <span>TOTAL</span>
                                <strong>
                                    ${formatPrice(order.total)}
                                </strong>
                            </div>

                        </div>

                    </article>
                `;
            }).join("")}

        </div>
    `;
}

async function loadOrders(uid) {
    ordersContainer.innerHTML = `
        <div class="orders-loading">
            LOADING ORDERS...
        </div>
    `;

    try {
        const ordersSnapshot = await getDocs(
            collection(db, "orders")
        );

        const orders = [];

        ordersSnapshot.forEach(orderDoc => {
            const order = orderDoc.data();

            if (order.userId === uid) {
                orders.push({
                    id: orderDoc.id,
                    ...order
                });
            }
        });

        orders.sort((a, b) => {
            const dateA = a.createdAt?.toDate?.() || new Date(0);
            const dateB = b.createdAt?.toDate?.() || new Date(0);

            return dateB - dateA;
        });

        renderOrders(orders);

    } catch (error) {
        console.error("Cannot load orders:", error);

        ordersContainer.innerHTML = `
            <div class="empty-orders-box">
                <span>!</span>
                <h3>Unable To Load Orders</h3>
                <p>
                    Please check your connection and try again.
                </p>
            </div>
        `;
    }
}

onAuthStateChanged(auth, user => {

    if (!user) {
        ordersContainer.innerHTML = `
            <div class="empty-orders-box">

                <span>00</span>

                <h3>Please Sign In</h3>

                <p>
                    You need to sign in to view your orders.
                </p>

                <a href="signin.html" class="cart-shop-btn">
                    SIGN IN
                </a>

            </div>
        `;

        return;
    }

    loadOrders(user.uid);
});