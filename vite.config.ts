import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { resolve } from 'path'

export default defineConfig(({ mode }) => {
  const isExtension = mode === 'extension'
  
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: isExtension 
      ? {
          // Extension build config
          outDir: 'dist/extension',
          emptyOutDir: true,
          rollupOptions: {
            input: {
              popup: resolve(__dirname, 'extension/popup.html'),
              background: resolve(__dirname, 'extension/background.ts'),
              content: resolve(__dirname, 'extension/content.ts'),
            },
            output: {
              entryFileNames: '[name].js',
              chunkFileNames: '[name].js',
              assetFileNames: '[name].[ext]',
            },
          },
        }
      : {
          // Web app build config
          outDir: 'dist/web',
          emptyOutDir: true,
          sourcemap: true,
        },
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode === 'production' ? 'production' : 'development'),
    },
  }
})
