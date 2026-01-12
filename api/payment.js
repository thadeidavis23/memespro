/**
 * Vercel Serverless Function: Payment Processing
 * This function securely handles payment transactions using the FastLipa API
 * The API key is read from environment variables (not exposed to frontend)
 */

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { phone, amount, name } = req.body;

  // Validate input - all fields required per FastLipa API
  if (!phone || !amount || !name) {
    return res.status(400).json({ 
      error: "Phone number, amount, and recipient name are all required" 
    });
  }

  // Validate phone format
  if (typeof phone !== "string" || phone.trim().length < 9) {
    return res.status(400).json({ error: "Invalid phone number format" });
  }

  // Validate amount - must be positive integer (in smallest currency unit)
  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount <= 0 || !Number.isInteger(numAmount)) {
    return res.status(400).json({ error: "Amount must be a positive integer" });
  }

  // Validate name
  if (typeof name !== "string" || name.trim().length < 2) {
    return res.status(400).json({ error: "Recipient name must be at least 2 characters" });
  }

  // Get API key from environment variable
  const apiKey = process.env.FASTLIPA_API_KEY;

  if (!apiKey) {
    console.error("FASTLIPA_API_KEY environment variable is not set");
    return res.status(500).json({ error: "Payment service not configured" });
  }

  try {
    console.log("Processing transaction:", { phone, amount, name });

    // Call FastLipa API
    const response = await fetch("https://api.fastlipa.com/api/create-transaction", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        number: phone.trim(),
        amount: numAmount,
        name: name.trim()
      })
    });

    const data = await response.json();

    // Log response for debugging
    console.log("FastLipa response status:", response.status);
    console.log("FastLipa response data:", data);

    // Handle API response
    if (!response.ok) {
      console.error("FastLipa API error:", data);
      return res.status(response.status).json({
        status: "error",
        message: data.message || data.error || "Payment processing failed",
        details: data
      });
    }

    // Return success response
    return res.status(200).json({
      status: "success",
      message: "Transaction created successfully",
      data: data
    });
  } catch (error) {
    console.error("Payment processing error:", error.message);
    return res.status(500).json({
      status: "error",
      message: "Internal server error: " + error.message
    });
  }
}
