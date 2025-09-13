#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Copy frontend assets to public directory
function copyAssets() {
  const frontendDir = path.join(__dirname, '../frontend/assets');
  const publicDir = path.join(__dirname, '../public');
  
  // Ensure public directory exists
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  
  // Copy CSS files
  const cssSource = path.join(frontendDir, 'css');
  const cssTarget = path.join(publicDir, 'css');
  if (fs.existsSync(cssSource)) {
    if (!fs.existsSync(cssTarget)) {
      fs.mkdirSync(cssTarget, { recursive: true });
    }
    fs.readdirSync(cssSource).forEach(file => {
      fs.copyFileSync(path.join(cssSource, file), path.join(cssTarget, file));
    });
  }
  
  // Copy JS files
  const jsSource = path.join(frontendDir, 'js');
  const jsTarget = path.join(publicDir, 'js');
  if (fs.existsSync(jsSource)) {
    if (!fs.existsSync(jsTarget)) {
      fs.mkdirSync(jsTarget, { recursive: true });
    }
    fs.readdirSync(jsSource).forEach(file => {
      fs.copyFileSync(path.join(jsSource, file), path.join(jsTarget, file));
    });
  }
  
  // Copy image files
  const imagesSource = path.join(frontendDir, 'images');
  const imagesTarget = path.join(publicDir, 'images');
  if (fs.existsSync(imagesSource)) {
    if (!fs.existsSync(imagesTarget)) {
      fs.mkdirSync(imagesTarget, { recursive: true });
    }
    fs.readdirSync(imagesSource).forEach(file => {
      fs.copyFileSync(path.join(imagesSource, file), path.join(imagesTarget, file));
    });
  }
  
  console.log('Frontend assets copied to public directory');
}

copyAssets();
