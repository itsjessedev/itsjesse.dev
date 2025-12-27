import { chromium } from 'playwright';

async function generatePDF() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto('file:///home/jesse/itsjesse.dev/site/public/Jesse-Eldridge-Resume.html');
  await page.waitForTimeout(1000);

  await page.pdf({
    path: '/home/jesse/itsjesse.dev/site/public/Jesse-Eldridge-Resume.pdf',
    format: 'Letter',
    margin: {
      top: '0.5in',
      right: '0.5in',
      bottom: '0.5in',
      left: '0.5in'
    },
    printBackground: true
  });

  await browser.close();
  console.log('PDF generated: Jesse_Eldridge_Resume.pdf');
}

generatePDF().catch(console.error);
