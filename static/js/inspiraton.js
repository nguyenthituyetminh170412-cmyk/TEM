const inspirationQuote = document.getElementById("inspirationQuote");
const inspirationAuthor = document.getElementById("inspirationAuthor");
const inspireBtn = document.getElementById("inspireBtn");

// Hàm lấy câu quote từ API
async function getInspiration() {
    try {
        // Khóa nút và hiển thị trạng thái đang tải
        inspireBtn.disabled = true;
        inspireBtn.textContent = "LOADING...";
        inspirationQuote.textContent = "Finding your inspiration...";
        inspirationAuthor.textContent = "";
        // Gửi request đến API
        const response = await fetch("https://www.drivebird.com/api/quotes/random");
        // Kiểm tra API có trả về thành công không
        if (!response.ok) {
            throw new Error("API request failed");
        }
        // Chuyển dữ liệu API sang JSON
        const data = await response.json();
        // Lấy quote đầu tiên trong dữ liệu trả về
        const quoteData = data.data[0];
        // Hiển thị quote và tác giả
        inspirationQuote.textContent = `"${quoteData.quote}"`;
        inspirationAuthor.textContent = `— ${quoteData.author || "Unknown"}`;
    } catch (error) {
        // Nếu API lỗi thì hiển thị quote dự phòng
        console.error("Inspiration API error:", error);
        inspirationQuote.textContent = "Style begins with the confidence to be yourself.";
        inspirationAuthor.textContent = "— TÉM";
    } finally {
        // Mở lại nút và khôi phục nội dung
        inspireBtn.disabled = false;
        inspireBtn.textContent = "✦ INSPIRE ME";
    }
}
// Bấm nút để gọi API lấy quote mới
inspireBtn.addEventListener("click", getInspiration);
// Tự động lấy quote khi mở trang
getInspiration();