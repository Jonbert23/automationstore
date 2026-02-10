import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { schemaTypes } from './schemas';

export default defineConfig({
  name: 'apex-ecommerce',
  title: 'SHUZEE E-Commerce',

  projectId: process.env.SANITY_STUDIO_PROJECT_ID || 'bsx4rxqm',
  dataset: process.env.SANITY_STUDIO_DATASET || 'production',

  plugins: [structureTool()],

  schema: {
    types: schemaTypes,
  },
});
