const PAYMONGO_SECRET = process.env.PAYMONGO_SECRET_KEY;
const authHeader = () => PAYMONGO_SECRET ? { Authorization: `Basic ${Buffer.from(PAYMONGO_SECRET + ':').toString('base64')}` } : {};

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type' };
  if (!PAYMONGO_SECRET) return { statusCode: 500, headers, body: JSON.stringify({ error: 'PayMongo not configured' }) };
  let body;
  try { body = JSON.parse(event.body || '{}'); } catch { return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) }; }
  const { clientKey, returnUrl, provider = 'gcash' } = body;
  if (!clientKey || !returnUrl) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing clientKey or returnUrl' }) };
  const paymentIntentId = clientKey.split('_client_')[0];
  if (!paymentIntentId) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid clientKey' }) };
  // PayMongo expects type = provider name: 'gcash' or 'paymaya' (not paymongo_ewallet)
  const methodType = provider === 'paymaya' ? 'paymaya' : 'gcash';
  try {
    const pmRes = await fetch('https://api.paymongo.com/v1/payment_methods', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify({
        data: {
          attributes: {
            type: methodType,
            billing: {},
            ewallet: { provider: methodType, return_url: returnUrl },
          },
        },
      }),
    });
    const pmData = await pmRes.json();
    const paymentMethodId = pmData?.data?.id;
    if (!paymentMethodId) return { statusCode: pmRes.status || 500, headers, body: JSON.stringify({ error: pmData?.errors?.[0]?.detail || 'Failed to create payment method' }) };
    const attachRes = await fetch(`https://api.paymongo.com/v1/payment_intents/${paymentIntentId}/attach`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify({
        data: {
          attributes: {
            client_key: clientKey,
            payment_method: paymentMethodId,
            return_url: returnUrl,
          },
        },
      }),
    });
    const attachData = await attachRes.json();
    const pi = attachData?.data;
    const status = pi?.attributes?.status;
    const nextAction = pi?.attributes?.next_action;

    if (!attachRes.ok) {
      const msg = attachData?.errors?.[0]?.detail || attachData?.errors?.[0]?.title || 'Attach failed';
      return { statusCode: attachRes.status || 500, headers, body: JSON.stringify({ error: msg }) };
    }

    if (status === 'awaiting_next_action' && nextAction?.redirect?.url) {
      return { statusCode: 200, headers, body: JSON.stringify({ redirectUrl: nextAction.redirect.url }) };
    }
    if (status === 'succeeded') return { statusCode: 200, headers, body: JSON.stringify({ redirectUrl: returnUrl, status: 'succeeded' }) };

    const lastError = pi?.attributes?.last_payment_error?.message;
    const apiError = attachData?.errors?.[0]?.detail || attachData?.errors?.[0]?.title;
    const errorMsg = lastError || apiError || (status ? `Payment status: ${status}` : 'Could not start payment');
    return { statusCode: 200, headers, body: JSON.stringify({ error: errorMsg, status }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message || 'Server error' }) };
  }
};
