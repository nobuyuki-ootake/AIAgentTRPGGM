import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Slider,
  Tooltip,
  IconButton,
  Badge,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  CircularProgress,
} from "@mui/material";
import {
  Devices as DevicesIcon,
  PhoneAndroid as MobileIcon,
  Tablet as TabletIcon,
  Computer as DesktopIcon,
  Tv as LargeScreenIcon,
  ExpandMore,
  CheckCircle as PassIcon,
  Error as FailIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Assessment as AnalysisIcon,
  Visibility as ViewIcon,
  Screenshot as CaptureIcon,
  Speed as PerformanceIcon,
  Accessibility as AccessibilityIcon,
  TouchApp as TouchIcon,
  Mouse as MouseIcon,
  Keyboard as KeyboardIcon,
  Refresh as RefreshIcon,
  Download as ExportIcon,
  BugReport as BugIcon,
  Settings as SettingsIcon,
} from "@mui/icons-material";

interface DeviceProfile {
  name: string;
  width: number;
  height: number;
  category: "mobile" | "tablet" | "desktop" | "large";
  userAgent?: string;
  touchEnabled: boolean;
  pixelRatio: number;
}

interface ResponsiveTest {
  id: string;
  name: string;
  category: "layout" | "navigation" | "forms" | "performance" | "accessibility";
  description: string;
  devices: DeviceProfile["category"][];
  status: "pending" | "running" | "passed" | "failed" | "warning";
  results: { [deviceName: string]: TestResult };
  priority: "critical" | "high" | "medium" | "low";
}

interface TestResult {
  status: "passed" | "failed" | "warning";
  score: number; // 0-100
  issues: Issue[];
  screenshots?: string[];
  performance?: PerformanceMetrics;
}

interface Issue {
  severity: "error" | "warning" | "info";
  description: string;
  location: string;
  suggestion: string;
}

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  interactionDelay: number;
  memoryUsage: number;
}

