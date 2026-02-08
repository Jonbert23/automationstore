export default {
  name: 'order',
  title: 'Order',
  type: 'document',
  fields: [
    {
      name: 'user',
      title: 'User Email',
      type: 'string',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'userName',
      title: 'User Name',
      type: 'string',
    },
    {
      name: 'items',
      title: 'Items',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'product', title: 'Product', type: 'reference', to: [{ type: 'product' }] },
            { name: 'quantity', title: 'Quantity', type: 'number', initialValue: 1 },
            { name: 'price', title: 'Price at Purchase', type: 'number' },
          ],
        },
      ],
    },
    {
      name: 'total',
      title: 'Total (PHP)',
      type: 'number',
    },
    // Payment Information
    {
      name: 'paymentMethod',
      title: 'Payment Method',
      type: 'string',
      options: {
        list: [
          { title: 'PayMongo (Card / E-Wallet)', value: 'paymongo' },
          { title: 'GCash', value: 'gcash' },
          { title: 'Maya', value: 'maya' },
          { title: 'GoTyme', value: 'gotyme' },
        ],
      },
    },
    {
      name: 'paymongoPaymentIntentId',
      title: 'PayMongo Payment Intent ID',
      type: 'string',
      hidden: ({ document }) => document?.paymentMethod !== 'paymongo',
    },
    {
      name: 'paymentReference',
      title: 'Payment Reference Number',
      type: 'string',
      description: 'Reference/Transaction ID from customer\'s payment',
    },
    {
      name: 'paymentProof',
      title: 'Payment Proof',
      type: 'image',
      description: 'Screenshot of payment confirmation',
      options: {
        hotspot: true,
      },
    },
    {
      name: 'paymentVerified',
      title: 'Payment Verified',
      type: 'boolean',
      initialValue: false,
      description: 'Has the payment been verified by admin?',
    },
    {
      name: 'paymentVerifiedAt',
      title: 'Payment Verified At',
      type: 'datetime',
    },
    {
      name: 'paymentVerifiedBy',
      title: 'Verified By',
      type: 'string',
      description: 'Admin who verified the payment',
    },
    // Access Information
    {
      name: 'accessGranted',
      title: 'Access Granted',
      type: 'boolean',
      initialValue: false,
      description: 'Has the customer been granted access to the digital products?',
    },
    {
      name: 'accessGrantedAt',
      title: 'Access Granted At',
      type: 'datetime',
    },
    // Order Status
    {
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          { title: 'Pending', value: 'pending' },
          { title: 'Verified', value: 'verified' },
          { title: 'Completed', value: 'completed' },
          { title: 'Cancelled', value: 'cancelled' },
        ],
      },
      initialValue: 'pending',
    },
    {
      name: 'notes',
      title: 'Admin Notes',
      type: 'text',
      description: 'Internal notes about this order',
    },
  ],
  preview: {
    select: {
      title: 'user',
      subtitle: 'status',
      total: 'total',
      paymentMethod: 'paymentMethod',
    },
    prepare({ title, subtitle, total, paymentMethod }) {
      const statusLabels = {
        pending: 'PENDING',
        verified: 'VERIFIED',
        completed: 'COMPLETED',
        cancelled: 'CANCELLED',
      };
      return {
        title: title || 'Unknown User',
        subtitle: `${statusLabels[subtitle] || 'PENDING'} - ₱${total?.toLocaleString() || '0'} ${paymentMethod ? `(${paymentMethod.toUpperCase()})` : ''}`,
      };
    },
  },
}
