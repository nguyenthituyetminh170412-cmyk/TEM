import { db } from "./firebase.config.js";
import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const productGrid = document.getElementById("productGrid");

async function displayProducts() {
    try {
        productGrid.innerHTML = "";

        const querySnapshot = await getDocs(
            collection(db, "products")
        );

        querySnapshot.forEach((doc) => {
            const product = doc.data();

            const productCard = document.createElement("div");
            productCard.className = "product-card";

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

            productCard.addEventListener("click", function () {
            window.location.href = `product.detail.html?id=${doc.id}`;
        });

            productGrid.appendChild(productCard);
        });

    } catch (error) {
        console.error("Không thể tải sản phẩm:", error);

        productGrid.innerHTML = `
            <p>Không thể tải sản phẩm.</p>
        `;
    }
}

displayProducts();