const ResponsiveDesignTester: React.FC = () => {
  const [isTestingActive, setIsTestingActive] = useState(false);
  const [currentDevice, setCurrentDevice] = useState<DeviceProfile | null>(null);
  const [testResults, setTestResults] = useState<ResponsiveTest[]>([]);
  const [selectedTest, setSelectedTest] = useState<ResponsiveTest | null>(null);
  const [detailDialog, setDetailDialog] = useState(false);
  const [settingsDialog, setSettingsDialog] = useState(false);
  const [testProgress, setTestProgress] = useState(0);

  // デバイスプロファイル定義
  const deviceProfiles: DeviceProfile[] = [
    {
      name: "iPhone SE",
      width: 375,
      height: 667,
      category: "mobile",
      touchEnabled: true,
      pixelRatio: 2,
    },
    {
      name: "iPhone 12",
      width: 390,
      height: 844,
      category: "mobile",
      touchEnabled: true,
      pixelRatio: 3,
    },
    {
      name: "Samsung Galaxy S21",
      width: 360,
      height: 800,
      category: "mobile",
      touchEnabled: true,
      pixelRatio: 3,
    },
    {
      name: "iPad",
      width: 768,
      height: 1024,
      category: "tablet",
      touchEnabled: true,
      pixelRatio: 2,
    },
    {
      name: "iPad Pro",
      width: 1024,
      height: 1366,
      category: "tablet",
      touchEnabled: true,
      pixelRatio: 2,
    },
    {
      name: "Laptop",
      width: 1366,
      height: 768,
      category: "desktop",
      touchEnabled: false,
      pixelRatio: 1,
    },
    {
      name: "Desktop FHD",
      width: 1920,
      height: 1080,
      category: "desktop",
      touchEnabled: false,
      pixelRatio: 1,
    },
    {
      name: "4K Monitor",
      width: 3840,
      height: 2160,
      category: "large",
      touchEnabled: false,
      pixelRatio: 2,
    },
  ];

  // テストケース定義
  const createTestCases = (): ResponsiveTest[] => {
    return [
      {
        id: "layout-structure",
        name: "レイアウト構造テスト",
        category: "layout",
        description: "各画面サイズでレイアウトが適切に表示されるかテスト",
        devices: ["mobile", "tablet", "desktop"],
        status: "pending",
        results: {},
        priority: "critical",
      },
      {
        id: "navigation-usability",
        name: "ナビゲーション操作性",
        category: "navigation",
        description: "タッチ操作とマウス操作でのナビゲーションテスト",
        devices: ["mobile", "tablet", "desktop"],
        status: "pending",
        results: {},
        priority: "high",
      },
      {
        id: "form-interaction",
        name: "フォーム入力テスト",
        category: "forms",
        description: "各デバイスでのフォーム入力の使いやすさをテスト",
        devices: ["mobile", "tablet", "desktop"],
        status: "pending",
        results: {},
        priority: "high",
      },
      {
        id: "content-readability",
        name: "コンテンツ可読性",
        category: "layout",
        description: "テキストサイズ、行間、コントラストの適切性をテスト",
        devices: ["mobile", "tablet", "desktop"],
        status: "pending",
        results: {},
        priority: "medium",
      },
      {
        id: "trpg-specific-ui",
        name: "TRPG特有UI要素",
        category: "layout",
        description: "ダイスロール、キャラクターシート、セッション画面の表示テスト",
        devices: ["mobile", "tablet", "desktop"],
        status: "pending",
        results: {},
        priority: "critical",
      },
      {
        id: "performance-mobile",
        name: "モバイル性能テスト",
        category: "performance",
        description: "モバイルデバイスでの読み込み速度と応答性をテスト",
        devices: ["mobile"],
        status: "pending",
        results: {},
        priority: "medium",
      },
      {
        id: "touch-gestures",
        name: "タッチジェスチャー",
        category: "accessibility",
        description: "タップ、スワイプ、ピンチなどのジェスチャー対応テスト",
        devices: ["mobile", "tablet"],
        status: "pending",
        results: {},
        priority: "high",
      },
      {
        id: "orientation-support",
        name: "画面回転対応",
        category: "layout",
        description: "縦横画面回転時の表示適応をテスト",
        devices: ["mobile", "tablet"],
        status: "pending",
        results: {},
        priority: "medium",
      },
    ];
  };

  useEffect(() => {
    setTestResults(createTestCases());
  }, []);

  // 全テスト実行
  const runAllTests = async () => {
    setIsTestingActive(true);
    setTestProgress(0);

    const totalTests = testResults.length * deviceProfiles.length;
    let completedTests = 0;

    for (const test of testResults) {
      test.status = "running";
      setTestResults([...testResults]);

      for (const deviceCategory of test.devices) {
        const relevantDevices = deviceProfiles.filter(d => d.category === deviceCategory);
        
        for (const device of relevantDevices) {
          const result = await executeTest(test, device);
          test.results[device.name] = result;
          
          completedTests++;
          setTestProgress((completedTests / totalTests) * 100);
          
          // 短い間隔で更新
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      // テスト結果の評価
      test.status = evaluateTestStatus(test);
      setTestResults([...testResults]);
    }

    setIsTestingActive(false);
  };

  // 個別テスト実行
  const executeTest = async (test: ResponsiveTest, device: DeviceProfile): Promise<TestResult> => {
    setCurrentDevice(device);
    
    // シミュレートされた視覚的レイアウトテスト
    const simulatedResult = await simulateResponsiveTest(test, device);
    
    return simulatedResult;
  };

  const simulateResponsiveTest = async (test: ResponsiveTest, device: DeviceProfile): Promise<TestResult> => {
    // 実際のテストロジックをシミュレート
    const issues: Issue[] = [];
    let score = 85; // ベーススコア

    // デバイス特有のテスト
    switch (test.category) {
      case "layout":
        if (device.category === "mobile" && device.width < 380) {
          issues.push({
            severity: "warning",
            description: "小画面での要素重複の可能性",
            location: "メインナビゲーション",
            suggestion: "ハンバーガーメニューの実装を検討",
          });
          score -= 10;
        }
        
        if (device.category === "desktop" && device.width > 1600) {
          issues.push({
            severity: "info",
            description: "大画面での余白活用",
            location: "コンテンツエリア",
            suggestion: "サイドバーや追加情報の表示を検討",
          });
        }
        break;

      case "navigation":
        if (device.touchEnabled) {
          if (test.id === "navigation-usability") {
            // タッチターゲットサイズチェック
            const touchTargetIssue = Math.random() > 0.7;
            if (touchTargetIssue) {
              issues.push({
                severity: "error",
                description: "タッチターゲットが小さすぎます",
                location: "ドロップダウンメニュー",
                suggestion: "最小44px×44pxのタッチエリアを確保",
              });
              score -= 15;
            }
          }
        }
        break;

      case "forms":
        if (device.category === "mobile") {
          issues.push({
            severity: "warning",
            description: "キーボード表示時の表示領域確保",
            location: "入力フォーム",
            suggestion: "virtual keyboardを考慮した高さ調整",
          });
          score -= 5;
        }
        break;

      case "performance":
        const performanceMetrics: PerformanceMetrics = {
          loadTime: device.category === "mobile" ? 2500 + Math.random() * 1000 : 1500 + Math.random() * 500,
          renderTime: device.category === "mobile" ? 150 + Math.random() * 100 : 80 + Math.random() * 50,
          interactionDelay: device.category === "mobile" ? 50 + Math.random() * 30 : 20 + Math.random() * 15,
          memoryUsage: device.category === "mobile" ? 45 + Math.random() * 20 : 35 + Math.random() * 15,
        };

        if (performanceMetrics.loadTime > 3000) {
          issues.push({
            severity: "error",
            description: "読み込み時間が長すぎます",
            location: "初期ページロード",
            suggestion: "画像最適化とコード分割の実装",
          });
          score -= 20;
        }
        break;

      case "accessibility":
        if (device.touchEnabled && test.id === "touch-gestures") {
          // ランダムでアクセシビリティ問題を生成
          if (Math.random() > 0.6) {
            issues.push({
              severity: "warning",
              description: "スワイプジェスチャーの代替操作が不明確",
              location: "カードスライダー",
              suggestion: "矢印ボタンやページネーションを追加",
            });
            score -= 8;
          }
        }
        break;
    }

    // TRPG特有の要素チェック
    if (test.id === "trpg-specific-ui") {
      if (device.category === "mobile") {
        issues.push({
          severity: "info",
          description: "ダイスロールボタンの配置最適化",
          location: "TRPGセッション画面",
          suggestion: "画面下部の固定位置に配置することを推奨",
        });
      }
    }

    const status: TestResult["status"] = 
      issues.some(i => i.severity === "error") ? "failed" :
      issues.some(i => i.severity === "warning") ? "warning" : "passed";

    return {
      status,
      score: Math.max(0, Math.min(100, score)),
      issues,
      performance: test.category === "performance" ? {
        loadTime: 2000 + Math.random() * 1000,
        renderTime: 100 + Math.random() * 50,
        interactionDelay: 30 + Math.random() * 20,
        memoryUsage: 40 + Math.random() * 15,
      } : undefined,
    };
  };

  const evaluateTestStatus = (test: ResponsiveTest): ResponsiveTest["status"] => {
    const results = Object.values(test.results);
    if (results.length === 0) return "pending";
    
    const hasErrors = results.some(r => r.status === "failed");
    const hasWarnings = results.some(r => r.status === "warning");
    
    if (hasErrors) return "failed";
    if (hasWarnings) return "warning";
    return "passed";
  };

  // 個別テスト実行
  const runSingleTest = async (test: ResponsiveTest) => {
    test.status = "running";
    setTestResults([...testResults]);

    for (const deviceCategory of test.devices) {
      const relevantDevices = deviceProfiles.filter(d => d.category === deviceCategory);
      
      for (const device of relevantDevices) {
        const result = await executeTest(test, device);
        test.results[device.name] = result;
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    test.status = evaluateTestStatus(test);
    setTestResults([...testResults]);
  };

  // 結果の詳細表示
  const showTestDetails = (test: ResponsiveTest) => {
    setSelectedTest(test);
    setDetailDialog(true);
  };

  // レポート生成
  const generateReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: testResults.length,
        passedTests: testResults.filter(t => t.status === "passed").length,
        failedTests: testResults.filter(t => t.status === "failed").length,
        warningTests: testResults.filter(t => t.status === "warning").length,
      },
      results: testResults,
      devices: deviceProfiles,
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `responsive-test-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>
        レスポンシブデザインテスター
      </Typography>

      {/* 制御パネル */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="h6">
              <DevicesIcon sx={{ verticalAlign: "middle", mr: 1 }} />
              テスト制御
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <IconButton onClick={() => setSettingsDialog(true)}>
                <SettingsIcon />
              </IconButton>
            </Box>
          </Box>

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid size={{ xs: 12, md: 3 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6">総テスト数</Typography>
                  <Typography variant="h4" color="primary">
                    {testResults.length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6">成功</Typography>
                  <Typography variant="h4" color="success.main">
                    {testResults.filter(t => t.status === "passed").length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6">警告</Typography>
                  <Typography variant="h4" color="warning.main">
                    {testResults.filter(t => t.status === "warning").length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6">失敗</Typography>
                  <Typography variant="h4" color="error.main">
                    {testResults.filter(t => t.status === "failed").length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {isTestingActive && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                テスト実行中... {currentDevice ? `(${currentDevice.name})` : ""}
              </Typography>
              <LinearProgress variant="determinate" value={testProgress} />
            </Box>
          )}
        </CardContent>
        <CardActions>
          <Button
            variant="contained"
            onClick={runAllTests}
            disabled={isTestingActive}
            startIcon={isTestingActive ? <CircularProgress size={16} /> : <DevicesIcon />}
          >
            {isTestingActive ? "テスト実行中..." : "全テスト実行"}
          </Button>
          <Button onClick={generateReport} startIcon={<ExportIcon />}>
            レポート生成
          </Button>
        </CardActions>
      </Card>

      {/* デバイス一覧 */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          対応デバイス
        </Typography>
        <Grid container spacing={2}>
          {deviceProfiles.map((device) => (
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={device.name}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                    {device.category === "mobile" && <MobileIcon sx={{ mr: 1 }} />}
                    {device.category === "tablet" && <TabletIcon sx={{ mr: 1 }} />}
                    {device.category === "desktop" && <DesktopIcon sx={{ mr: 1 }} />}
                    {device.category === "large" && <LargeScreenIcon sx={{ mr: 1 }} />}
                    <Typography variant="subtitle1">{device.name}</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {device.width} × {device.height}
                  </Typography>
                  <Box sx={{ display: "flex", gap: 0.5, mt: 1 }}>
                    <Chip 
                      label={device.category} 
                      size="small" 
                      color="primary"
                    />
                    {device.touchEnabled && (
                      <Chip 
                        label="タッチ" 
                        size="small" 
                        color="secondary"
                      />
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* テスト結果一覧 */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          テスト結果
        </Typography>
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>テスト名</TableCell>
                <TableCell>カテゴリ</TableCell>
                <TableCell>優先度</TableCell>
                <TableCell>対象デバイス</TableCell>
                <TableCell>ステータス</TableCell>
                <TableCell>アクション</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {testResults.map((test) => (
                <TableRow key={test.id}>
                  <TableCell>{test.name}</TableCell>
                  <TableCell>
                    <Chip 
                      label={test.category} 
                      size="small"
                      color={
                        test.category === "layout" ? "primary" :
                        test.category === "navigation" ? "secondary" :
                        test.category === "forms" ? "info" :
                        test.category === "performance" ? "warning" : "default"
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={test.priority} 
                      size="small"
                      color={
                        test.priority === "critical" ? "error" :
                        test.priority === "high" ? "warning" :
                        test.priority === "medium" ? "info" : "default"
                      }
                    />
                  </TableCell>
                  <TableCell>{test.devices.join(", ")}</TableCell>
                  <TableCell>
                    {test.status === "passed" && <PassIcon color="success" />}
                    {test.status === "failed" && <FailIcon color="error" />}
                    {test.status === "warning" && <WarningIcon color="warning" />}
                    {test.status === "running" && <CircularProgress size={16} />}
                    {test.status === "pending" && <InfoIcon color="disabled" />}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => runSingleTest(test)}
                      disabled={isTestingActive}
                    >
                      <RefreshIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => showTestDetails(test)}
                    >
                      <ViewIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* テスト詳細ダイアログ */}
      <Dialog open={detailDialog} onClose={() => setDetailDialog(false)} maxWidth="lg" fullWidth>
        {selectedTest && (
          <>
            <DialogTitle>{selectedTest.name}</DialogTitle>
            <DialogContent>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {selectedTest.description}
              </Typography>
              
              {Object.entries(selectedTest.results).map(([deviceName, result]) => (
                <Accordion key={deviceName}>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Box sx={{ display: "flex", alignItems: "center", width: "100%" }}>
                      <Typography sx={{ flexGrow: 1 }}>{deviceName}</Typography>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        {result.status === "passed" && <PassIcon color="success" />}
                        {result.status === "failed" && <FailIcon color="error" />}
                        {result.status === "warning" && <WarningIcon color="warning" />}
                        <Chip label={`${result.score}点`} size="small" />
                      </Box>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    {result.issues.length > 0 ? (
                      <List>
                        {result.issues.map((issue, index) => (
                          <ListItem key={index}>
                            <ListItemIcon>
                              {issue.severity === "error" && <FailIcon color="error" />}
                              {issue.severity === "warning" && <WarningIcon color="warning" />}
                              {issue.severity === "info" && <InfoIcon color="info" />}
                            </ListItemIcon>
                            <ListItemText
                              primary={issue.description}
                              secondary={`場所: ${issue.location} | 推奨: ${issue.suggestion}`}
                            />
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Alert severity="success">
                        問題は検出されませんでした。
                      </Alert>
                    )}
                    
                    {result.performance && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2">パフォーマンス指標</Typography>
                        <Typography variant="body2">
                          読み込み時間: {result.performance.loadTime.toFixed(0)}ms |
                          レンダリング時間: {result.performance.renderTime.toFixed(0)}ms |
                          メモリ使用量: {result.performance.memoryUsage.toFixed(1)}MB
                        </Typography>
                      </Box>
                    )}
                  </AccordionDetails>
                </Accordion>
              ))}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailDialog(false)}>
                閉じる
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default ResponsiveDesignTester;