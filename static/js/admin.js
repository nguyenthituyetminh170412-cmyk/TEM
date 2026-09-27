import { db } from "./firebase.config.js";
import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
    getAuth,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const auth = getAuth();
const menuItems = document.querySelectorAll(".admin-menu-item");
const sections = document.querySelectorAll(".admin-section");
const pageTitle = document.getElementById("pageTitle");
const productModal = document.getElementById("productModal");
const addProductBtn = document.getElementById("addProductBtn");
const closeProductModal = document.getElementById("closeProductModal");
const cancelProductBtn = document.getElementById("cancelProductBtn");
const addProductForm = document.getElementById("addProductForm");
const addProductMessage = document.getElementById("addProductMessage");
const productSearch = document.getElementById("productSearch");
const modalTitle = document.querySelector(".product-modal-header h2");
const saveProductBtn = document.querySelector(".save-product-btn");
const logoutBtn = document.getElementById("logoutBtn");
const orderSearch = document.getElementById("orderSearch");
const orderTableBody = document.getElementById("orderTableBody");
const orderTotal = document.getElementById("orderTotal");
const orderModal = document.getElementById("orderModal");
const closeOrderModal = document.getElementById("closeOrderModal");
const orderDetailContent = document.getElementById("orderDetailContent");
const customerSearch = document.getElementById("customerSearch");
const customerTableBody = document.getElementById("customerTableBody");
const customerTotal = document.getElementById("customerTotal");

let products = [];
let orders = [];
let customers = [];
let editingProductId = null;

const sectionTitles = {
    dashboard: "Dashboard",
    products: "Products",
    orders: "Orders",
    customers: "Customers",
    inventory: "Inventory"
};

function showSection(sectionName) {
    menuItems.forEach(item => {
        item.classList.toggle("active", item.dataset.section === sectionName);
    });

    sections.forEach(section => {
        section.classList.remove("active-section");
    });

    const section = document.getElementById(`${sectionName}Section`);

    if (section) {
        section.classList.add("active-section");
    }

    pageTitle.textContent = sectionTitles[sectionName] || "Dashboard";
}

menuItems.forEach(item => {
    item.addEventListener("click", event => {
        event.preventDefault();
        showSection(item.dataset.section);
    });
});

document.querySelectorAll("[data-section]").forEach(button => {
    if (!button.classList.contains("admin-menu-item")) {
        button.addEventListener("click", () => {
            showSection(button.dataset.section);
        });
    }
});

function getProductName(product) {
    return product.name || product["name "] || "Unnamed Product";
}

function getProductPrice(product) {
    return Number(product.price || product["price "] || 0);
}

function getProductImage(product) {
    return product.image || "";
}

function getProductCategory(product) {
    return product.category || "UNCATEGORIZED";
}

function getProductSize(product) {
    return product.size || product["size "] || "";
}

function getProductStock(product) {
    return Number(product.stock || 0);
}

function getProductColor(product) {
    return product.color || "";
}

function getProductDescription(product) {
    return product.description || "";
}

function formatPrice(price) {
    return Number(price || 0).toLocaleString("en-US") + " VND";
}

async function loadProducts() {
    try {
        const snapshot = await getDocs(collection(db, "products"));
        products = [];

        snapshot.forEach(productDoc => {
            products.push({
                id: productDoc.id,
                ...productDoc.data()
            });
        });

        renderProducts();
        renderRecentProducts();
        renderInventory();
        updateDashboard();
    } catch (error) {
        console.error("Cannot load products:", error);
        alert("Cannot load products from Firestore.");
    }
}

function renderProducts(list = products) {
    const tbody = document.getElementById("productTableBody");
    const total = document.getElementById("productTotal");

    if (!tbody || !total) {
        return;
    }

    total.textContent = `${list.length} PRODUCTS`;
    tbody.innerHTML = "";

    if (list.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6">No products found.</td>
            </tr>
        `;
        return;
    }

    list.forEach(product => {
        const name = getProductName(product);
        const price = getProductPrice(product);
        const image = getProductImage(product);
        const category = getProductCategory(product);
        const size = getProductSize(product);
        const stock = getProductStock(product);

        let stockClass = "stock-good";

        if (stock <= 5) {
            stockClass = "stock-out";
        } else if (stock <= 10) {
            stockClass = "stock-low";
        }

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>
                <div class="admin-product-cell">
                    <img src="../static/img/${image}" alt="${name}">
                    <span class="admin-product-name">${name}</span>
                </div>
            </td>
            <td>${category}</td>
            <td>${formatPrice(price)}</td>
            <td>${size}</td>
            <td>
                <span class="${stockClass}">${stock}</span>
            </td>
            <td>
                <div style="display:flex;gap:8px;align-items:center;">
                    <button class="view-product" data-id="${product.id}">EDIT</button>
                    <button class="delete-product" data-id="${product.id}">DELETE</button>
                </div>
            </td>
        `;

        row.querySelector(".view-product").addEventListener("click", () => {
            openEditProduct(product.id);
        });

        row.querySelector(".delete-product").addEventListener("click", () => {
            deleteProduct(product.id);
        });

        tbody.appendChild(row);
    });
}

