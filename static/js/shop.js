import { products } from "./products.js";
const productGrid = document.getElementById("productGrid");
function displayProducts() {
    productGrid.innerHTML = "";
    products.forEach(function (product) {
        const productCard = document.createElement("div");
        productCard.className = "product-card";
        productCard.innerHTML = `
            <div class="product-image">
                <img 
                    src="../static/img/${product.image}" 
                    alt="${product.name}"
                >
            </div>
            <div class="product-info">
                <p class="product-category">
                    ${product.category}
                </p>
                <h2>
                    ${product.name}
                </h2>
                <p class="product-price">
                    ${product.price.toLocaleString("en-US")} VND
                </p>
            </div>
        `;
        productGrid.appendChild(productCard);
    });
}
displayProducts();