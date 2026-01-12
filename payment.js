// Payment module - handles all donation/payment transactions
const PaymentModule = {
  // Use internal API route (Vercel Serverless Function)
  API_ENDPOINT: "/api/payment",

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
    const phone = document.getElementById("phone").value;
    const amount = document.getElementById("amount").value;
    const name = document.getElementById("name")?.value || "Donor";

    if (!phone || !amount) {
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

    try {
      const response = await fetch(this.API_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          phone: phone,
          amount: parseInt(amount),
          name: name
        })
      });

      const data = await response.json();
      console.log("Payment response:", data);

      if (data.status === "success") {
        document.body.innerHTML = document.getElementById("thankyou").outerHTML;
      } else {
        alert("Transaction failed: " + (data.message || data.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Payment error:", error);
      alert("Network error: " + error.message);
    }
  }
};

// Export for use
if (typeof module !== "undefined" && module.exports) {
  module.exports = PaymentModule;
}
