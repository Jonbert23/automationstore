export default {
  name: 'user',
  title: 'User',
  type: 'document',
  fields: [
    {
      name: 'authType',
      title: 'Auth Type',
      type: 'string',
      options: {
        list: [
          { title: 'Email', value: 'email' },
          { title: 'Google', value: 'google' },
        ],
      },
      initialValue: 'email',
    },
    {
      name: 'googleId',
      title: 'Google ID',
      type: 'string',
      hidden: ({ document }) => document?.authType !== 'google',
    },
    {
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'email',
      title: 'Email',
      type: 'string',
      validation: (Rule) => Rule.required().email(),
    },
    {
      name: 'password',
      title: 'Password Hash',
      type: 'string',
      hidden: ({ document }) => document?.authType !== 'email',
      description: 'Hashed password for email authentication',
    },
    {
      name: 'picture',
      title: 'Profile Picture',
      type: 'url',
    },
    {
      name: 'addresses',
      title: 'Addresses',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'label', title: 'Label', type: 'string' },
            { name: 'street', title: 'Street', type: 'string' },
            { name: 'city', title: 'City', type: 'string' },
            { name: 'state', title: 'State', type: 'string' },
            { name: 'zip', title: 'ZIP Code', type: 'string' },
            { name: 'country', title: 'Country', type: 'string' },
            { name: 'phone', title: 'Phone', type: 'string' },
            { name: 'isDefault', title: 'Default Address', type: 'boolean' },
          ],
        },
      ],
    },
    {
      name: 'wishlist',
      title: 'Wishlist',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'product' }] }],
    },
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'email',
    },
  },
}
