import emailjs from '@emailjs/browser';

// EmailJS configuration
const SERVICE_ID = 'service_zeuqnhb';
const PUBLIC_KEY = 'bN1Y9i0WnPAEibqWd';

// Template IDs - Only 2 templates needed
const TEMPLATES = {
  ADMIN_NEW_ORDER: 'template_3ygdrmg',    // Admin notification for new orders
  CUSTOMER_EMAIL: 'template_customer',     // Single dynamic template for all customer emails
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

// Single function for all customer emails with dynamic content
const sendCustomerEmail = async (orderData, emailType) => {
  try {
    // Dynamic content based on email type
    let subject, heading, message, status_color, button_text, button_url, show_items, show_rejection;
    
    switch (emailType) {
      case 'order_confirmed':
        subject = `🛒 Order Confirmed - SHUZEE #${orderData.orderId.slice(-8).toUpperCase()}`;
        heading = '✓ Order Received!';
        message = `Thank you for your order! We've received your payment and it's now being reviewed. You'll receive another email once your payment is verified.`;
        status_color = '#D9FF00';
        button_text = 'View Order Status';
        button_url = `${SITE_URL}/account/orders`;
        show_items = 'yes';
        show_rejection = 'no';
        break;
        
      case 'payment_verified':
        subject = `✅ Payment Verified - Access Your Products! SHUZEE #${orderData.orderId.slice(-8).toUpperCase()}`;
        heading = '🎉 Payment Verified!';
        message = `Great news! Your payment has been verified and you now have access to your digital products. Click the button below to access your files.`;
        status_color = '#22c55e';
        button_text = '🚀 Access Your Products';
        button_url = `${SITE_URL}/account/purchases`;
        show_items = 'yes';
        show_rejection = 'no';
        break;
        
      case 'payment_rejected':
        subject = `❌ Payment Issue - SHUZEE Order #${orderData.orderId.slice(-8).toUpperCase()}`;
        heading = '⚠️ Payment Issue';
        message = `Unfortunately, we were unable to verify your payment. Please see the reason below and contact us if you believe this is an error.`;
        status_color = '#ef4444';
        button_text = 'Contact Support';
        button_url = `mailto:${ADMIN_EMAIL}`;
        show_items = 'no';
        show_rejection = 'yes';
        break;
        
      default:
        return null;
    }

    const templateParams = {
      to_email: orderData.customerEmail,
      subject: subject,
      order_id: orderData.orderId.slice(-8).toUpperCase(),
      customer_name: orderData.customerName,
      total_amount: orderData.totalAmount?.toLocaleString() || '0',
      order_items: formatItemsList(orderData.items || []),
      heading: heading,
      message: message,
      status_color: status_color,
      button_text: button_text,
      button_url: button_url,
      show_items: show_items,
      show_rejection: show_rejection,
      rejection_reason: orderData.rejectionReason || '',
      contact_email: ADMIN_EMAIL,
    };

    const response = await emailjs.send(
      SERVICE_ID,
      TEMPLATES.CUSTOMER_EMAIL,
      templateParams,
      PUBLIC_KEY
    );

    console.log(`Customer ${emailType} email sent!`, response.status);
    return response;
  } catch (error) {
    console.error(`Failed to send customer ${emailType} email:`, error);
    return null;
  }
};

// Export convenience functions
export const sendCustomerOrderConfirmation = (orderData) => sendCustomerEmail(orderData, 'order_confirmed');
export const sendCustomerPaymentVerified = (orderData) => sendCustomerEmail(orderData, 'payment_verified');
export const sendCustomerPaymentRejected = (orderData) => sendCustomerEmail(orderData, 'payment_rejected');
