import { Page } from "@playwright/test";
import fs from "fs";
import path from "path";

/**
 * TRPG Test Reporting and Analysis Utilities
 * 
 * Provides comprehensive test result reporting, analysis, and performance metrics
 */

export interface TestResult {
  testName: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
  screenshots: string[];
  performanceMetrics?: any;
  timestamp: string;
}

export interface TRPGTestReport {
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    duration: number;
    coverage: {
      campaignManagement: number;
      characterManagement: number;
      worldBuilding: number;
      sessionManagement: number;
      aiIntegration: number;
      mobileExperience: number;
    };
  };
  tests: TestResult[];
  performance: {
    averageLoadTime: number;
    memoryUsage: any;
    responsivePerformance: any;
    mobilePerformance: any;
  };
  recommendations: string[];
  generatedAt: string;
}

/**
 * Collect performance data from browser
 */
export const collectPerformanceData = async (page: Page) => {
  try {
    const performanceData = await page.evaluate(() => {
      const data = localStorage.getItem('trpg-performance-data');
      return data ? JSON.parse(data) : null;
    });

    return performanceData;
  } catch (error) {
    console.error('Failed to collect performance data:', error);
    return null;
  }
};

/**
 * Generate comprehensive test report
 */
export const generateTRPGTestReport = async (
  testResults: TestResult[],
  performanceData: any
): Promise<TRPGTestReport> => {
  const total = testResults.length;
  const passed = testResults.filter(t => t.status === 'passed').length;
  const failed = testResults.filter(t => t.status === 'failed').length;
  const skipped = testResults.filter(t => t.status === 'skipped').length;
  const totalDuration = testResults.reduce((sum, t) => sum + t.duration, 0);

  // Calculate coverage by test categories
  const coverage = {
    campaignManagement: calculateCoverage(testResults, 'campaign'),
    characterManagement: calculateCoverage(testResults, 'character'),
    worldBuilding: calculateCoverage(testResults, 'world'),
    sessionManagement: calculateCoverage(testResults, 'session'),
    aiIntegration: calculateCoverage(testResults, 'ai'),
    mobileExperience: calculateCoverage(testResults, 'mobile')
  };

  // Generate recommendations based on results
  const recommendations = generateRecommendations(testResults, performanceData);

  const report: TRPGTestReport = {
    summary: {
      total,
      passed,
      failed,
      skipped,
      duration: totalDuration,
      coverage
    },
    tests: testResults,
    performance: {
      averageLoadTime: performanceData?.startup?.totalLoadTime || 0,
      memoryUsage: performanceData?.memoryUsage || {},
      responsivePerformance: performanceData?.responsivePerformance || {},
      mobilePerformance: performanceData?.mobilePerformance || {}
    },
    recommendations,
    generatedAt: new Date().toISOString()
  };

  return report;
};

/**
 * Calculate test coverage for a specific category
 */
const calculateCoverage = (testResults: TestResult[], category: string): number => {
  const categoryTests = testResults.filter(t => 
    t.testName.toLowerCase().includes(category)
  );
  
  if (categoryTests.length === 0) return 0;
  
  const passedCategoryTests = categoryTests.filter(t => t.status === 'passed').length;
  return Math.round((passedCategoryTests / categoryTests.length) * 100);
};

/**
 * Generate actionable recommendations based on test results
 */
const generateRecommendations = (testResults: TestResult[], performanceData: any): string[] => {
  const recommendations: string[] = [];

  // Performance recommendations
  if (performanceData?.startup?.totalLoadTime > 5000) {
    recommendations.push("アプリケーションの初期ロード時間を改善することを検討してください（現在: " + performanceData.startup.totalLoadTime + "ms）");
  }

  if (performanceData?.memoryUsage?.memoryIncrease > 30) {
    recommendations.push("メモリ使用量の増加を監視し、メモリリークの可能性を調査してください");
  }

  // Test failure recommendations
  const failedTests = testResults.filter(t => t.status === 'failed');
  if (failedTests.length > 0) {
    const failuresByCategory = new Map<string, number>();
    
    failedTests.forEach(test => {
      const category = extractCategory(test.testName);
      failuresByCategory.set(category, (failuresByCategory.get(category) || 0) + 1);
    });

    failuresByCategory.forEach((count, category) => {
      if (count > 1) {
        recommendations.push(`${category}カテゴリで複数のテストが失敗しています。この領域の実装を見直してください`);
      }
    });
  }

  // Mobile recommendations
  if (performanceData?.mobilePerformance?.totalTime > 8000) {
    recommendations.push("モバイルパフォーマンスを改善してください。レスポンシブデザインの最適化を検討してください");
  }

  // Coverage recommendations
  const totalTests = testResults.length;
  const passedTests = testResults.filter(t => t.status === 'passed').length;
  const coverage = (passedTests / totalTests) * 100;

  if (coverage < 80) {
    recommendations.push("テストカバレッジを80%以上に向上させることを目標にしてください");
  }

  if (recommendations.length === 0) {
    recommendations.push("すべてのテストが良好な状態です。継続的な監視を続けてください");
  }

  return recommendations;
};

