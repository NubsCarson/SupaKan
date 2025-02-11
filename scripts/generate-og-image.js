import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateOGImage() {
  console.log('Starting OG image generation...');
  let browser;
  
  try {
    console.log('Launching browser...');
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    console.log('Creating new page...');
    const page = await browser.newPage();
    
    console.log('Setting viewport...');
    await page.setViewport({
      width: 1200,
      height: 630,
      deviceScaleFactor: 2, // For better quality
    });

    const htmlPath = path.join(__dirname, '../public/og-preview.html');
    console.log('Loading HTML file from:', htmlPath);
    
    const fileUrl = `file://${htmlPath}`;
    console.log('Navigating to:', fileUrl);
    await page.goto(fileUrl, { waitUntil: 'networkidle0' });

    console.log('Waiting for fonts and animations...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    const screenshotPath = path.join(__dirname, '../public/og-preview.png');
    console.log('Taking screenshot to:', screenshotPath);
    await page.screenshot({
      path: screenshotPath,
      type: 'png',
      fullPage: true
    });

    console.log('OG preview image generated successfully!');
  } catch (error) {
    console.error('Error generating OG image:', error);
    throw error;
  } finally {
    if (browser) {
      console.log('Closing browser...');
      await browser.close();
    }
  }
}

console.log('Script started');
generateOGImage().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
}); 