function renderRecentProducts() {
    const container = document.getElementById("recentProducts");

    if (!container) {
        return;
    }

    container.innerHTML = "";

    products.slice(0, 5).forEach(product => {
        const name = getProductName(product);
        const price = getProductPrice(product);
        const image = getProductImage(product);
        const item = document.createElement("div");

        item.className = "recent-product";

        item.innerHTML = `
            <img src="../static/img/${image}" alt="${name}">
            <div class="recent-product-info">
                <h3>${name}</h3>
                <p>${formatPrice(price)}</p>
            </div>
        `;

        container.appendChild(item);
    });
}

function renderInventory() {
    const container = document.getElementById("inventoryGrid");

    if (!container) {
        return;
    }

    container.innerHTML = "";

    products.forEach(product => {
        const name = getProductName(product);
        const stock = getProductStock(product);

        let status = "IN STOCK";

        if (stock === 0) {
            status = "OUT OF STOCK";
        } else if (stock <= 10) {
            status = "LOW STOCK";
        }

        const card = document.createElement("div");

        card.className = "inventory-card";

        card.innerHTML = `
            <h3>${name}</h3>
            <p>${status}</p>
            <div class="inventory-number">${stock}</div>
        `;

        container.appendChild(card);
    });
}

function updateDashboard() {
    const productCount = document.getElementById("productCount");
    const stockCount = document.getElementById("stockCount");
    const orderCount = document.getElementById("orderCount");
    const customerCount = document.getElementById("customerCount");

    if (productCount) {
        productCount.textContent = products.length;
    }

    const totalStock = products.reduce((total, product) => {
        return total + getProductStock(product);
    }, 0);

    if (stockCount) {
        stockCount.textContent = totalStock;
    }

    if (orderCount) {
        orderCount.textContent = orders.length;
    }

    if (customerCount) {
        customerCount.textContent = customers.length;
    }
}

async function loadOrders() {
    try {
        const snapshot = await getDocs(collection(db, "orders"));

        orders = [];

        snapshot.forEach(orderDoc => {
            orders.push({
                id: orderDoc.id,
                ...orderDoc.data()
            });
        });

        orders.sort((a, b) => {
            const dateA = a.createdAt?.seconds || 0;
            const dateB = b.createdAt?.seconds || 0;
            return dateB - dateA;
        });

        renderOrders();
        updateDashboard();
    } catch (error) {
        console.error("Cannot load orders:", error);

        if (orderTableBody) {
            orderTableBody.innerHTML = `
                <tr>
                    <td colspan="7">Cannot load orders.</td>
                </tr>
            `;
        }

        if (orderTotal) {
            orderTotal.textContent = "0 ORDERS";
        }
    }
}

function getOrderDate(order) {
    if (!order.createdAt) {
        return "—";
    }

    if (typeof order.createdAt.toDate === "function") {
        return order.createdAt.toDate().toLocaleString("vi-VN");
    }

    if (order.createdAt.seconds) {
        return new Date(order.createdAt.seconds * 1000).toLocaleString("vi-VN");
    }

    return "—";
}

