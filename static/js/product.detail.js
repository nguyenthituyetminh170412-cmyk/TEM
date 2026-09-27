import { db, auth } from "./firebase.config.js";
import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Lấy khu vực hiển thị chi tiết sản phẩm
const productDetail = document.getElementById("productDetail");
// Lấy id sản phẩm từ URL
const params = new URLSearchParams(window.location.search);
const productId = params.get("id");
// Tải thông tin sản phẩm từ Firestore
async function loadProduct() {
    try {
        // Kiểm tra URL có productId không
        if (!productId) {
            productDetail.innerHTML = "<p>Product not found.</p>";
            return;
        }
        // Lấy sản phẩm theo id
        const productRef = doc(db, "products", productId);
        const productSnap = await getDoc(productRef);
        // Kiểm tra sản phẩm có tồn tại không
        if (!productSnap.exists()) {
            productDetail.innerHTML = "<p>Product not found.</p>";
            return;
        }
        // Lấy dữ liệu sản phẩm
        const product = productSnap.data();
        // Chuẩn hóa size thành mảng
        const sizes = Array.isArray(product.size)
            ? product.size
            : String(product.size || "")
                .split(",")
                .map(item => item.trim())
                .filter(Boolean);

        // Lấy số lượng tồn kho
        const stock = Number(product.stock || 0);

        // Tạo giao diện chi tiết sản phẩm
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
        // Gắn chức năng cho size, quantity và cart
        setupProductOptions(product, sizes, stock);
    } catch (error) {
        // Hiển thị lỗi khi không tải được sản phẩm
        console.error("Không thể tải sản phẩm:", error);
        productDetail.innerHTML = `
            <p>Không thể tải thông tin sản phẩm.</p>
        `;
    }
}
// Xử lý size, số lượng và thêm vào cart
function setupProductOptions(product, sizes, stock) {
    // Lấy các phần tử cần thao tác
    const sizeButtons = document.querySelectorAll(".size-btn");
    const quantityInput = document.getElementById("quantityInput");
    const minusBtn = document.getElementById("minusBtn");
    const plusBtn = document.getElementById("plusBtn");
    const addToCartBtn = document.getElementById("addToCartBtn");
    // Lưu size người dùng chọn
    let selectedSize = "";
    // Xử lý chọn size
    sizeButtons.forEach(button => {
        button.addEventListener("click", () => {
            sizeButtons.forEach(btn => {
                btn.classList.remove("selected");
            });
            button.classList.add("selected");
            selectedSize = button.dataset.value;
        });
    });
    // Xử lý tăng giảm số lượng
    if (stock > 0) {
        minusBtn.addEventListener("click", () => {
            let quantity = Number(quantityInput.value);
            if (quantity > 1) {
                quantity--;
            }
            quantityInput.value = quantity;
        });
        plusBtn.addEventListener("click", () => {
            let quantity = Number(quantityInput.value);
            if (quantity < stock) {
                quantity++;
            }
            quantityInput.value = quantity;
        });
        // Kiểm tra số lượng nhập vào không vượt stock
        quantityInput.addEventListener("change", () => {
            let quantity = Number(quantityInput.value);
            if (quantity < 1 || isNaN(quantity)) {
                quantity = 1;
            }
            if (quantity > stock) {
                quantity = stock;
            }
            quantityInput.value = quantity;
        });
    }
    // Xử lý nút ADD TO CART
    addToCartBtn.addEventListener("click", () => {
        // Không cho thêm nếu hết hàng
        if (stock <= 0) {
            return;
        }
        // Bắt buộc đăng nhập trước khi mua
        if (!auth.currentUser) {
            alert("Please sign in before adding products to your cart.");
            window.location.href = "signin.html";
            return;
        }
        // Nếu sản phẩm có size thì phải chọn size
        if (sizes.length > 0 && !selectedSize) {
            alert("Please select a size.");
            return;
        }
        // Lấy số lượng người dùng chọn
        const quantity = Number(quantityInput.value);
        // Tạo cart riêng cho từng user
        const cartKey = `temCart_${auth.currentUser.uid}`;
        // Lấy cart hiện tại từ localStorage
        let cart = JSON.parse(
            localStorage.getItem(cartKey) || "[]"
        );
        // Tìm sản phẩm đã có trong cart
        const existingIndex = cart.findIndex(
            item =>
                item.id === productId &&
                item.size === selectedSize
        );

        // Tạo object sản phẩm trong cart
        const cartItem = {
            id: productId,
            name: product.name || "",
            price: Number(product.price || 0),
            image: product.image || "",
            category: product.category || "",
            size: selectedSize,
            quantity: quantity
        };
        // Nếu sản phẩm đã có thì cộng thêm số lượng
        if (existingIndex !== -1) {
            const newQuantity =
                Number(cart[existingIndex].quantity) + quantity;

            cart[existingIndex].quantity =
                Math.min(newQuantity, stock);
        } else {
            // Nếu chưa có thì thêm sản phẩm mới
            cart.push(cartItem);
        }
        // Lưu cart vào localStorage
        localStorage.setItem(
            cartKey,
            JSON.stringify(cart)
        );
        // Thông báo và chuyển đến cart
        alert("Product added to cart.");
        window.location.href = "cart.html";
    });
}
// Chạy hàm tải sản phẩm
loadProduct();