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

  const { phone, amount } = req.body;

  // Validate input
  if (!phone || !amount) {
    return res.status(400).json({ error: "Phone and amount are required" });
  }

  if (isNaN(amount) || amount <= 0) {
    return res.status(400).json({ error: "Amount must be a positive number" });
  }

  // Get API key from environment variable
  const apiKey = process.env.FASTLIPA_API_KEY;

  if (!apiKey) {
    console.error("FASTLIPA_API_KEY environment variable is not set");
    return res.status(500).json({ error: "Payment service not configured" });
  }

  try {
    // Call FastLipa API
    const response = await fetch("https://api.fastlipa.com/api/create-transaction", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        number: phone,
        amount: amount,
        name: "Memes Channel Donation"
      })
    });

    const data = await response.json();

    // Handle API response
    if (!response.ok) {
      console.error("FastLipa API error:", data);
      return res.status(response.status).json({
        status: "error",
        message: data.message || "Payment processing failed"
      });
    }

    // Return success response
    return res.status(200).json({
      status: "success",
      data: data
    });
  } catch (error) {
    console.error("Payment processing error:", error);
    return res.status(500).json({
      status: "error",
      message: "Internal server error: " + error.message
    });
  }
}
