import emailjs from '@emailjs/browser';

// EmailJS configuration
const SERVICE_ID = 'service_zeuqnhb';
const TEMPLATE_ID = 'template_3ygdrmg';
const PUBLIC_KEY = 'bN1Y9i0WnPAEibqWd';

// Your admin panel URL
const ADMIN_URL = 'https://shuzee.netlify.app';

export const sendOrderNotification = async (orderData) => {
  try {
    // Format items as a list
    const itemsList = orderData.items
      .map(item => `• ${item.title} - ₱${item.price?.toLocaleString() || '0'}`)
      .join('\n');

    const templateParams = {
      order_id: orderData.orderId.slice(-8).toUpperCase(),
      full_order_id: orderData.orderId,
      customer_name: orderData.customerName,
      customer_email: orderData.customerEmail,
      total_amount: orderData.totalAmount?.toLocaleString() || '0',
      order_items: itemsList,
      payment_method: orderData.paymentMethod,
      payment_proof_url: orderData.paymentProofUrl || '',
      admin_order_url: `${ADMIN_URL}/admin/orders/${orderData.orderId}`,
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
