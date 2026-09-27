import { db, collection, getDocs } from "./firebase.config.js";
// Lấy khu vực hiển thị sản phẩm NEW IN
const newInGrid = document.getElementById("newInGrid");
// Tải sản phẩm NEW IN từ Firestore
async function loadNewIn() {
    try {
        // Lấy toàn bộ sản phẩm
        const snapshot = await getDocs(collection(db, "products"));
        // Chuyển dữ liệu thành mảng
        const products = [];
        snapshot.forEach(doc => {
            products.push({
                id: doc.id,
                ...doc.data()
            });
        });
        // Chỉ lấy sản phẩm có isNew = true
        const newProducts = products.filter(
            product => product.isNew === true
        );
        // Nếu không có sản phẩm mới
        if (newProducts.length === 0) {
            newInGrid.innerHTML = `
                <p style="grid-column:1/-1;text-align:center;color:#777;">
                    No new products available.
                </p>
            `;
            return;
        }
        // Tạo giao diện cho từng sản phẩm mới
        newInGrid.innerHTML = newProducts.map(product => `
            <div class="product-card" onclick="location.href='product.detail.html?id=${product.id}'">
                <div class="product-image">
                    <img src="../static/img/${product.image}" alt="${product.name}">
                </div>
                <div class="product-info">
                    <div class="product-category">
                        ${product.category || "FASHION"}
                    </div>
                    <h2>${product.name}</h2>
                    <div class="product-price">
                        ${Number(product.price).toLocaleString("vi-VN")} VND
                    </div>
                </div>
            </div>
        `).join("");
    } catch (error) {
        // Hiển thị lỗi nếu không tải được sản phẩm
        console.error("Error loading NEW IN:", error);
        newInGrid.innerHTML = `
            <p style="grid-column:1/-1;text-align:center;color:#777;">
                Unable to load products.
            </p>
        `;
    }
}
// Chạy hàm khi mở trang
loadNewIn();