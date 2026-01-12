// Payment module - handles all donation/payment transactions
const PaymentModule = {
  // Use internal API route (Vercel Serverless Function)
  API_ENDPOINT: "/api/payment",
  isProcessing: false,

  // Open modal for donation
  openModal(type) {
    const title = type === "challenge" 
      ? "Donate for Challenge" 
      : "Donate for Channel";
    
    document.getElementById("modalTitle").innerText = title;
    document.getElementById("modal").style.display = "flex";
  },

  // Process donation payment
  async donate() {
    // Prevent multiple submissions
    if (this.isProcessing) {
      console.warn("Payment already processing, please wait...");
      return;
    }

    const phone = document.getElementById("phone").value.trim();
    const amount = document.getElementById("amount").value.trim();
    const name = document.getElementById("name")?.value.trim() || "Donor";

    if (!phone || !amount || !name) {
      alert("Fill all required fields");
      return;
    }

    // Validate phone format
    if (phone.length < 9) {
      alert("Invalid phone number");
      return;
    }

    // Validate amount
    if (isNaN(amount) || amount <= 0) {
      alert("Amount must be a positive number");
      return;
    }

    this.isProcessing = true;
    const submitBtn = event?.target;
    const originalText = submitBtn?.innerText;

    try {
      // Show loading state
      if (submitBtn) {
        submitBtn.innerText = "Processing";
        submitBtn.disabled = true;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      const response = await fetch(this.API_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          phone: phone,
          amount: parseInt(amount),
          name: name
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok && response.status !== 200) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log("Payment response:", data);

      if (data.status === "success") {
        // Close modal first
        document.getElementById("modal").style.display = "none";
        
        // Clear form
        document.getElementById("phone").value = "";
        document.getElementById("amount").value = "";
        document.getElementById("name").value = "";
        
        // Show thank you message
        const thankYou = document.getElementById("thankyou");
        if (thankYou) {
          thankYou.style.display = "block";
          thankYou.scrollIntoView({ behavior: "smooth" });
        }
      } else {
        alert("Transaction failed: " + (data.message || data.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Payment error:", error);
      if (error.name === "AbortError") {
        alert("❌ Request timeout - try again");
      } else {
        alert("❌ Network error: " + error.message);
      }
    } finally {
      // Reset loading state
      this.isProcessing = false;
      if (submitBtn) {
        submitBtn.innerText = originalText || "Proceed";
        submitBtn.disabled = false;
      }
    }
  }
};

// Export for use
if (typeof module !== "undefined" && module.exports) {
  module.exports = PaymentModule;
}
