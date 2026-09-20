import { db, collection, getDocs } from "./firebase.config.js";
const newInGrid = document.getElementById("newInGrid");
async function loadNewIn() {
    try {
        const snapshot = await getDocs(collection(db, "products"));
        const products = [];
        snapshot.forEach(doc => {
            products.push({
                id: doc.id,
                ...doc.data()
            });
        });
        const newProducts = products.filter(product => product.isNew === true);
        if (newProducts.length === 0) {
            newInGrid.innerHTML = `
                <p style="grid-column:1/-1;text-align:center;color:#777;">
                    No new products available.
                </p>
            `;
            return;
        }
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
        console.error("Error loading NEW IN:", error);
        newInGrid.innerHTML = `
            <p style="grid-column:1/-1;text-align:center;color:#777;">
                Unable to load products.
            </p>
        `;
    }
}
loadNewIn();

