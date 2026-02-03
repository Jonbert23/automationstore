export default {
  name: 'review',
  title: 'Review',
  type: 'document',
  fields: [
    {
      name: 'product',
      title: 'Product',
      type: 'reference',
      to: [{ type: 'product' }],
      validation: (Rule) => Rule.required(),
    },
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
      name: 'rating',
      title: 'Rating',
      type: 'number',
      validation: (Rule) => Rule.required().min(1).max(5),
      options: {
        list: [1, 2, 3, 4, 5],
      },
    },
    {
      name: 'title',
      title: 'Review Title',
      type: 'string',
    },
    {
      name: 'comment',
      title: 'Review Comment',
      type: 'text',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'isApproved',
      title: 'Approved',
      type: 'boolean',
      initialValue: false,
      description: 'Review will only appear on the site when approved',
    },
    {
      name: 'isVerifiedPurchase',
      title: 'Verified Purchase',
      type: 'boolean',
      initialValue: false,
      description: 'User has purchased this product',
    },
  ],
  preview: {
    select: {
      userName: 'userName',
      rating: 'rating',
      productTitle: 'product.title',
      isApproved: 'isApproved',
    },
    prepare({ userName, rating, productTitle, isApproved }) {
      return {
        title: `${userName || 'Anonymous'} - ${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}`,
        subtitle: `${productTitle}${!isApproved ? ' (Pending)' : ''}`,
      };
    },
  },
}
