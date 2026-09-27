import { db } from "./firebase.config.js";
import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
// Lấy khu vực hiển thị sản phẩm
const productGrid = document.getElementById("productGrid");
// Hiển thị danh sách sản phẩm
async function displayProducts() {
    try {
        // Xóa sản phẩm cũ trước khi tải
        productGrid.innerHTML = "";
        // Lấy toàn bộ sản phẩm từ Firestore
        const querySnapshot = await getDocs(
            collection(db, "products")
        );
        // Duyệt qua từng sản phẩm
        querySnapshot.forEach((doc) => {
            const product = doc.data();
            // Tạo thẻ sản phẩm
            const productCard = document.createElement("div");
            productCard.className = "product-card";
            // Tạo nội dung cho card
            productCard.innerHTML = `
                <div class="product-image">
                    <img 
                        src="../static/img/${product.image}" 
                        alt="${product.name || ""}"
                    >
                </div>
                <div class="product-info">
                    <p class="product-category">
                        ${product.category || ""}
                    </p>
                    <h2>
                        ${product.name || ""}
                    </h2>
                    <p class="product-price">
                        ${Number(product.price || 0).toLocaleString("en-US")} VND
                    </p>
                </div>
            `;
            // Bấm vào card để mở trang chi tiết
            productCard.addEventListener("click", function () {
                window.location.href = `product.detail.html?id=${doc.id}`;
            });
            // Thêm card vào productGrid
            productGrid.appendChild(productCard);
        });
    } catch (error) {
        // Hiển thị lỗi nếu không tải được sản phẩm
        console.error("Không thể tải sản phẩm:", error);
        productGrid.innerHTML = `
            <p>Không thể tải sản phẩm.</p>
        `;
    }
}
// Chạy hàm hiển thị sản phẩm
displayProducts();