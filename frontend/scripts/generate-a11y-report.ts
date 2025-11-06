/**
 * Automated Accessibility Report Generator
 *
 * Generates HTML and JSON reports of accessibility test results.
 * Includes WCAG compliance status, violations, and recommendations.
 *
 * Run: npm run test:a11y:report
 */

import { chromium, Browser, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const STORYBOOK_URL = 'http://localhost:6006';
const REPORT_DIR = path.join(__dirname, '../accessibility-reports');

interface StoryTest {
  id: string;
  name: string;
  component: string;
}

// All stories to test
const STORIES: StoryTest[] = [
  // Button
  { id: 'components-button--primary', name: 'Primary', component: 'Button' },
  { id: 'components-button--secondary', name: 'Secondary', component: 'Button' },
  { id: 'components-button--tertiary', name: 'Tertiary', component: 'Button' },
  { id: 'components-button--primary-disabled', name: 'Disabled', component: 'Button' },
  { id: 'components-button--primary-loading', name: 'Loading', component: 'Button' },

  // Input
  { id: 'components-input--default', name: 'Default', component: 'Input' },
  { id: 'components-input--with-error', name: 'With Error', component: 'Input' },
  { id: 'components-input--with-success', name: 'With Success', component: 'Input' },
  { id: 'components-input--required', name: 'Required', component: 'Input' },
  { id: 'components-input--disabled', name: 'Disabled', component: 'Input' },

  // Select
  { id: 'components-select--default', name: 'Default', component: 'Select' },
  { id: 'components-select--with-error', name: 'With Error', component: 'Select' },
  { id: 'components-select--required', name: 'Required', component: 'Select' },
  { id: 'components-select--disabled', name: 'Disabled', component: 'Select' },

  // Checkbox
  { id: 'components-checkbox--unchecked', name: 'Unchecked', component: 'Checkbox' },
  { id: 'components-checkbox--checked', name: 'Checked', component: 'Checkbox' },
  { id: 'components-checkbox--with-error', name: 'With Error', component: 'Checkbox' },
  { id: 'components-checkbox--disabled-unchecked', name: 'Disabled', component: 'Checkbox' },

  // Radio
  { id: 'components-radio--unchecked', name: 'Unchecked', component: 'Radio' },
  { id: 'components-radio--checked', name: 'Checked', component: 'Radio' },
  { id: 'components-radio--with-error', name: 'With Error', component: 'Radio' },
  { id: 'components-radio--radio-group', name: 'Radio Group', component: 'Radio' },

  // Card
  { id: 'components-card--elevated', name: 'Elevated', component: 'Card' },
  { id: 'components-card--interactive', name: 'Interactive', component: 'Card' },
  { id: 'components-card--with-header-body-footer', name: 'With Composition', component: 'Card' },

  // Toast
  { id: 'components-toast--success', name: 'Success', component: 'Toast' },
  { id: 'components-toast--error', name: 'Error', component: 'Toast' },
  { id: 'components-toast--warning', name: 'Warning', component: 'Toast' },
  { id: 'components-toast--info', name: 'Info', component: 'Toast' },

  // Logo
  { id: 'components-logo--colored-medium', name: 'Colored', component: 'Logo' },
  { id: 'components-logo--black-white-medium', name: 'Black & White', component: 'Logo' },
  { id: 'components-logo--icon-variant', name: 'Icon', component: 'Logo' },
];

interface TestResult {
  story: StoryTest;
  violations: any[];
  passes: any[];
  incomplete: any[];
  timestamp: string;
}

async function testStory(page: Page, story: StoryTest): Promise<TestResult> {
  await page.goto(`${STORYBOOK_URL}/iframe.html?id=${story.id}`);
  await page.waitForLoadState('networkidle');

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  return {
    story,
    violations: results.violations,
    passes: results.passes,
    incomplete: results.incomplete,
    timestamp: new Date().toISOString(),
  };
}

async function generateReport() {
  console.log('🔍 Starting accessibility audit...\n');

  // Ensure report directory exists
  if (!fs.existsSync(REPORT_DIR)) {
    fs.mkdirSync(REPORT_DIR, { recursive: true });
  }

  const browser: Browser = await chromium.launch();
  const context = await browser.newContext();
  const page: Page = await context.newPage();

  const results: TestResult[] = [];

  for (const story of STORIES) {
    process.stdout.write(`Testing ${story.component} - ${story.name}... `);
    const result = await testStory(page, story);
    results.push(result);

    if (result.violations.length === 0) {
      console.log('✅ PASS');
    } else {
      console.log(`❌ FAIL (${result.violations.length} violations)`);
    }
  }

  await browser.close();

  // Generate JSON report
  const jsonReport = {
    summary: {
      totalStories: results.length,
      passed: results.filter((r) => r.violations.length === 0).length,
      failed: results.filter((r) => r.violations.length > 0).length,
      totalViolations: results.reduce((sum, r) => sum + r.violations.length, 0),
      timestamp: new Date().toISOString(),
    },
    results,
  };

  fs.writeFileSync(
    path.join(REPORT_DIR, 'accessibility-report.json'),
    JSON.stringify(jsonReport, null, 2)
  );

  // Generate HTML report
  const html = generateHTMLReport(jsonReport);
  fs.writeFileSync(path.join(REPORT_DIR, 'accessibility-report.html'), html);

  console.log(`\n📊 Report Summary:`);
  console.log(`   Total Stories: ${jsonReport.summary.totalStories}`);
  console.log(`   ✅ Passed: ${jsonReport.summary.passed}`);
  console.log(`   ❌ Failed: ${jsonReport.summary.failed}`);
  console.log(`   🔴 Total Violations: ${jsonReport.summary.totalViolations}`);
  console.log(`\n📁 Reports generated in: ${REPORT_DIR}`);
  console.log(`   - accessibility-report.json`);
  console.log(`   - accessibility-report.html`);

  // Exit with error code if there are failures
  if (jsonReport.summary.failed > 0) {
    process.exit(1);
  }
}

function generateHTMLReport(report: any): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Accessibility Report - ${new Date().toLocaleDateString()}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
      background: #f5f5f5;
    }
    h1 { color: #1A1A1A; margin-bottom: 1rem; }
    h2 { color: #1A1A1A; margin-top: 2rem; border-bottom: 2px solid #FFB400; padding-bottom: 0.5rem; }
    .summary {
      background: white;
      padding: 1.5rem;
      border-radius: 8px;
      margin-bottom: 2rem;
      box-shadow: 0 2px 8px rgba(26,26,26,0.1);
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-top: 1rem;
    }
    .stat {
      padding: 1rem;
      border-radius: 4px;
      text-align: center;
    }
    .stat-value {
      font-size: 2rem;
      font-weight: bold;
      margin-bottom: 0.5rem;
    }
    .stat-label {
      font-size: 0.875rem;
      color: #666;
    }
    .stat.pass { background: #D1FAE5; color: #065F46; }
    .stat.fail { background: #FEE2E2; color: #991B1B; }
    .result {
      background: white;
      padding: 1.5rem;
      border-radius: 8px;
      margin-bottom: 1rem;
      box-shadow: 0 2px 4px rgba(26,26,26,0.1);
    }
    .result.pass { border-left: 4px solid #10B981; }
    .result.fail { border-left: 4px solid #DC2626; }
    .result-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }
    .component-name {
      font-weight: 600;
      font-size: 1.125rem;
    }
    .badge {
      padding: 0.25rem 0.75rem;
      border-radius: 4px;
      font-size: 0.875rem;
      font-weight: 600;
    }
    .badge.pass { background: #10B981; color: white; }
    .badge.fail { background: #DC2626; color: white; }
    .violation {
      background: #FEF2F2;
      border: 1px solid #FCA5A5;
      border-radius: 4px;
      padding: 1rem;
      margin-bottom: 0.75rem;
    }
    .violation-impact {
      display: inline-block;
      padding: 0.125rem 0.5rem;
      border-radius: 3px;
      font-size: 0.75rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }
    .impact-critical { background: #7F1D1D; color: white; }
    .impact-serious { background: #DC2626; color: white; }
    .impact-moderate { background: #F59E0B; color: white; }
    .impact-minor { background: #FCD34D; color: #92400E; }
    .violation-description {
      font-size: 0.938rem;
      margin: 0.5rem 0;
    }
    .violation-help {
      font-size: 0.875rem;
      color: #666;
      margin: 0.5rem 0;
    }
    .violation-help a {
      color: #FFB400;
      text-decoration: none;
    }
    .violation-help a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <h1>🔍 Accessibility Audit Report</h1>
  <p>Generated on ${new Date().toLocaleString()}</p>

  <div class="summary">
    <h2>Summary</h2>
    <div class="summary-grid">
      <div class="stat">
        <div class="stat-value">${report.summary.totalStories}</div>
        <div class="stat-label">Total Stories</div>
      </div>
      <div class="stat pass">
        <div class="stat-value">${report.summary.passed}</div>
        <div class="stat-label">Passed</div>
      </div>
      <div class="stat fail">
        <div class="stat-value">${report.summary.failed}</div>
        <div class="stat-label">Failed</div>
      </div>
      <div class="stat fail">
        <div class="stat-value">${report.summary.totalViolations}</div>
        <div class="stat-label">Total Violations</div>
      </div>
    </div>
  </div>

  <h2>Results by Component</h2>
  ${report.results
    .map((result: TestResult) => {
      const hasFailed = result.violations.length > 0;
      return `
      <div class="result ${hasFailed ? 'fail' : 'pass'}">
        <div class="result-header">
          <div class="component-name">${result.story.component} - ${result.story.name}</div>
          <span class="badge ${hasFailed ? 'fail' : 'pass'}">${hasFailed ? '❌ FAIL' : '✅ PASS'}</span>
        </div>
        ${
          hasFailed
            ? `
          <div class="violations">
            ${result.violations
              .map(
                (v: any) => `
              <div class="violation">
                <span class="violation-impact impact-${v.impact}">${v.impact.toUpperCase()}</span>
                <div class="violation-description"><strong>${v.id}:</strong> ${v.description}</div>
                <div class="violation-help">${v.help} <a href="${v.helpUrl}" target="_blank">Learn more →</a></div>
                <div><strong>Affected elements:</strong> ${v.nodes.length}</div>
              </div>
            `
              )
              .join('')}
          </div>
        `
            : '<p style="color: #10B981; font-weight: 600;">✓ No accessibility violations found</p>'
        }
      </div>
    `;
    })
    .join('')}

</body>
</html>
  `;
}

// Run report generation
generateReport().catch((error) => {
  console.error('Error generating report:', error);
  process.exit(1);
});