/**
 * Extract category from test name
 */
const extractCategory = (testName: string): string => {
  const categories = [
    { key: 'campaign', name: 'キャンペーン管理' },
    { key: 'character', name: 'キャラクター管理' },
    { key: 'world', name: '世界観構築' },
    { key: 'session', name: 'セッション管理' },
    { key: 'mobile', name: 'モバイル体験' },
    { key: 'performance', name: 'パフォーマンス' },
    { key: 'ai', name: 'AI統合' }
  ];

  for (const category of categories) {
    if (testName.toLowerCase().includes(category.key)) {
      return category.name;
    }
  }

  return '一般';
};

/**
 * Save test report to file
 */
export const saveTestReport = async (report: TRPGTestReport, outputPath: string = 'test-results') => {
  try {
    // Ensure output directory exists
    fs.mkdirSync(outputPath, { recursive: true });

    // Save JSON report
    const jsonPath = path.join(outputPath, 'trpg-test-report.json');
    fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));

    // Generate HTML report
    const htmlReport = generateHTMLReport(report);
    const htmlPath = path.join(outputPath, 'trpg-test-report.html');
    fs.writeFileSync(htmlPath, htmlReport);

    // Generate Markdown summary
    const markdownReport = generateMarkdownReport(report);
    const mdPath = path.join(outputPath, 'trpg-test-summary.md');
    fs.writeFileSync(markdownReport, markdownReport);

    console.log(`📊 Test report saved to:`);
    console.log(`  JSON: ${jsonPath}`);
    console.log(`  HTML: ${htmlPath}`);
    console.log(`  Markdown: ${mdPath}`);

    return { jsonPath, htmlPath, mdPath };
  } catch (error) {
    console.error('Failed to save test report:', error);
    throw error;
  }
};

/**
 * Generate HTML test report
 */
