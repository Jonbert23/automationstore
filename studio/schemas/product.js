export default {
  name: 'product',
  title: 'Product',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'price',
      title: 'Price (PHP)',
      type: 'number',
      validation: (Rule) => Rule.required().positive(),
    },
    {
      name: 'comparePrice',
      title: 'Compare at Price (Original)',
      type: 'number',
      description: 'Original price for showing discounts',
    },
    {
      name: 'description',
      title: 'Description',
      type: 'text',
    },
    {
      name: 'images',
      title: 'Preview Images',
      type: 'array',
      description: 'Product preview images (screenshots, demos)',
      of: [
        {
          type: 'image',
          options: {
            hotspot: true,
          },
        },
      ],
    },
    {
      name: 'category',
      title: 'Category',
      type: 'reference',
      to: [{ type: 'category' }],
    },
    {
      name: 'featured',
      title: 'Featured Product',
      type: 'boolean',
      initialValue: false,
    },
    // Digital Product Fields
    {
      name: 'driveLink',
      title: 'Google Drive Link',
      type: 'url',
      description: 'The Google Drive link where customers can access the product after purchase',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'fileType',
      title: 'File Type',
      type: 'string',
      options: {
        list: [
          { title: 'Photoshop Script (.jsx)', value: 'jsx' },
          { title: 'Photoshop Action (.atn)', value: 'atn' },
          { title: 'ZIP Archive', value: 'zip' },
          { title: 'PDF Document', value: 'pdf' },
          { title: 'Other', value: 'other' },
        ],
      },
      initialValue: 'jsx',
    },
    {
      name: 'fileSize',
      title: 'File Size',
      type: 'string',
      description: 'e.g., 2.5 MB, 150 KB',
    },
    {
      name: 'compatibility',
      title: 'Compatibility',
      type: 'string',
      description: 'e.g., Photoshop CC 2020+, Photoshop CS6+',
    },
    {
      name: 'accessInstructions',
      title: 'Access Instructions',
      type: 'text',
      description: 'Instructions for customers on how to download and use the product',
    },
    {
      name: 'features',
      title: 'Product Features',
      type: 'array',
      description: 'List of features included in this product',
      of: [
        {
          type: 'object',
          name: 'feature',
          fields: [
            {
              name: 'title',
              title: 'Feature Title',
              type: 'string',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'description',
              title: 'Feature Description',
              type: 'string',
            },
          ],
          preview: {
            select: {
              title: 'title',
              subtitle: 'description',
            },
          },
        },
      ],
    },
    {
      name: 'demoVideo',
      title: 'Demo Video URL',
      type: 'url',
      description: 'YouTube or Vimeo link showing the product in action',
    },
  ],
  preview: {
    select: {
      title: 'title',
      media: 'images.0',
      price: 'price',
    },
    prepare({ title, media, price }) {
      return {
        title,
        media,
        subtitle: price ? `₱${price.toLocaleString()}` : 'No price set',
      };
    },
  },
}
