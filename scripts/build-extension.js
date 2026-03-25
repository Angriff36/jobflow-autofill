#!/usr/bin/env node

/**
 * Build script for browser extension
 * Compiles TypeScript files and bundles for Chrome/Firefox
 */

import * as esbuild from 'esbuild'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = path.resolve(__dirname, '..')
const EXTENSION_DIR = path.join(ROOT_DIR, 'extension')
const DIST_DIR = path.join(ROOT_DIR, 'dist', 'extension')

async function buildExtension() {
  console.log('Building extension...')

  // Clean and create dist directory
  if (fs.existsSync(DIST_DIR)) {
    fs.rmSync(DIST_DIR, { recursive: true })
  }
  fs.mkdirSync(DIST_DIR, { recursive: true })

  // Build background script
  console.log('  Building background.js...')
  await esbuild.build({
    entryPoints: [path.join(EXTENSION_DIR, 'background.ts')],
    bundle: true,
    outfile: path.join(DIST_DIR, 'background.js'),
    format: 'iife',
    platform: 'browser',
    target: ['chrome110'],
    minify: process.env.NODE_ENV === 'production',
  })

  // Build content script
  console.log('  Building content.js...')
  await esbuild.build({
    entryPoints: [path.join(EXTENSION_DIR, 'content.ts')],
    bundle: true,
    outfile: path.join(DIST_DIR, 'content.js'),
    format: 'iife',
    platform: 'browser',
    target: ['chrome110'],
    minify: process.env.NODE_ENV === 'production',
  })

  // Build popup
  console.log('  Building popup.js...')
  await esbuild.build({
    entryPoints: [path.join(EXTENSION_DIR, 'popup.tsx')],
    bundle: true,
    outfile: path.join(DIST_DIR, 'popup.js'),
    format: 'iife',
    platform: 'browser',
    target: ['chrome110'],
    minify: process.env.NODE_ENV === 'production',
    define: {
      'process.env.NODE_ENV': '"production"',
    },
    jsx: 'automatic',
  })

  // Copy static files
  console.log('  Copying static files...')

  // Copy manifest
  fs.copyFileSync(
    path.join(EXTENSION_DIR, 'manifest.json'),
    path.join(DIST_DIR, 'manifest.json')
  )

  // Copy HTML files
  fs.copyFileSync(
    path.join(EXTENSION_DIR, 'popup.html'),
    path.join(DIST_DIR, 'popup.html')
  )

  const dashboardSrc = path.join(EXTENSION_DIR, 'dashboard.html')
  if (fs.existsSync(dashboardSrc)) {
    fs.copyFileSync(dashboardSrc, path.join(DIST_DIR, 'dashboard.html'))
  }
  const dashboardJsSrc = path.join(EXTENSION_DIR, 'dashboard.js')
  if (fs.existsSync(dashboardJsSrc)) {
    fs.copyFileSync(dashboardJsSrc, path.join(DIST_DIR, 'dashboard.js'))
  }

  // Copy icons
  const iconsDir = path.join(DIST_DIR, 'icons')
  fs.mkdirSync(iconsDir, { recursive: true })

  const iconSizes = [16, 48, 128]
  for (const size of iconSizes) {
    const iconSrc = path.join(EXTENSION_DIR, 'icons', `icon${size}.png`)
    if (fs.existsSync(iconSrc)) {
      fs.copyFileSync(iconSrc, path.join(iconsDir, `icon${size}.png`))
    } else {
      console.warn(`  Warning: Missing icon${size}.png`)
    }
  }

  console.log('Extension built successfully!')
  console.log(`  Output: ${DIST_DIR}`)
}

buildExtension().catch((error) => {
  console.error('Build failed:', error)
  process.exit(1)
})
