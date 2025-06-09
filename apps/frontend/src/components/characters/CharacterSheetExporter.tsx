// @ts-nocheck
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
  RadioGroup,
  Radio,
  Select,
  MenuItem,
  InputLabel,
  Stack,
  Card,
  CardContent,
  Box,
  Alert,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
} from '@mui/material';
import {
  PictureAsPdf,
  TableChart,
  Print,
  Code,
  Download,
  Person,
  Group,
  Settings,
  CheckCircle,
  Error,
} from '@mui/icons-material';
import { useRecoilValue } from 'recoil';
import { currentCampaignState } from '../../store/atoms';
import { TRPGCharacter } from '@trpg-ai-gm/types';
import CharacterSheetExporter, { ExportOptions } from '../../utils/CharacterSheetExporter';

interface CharacterSheetExporterProps {
  open: boolean;
  onClose: () => void;
  characters: TRPGCharacter[];
  selectedCharacters?: string[]; // キャラクターIDの配列
}

interface ExportProgress {
  isExporting: boolean;
  current: number;
  total: number;
  currentCharacter?: string;
  completed: string[];
  errors: { character: string; error: string }[];
}

export const CharacterSheetExporterComponent: React.FC<CharacterSheetExporterProps> = ({
  open,
  onClose,
  characters,
  selectedCharacters = [],
}) => {
  const currentCampaign = useRecoilValue(currentCampaignState);
  
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'pdf',
    includePortrait: true,
    includeSpells: true,
    includeEquipment: true,
    includeNotes: true,
    gameSystem: currentCampaign?.gameSystem || 'dnd5e',
    template: 'official',
  });

  const [exportMode, setExportMode] = useState<'selected' | 'all'>('selected');
  const [progress, setProgress] = useState<ExportProgress>({
    isExporting: false,
    current: 0,
    total: 0,
    completed: [],
    errors: [],
  });

  // エクスポート対象キャラクター
  const targetCharacters = exportMode === 'all' 
    ? characters 
    : characters.filter(char => selectedCharacters.includes(char.id));

  // エクスポート実行
  const handleExport = async () => {
    if (!currentCampaign || targetCharacters.length === 0) {
      console.error('キャンペーンまたはキャラクターが選択されていません');
      return;
    }

    const exporter = new CharacterSheetExporter(exportOptions.gameSystem);
    
    setProgress({
      isExporting: true,
      current: 0,
      total: targetCharacters.length,
      completed: [],
      errors: [],
    });

    try {
      if (exportOptions.format === 'csv') {
        // CSV は一括エクスポート
        const csvData = exporter.exportToCSV(targetCharacters, currentCampaign, exportOptions);
        downloadFile(csvData, 'characters.csv', 'text/csv');
        
        setProgress(prev => ({
          ...prev,
          isExporting: false,
          current: prev.total,
          completed: targetCharacters.map(char => char.name),
        }));
      } else {
        // 個別エクスポート
        for (let i = 0; i < targetCharacters.length; i++) {
          const character = targetCharacters[i];
          
          setProgress(prev => ({
            ...prev,
            current: i + 1,
            currentCharacter: character.name,
          }));

          try {
            await exportSingleCharacter(exporter, character, exportOptions);
            
            setProgress(prev => ({
              ...prev,
              completed: [...prev.completed, character.name],
            }));
          } catch (error) {
            setProgress(prev => ({
              ...prev,
              errors: [...prev.errors, {
                character: character.name,
                error: error instanceof Error ? error.message : 'Unknown error'
              }],
            }));
          }

          // UI更新のための小さな遅延
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        setProgress(prev => ({ ...prev, isExporting: false }));
      }
    } catch (error) {
      console.error('Export error:', error);
      setProgress(prev => ({
        ...prev,
        isExporting: false,
        errors: [{
          character: 'General',
          error: error instanceof Error ? error.message : 'Export failed'
        }],
      }));
    }
  };

  // 単一キャラクターエクスポート
  const exportSingleCharacter = async (
    exporter: CharacterSheetExporter,
    character: TRPGCharacter,
    options: ExportOptions
  ) => {
    const filename = `${character.name.replace(/[^a-zA-Z0-9]/g, '_')}_sheet`;
    
    switch (options.format) {
      case 'pdf':
        const pdfBlob = await exporter.exportToPDF(character, currentCampaign!, options);
        downloadFile(pdfBlob, `${filename}.pdf`, 'application/pdf');
        break;
        
      case 'json':
        const jsonData = exporter.exportToJSON([character], currentCampaign!, options);
        downloadFile(jsonData, `${filename}.json`, 'application/json');
        break;
        
      case 'print':
        const htmlData = exporter.generatePrintHTML(character, currentCampaign!, options);
        openPrintWindow(htmlData, character.name);
        break;
    }
  };

  // ファイルダウンロード
  const downloadFile = (data: Blob | string, filename: string, mimeType: string) => {
    const blob = data instanceof Blob ? data : new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  // 印刷ウィンドウを開く
  const openPrintWindow = (htmlContent: string, title: string) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
    }
  };

  // プログレス表示
  const getProgressPercentage = () => {
    return progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Stack direction="row" spacing={2} alignItems="center">
          <Download color="primary" />
          <Typography variant="h6">キャラクターシートエクスポート</Typography>
        </Stack>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3}>
          {/* キャンペーン情報 */}
          <Alert severity="info">
            <strong>キャンペーン</strong>: {currentCampaign?.title}<br />
            <strong>ゲームシステム</strong>: {currentCampaign?.gameSystem}
          </Alert>

          {/* エクスポート対象選択 */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Group sx={{ verticalAlign: 'middle', mr: 1 }} />
                エクスポート対象
              </Typography>
              
              <FormControl component="fieldset">
                <RadioGroup
                  value={exportMode}
                  onChange={(e) => setExportMode(e.target.value as 'selected' | 'all')}
                >
                  <FormControlLabel
                    value="selected"
                    control={<Radio />}
                    label={`選択されたキャラクター (${targetCharacters.length}人)`}
                    disabled={selectedCharacters.length === 0}
                  />
                  <FormControlLabel
                    value="all"
                    control={<Radio />}
                    label={`全キャラクター (${characters.length}人)`}
                  />
                </RadioGroup>
              </FormControl>

              {targetCharacters.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    エクスポート対象キャラクター:
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {targetCharacters.map(char => (
                      <Chip key={char.id} label={char.name} size="small" />
                    ))}
                  </Stack>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* エクスポート設定 */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Settings sx={{ verticalAlign: 'middle', mr: 1 }} />
                エクスポート設定
              </Typography>

              <Stack spacing={2}>
                {/* 出力形式 */}
                <FormControl fullWidth>
                  <InputLabel>出力形式</InputLabel>
                  <Select
                    value={exportOptions.format}
                    onChange={(e) => setExportOptions(prev => ({ 
                      ...prev, 
                      format: e.target.value as ExportOptions['format'] 
                    }))}
                  >
                    <MenuItem value="pdf">
                      <Stack direction="row" spacing={1} alignItems="center">
                        <PictureAsPdf />
                        <span>PDF (推奨)</span>
                      </Stack>
                    </MenuItem>
                    <MenuItem value="csv">
                      <Stack direction="row" spacing={1} alignItems="center">
                        <TableChart />
                        <span>CSV (データ分析用)</span>
                      </Stack>
                    </MenuItem>
                    <MenuItem value="json">
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Code />
                        <span>JSON (バックアップ用)</span>
                      </Stack>
                    </MenuItem>
                    <MenuItem value="print">
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Print />
                        <span>印刷用HTML</span>
                      </Stack>
                    </MenuItem>
                  </Select>
                </FormControl>

                {/* テンプレート選択 */}
                {exportOptions.format === 'pdf' && (
                  <FormControl fullWidth>
                    <InputLabel>テンプレート</InputLabel>
                    <Select
                      value={exportOptions.template}
                      onChange={(e) => setExportOptions(prev => ({ 
                        ...prev, 
                        template: e.target.value as ExportOptions['template'] 
                      }))}
                    >
                      <MenuItem value="official">公式スタイル</MenuItem>
                      <MenuItem value="compact">コンパクト</MenuItem>
                      <MenuItem value="detailed">詳細版</MenuItem>
                    </Select>
                  </FormControl>
                )}

                {/* 含める要素 */}
                <FormControl component="fieldset">
                  <FormLabel component="legend">含める要素</FormLabel>
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={exportOptions.includePortrait}
                          onChange={(e) => setExportOptions(prev => ({ 
                            ...prev, 
                            includePortrait: e.target.checked 
                          }))}
                        />
                      }
                      label="キャラクターポートレート"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={exportOptions.includeSpells}
                          onChange={(e) => setExportOptions(prev => ({ 
                            ...prev, 
                            includeSpells: e.target.checked 
                          }))}
                        />
                      }
                      label="呪文・能力"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={exportOptions.includeEquipment}
                          onChange={(e) => setExportOptions(prev => ({ 
                            ...prev, 
                            includeEquipment: e.target.checked 
                          }))}
                        />
                      }
                      label="装備・アイテム"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={exportOptions.includeNotes}
                          onChange={(e) => setExportOptions(prev => ({ 
                            ...prev, 
                            includeNotes: e.target.checked 
                          }))}
                        />
                      }
                      label="メモ・備考"
                    />
                  </FormGroup>
                </FormControl>
              </Stack>
            </CardContent>
          </Card>

          {/* プログレス表示 */}
          {progress.isExporting && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  エクスポート中...
                </Typography>
                
                <LinearProgress 
                  variant="determinate" 
                  value={getProgressPercentage()} 
                  sx={{ mb: 2 }}
                />
                
                <Typography variant="body2" color="text.secondary">
                  {progress.current} / {progress.total} 
                  {progress.currentCharacter && ` - 現在: ${progress.currentCharacter}`}
                </Typography>
              </CardContent>
            </Card>
          )}

          {/* 結果表示 */}
          {!progress.isExporting && (progress.completed.length > 0 || progress.errors.length > 0) && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  エクスポート結果
                </Typography>
                
                {progress.completed.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      <CheckCircle color="success" sx={{ verticalAlign: 'middle', mr: 1 }} />
                      完了 ({progress.completed.length}件)
                    </Typography>
                    <List dense>
                      {progress.completed.map(name => (
                        <ListItem key={name}>
                          <ListItemIcon>
                            <CheckCircle color="success" />
                          </ListItemIcon>
                          <ListItemText primary={name} />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}

                {progress.errors.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      <Error color="error" sx={{ verticalAlign: 'middle', mr: 1 }} />
                      エラー ({progress.errors.length}件)
                    </Typography>
                    <List dense>
                      {progress.errors.map((error, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <Error color="error" />
                          </ListItemIcon>
                          <ListItemText 
                            primary={error.character}
                            secondary={error.error}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
              </CardContent>
            </Card>
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={progress.isExporting}>
          {progress.isExporting ? 'エクスポート中...' : 'キャンセル'}
        </Button>
        <Button
          variant="contained"
          onClick={handleExport}
          disabled={progress.isExporting || targetCharacters.length === 0}
          startIcon={<Download />}
        >
          エクスポート開始
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CharacterSheetExporterComponent;