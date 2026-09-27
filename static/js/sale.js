import { db, collection, getDocs } from "./firebase.config.js";
// Lấy khu vực hiển thị sản phẩm SALE
const saleGrid = document.getElementById("saleGrid");
// Tải sản phẩm SALE từ Firestore
async function loadSale() {
    try {
        // Lấy toàn bộ sản phẩm từ Firestore
        const snapshot = await getDocs(collection(db, "products"));

        // Chuyển dữ liệu Firestore thành mảng
        const products = [];
        snapshot.forEach(doc => {
            products.push({
                id: doc.id,
                ...doc.data()
            });
        });
        // Chỉ lấy sản phẩm có sale = true
        const saleProducts = products.filter(
            product => product.sale === true
        );
        // Nếu không có sản phẩm SALE
        if (saleProducts.length === 0) {
            saleGrid.innerHTML = `
                <p style="grid-column:1/-1;text-align:center;color:#777;">
                    No sale products available.
                </p>
            `;
            return;
        }
        // Tạo giao diện cho các sản phẩm SALE
        saleGrid.innerHTML = saleProducts.map(product => {
            // Lấy giá cũ và giá SALE
            const oldPrice = Number(product.originalPrice || 0);
            const salePrice = Number(product.price || 0);
            // Tính phần trăm giảm giá
            const discount = oldPrice > salePrice
                ? Math.round((1 - salePrice / oldPrice) * 100)
                : 0;

            return `
                <div class="product-card" onclick="location.href='product.detail.html?id=${product.id}'">
                    <div class="product-image sale-image">
                        <img src="../static/img/${product.image}" alt="${product.name}">
                        <span class="sale-badge">SALE</span>
                    </div>
                    <div class="product-info">
                        <div class="product-category">
                            ${product.category || "FASHION"}
                        </div>
                        <h2>${product.name}</h2>
                        <div class="product-sale-price">
                            ${oldPrice > salePrice
                                ? `<span class="old-price">${oldPrice.toLocaleString("vi-VN")} VND</span>`
                                : ""}
                            <span class="new-price">
                                ${salePrice.toLocaleString("vi-VN")} VND
                            </span>
                            ${discount > 0
                                ? `<span class="discount">-${discount}%</span>`
                                : ""}
                        </div>
                    </div>
                </div>
            `;
        }).join("");
    } catch (error) {
        // Hiển thị thông báo nếu tải sản phẩm thất bại
        console.error("Error loading SALE:", error);
        saleGrid.innerHTML = `
            <p style="grid-column:1/-1;text-align:center;color:#777;">
                Unable to load products.
            </p>
        `;
    }
}
// Chạy hàm khi mở trang
loadSale();