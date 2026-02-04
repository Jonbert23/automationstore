import emailjs from '@emailjs/browser';

// EmailJS configuration
const SERVICE_ID = 'service_zeuqnhb';
const TEMPLATE_ID = 'template_3ygdrmg';
const PUBLIC_KEY = 'bN1Y9i0WnPAEibqWd';

// Your site URL
const SITE_URL = 'https://shuzee.netlify.app';

// Secret key for token generation (must match serverless function)
const SECRET_KEY = 'shuzee-order-secret-2024';

// Generate security token for order actions
function generateActionToken(orderId) {
  const combined = `${orderId}-${SECRET_KEY}`;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

export const sendOrderNotification = async (orderData) => {
  try {
    // Format items as a list
    const itemsList = orderData.items
      .map(item => `• ${item.title} - ₱${item.price?.toLocaleString() || '0'}`)
      .join('\n');

    // Generate secure token for verify/reject actions
    const actionToken = generateActionToken(orderData.orderId);
    
    // Build action URLs
    const verifyUrl = `${SITE_URL}/.netlify/functions/order-action?orderId=${orderData.orderId}&action=verify&token=${actionToken}`;
    const rejectUrl = `${SITE_URL}/.netlify/functions/order-action?orderId=${orderData.orderId}&action=reject&token=${actionToken}`;

    const templateParams = {
      order_id: orderData.orderId.slice(-8).toUpperCase(),
      full_order_id: orderData.orderId,
      customer_name: orderData.customerName,
      customer_email: orderData.customerEmail,
      total_amount: orderData.totalAmount?.toLocaleString() || '0',
      order_items: itemsList,
      payment_method: orderData.paymentMethod,
      payment_proof_url: orderData.paymentProofUrl || '',
      admin_order_url: `${SITE_URL}/admin/orders/${orderData.orderId}`,
      verify_url: verifyUrl,
      reject_url: rejectUrl,
      to_email: 'jonbertandam@gmail.com', // Admin email
    };

    const response = await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      templateParams,
      PUBLIC_KEY
    );

    console.log('Email sent successfully!', response.status, response.text);
    return response;
  } catch (error) {
    console.error('Failed to send email:', error);
    // Don't block the UI flow if email fails
    return null;
  }
};
