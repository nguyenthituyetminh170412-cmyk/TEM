// IMPORT FIREBASE FIRESTORE
// Các hàm dùng để lấy, thêm, sửa, xóa và cập nhật dữ liệu trong Firestore
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
// IMPORT FIREBASE AUTHENTICATION
// Dùng để kiểm tra trạng thái đăng nhập của tài khoản
import {
    getAuth,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
const auth = getAuth(); // lấy hệ thống Authentication hiện tại
// LẤY CÁC PHẦN TỬ HTML CẦN DÙNG
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
// BIẾN DỮ LIỆU DÙNG CHUNG
// Lưu sản phẩm, đơn hàng, khách hàng và ID sản phẩm đang chỉnh sửa
let products = [];
let orders = [];
let customers = [];
let editingProductId = null; // null = đang thêm sản phẩm mới
// TÊN CÁC SECTION
// Dùng object để liên kết tên section với tiêu đề hiển thị trên trang
const sectionTitles = {
    dashboard: "Dashboard",
    products: "Products",
    orders: "Orders",
    customers: "Customers",
    inventory: "Inventory"
};
// CHUYỂN GIỮA CÁC SECTION
// Hiện đúng section được chọn và đổi tiêu đề trang
function showSection(sectionName) {
    menuItems.forEach(item => {
        item.classList.toggle("active", item.dataset.section === sectionName); // bật/tắt class active
    });
    sections.forEach(section => {
        section.classList.remove("active-section"); // ẩn trạng thái active của các section cũ
    });
    const section = document.getElementById(`${sectionName}Section`); // tạo ID từ tên section
    if (section) {
        section.classList.add("active-section");
    }
    pageTitle.textContent = sectionTitles[sectionName] || "Dashboard"; // lấy tiêu đề tương ứng
}
// XỬ LÝ MENU ADMIN
// Khi click menu thì chuyển sang section tương ứng
menuItems.forEach(item => {
    item.addEventListener("click", event => {
        event.preventDefault(); // ngăn hành động mặc định của link
        showSection(item.dataset.section);
    });
});
// XỬ LÝ CÁC BUTTON CÓ DATA-SECTION
// Cho phép các button khác cũng chuyển section
document.querySelectorAll("[data-section]").forEach(button => {
    if (!button.classList.contains("admin-menu-item")) {
        button.addEventListener("click", () => {
            showSection(button.dataset.section);
        });
    }
});
// HÀM LẤY THÔNG TIN SẢN PHẨM
// Các hàm này giúp lấy dữ liệu an toàn và xử lý trường hợp key có khoảng trắng thừa
function getProductName(product) {
    return product.name || product["name "] || "Unnamed Product"; // thử key name trước rồi đến key có khoảng trắng
}
function getProductPrice(product) {
    return Number(product.price || product["price "] || 0); // Number() chuyển dữ liệu thành kiểu số
}
function getProductImage(product) {
    return product.image || "";
}
function getProductCategory(product) {
    return product.category || "UNCATEGORIZED";
}
function getProductSize(product) {
    return product.size || product["size "] || ""; // hỗ trợ key size có khoảng trắng
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
// ĐỊNH DẠNG GIÁ
// Chuyển số thành dạng có dấu phân cách hàng nghìn và thêm VND
function formatPrice(price) {
    return Number(price || 0).toLocaleString("en-US") + " VND"; // toLocaleString() định dạng số
}
// LOAD SẢN PHẨM TỪ FIRESTORE
// Lấy toàn bộ dữ liệu trong collection products rồi lưu vào mảng products
async function loadProducts() {
    try {
        const snapshot = await getDocs(collection(db, "products")); // lấy toàn bộ document trong products
        products = [];
        snapshot.forEach(productDoc => {
            products.push({
                id: productDoc.id, // ID document của Firestore
                ...productDoc.data() // ... lấy toàn bộ dữ liệu trong document
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
// HIỂN THỊ DANH SÁCH SẢN PHẨM
// Đưa dữ liệu products vào bảng quản trị
function renderProducts(list = products) {
    const tbody = document.getElementById("productTableBody");
    const total = document.getElementById("productTotal");
    if (!tbody || !total) {
        return; // dừng nếu HTML không có phần tử cần thiết
    }
    total.textContent = `${list.length} PRODUCTS`; // hiển thị tổng số sản phẩm
    tbody.innerHTML = ""; // xóa bảng cũ trước khi render
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
        const row = document.createElement("tr"); // tạo một hàng mới
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
                <div style="display:flex;gap:8px;align-items:center;"> <!-- flex để các nút nằm cùng hàng -->
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
        tbody.appendChild(row); // thêm hàng vào bảng
    });
}
// HIỂN THỊ SẢN PHẨM GẦN ĐÂY
// Chỉ lấy 5 sản phẩm đầu tiên để hiển thị ở Dashboard
function renderRecentProducts() {
    const container = document.getElementById("recentProducts");
    if (!container) {
        return;
    }
    container.innerHTML = "";
    products.slice(0, 5).forEach(product => { // slice(0,5) lấy 5 phần tử đầu
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
// HIỂN THỊ KHO HÀNG
// Kiểm tra số lượng tồn kho và hiển thị trạng thái
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
// CẬP NHẬT DASHBOARD
// Tính tổng sản phẩm, tổng tồn kho, đơn hàng và khách hàng
function updateDashboard() {
    const productCount = document.getElementById("productCount");
    const stockCount = document.getElementById("stockCount");
    const orderCount = document.getElementById("orderCount");
    const customerCount = document.getElementById("customerCount");
    if (productCount) {
        productCount.textContent = products.length;
    }
    const totalStock = products.reduce((total, product) => { // reduce() dùng để cộng dồn dữ liệu
        return total + getProductStock(product);
    }, 0); // 0 là giá trị ban đầu
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
// LOAD ĐƠN HÀNG
// Lấy đơn hàng từ Firestore và sắp xếp đơn mới nhất lên đầu
async function loadOrders() {
    try {
        const snapshot = await getDocs(collection(db, "orders")); // lấy collection orders
        orders = [];
        snapshot.forEach(orderDoc => {
            orders.push({
                id: orderDoc.id,
                ...orderDoc.data()
            });
        });
        orders.sort((a, b) => { // sort() sắp xếp mảng
            const dateA = a.createdAt?.seconds || 0; // ?. tránh lỗi nếu createdAt không tồn tại
            const dateB = b.createdAt?.seconds || 0;
            return dateB - dateA; // số lớn hơn = thời gian mới hơn
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
// LẤY NGÀY ĐẶT HÀNG
// Chuyển Timestamp của Firestore thành ngày giờ dễ đọc
function getOrderDate(order) {
    if (!order.createdAt) {
        return "—";
    }
    if (typeof order.createdAt.toDate === "function") { // kiểm tra toDate có phải function không
        return order.createdAt.toDate().toLocaleString("vi-VN"); // đổi Timestamp thành ngày giờ Việt Nam
    }
    if (order.createdAt.seconds) {
        return new Date(order.createdAt.seconds * 1000).toLocaleString("vi-VN"); // đổi timestamp sang Date
    }
    return "—";
}
// HIỂN THỊ DANH SÁCH ĐƠN HÀNG
// Tạo bảng Orders và cho phép đổi trạng thái đơn hàng
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
                <strong>#${order.id.slice(0, 8).toUpperCase()}</strong> <!-- slice lấy 8 ký tự đầu -->
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
            updateOrderStatus(order.id, event.target.value); // event.target = phần tử vừa thay đổi
        });
        orderTableBody.appendChild(row);
    });
}
// CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG
// Sửa status trong Firestore và cập nhật lại giao diện
async function updateOrderStatus(orderId, newStatus) {
    try {
        await updateDoc(doc(db, "orders", orderId), { // updateDoc() cập nhật document cụ thể
            status: newStatus,
            updatedAt: serverTimestamp() // lấy thời gian hiện tại từ server
        });
        const order = orders.find(item => item.id === orderId); // find() tìm phần tử đầu tiên phù hợp
        if (order) {
            order.status = newStatus;
        }
        renderOrders();
        alert(`Order status changed to ${newStatus}.`);
    } catch (error) {
        console.error("Cannot update order:", error);
        alert("Cannot update order status.");
        await loadOrders(); // load lại dữ liệu nếu cập nhật thất bại
    }
}
// HIỂN THỊ CHI TIẾT ĐƠN HÀNG
// Mở modal và hiển thị toàn bộ thông tin của đơn hàng
function openOrderModal(orderId) {
    if (!orderDetailContent || !orderModal) {
        return;
    }
    const order = orders.find(item => item.id === orderId); // tìm đơn hàng theo ID
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
                `).join("") : "<p>No items.</p>"} <!-- map tạo HTML cho từng item, join() gộp lại -->
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
            ` : ""} <!-- chỉ hiển thị NOTE nếu order.note có dữ liệu -->
        </div>
    `;
    orderModal.classList.add("active"); // thêm class active để CSS hiện modal
}
// LOAD KHÁCH HÀNG
// Lấy dữ liệu từ collection user và loại tài khoản admin
async function loadCustomers() {
    try {
        const snapshot = await getDocs(collection(db, "user")); // lấy collection user
        customers = [];
        snapshot.forEach(userDoc => {
            const data = userDoc.data();
            if (data.roleId !== "admin") { // bỏ tài khoản admin khỏi danh sách khách hàng
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
// LẤY THÔNG TIN KHÁCH HÀNG
function getCustomerName(customer) {
    return customer.name || customer.displayName || customer.fullName || ""; // thử nhiều field tên khác nhau
}
function getCustomerEmail(customer) {
    return customer.email || "";
}
function getCustomerPhone(customer) {
    return customer.phone || customer.phoneNumber || ""; // hỗ trợ 2 tên field
}
function getCustomerRole(customer) {
    const role = String(customer.roleId || customer.role || "user").toLowerCase(); // chuyển role về chữ thường
    if (role === "admin") {
        return "ADMIN";
    }
    return "CUSTOMER";
}
// HIỂN THỊ DANH SÁCH KHÁCH HÀNG
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
        const displayName = name || email || "Unknown"; // không có tên thì dùng email
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
// MỞ FORM THÊM SẢN PHẨM
function openAddProduct() {
    editingProductId = null; // null = thêm mới, không phải chỉnh sửa
    addProductForm.reset(); // reset() xóa dữ liệu trong form
    modalTitle.textContent = "ADD PRODUCT";
    saveProductBtn.textContent = "ADD PRODUCT";
    addProductMessage.textContent = "";
    productModal.classList.add("active"); // thêm active để hiện modal
}
// MỞ FORM CHỈNH SỬA SẢN PHẨM
function openEditProduct(productId) {
    const product = products.find(item => item.id === productId); // tìm sản phẩm theo ID
    if (!product) {
        alert("Product not found.");
        return;
    }
    editingProductId = productId; // lưu ID sản phẩm đang sửa
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
// ĐÓNG MODAL SẢN PHẨM
function closeModal() {
    productModal.classList.remove("active"); // xóa active để CSS ẩn modal
    editingProductId = null;
    addProductForm.reset();
    addProductMessage.textContent = "";
    modalTitle.textContent = "ADD PRODUCT";
    saveProductBtn.textContent = "ADD PRODUCT";
}
// THÊM / SỬA SẢN PHẨM TRÊN FIRESTORE
// Nếu có editingProductId thì sửa, nếu không thì thêm mới
async function saveProduct(event) {
    event.preventDefault(); // ngăn form reload trang
    const currentUser = auth.currentUser; // lấy tài khoản đang đăng nhập
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
    if (!name || !category || !image) { // kiểm tra các field bắt buộc
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
        saveProductBtn.disabled = true; // khóa nút để tránh bấm nhiều lần
        if (editingProductId) {
            await updateDoc(doc(db, "products", editingProductId), productData); // có ID = sửa document
            addProductMessage.textContent = "Product updated successfully.";
        } else {
            await addDoc(collection(db, "products"), productData); // không có ID = tạo document mới
            addProductMessage.textContent = "Product added successfully.";
        }
        await loadProducts(); // load lại sản phẩm sau khi lưu
        setTimeout(() => { // trì hoãn 700ms
            closeModal();
        }, 700);
    } catch (error) {
        console.error("Firestore error:", error);
        if (error.code === "permission-denied") { // kiểm tra lỗi không có quyền Firestore
            addProductMessage.textContent = "Permission denied. Please sign in again.";
        } else {
            addProductMessage.textContent = "Cannot save product. Please try again.";
        }
    } finally {
        saveProductBtn.disabled = false; // luôn mở lại nút dù thành công hay thất bại
    }
}
// XÓA SẢN PHẨM
// Xác nhận trước rồi xóa document khỏi Firestore
async function deleteProduct(productId) {
    const currentUser = auth.currentUser;
    if (!currentUser) {
        alert("Please sign in before deleting products.");
        return;
    }
    const product = products.find(item => item.id === productId); // tìm sản phẩm theo ID
    if (!product) {
        alert("Product not found.");
        return;
    }
    const productName = getProductName(product);
    if (!confirm(`Delete "${productName}"?`)) { // confirm() tạo hộp thoại xác nhận
        return;
    }
    try {
        await deleteDoc(doc(db, "products", productId)); // xóa document theo ID
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
// TÌM KIẾM SẢN PHẨM
// Lọc sản phẩm theo tên, category hoặc màu
if (productSearch) {
    productSearch.addEventListener("input", () => { // chạy mỗi khi người dùng nhập
        const keyword = productSearch.value.trim().toLowerCase();
        const filtered = products.filter(product => { // filter() tạo mảng mới chứa phần tử phù hợp
            const name = getProductName(product).toLowerCase();
            const category = getProductCategory(product).toLowerCase();
            const color = getProductColor(product).toLowerCase();
            return name.includes(keyword) || category.includes(keyword) || color.includes(keyword); // includes() kiểm tra chuỗi có chứa keyword
        });
        renderProducts(filtered);
    });
}
// TÌM KIẾM ĐƠN HÀNG
// Lọc theo ID, tên khách hàng, số điện thoại, phương thức thanh toán hoặc trạng thái
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
// TÌM KIẾM KHÁCH HÀNG
// Lọc theo tên, email hoặc số điện thoại
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
// NÚT THÊM SẢN PHẨM
if (addProductBtn) {
    addProductBtn.addEventListener("click", openAddProduct);
}
// NÚT ĐÓNG MODAL SẢN PHẨM
if (closeProductModal) {
    closeProductModal.addEventListener("click", closeModal);
}
// NÚT HỦY
if (cancelProductBtn) {
    cancelProductBtn.addEventListener("click", closeModal);
}
// SUBMIT FORM SẢN PHẨM
if (addProductForm) {
    addProductForm.addEventListener("submit", saveProduct); // submit form sẽ chạy saveProduct()
}
// ĐÓNG MODAL KHI CLICK RA BÊN NGOÀI
if (productModal) {
    productModal.addEventListener("click", event => {
        if (event.target === productModal) { // chỉ đóng khi click đúng phần nền modal
            closeModal();
        }
    });
}
// ĐÓNG ORDER MODAL
if (closeOrderModal) {
    closeOrderModal.addEventListener("click", () => {
        orderModal.classList.remove("active");
    });
}
// ĐÓNG ORDER MODAL KHI CLICK RA NGOÀI
if (orderModal) {
    orderModal.addEventListener("click", event => {
        if (event.target === orderModal) { // kiểm tra click có nằm ở nền modal không
            orderModal.classList.remove("active");
        }
    });
}
// ĐĂNG XUẤT
// Đăng xuất Firebase rồi chuyển về trang chính
if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
        try {
            await auth.signOut(); // đăng xuất tài khoản hiện tại
            window.location.href = "./index.html"; // chuyển trang
        } catch (error) {
            console.error("Logout error:", error);
        }
    });
}
// KIỂM TRA ĐĂNG NHẬP VÀ QUYỀN ADMIN
// onAuthStateChanged() tự chạy khi trạng thái đăng nhập thay đổi
onAuthStateChanged(auth, async user => {
    if (!user) {
        window.location.href = "./admin.login.html"; // chưa đăng nhập = về trang login
        return;
    }
    try {
        const userDoc = await getDoc(doc(db, "user", user.uid)); // lấy document user theo UID
        if (!userDoc.exists()) { // kiểm tra document có tồn tại không
            await auth.signOut();
            window.location.href = "./admin.login.html";
            return;
        }
        const userData = userDoc.data();
        if (userData.roleId !== "admin") { // chỉ tài khoản có roleId = admin mới được vào
            alert("Access denied. Admin account required.");
            await auth.signOut();
            window.location.href = "./admin.login.html";
            return;
        }
        console.log("Admin authenticated:", user.email);
        // LOAD TOÀN BỘ DỮ LIỆU ADMIN
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