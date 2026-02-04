import emailjs from '@emailjs/browser';

// EmailJS configuration
const SERVICE_ID = 'service_zeuqnhb';
const PUBLIC_KEY = 'bN1Y9i0WnPAEibqWd';

// Template IDs - Create these templates in your EmailJS dashboard
const TEMPLATES = {
  ADMIN_NEW_ORDER: 'template_3ygdrmg',           // Admin notification for new orders
  CUSTOMER_ORDER_CONFIRMED: 'template_customer_order',  // Customer order confirmation
  CUSTOMER_PAYMENT_VERIFIED: 'template_verified',       // Customer payment verified
  CUSTOMER_PAYMENT_REJECTED: 'template_rejected',       // Customer payment rejected
};

// Your site URL
const SITE_URL = 'https://shuzee.netlify.app';
const ADMIN_EMAIL = 'jonbertandam@gmail.com';

// Format items list for emails
const formatItemsList = (items) => {
  return items.map(item => `• ${item.title} - ₱${item.price?.toLocaleString() || '0'}`).join('\n');
};

// ==================== ADMIN NOTIFICATIONS ====================

// Send notification to admin when new order is placed
export const sendAdminOrderNotification = async (orderData) => {
  try {
    const templateParams = {
      order_id: orderData.orderId.slice(-8).toUpperCase(),
      customer_name: orderData.customerName,
      customer_email: orderData.customerEmail,
      total_amount: orderData.totalAmount?.toLocaleString() || '0',
      order_items: formatItemsList(orderData.items),
      payment_method: orderData.paymentMethod,
      payment_proof_url: orderData.paymentProofUrl || '',
      admin_order_url: `${SITE_URL}/admin/orders/${orderData.orderId}`,
      to_email: ADMIN_EMAIL,
    };

    const response = await emailjs.send(
      SERVICE_ID,
      TEMPLATES.ADMIN_NEW_ORDER,
      templateParams,
      PUBLIC_KEY
    );

    console.log('Admin notification sent!', response.status);
    return response;
  } catch (error) {
    console.error('Failed to send admin notification:', error);
    return null;
  }
};

// ==================== CUSTOMER NOTIFICATIONS ====================

// Send order confirmation to customer when they place an order
export const sendCustomerOrderConfirmation = async (orderData) => {
  try {
    const templateParams = {
      order_id: orderData.orderId.slice(-8).toUpperCase(),
      customer_name: orderData.customerName,
      to_email: orderData.customerEmail,
      total_amount: orderData.totalAmount?.toLocaleString() || '0',
      order_items: formatItemsList(orderData.items),
      payment_method: orderData.paymentMethod,
      order_url: `${SITE_URL}/account/orders`,
    };

    const response = await emailjs.send(
      SERVICE_ID,
      TEMPLATES.CUSTOMER_ORDER_CONFIRMED,
      templateParams,
      PUBLIC_KEY
    );

    console.log('Customer order confirmation sent!', response.status);
    return response;
  } catch (error) {
    console.error('Failed to send customer confirmation:', error);
    return null;
  }
};

// Send notification to customer when payment is verified
export const sendCustomerPaymentVerified = async (orderData) => {
  try {
    const templateParams = {
      order_id: orderData.orderId.slice(-8).toUpperCase(),
      customer_name: orderData.customerName,
      to_email: orderData.customerEmail,
      total_amount: orderData.totalAmount?.toLocaleString() || '0',
      order_items: formatItemsList(orderData.items),
      purchases_url: `${SITE_URL}/account/purchases`,
    };

    const response = await emailjs.send(
      SERVICE_ID,
      TEMPLATES.CUSTOMER_PAYMENT_VERIFIED,
      templateParams,
      PUBLIC_KEY
    );

    console.log('Payment verified notification sent!', response.status);
    return response;
  } catch (error) {
    console.error('Failed to send verified notification:', error);
    return null;
  }
};

// Send notification to customer when payment is rejected
export const sendCustomerPaymentRejected = async (orderData) => {
  try {
    const templateParams = {
      order_id: orderData.orderId.slice(-8).toUpperCase(),
      customer_name: orderData.customerName,
      to_email: orderData.customerEmail,
      total_amount: orderData.totalAmount?.toLocaleString() || '0',
      rejection_reason: orderData.rejectionReason || 'Payment could not be verified',
      order_url: `${SITE_URL}/account/orders`,
      contact_email: ADMIN_EMAIL,
    };

    const response = await emailjs.send(
      SERVICE_ID,
      TEMPLATES.CUSTOMER_PAYMENT_REJECTED,
      templateParams,
      PUBLIC_KEY
    );

    console.log('Payment rejected notification sent!', response.status);
    return response;
  } catch (error) {
    console.error('Failed to send rejected notification:', error);
    return null;
  }
};
