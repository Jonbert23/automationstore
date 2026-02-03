export default {
  name: 'discount',
  title: 'Discount',
  type: 'document',
  fields: [
    {
      name: 'code',
      title: 'Discount Code',
      type: 'string',
      validation: (Rule) => Rule.required().uppercase(),
      description: 'Unique code customers enter at checkout',
    },
    {
      name: 'description',
      title: 'Description',
      type: 'string',
      description: 'Internal description for this discount',
    },
    {
      name: 'type',
      title: 'Discount Type',
      type: 'string',
      options: {
        list: [
          { title: 'Percentage Off', value: 'percentage' },
          { title: 'Fixed Amount Off', value: 'fixed' },
          { title: 'Free Shipping', value: 'free_shipping' },
        ],
      },
      initialValue: 'percentage',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'value',
      title: 'Discount Value',
      type: 'number',
      description: 'Percentage (e.g., 10 for 10%) or fixed amount (e.g., 20 for $20)',
      hidden: ({ document }) => document?.type === 'free_shipping',
    },
    {
      name: 'minOrderAmount',
      title: 'Minimum Order Amount',
      type: 'number',
      description: 'Minimum cart total required to use this discount',
      initialValue: 0,
    },
    {
      name: 'maxUses',
      title: 'Maximum Uses',
      type: 'number',
      description: 'Total number of times this code can be used (leave empty for unlimited)',
    },
    {
      name: 'usedCount',
      title: 'Times Used',
      type: 'number',
      initialValue: 0,
      readOnly: true,
    },
    {
      name: 'startDate',
      title: 'Start Date',
      type: 'datetime',
      description: 'When this discount becomes active',
    },
    {
      name: 'endDate',
      title: 'End Date',
      type: 'datetime',
      description: 'When this discount expires',
    },
    {
      name: 'isActive',
      title: 'Active',
      type: 'boolean',
      initialValue: true,
    },
  ],
  preview: {
    select: {
      title: 'code',
      type: 'type',
      value: 'value',
      isActive: 'isActive',
    },
    prepare({ title, type, value, isActive }) {
      let subtitle = '';
      if (type === 'percentage') subtitle = `${value}% off`;
      else if (type === 'fixed') subtitle = `$${value} off`;
      else if (type === 'free_shipping') subtitle = 'Free shipping';
      
      return {
        title: `${title}${!isActive ? ' (Inactive)' : ''}`,
        subtitle,
      };
    },
  },
}
