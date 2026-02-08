// Secret key must stay here (Netlify env), never in the frontend .env
const PAYMONGO_SECRET = process.env.PAYMONGO_SECRET_KEY;

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type' };
  if (!PAYMONGO_SECRET) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'PayMongo secret key not configured' }) };
  }
  let body;
  try { body = JSON.parse(event.body || '{}'); } catch { return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) }; }
  const { orderId, amount, successUrl, cancelUrl, customerEmail, customerName } = body;
  if (!orderId || amount == null || !successUrl || !cancelUrl) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing orderId, amount, successUrl, or cancelUrl' }) };
  }
  const amountCentavos = Math.round(Number(amount) * 100);
  if (amountCentavos < 100) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Amount must be at least 1 PHP' }) };
  }
  try {
    const res = await fetch('https://api.paymongo.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(PAYMONGO_SECRET + ':').toString('base64')}`,
      },
      body: JSON.stringify({
        data: {
          attributes: {
            amount: amountCentavos,
            currency: 'PHP',
            payment_method_allowed: ['card', 'paymaya', 'gcash', 'grab_pay'],
            description: `Order ${orderId}`,
            metadata: { orderId, customerEmail: customerEmail || '', customerName: customerName || '' },
            statement_descriptor: 'SHUZEE',
          },
        },
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { statusCode: res.status || 500, headers, body: JSON.stringify({ error: data.errors?.[0]?.detail || 'Failed to create payment intent' }) };
    }
    const pi = data.data;
    const clientKey = pi.attributes?.client_key;
    if (!clientKey) return { statusCode: 500, headers, body: JSON.stringify({ error: 'No client_key in response' }) };
    return { statusCode: 200, headers, body: JSON.stringify({ clientKey, paymentIntentId: pi.id, orderId }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message || 'Server error' }) };
  }
};
