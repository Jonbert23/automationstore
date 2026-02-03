export default {
  name: 'paymentMethod',
  title: 'Payment Method',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'name',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'qrCode',
      title: 'QR Code Image',
      type: 'image',
      description: 'Upload the QR code for this payment method',
      options: {
        hotspot: true,
      },
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'accountName',
      title: 'Account Name',
      type: 'string',
      description: 'Name displayed on the payment account',
    },
    {
      name: 'accountNumber',
      title: 'Account Number',
      type: 'string',
      description: 'Account/Mobile number (optional, for manual entry)',
    },
    {
      name: 'instructions',
      title: 'Payment Instructions',
      type: 'text',
      description: 'Step-by-step instructions for this payment method',
    },
    {
      name: 'isActive',
      title: 'Active',
      type: 'boolean',
      initialValue: true,
      description: 'Is this payment method currently available?',
    },
    {
      name: 'sortOrder',
      title: 'Sort Order',
      type: 'number',
      initialValue: 0,
      description: 'Order in which to display (lower = first)',
    },
  ],
  preview: {
    select: {
      title: 'name',
      media: 'qrCode',
      isActive: 'isActive',
    },
    prepare({ title, media, isActive }) {
      return {
        title,
        media,
        subtitle: isActive ? 'Active' : 'Inactive',
      };
    },
  },
}