function renderOrders(list = orders) {
    if (!orderTableBody) {
        return;
    }

    orderTableBody.innerHTML = "";

    if (orderTotal) {
        orderTotal.textContent = `${list.length} ORDERS`;
    }

    if (list.length === 0) {
        orderTableBody.innerHTML = `
            <tr>
                <td colspan="7">No orders found.</td>
            </tr>
        `;
        return;
    }

    list.forEach(order => {
        const customer = order.customer || {};
        const payment = order.paymentMethod || "COD";
        const status = order.status || "PENDING";
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>
                <strong>#${order.id.slice(0, 8).toUpperCase()}</strong>
            </td>
            <td>${customer.name || "Unknown"}</td>
            <td>${customer.phone || "-"}</td>
            <td>${formatPrice(order.total)}</td>
            <td>
                <span class="order-payment">${payment}</span>
            </td>
            <td>
                <select class="order-status-select" data-id="${order.id}">
                    <option value="PENDING" ${status === "PENDING" ? "selected" : ""}>PENDING</option>
                    <option value="PROCESSING" ${status === "PROCESSING" ? "selected" : ""}>PROCESSING</option>
                    <option value="SHIPPED" ${status === "SHIPPED" ? "selected" : ""}>SHIPPED</option>
                    <option value="DELIVERED" ${status === "DELIVERED" ? "selected" : ""}>DELIVERED</option>
                    <option value="CANCELLED" ${status === "CANCELLED" ? "selected" : ""}>CANCELLED</option>
                </select>
            </td>
            <td>
                <button class="view-order" data-id="${order.id}">VIEW</button>
            </td>
        `;

        row.querySelector(".view-order").addEventListener("click", () => {
            openOrderModal(order.id);
        });

        row.querySelector(".order-status-select").addEventListener("change", event => {
            updateOrderStatus(order.id, event.target.value);
        });

        orderTableBody.appendChild(row);
    });
}

async function updateOrderStatus(orderId, newStatus) {
    try {
        await updateDoc(doc(db, "orders", orderId), {
            status: newStatus,
            updatedAt: serverTimestamp()
        });

        const order = orders.find(item => item.id === orderId);

        if (order) {
            order.status = newStatus;
        }

        renderOrders();
        alert(`Order status changed to ${newStatus}.`);
    } catch (error) {
        console.error("Cannot update order:", error);
        alert("Cannot update order status.");
        await loadOrders();
    }
}

function openOrderModal(orderId) {
    if (!orderDetailContent || !orderModal) {
        return;
    }

    const order = orders.find(item => item.id === orderId);

    if (!order) {
        return;
    }

    const customer = order.customer || {};
    const items = order.items || [];

    orderDetailContent.innerHTML = `
        <div class="order-detail">
            <div class="order-detail-top">
                <div>
                    <p>ORDER</p>
                    <h3>#${order.id.toUpperCase()}</h3>
                    <small>${getOrderDate(order)}</small>
                </div>
                <span class="order-detail-status">${order.status || "PENDING"}</span>
            </div>
            <div class="order-detail-section">
                <p class="order-detail-label">CUSTOMER</p>
                <h3>${customer.name || "-"}</h3>
                <p>${customer.phone || "-"}</p>
                <p>${customer.address || "-"}</p>
            </div>
            <div class="order-detail-section">
                <p class="order-detail-label">PAYMENT</p>
                <p>METHOD: <strong>${order.paymentMethod || "COD"}</strong></p>
                <p>STATUS: <strong>${order.paymentStatus || "PENDING"}</strong></p>
            </div>
            <div class="order-detail-section">
                <p class="order-detail-label">ITEMS</p>
                ${items.length > 0 ? items.map(item => `
                    <div class="order-detail-item">
                        <div>
                            <strong>${item.name || "Product"}</strong>
                            <span>Size: ${item.size || "N/A"}</span>
                            <span>Quantity: ${item.quantity || 0}</span>
                        </div>
                        <strong>${formatPrice(Number(item.price || 0) * Number(item.quantity || 0))}</strong>
                    </div>
                `).join("") : "<p>No items.</p>"}
            </div>
            <div class="order-detail-total">
                <span>TOTAL</span>
                <strong>${formatPrice(order.total)}</strong>
            </div>
            ${order.note ? `
                <div class="order-detail-section">
                    <p class="order-detail-label">NOTE</p>
                    <p>${order.note}</p>
                </div>
            ` : ""}
        </div>
    `;

    orderModal.classList.add("active");
}

async function loadCustomers() {
    try {
        const snapshot = await getDocs(collection(db, "user"));

        customers = [];

        snapshot.forEach(userDoc => {
            const data = userDoc.data();

            if (data.roleId !== "admin") {
                customers.push({
                    id: userDoc.id,
                    ...data
                });
            }
        });

        renderCustomers();
        updateDashboard();
    } catch (error) {
        console.error("Cannot load customers:", error);

        if (customerTableBody) {
            customerTableBody.innerHTML = `
                <tr>
                    <td colspan="5">Cannot load customers.</td>
                </tr>
            `;
        }

        if (customerTotal) {
            customerTotal.textContent = "0 CUSTOMERS";
        }
    }
}

function getCustomerName(customer) {
    return customer.name || customer.displayName || customer.fullName || "";
}

function getCustomerEmail(customer) {
    return customer.email || "";
}

function getCustomerPhone(customer) {
    return customer.phone || customer.phoneNumber || "";
}

function getCustomerRole(customer) {
    const role = String(customer.roleId || customer.role || "user").toLowerCase();

    if (role === "admin") {
        return "ADMIN";
    }

    return "CUSTOMER";
}

function renderCustomers(list = customers) {
    if (!customerTableBody) {
        return;
    }

    customerTableBody.innerHTML = "";

    if (customerTotal) {
        customerTotal.textContent = `${list.length} CUSTOMERS`;
    }

    if (list.length === 0) {
        customerTableBody.innerHTML = `
            <tr>
                <td colspan="5">No customers found.</td>
            </tr>
        `;
        return;
    }

    list.forEach(customer => {
        const name = getCustomerName(customer);
        const email = getCustomerEmail(customer);
        const phone = getCustomerPhone(customer);
        const role = getCustomerRole(customer);

        const displayName = name || email || "Unknown";
        const displayEmail = email || "—";
        const displayPhone = phone || "—";

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>
                <strong>${displayName}</strong>
            </td>
            <td>${displayEmail}</td>
            <td>${displayPhone}</td>
            <td>${role}</td>
            <td>ACTIVE</td>
        `;

        customerTableBody.appendChild(row);
    });
}

