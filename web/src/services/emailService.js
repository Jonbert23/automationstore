import emailjs from '@emailjs/browser';

// You need to get these from your EmailJS dashboard
// Ideally these should be in environment variables
const SERVICE_ID = 'YOUR_SERVICE_ID';
const TEMPLATE_ID = 'YOUR_TEMPLATE_ID';
const PUBLIC_KEY = 'YOUR_PUBLIC_KEY';

export const sendOrderNotification = async (orderData) => {
  try {
    const templateParams = {
      order_id: orderData.orderId,
      customer_name: orderData.customerName,
      customer_email: orderData.customerEmail,
      total_amount: orderData.totalAmount,
      order_items: orderData.items.map(item => `${item.title} (x${item.quantity})`).join(', '),
      payment_method: orderData.paymentMethod,
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
