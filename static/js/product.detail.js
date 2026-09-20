import { db, auth } from "./firebase.config.js";
import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const productDetail = document.getElementById("productDetail");

const params = new URLSearchParams(window.location.search);
const productId = params.get("id");

async function loadProduct() {
    try {
        if (!productId) {
            productDetail.innerHTML = "<p>Product not found.</p>";
            return;
        }

        const productRef = doc(db, "products", productId);
        const productSnap = await getDoc(productRef);

        if (!productSnap.exists()) {
            productDetail.innerHTML = "<p>Product not found.</p>";
            return;
        }

        const product = productSnap.data();

        const sizes = Array.isArray(product.size)
            ? product.size
            : String(product.size || "")
                .split(",")
                .map(item => item.trim())
                .filter(Boolean);

        const stock = Number(product.stock || 0);

        productDetail.innerHTML = `
            <div class="product-detail-image">
                <img
                    src="../static/img/${product.image || ""}"
                    alt="${product.name || ""}"
                >
            </div>

            <div class="product-detail-info">

                <p class="product-category">
                    ${product.category || ""}
                </p>

                <h1>
                    ${product.name || ""}
                </h1>

                <p class="product-price">
                    ${Number(product.price || 0).toLocaleString("en-US")} VND
                </p>

                <p class="product-description">
                    ${product.description || ""}
                </p>

                <div class="size-section">
                    <p class="option-title">
                        <strong>Size</strong>
                    </p>

                    <div class="product-options">
                        ${
                            sizes.length
                                ? sizes
                                    .map(
                                        size => `
                                            <button
                                                type="button"
                                                class="option-btn size-btn"
                                                data-value="${size}"
                                            >
                                                ${size}
                                            </button>
                                        `
                                    )
                                    .join("")
                                : `<span class="no-option">N/A</span>`
                        }
                    </div>
                </div>

                <div class="stock-section">

                    <p class="stock-text">
                        <strong>Stock:</strong> ${stock}
                    </p>

                    <div class="quantity-box">

                        <button
                            type="button"
                            id="minusBtn"
                            class="quantity-btn"
                            ${stock <= 0 ? "disabled" : ""}
                        >
                            −
                        </button>

                        <input
                            type="number"
                            id="quantityInput"
                            value="${stock > 0 ? 1 : 0}"
                            min="${stock > 0 ? 1 : 0}"
                            max="${stock > 0 ? stock : 0}"
                            ${stock <= 0 ? "disabled" : ""}
                        >

                        <button
                            type="button"
                            id="plusBtn"
                            class="quantity-btn"
                            ${stock <= 0 ? "disabled" : ""}
                        >
                            +
                        </button>

                    </div>

                </div>

                <button
                    type="button"
                    id="addToCartBtn"
                    class="add-to-cart-btn"
                    ${stock <= 0 ? "disabled" : ""}
                >
                    ${stock <= 0 ? "OUT OF STOCK" : "ADD TO CART"}
                </button>

            </div>
        `;

        setupProductOptions(product, sizes, stock);

    } catch (error) {
        console.error(
            "Không thể tải sản phẩm:",
            error
        );

        productDetail.innerHTML = `
            <p>Không thể tải thông tin sản phẩm.</p>
        `;
    }
}

function setupProductOptions(product, sizes, stock) {

    const sizeButtons =
        document.querySelectorAll(".size-btn");

    const quantityInput =
        document.getElementById("quantityInput");

    const minusBtn =
        document.getElementById("minusBtn");

    const plusBtn =
        document.getElementById("plusBtn");

    const addToCartBtn =
        document.getElementById("addToCartBtn");

    let selectedSize = "";

    sizeButtons.forEach(button => {

        button.addEventListener("click", () => {

            sizeButtons.forEach(btn => {
                btn.classList.remove("selected");
            });

            button.classList.add("selected");

            selectedSize =
                button.dataset.value;
        });

    });

    if (stock > 0) {

        minusBtn.addEventListener("click", () => {

            let quantity =
                Number(quantityInput.value);

            if (quantity > 1) {
                quantity--;
            }

            quantityInput.value = quantity;
        });

        plusBtn.addEventListener("click", () => {

            let quantity =
                Number(quantityInput.value);

            if (quantity < stock) {
                quantity++;
            }

            quantityInput.value = quantity;
        });

        quantityInput.addEventListener("change", () => {

            let quantity =
                Number(quantityInput.value);

            if (
                quantity < 1 ||
                isNaN(quantity)
            ) {
                quantity = 1;
            }

            if (quantity > stock) {
                quantity = stock;
            }

            quantityInput.value = quantity;
        });

    }

    addToCartBtn.addEventListener("click", () => {

        if (stock <= 0) {
            return;
        }

        if (!auth.currentUser) {

            alert(
                "Please sign in before adding products to your cart."
            );

            window.location.href =
                "signin.html";

            return;
        }

        if (
            sizes.length > 0 &&
            !selectedSize
        ) {

            alert(
                "Please select a size."
            );

            return;
        }

        const quantity =
            Number(quantityInput.value);

        const cartKey =
            `temCart_${auth.currentUser.uid}`;

        let cart = JSON.parse(
            localStorage.getItem(cartKey) || "[]"
        );

        const existingIndex =
            cart.findIndex(
                item =>
                    item.id === productId &&
                    item.size === selectedSize
            );

        const cartItem = {
            id: productId,
            name: product.name || "",
            price: Number(product.price || 0),
            image: product.image || "",
            category: product.category || "",
            size: selectedSize,
            quantity: quantity
        };

        if (existingIndex !== -1) {

            const newQuantity =
                Number(
                    cart[existingIndex].quantity
                ) + quantity;

            cart[existingIndex].quantity =
                Math.min(
                    newQuantity,
                    stock
                );

        } else {

            cart.push(cartItem);

        }

        localStorage.setItem(
            cartKey,
            JSON.stringify(cart)
        );

        alert(
            "Product added to cart."
        );

        window.location.href =
            "cart.html";
    });
}

loadProduct();