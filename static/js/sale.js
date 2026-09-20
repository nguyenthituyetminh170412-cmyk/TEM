import { db, collection, getDocs } from "./firebase.config.js";
const saleGrid = document.getElementById("saleGrid");
async function loadSale() {
    try {
        const snapshot = await getDocs(collection(db, "products"));
        const products = [];
        snapshot.forEach(doc => {
            products.push({
                id: doc.id,
                ...doc.data()
            });
        });
        const saleProducts = products.filter(product => product.sale === true);
        if (saleProducts.length === 0) {
            saleGrid.innerHTML = `
                <p style="grid-column:1/-1;text-align:center;color:#777;">
                    No sale products available.
                </p>
            `;
            return;
        }
        saleGrid.innerHTML = saleProducts.map(product => {
            const oldPrice = Number(product.originalPrice || 0);
            const salePrice = Number(product.price || 0);
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
        console.error("Error loading SALE:", error);
        saleGrid.innerHTML = `
            <p style="grid-column:1/-1;text-align:center;color:#777;">
                Unable to load products.
            </p>
        `;
    }
}
loadSale();

