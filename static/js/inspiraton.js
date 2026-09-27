const inspirationQuote = document.getElementById("inspirationQuote");
const inspirationAuthor = document.getElementById("inspirationAuthor");
const inspireBtn = document.getElementById("inspireBtn");

async function getInspiration() {
    try {
        inspireBtn.disabled = true;
        inspireBtn.textContent = "LOADING...";
        inspirationQuote.textContent = "Finding your inspiration...";
        inspirationAuthor.textContent = "";
        const response = await fetch("https://www.drivebird.com/api/quotes/random");
        if (!response.ok) {
            throw new Error("API request failed");
        }
        const data = await response.json();
        const quoteData = data.data[0];
        inspirationQuote.textContent = `"${quoteData.quote}"`;
        inspirationAuthor.textContent = `— ${quoteData.author || "Unknown"}`;
    } catch (error) {
        console.error("Inspiration API error:", error);
        inspirationQuote.textContent = "Style begins with the confidence to be yourself.";
        inspirationAuthor.textContent = "— TÉM";
    } finally {
        inspireBtn.disabled = false;
        inspireBtn.textContent = "✦ INSPIRE ME";
    }
}

inspireBtn.addEventListener("click", getInspiration);
getInspiration();