function openAddProduct() {
    editingProductId = null;
    addProductForm.reset();
    modalTitle.textContent = "ADD PRODUCT";
    saveProductBtn.textContent = "ADD PRODUCT";
    addProductMessage.textContent = "";
    productModal.classList.add("active");
}

function openEditProduct(productId) {
    const product = products.find(item => item.id === productId);

    if (!product) {
        alert("Product not found.");
        return;
    }

    editingProductId = productId;

    document.getElementById("productName").value = getProductName(product);
    document.getElementById("productCategory").value = getProductCategory(product);
    document.getElementById("productPrice").value = getProductPrice(product);
    document.getElementById("productStock").value = getProductStock(product);
    document.getElementById("productSize").value = getProductSize(product);
    document.getElementById("productColor").value = getProductColor(product);
    document.getElementById("productImage").value = getProductImage(product);
    document.getElementById("productDescription").value = getProductDescription(product);

    modalTitle.textContent = "EDIT PRODUCT";
    saveProductBtn.textContent = "SAVE CHANGES";
    addProductMessage.textContent = "";
    productModal.classList.add("active");
}

function closeModal() {
    productModal.classList.remove("active");
    editingProductId = null;
    addProductForm.reset();
    addProductMessage.textContent = "";
    modalTitle.textContent = "ADD PRODUCT";
    saveProductBtn.textContent = "ADD PRODUCT";
}

async function saveProduct(event) {
    event.preventDefault();

    const currentUser = auth.currentUser;

    if (!currentUser) {
        addProductMessage.textContent = "Please sign in before managing products.";
        return;
    }

    const name = document.getElementById("productName").value.trim();
    const category = document.getElementById("productCategory").value.trim();
    const price = Number(document.getElementById("productPrice").value);
    const stock = Number(document.getElementById("productStock").value);
    const size = document.getElementById("productSize").value.trim();
    const color = document.getElementById("productColor").value.trim();
    const image = document.getElementById("productImage").value.trim();
    const description = document.getElementById("productDescription").value.trim();

    if (!name || !category || !image) {
        addProductMessage.textContent = "Please fill in all required fields.";
        return;
    }

    if (price < 0 || stock < 0) {
        addProductMessage.textContent = "Price and stock cannot be negative.";
        return;
    }

    const productData = {
        name,
        category,
        price,
        stock,
        size,
        color,
        image,
        description
    };

    try {
        saveProductBtn.disabled = true;

        if (editingProductId) {
            await updateDoc(doc(db, "products", editingProductId), productData);
            addProductMessage.textContent = "Product updated successfully.";
        } else {
            await addDoc(collection(db, "products"), productData);
            addProductMessage.textContent = "Product added successfully.";
        }

        await loadProducts();

        setTimeout(() => {
            closeModal();
        }, 700);
    } catch (error) {
        console.error("Firestore error:", error);

        if (error.code === "permission-denied") {
            addProductMessage.textContent = "Permission denied. Please sign in again.";
        } else {
            addProductMessage.textContent = "Cannot save product. Please try again.";
        }
    } finally {
        saveProductBtn.disabled = false;
    }
}

