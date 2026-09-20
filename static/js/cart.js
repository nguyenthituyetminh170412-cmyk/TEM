import { auth } from "./firebase.config.js";
import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const cartContainer = document.getElementById("cartContainer");

function getCartKey(uid) {
    return `temCart_${uid}`;
}

function getCart(uid) {
    return JSON.parse(
        localStorage.getItem(getCartKey(uid)) || "[]"
    );
}

function saveCart(uid, cart) {
    localStorage.setItem(
        getCartKey(uid),
        JSON.stringify(cart)
    );
}

function formatPrice(price) {
    return Number(price || 0).toLocaleString("en-US") + " VND";
}

function renderCart(uid) {
    const cart = getCart(uid);

    if (cart.length === 0) {
        cartContainer.innerHTML = `
            <div class="empty-cart-box">
                <span>00</span>
                <h3>Your Cart Is Empty</h3>
                <p>Looks like you haven't added anything yet.</p>

                <a href="shop.html" class="cart-shop-btn">
                    SHOP NOW
                </a>
            </div>
        `;
        return;
    }

    const subtotal = cart.reduce(
        (total, item) =>
            total +
            Number(item.price || 0) *
            Number(item.quantity || 0),
        0
    );

    cartContainer.innerHTML = `
        <div class="cart-layout">

            <div class="cart-items">

                <div class="cart-top">
                    <span>
                        ${cart.length}
                        ITEM${cart.length > 1 ? "S" : ""}
                    </span>

                    <a href="shop.html" class="view-cart-btn">
                        CONTINUE SHOPPING
                    </a>
                </div>

                ${cart.map((item, index) => `
                    <div class="cart-item">

                        <div class="cart-item-image">
                            <img
                                src="../static/img/${item.image || ""}"
                                alt="${item.name || ""}"
                            >
                        </div>

                        <div class="cart-item-info">

                            <p class="cart-category">
                                ${item.category || ""}
                            </p>

                            <h2>
                                ${item.name || ""}
                            </h2>

                            <p class="cart-price">
                                ${formatPrice(item.price)}
                            </p>

                            <p class="cart-size">
                                Size: ${item.size || "N/A"}
                            </p>

                            <div class="cart-actions">

                                <div class="cart-quantity">

                                    <button
                                        type="button"
                                        class="minus"
                                        data-index="${index}"
                                    >
                                        −
                                    </button>

                                    <span>
                                        ${item.quantity}
                                    </span>

                                    <button
                                        type="button"
                                        class="plus"
                                        data-index="${index}"
                                    >
                                        +
                                    </button>

                                </div>

                                <button
                                    type="button"
                                    class="remove-btn"
                                    data-index="${index}"
                                >
                                    REMOVE
                                </button>

                            </div>

                        </div>

                        <strong class="cart-item-total">
                            ${formatPrice(
                                Number(item.price || 0) *
                                Number(item.quantity || 0)
                            )}
                        </strong>

                    </div>
                `).join("")}

                <a href="shop.html" class="view-cart-bottom">
                    VIEW SHOP
                </a>

            </div>

            <aside class="cart-summary">

                <p class="summary-label">
                    TÉM / SHOPPING
                </p>

                <h2>
                    ORDER SUMMARY
                </h2>

                <div class="summary-row">
                    <span>Subtotal</span>
                    <strong>
                        ${formatPrice(subtotal)}
                    </strong>
                </div>

                <div class="summary-row">
                    <span>Shipping</span>
                    <strong>FREE</strong>
                </div>

                <hr>

                <div class="summary-total">
                    <span>TOTAL</span>
                    <strong>
                        ${formatPrice(subtotal)}
                    </strong>
                </div>

                <button
                    id="checkoutBtn"
                    class="checkout-btn"
                >
                    CHECKOUT
                </button>

                <a
                    href="shop.html"
                    class="summary-view-cart"
                >
                    CONTINUE SHOPPING
                </a>

            </aside>

        </div>
    `;

    document.querySelectorAll(".minus").forEach(button => {
        button.addEventListener("click", () => {
            const cart = getCart(uid);
            const index = Number(button.dataset.index);

            if (cart[index].quantity > 1) {
                cart[index].quantity--;
            }

            saveCart(uid, cart);
            renderCart(uid);
        });
    });

    document.querySelectorAll(".plus").forEach(button => {
        button.addEventListener("click", () => {
            const cart = getCart(uid);
            const index = Number(button.dataset.index);

            cart[index].quantity++;

            saveCart(uid, cart);
            renderCart(uid);
        });
    });

    document.querySelectorAll(".remove-btn").forEach(button => {
        button.addEventListener("click", () => {
            const cart = getCart(uid);
            const index = Number(button.dataset.index);

            cart.splice(index, 1);

            saveCart(uid, cart);
            renderCart(uid);
        });
    });

    const checkoutBtn =
        document.getElementById("checkoutBtn");

    if (checkoutBtn) {
        checkoutBtn.addEventListener("click", () => {
            window.location.href = "checkout.html";
        });
    }
}

onAuthStateChanged(auth, user => {
    if (!user) {
        cartContainer.innerHTML = `
            <div class="empty-cart-box">
                <span>00</span>

                <h3>Please Sign In</h3>

                <p>
                    You need to sign in to view your cart.
                </p>

                <a href="signin.html" class="cart-shop-btn">
                    SIGN IN
                </a>
            </div>
        `;

        return;
    }

    renderCart(user.uid);
});