// Netlify Function to handle order verification/rejection from email
const { createClient } = require('@sanity/client');

const sanityClient = createClient({
  projectId: process.env.VITE_SANITY_PROJECT_ID,
  dataset: process.env.VITE_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_WRITE_TOKEN, // Need write token for mutations
  useCdn: false,
});

// Simple token validation (order ID + secret = token)
const SECRET_KEY = process.env.ORDER_ACTION_SECRET || 'shuzee-order-secret-2024';

function generateToken(orderId) {
  // Simple hash-like token for verification
  const combined = `${orderId}-${SECRET_KEY}`;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

function validateToken(orderId, token) {
  return generateToken(orderId) === token;
}

// HTML response templates
const successHTML = (action, orderId) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order ${action === 'verify' ? 'Verified' : 'Rejected'} - SHUZEE</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: #111; 
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: #1a1a1a;
      border-radius: 20px;
      padding: 50px;
      text-align: center;
      max-width: 500px;
      border: 1px solid #333;
    }
    .icon {
      font-size: 80px;
      margin-bottom: 20px;
    }
    h1 {
      color: #fff;
      font-size: 28px;
      margin-bottom: 15px;
    }
    .highlight { color: #D9FF00; }
    p {
      color: #9ca3af;
      font-size: 16px;
      line-height: 1.6;
      margin-bottom: 30px;
    }
    .order-id {
      background: #222;
      padding: 15px 25px;
      border-radius: 10px;
      display: inline-block;
      margin-bottom: 30px;
    }
    .order-id span {
      color: #666;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
      display: block;
      margin-bottom: 5px;
    }
    .order-id strong {
      color: #fff;
      font-size: 18px;
      font-family: monospace;
    }
    .btn {
      display: inline-block;
      background: #D9FF00;
      color: #111;
      padding: 15px 40px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 700;
      font-size: 14px;
      transition: transform 0.2s;
    }
    .btn:hover { transform: scale(1.05); }
    .status-verified { border-color: #22c55e; }
    .status-verified .icon { color: #22c55e; }
    .status-rejected { border-color: #ef4444; }
    .status-rejected .icon { color: #ef4444; }
  </style>
</head>
<body>
  <div class="container status-${action === 'verify' ? 'verified' : 'rejected'}">
    <div class="icon">${action === 'verify' ? '✅' : '❌'}</div>
    <h1>Order <span class="highlight">${action === 'verify' ? 'Verified' : 'Rejected'}</span>!</h1>
    <p>${action === 'verify' 
      ? 'The payment has been verified and the customer now has access to their digital products.' 
      : 'The order has been rejected. The customer will be notified about the payment issue.'}</p>
    <div class="order-id">
      <span>Order ID</span>
      <strong>#${orderId.slice(-8).toUpperCase()}</strong>
    </div>
    <br><br>
    <a href="https://shuzee.netlify.app/admin/orders" class="btn">View All Orders</a>
  </div>
</body>
</html>
`;

const errorHTML = (message) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Error - SHUZEE</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: #111; 
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: #1a1a1a;
      border-radius: 20px;
      padding: 50px;
      text-align: center;
      max-width: 500px;
      border: 1px solid #ef4444;
    }
    .icon { font-size: 80px; margin-bottom: 20px; color: #ef4444; }
    h1 { color: #fff; font-size: 28px; margin-bottom: 15px; }
    p { color: #9ca3af; font-size: 16px; line-height: 1.6; margin-bottom: 30px; }
    .btn {
      display: inline-block;
      background: #D9FF00;
      color: #111;
      padding: 15px 40px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 700;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">⚠️</div>
    <h1>Action Failed</h1>
    <p>${message}</p>
    <a href="https://shuzee.netlify.app/admin/orders" class="btn">Go to Dashboard</a>
  </div>
</body>
</html>
`;

exports.handler = async (event) => {
  // Only allow GET requests (from email links)
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'text/html' },
      body: errorHTML('Method not allowed'),
    };
  }

  const { orderId, action, token } = event.queryStringParameters || {};

  // Validate parameters
  if (!orderId || !action || !token) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'text/html' },
      body: errorHTML('Missing required parameters. Please use the link from your email.'),
    };
  }

  // Validate action
  if (!['verify', 'reject'].includes(action)) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'text/html' },
      body: errorHTML('Invalid action. Only "verify" or "reject" are allowed.'),
    };
  }

  // Validate token
  if (!validateToken(orderId, token)) {
    return {
      statusCode: 403,
      headers: { 'Content-Type': 'text/html' },
      body: errorHTML('Invalid or expired token. This link may have already been used or is invalid.'),
    };
  }

  try {
    // Fetch the order first to check current status
    const order = await sanityClient.fetch(
      `*[_type == "order" && _id == $orderId][0]`,
      { orderId }
    );

    if (!order) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'text/html' },
        body: errorHTML('Order not found. It may have been deleted.'),
      };
    }

    // Check if order is already processed
    if (order.status === 'verified' || order.status === 'completed') {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'text/html' },
        body: errorHTML('This order has already been verified.'),
      };
    }

    if (order.status === 'rejected' || order.status === 'cancelled') {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'text/html' },
        body: errorHTML('This order has already been rejected/cancelled.'),
      };
    }

    // Update order based on action
    if (action === 'verify') {
      await sanityClient
        .patch(orderId)
        .set({
          status: 'verified',
          accessGranted: true,
          verifiedAt: new Date().toISOString(),
        })
        .commit();
    } else {
      await sanityClient
        .patch(orderId)
        .set({
          status: 'rejected',
          accessGranted: false,
          rejectedAt: new Date().toISOString(),
        })
        .commit();
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'text/html' },
      body: successHTML(action, orderId),
    };

  } catch (error) {
    console.error('Order action error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'text/html' },
      body: errorHTML('An error occurred while processing your request. Please try again or use the dashboard.'),
    };
  }
};

// Export token generator for use in email service
exports.generateToken = generateToken;
