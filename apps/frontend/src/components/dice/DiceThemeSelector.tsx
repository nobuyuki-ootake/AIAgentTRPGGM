// @ts-nocheck
import React, { useState } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Tooltip,
} from '@mui/material';
import {
  Palette as PaletteIcon,
  Preview as PreviewIcon,
  Casino as DiceIcon,
} from '@mui/icons-material';
import { DiceTheme, DICE_THEMES } from './DiceTheme';
import DiceVisualization from './DiceVisualization';

interface DiceThemeSelectorProps {
  selectedTheme: string;
  onThemeChange: (themeKey: string) => void;
  showPreview?: boolean;
  compact?: boolean;
}

const DiceThemeSelector: React.FC<DiceThemeSelectorProps> = ({
  selectedTheme,
  onThemeChange,
  showPreview = true,
  compact = false,
}) => {
  const [previewDialog, setPreviewDialog] = useState(false);
  const [previewTheme, setPreviewTheme] = useState<string>('classic');

  const currentTheme = DICE_THEMES[selectedTheme] || DICE_THEMES.classic;

  const handlePreview = (themeKey: string) => {
    setPreviewTheme(themeKey);
    setPreviewDialog(true);
  };

  const getDiceTypes = (): Array<'d4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20'> => {
    return ['d4', 'd6', 'd8', 'd10', 'd12', 'd20'];
  };

  const getMaterialIcon = (material: string) => {
    switch (material) {
      case 'metallic': return '⚡';
      case 'glass': return '💎';
      case 'neon': return '🌟';
      default: return '⚪';
    }
  };

  if (compact) {
    return (
      <FormControl size="small" sx={{ minWidth: 120 }}>
        <InputLabel>ダイステーマ</InputLabel>
        <Select
          value={selectedTheme}
          onChange={(e) => onThemeChange(e.target.value)}
          label="ダイステーマ"
        >
          {Object.entries(DICE_THEMES).map(([key, theme]) => (
            <MenuItem key={key} value={key}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>{getMaterialIcon(theme.material || 'standard')}</span>
                {theme.name}
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    );
  }

  return (
    <Box>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <PaletteIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
            ダイステーマ設定
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            ダイスの外観とマテリアルを選択してください
          </Typography>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>テーマ</InputLabel>
            <Select
              value={selectedTheme}
              onChange={(e) => onThemeChange(e.target.value)}
              label="テーマ"
            >
              {Object.entries(DICE_THEMES).map(([key, theme]) => (
                <MenuItem key={key} value={key}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                    <span>{getMaterialIcon(theme.material || 'standard')}</span>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography>{theme.name}</Typography>
                    </Box>
                    {showPreview && (
                      <Tooltip title="プレビュー">
                        <Button
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePreview(key);
                          }}
                          startIcon={<PreviewIcon />}
                        >
                          プレビュー
                        </Button>
                      </Tooltip>
                    )}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* 現在のテーマの詳細 */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              現在のテーマ: {currentTheme.name}
            </Typography>
            
            <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
              <Chip 
                label={`マテリアル: ${currentTheme.material || 'standard'}`} 
                size="small" 
                icon={<span>{getMaterialIcon(currentTheme.material || 'standard')}</span>}
              />
              {currentTheme.glowEffect && (
                <Chip 
                  label="グロー効果" 
                  size="small" 
                  color="primary"
                  icon={<span>✨</span>}
                />
              )}
            </Stack>

            {/* カラーパレット */}
            <Box>
              <Typography variant="body2" sx={{ mb: 1 }}>
                ダイスカラー:
              </Typography>
              <Grid container spacing={1}>
                {getDiceTypes().map((diceType) => (
                  <Grid item key={diceType}>
                    <Tooltip title={`${diceType.toUpperCase()}: ${currentTheme.colors[diceType]}`}>
                      <Box
                        sx={{
                          width: 24,
                          height: 24,
                          backgroundColor: currentTheme.colors[diceType],
                          borderRadius: 1,
                          border: '1px solid rgba(0,0,0,0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.6rem',
                          color: currentTheme.textColor || 'white',
                          fontWeight: 'bold',
                        }}
                      >
                        {diceType.substring(1)}
                      </Box>
                    </Tooltip>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Box>

          {/* サンプル表示 */}
          {showPreview && (
            <Box sx={{ textAlign: 'center' }}>
              <Button
                variant="outlined"
                onClick={() => handlePreview(selectedTheme)}
                startIcon={<DiceIcon />}
              >
                全ダイスをプレビュー
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* プレビューダイアログ */}
      <Dialog
        open={previewDialog}
        onClose={() => setPreviewDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          ダイステーマプレビュー: {DICE_THEMES[previewTheme]?.name}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            {getDiceTypes().map((diceType) => (
              <Grid item xs={6} sm={4} md={2} key={diceType}>
                <Card>
                  <CardContent sx={{ textAlign: 'center', pb: 1 }}>
                    <Typography variant="caption" display="block" gutterBottom>
                      {diceType.toUpperCase()}
                    </Typography>
                    <Box sx={{ height: 150 }}>
                      <DiceVisualization
                        diceType={diceType}
                        result={Math.floor(Math.random() * parseInt(diceType.substring(1))) + 1}
                        theme={DICE_THEMES[previewTheme]}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              テーマ詳細:
            </Typography>
            <Stack direction="row" spacing={1}>
              <Chip 
                label={`マテリアル: ${DICE_THEMES[previewTheme]?.material || 'standard'}`} 
                size="small" 
              />
              <Chip 
                label={`テキスト色: ${DICE_THEMES[previewTheme]?.textColor || 'white'}`} 
                size="small" 
              />
              {DICE_THEMES[previewTheme]?.glowEffect && (
                <Chip 
                  label="グロー効果あり" 
                  size="small" 
                  color="primary"
                />
              )}
            </Stack>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialog(false)}>
            閉じる
          </Button>
          <Button 
            onClick={() => {
              onThemeChange(previewTheme);
              setPreviewDialog(false);
            }}
            variant="contained"
          >
            このテーマを使用
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DiceThemeSelector;