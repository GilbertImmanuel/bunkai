import { defineConfig } from '@vite-pwa/assets-generator/config'

export default defineConfig({
  preset: {
    transparent: { sizes: [192, 512] },
    maskable: {
      sizes: [512],
      resizeOptions: { fit: 'contain', background: '#22302a' },
    },
    apple: {
      sizes: [180],
      resizeOptions: { fit: 'contain', background: '#22302a' },
    },
  },
  images: ['public/favicon.svg'],
  manifestIconsEntry: false,
})
