/**
 * Storybook Test Runner Configuration
 *
 * Automatically runs axe accessibility tests on all Storybook stories.
 * Integrates with @storybook/test-runner to provide automated a11y testing.
 *
 * Run: npm run test:storybook
 */

import type { TestRunnerConfig } from '@storybook/test-runner';
import { injectAxe, checkA11y, getViolations } from 'axe-playwright';

const config: TestRunnerConfig = {
  async preVisit(page) {
    // Inject axe-core into every story before testing
    await injectAxe(page);
  },

  async postVisit(page, context) {
    // Run axe accessibility checks after story loads
    await checkA11y(page, '#storybook-root', {
      detailedReport: true,
      detailedReportOptions: {
        html: true,
      },
      // WCAG 2.1 AA compliance
      axeOptions: {
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
        },
      },
    });

    // Log violations to console for CI/CD
    const violations = await getViolations(page, '#storybook-root');
    if (violations.length > 0) {
      console.error(
        `Accessibility violations found in story: ${context.title}`,
        violations
      );
    }
  },
};

export default config;
