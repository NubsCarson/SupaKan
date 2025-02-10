import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateOGImage() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  
  // Set viewport to match OG image dimensions
  await page.setViewport({
    width: 1200,
    height: 630,
    deviceScaleFactor: 2, // For better quality
  });

  // Load the HTML file
  const htmlPath = path.join(__dirname, '../public/og-preview.html');
  await page.goto(`file://${htmlPath}`);

  // Wait for any animations/fonts to load
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Take screenshot
  await page.screenshot({
    path: path.join(__dirname, '../public/og-preview.png'),
    type: 'png',
  });

  await browser.close();
  console.log('OG preview image generated successfully!');
}

generateOGImage().catch(console.error); 