const generateHTMLReport = (report: TRPGTestReport): string => {
  const { summary, tests, performance, recommendations } = report;

  return `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TRPG E2E Test Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric-card { background: #f8f9fa; padding: 20px; border-radius: 6px; text-align: center; }
        .metric-card.passed { border-left: 4px solid #28a745; }
        .metric-card.failed { border-left: 4px solid #dc3545; }
        .metric-card.performance { border-left: 4px solid #007bff; }
        .metric-value { font-size: 2em; font-weight: bold; margin-bottom: 5px; }
        .coverage-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin: 20px 0; }
        .coverage-item { text-align: center; padding: 15px; background: #e9ecef; border-radius: 4px; }
        .coverage-value { font-size: 1.5em; font-weight: bold; }
        .tests-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .tests-table th, .tests-table td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        .tests-table th { background: #f8f9fa; font-weight: bold; }
        .status-passed { color: #28a745; }
        .status-failed { color: #dc3545; }
        .status-skipped { color: #6c757d; }
        .recommendations { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px; padding: 20px; margin: 20px 0; }
        .recommendations h3 { margin-top: 0; color: #856404; }
        .recommendations ul { margin: 10px 0; }
        .recommendations li { margin: 5px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎲 TRPG E2E Test Report</h1>
            <p>Generated on ${new Date(report.generatedAt).toLocaleString('ja-JP')}</p>
        </div>

        <div class="summary">
            <div class="metric-card passed">
                <div class="metric-value">${summary.passed}</div>
                <div>Tests Passed</div>
            </div>
            <div class="metric-card failed">
                <div class="metric-value">${summary.failed}</div>
                <div>Tests Failed</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${summary.total}</div>
                <div>Total Tests</div>
            </div>
            <div class="metric-card performance">
                <div class="metric-value">${Math.round(summary.duration / 1000)}s</div>
                <div>Total Duration</div>
            </div>
        </div>

        <h2>📊 Test Coverage by Category</h2>
        <div class="coverage-grid">
            <div class="coverage-item">
                <div class="coverage-value">${summary.coverage.campaignManagement}%</div>
                <div>Campaign Management</div>
            </div>
            <div class="coverage-item">
                <div class="coverage-value">${summary.coverage.characterManagement}%</div>
                <div>Character Management</div>
            </div>
            <div class="coverage-item">
                <div class="coverage-value">${summary.coverage.worldBuilding}%</div>
                <div>World Building</div>
            </div>
            <div class="coverage-item">
                <div class="coverage-value">${summary.coverage.sessionManagement}%</div>
                <div>Session Management</div>
            </div>
            <div class="coverage-item">
                <div class="coverage-value">${summary.coverage.aiIntegration}%</div>
                <div>AI Integration</div>
            </div>
            <div class="coverage-item">
                <div class="coverage-value">${summary.coverage.mobileExperience}%</div>
                <div>Mobile Experience</div>
            </div>
        </div>

        <h2>⚡ Performance Metrics</h2>
        <div class="summary">
            <div class="metric-card performance">
                <div class="metric-value">${Math.round(performance.averageLoadTime)}ms</div>
                <div>Average Load Time</div>
            </div>
        </div>

        <h2>📋 Test Results</h2>
        <table class="tests-table">
            <thead>
                <tr>
                    <th>Test Name</th>
                    <th>Status</th>
                    <th>Duration</th>
                    <th>Screenshots</th>
                </tr>
            </thead>
            <tbody>
                ${tests.map(test => `
                    <tr>
                        <td>${test.testName}</td>
                        <td class="status-${test.status}">${test.status.toUpperCase()}</td>
                        <td>${Math.round(test.duration)}ms</td>
                        <td>${test.screenshots.length} files</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>

        <div class="recommendations">
            <h3>💡 Recommendations</h3>
            <ul>
                ${recommendations.map(rec => `<li>${rec}</li>`).join('')}
            </ul>
        </div>
    </div>
</body>
</html>`;
};

/**
 * Generate Markdown test report summary
 */
const generateMarkdownReport = (report: TRPGTestReport): string => {
  const { summary, recommendations } = report;
  
  return `# 🎲 TRPG E2E Test Report Summary

**Generated:** ${new Date(report.generatedAt).toLocaleString('ja-JP')}

## 📊 Test Summary

| Metric | Value |
|--------|--------|
| Total Tests | ${summary.total} |
| Passed | ${summary.passed} |
| Failed | ${summary.failed} |
| Skipped | ${summary.skipped} |
| Total Duration | ${Math.round(summary.duration / 1000)}s |
| Pass Rate | ${Math.round((summary.passed / summary.total) * 100)}% |

## 📈 Coverage by Category

| Category | Coverage |
|----------|----------|
| Campaign Management | ${summary.coverage.campaignManagement}% |
| Character Management | ${summary.coverage.characterManagement}% |
| World Building | ${summary.coverage.worldBuilding}% |
| Session Management | ${summary.coverage.sessionManagement}% |
| AI Integration | ${summary.coverage.aiIntegration}% |
| Mobile Experience | ${summary.coverage.mobileExperience}% |

## 💡 Recommendations

${recommendations.map(rec => `- ${rec}`).join('\n')}

## 🔗 Additional Resources

- [Full HTML Report](./trpg-test-report.html)
- [Detailed JSON Results](./trpg-test-report.json)
- [Test Screenshots](./screenshots/)

---
*Report generated by TRPG E2E Testing Framework*
`;
};

/**
 * Create test execution summary for CI/CD integration
 */
export const createCISummary = (report: TRPGTestReport): string => {
  const { summary } = report;
  const passRate = Math.round((summary.passed / summary.total) * 100);
  
  return `
🎲 TRPG E2E Test Results:
✅ Passed: ${summary.passed}
❌ Failed: ${summary.failed}
⏭️ Skipped: ${summary.skipped}
📊 Pass Rate: ${passRate}%
⏱️ Duration: ${Math.round(summary.duration / 1000)}s

${summary.failed > 0 ? '⚠️ Some tests failed. Please review the detailed report.' : '🎉 All tests passed!'}
`;
};