async function deleteProduct(productId) {
    const currentUser = auth.currentUser;

    if (!currentUser) {
        alert("Please sign in before deleting products.");
        return;
    }

    const product = products.find(item => item.id === productId);

    if (!product) {
        alert("Product not found.");
        return;
    }

    const productName = getProductName(product);

    if (!confirm(`Delete "${productName}"?`)) {
        return;
    }

    try {
        await deleteDoc(doc(db, "products", productId));
        await loadProducts();
        alert("Product deleted successfully.");
    } catch (error) {
        console.error("Delete error:", error);

        if (error.code === "permission-denied") {
            alert("Permission denied. Please sign in again.");
        } else {
            alert("Cannot delete product.");
        }
    }
}

if (productSearch) {
    productSearch.addEventListener("input", () => {
        const keyword = productSearch.value.trim().toLowerCase();

        const filtered = products.filter(product => {
            const name = getProductName(product).toLowerCase();
            const category = getProductCategory(product).toLowerCase();
            const color = getProductColor(product).toLowerCase();

            return name.includes(keyword) || category.includes(keyword) || color.includes(keyword);
        });

        renderProducts(filtered);
    });
}

if (orderSearch) {
    orderSearch.addEventListener("input", () => {
        const keyword = orderSearch.value.trim().toLowerCase();

        const filtered = orders.filter(order => {
            const customer = order.customer || {};
            const orderId = order.id.toLowerCase();
            const name = String(customer.name || "").toLowerCase();
            const phone = String(customer.phone || "").toLowerCase();
            const payment = String(order.paymentMethod || "").toLowerCase();
            const status = String(order.status || "").toLowerCase();

            return orderId.includes(keyword) || name.includes(keyword) || phone.includes(keyword) || payment.includes(keyword) || status.includes(keyword);
        });

        renderOrders(filtered);
    });
}

if (customerSearch) {
    customerSearch.addEventListener("input", () => {
        const keyword = customerSearch.value.trim().toLowerCase();

        const filtered = customers.filter(customer => {
            const name = getCustomerName(customer).toLowerCase();
            const email = getCustomerEmail(customer).toLowerCase();
            const phone = getCustomerPhone(customer).toLowerCase();

            return name.includes(keyword) || email.includes(keyword) || phone.includes(keyword);
        });

        renderCustomers(filtered);
    });
}

if (addProductBtn) {
    addProductBtn.addEventListener("click", openAddProduct);
}

if (closeProductModal) {
    closeProductModal.addEventListener("click", closeModal);
}

if (cancelProductBtn) {
    cancelProductBtn.addEventListener("click", closeModal);
}

if (addProductForm) {
    addProductForm.addEventListener("submit", saveProduct);
}

if (productModal) {
    productModal.addEventListener("click", event => {
        if (event.target === productModal) {
            closeModal();
        }
    });
}

if (closeOrderModal) {
    closeOrderModal.addEventListener("click", () => {
        orderModal.classList.remove("active");
    });
}

if (orderModal) {
    orderModal.addEventListener("click", event => {
        if (event.target === orderModal) {
            orderModal.classList.remove("active");
        }
    });
}

if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
        try {
            await auth.signOut();
            window.location.href = "./index.html";
        } catch (error) {
            console.error("Logout error:", error);
        }
    });
}

onAuthStateChanged(auth, async user => {
    if (!user) {
        window.location.href = "./admin.login.html";
        return;
    }

    try {
        const userDoc = await getDoc(doc(db, "user", user.uid));

        if (!userDoc.exists()) {
            await auth.signOut();
            window.location.href = "./admin.login.html";
            return;
        }

        const userData = userDoc.data();

        if (userData.roleId !== "admin") {
            alert("Access denied. Admin account required.");
            await auth.signOut();
            window.location.href = "./admin.login.html";
            return;
        }

        console.log("Admin authenticated:", user.email);

        await loadProducts();
        await loadOrders();
        await loadCustomers();
    } catch (error) {
        console.error("Admin authentication error:", error);

        alert("Unable to verify administrator permissions.");

        await auth.signOut();
        window.location.href = "./admin.login.html";
    }
});