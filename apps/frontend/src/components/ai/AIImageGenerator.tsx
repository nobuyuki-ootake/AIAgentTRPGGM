/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Typography,
  Box,
  Chip,
  LinearProgress,
  Alert,
  Stack,
  IconButton,
  Tab,
  Tabs,
  Slider,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Image,
  Download,
  Close,
  ExpandMore,
  PhotoCamera,
  Map,
  Person,
  Home,
  Build,
  Landscape,
} from '@mui/icons-material';
import AIImageGenerationService, {
  ImageGenerationRequest,
  GeneratedImage,
  IMAGE_GENERATION_PRESETS,
  // GENERATION_SETTINGS, // Unused
} from '../../services/AIImageGenerationService';

interface AIImageGeneratorProps {
  open: boolean;
  onClose: () => void;
  initialPrompt?: string;
  initialType?: 'character' | 'location' | 'item' | 'scene' | 'map' | 'portrait';
  onImageSelected?: (image: GeneratedImage) => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export const AIImageGenerator: React.FC<AIImageGeneratorProps> = ({
  open,
  onClose,
  initialPrompt = '',
  initialType = 'character',
  onImageSelected,
}) => {
  const [service] = useState(() => new AIImageGenerationService());
  const [tabValue, setTabValue] = useState(0);
  
  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [generationHistory, setGenerationHistory] = useState<GeneratedImage[]>([]);
  
  // Form state
  const [prompt, setPrompt] = useState(initialPrompt);
  const [negativePrompt, setNegativePrompt] = useState('');
  const [imageType, setImageType] = useState<ImageGenerationRequest['imageType']>(initialType);
  const [style, setStyle] = useState<ImageGenerationRequest['style']>('fantasy');
  const [aspectRatio, setAspectRatio] = useState<ImageGenerationRequest['aspectRatio']>('1:1');
  const [quality, setQuality] = useState<ImageGenerationRequest['quality']>('standard');
  const [guidanceScale, setGuidanceScale] = useState(10);
  const [steps, setSteps] = useState(50);
  const [seed, setSeed] = useState<number | undefined>(undefined);
  const [useRandomSeed, setUseRandomSeed] = useState(true);
  
  // UI state
  const [error, setError] = useState<string | null>(null);
  const [estimatedCost, setEstimatedCost] = useState(0);

  // Load history on component mount
  React.useEffect(() => {
    setGenerationHistory(service.getGenerationHistory());
  }, [service]);

  // Update estimated cost when parameters change
  React.useEffect(() => {
    const request: ImageGenerationRequest = {
      prompt,
      negativePrompt,
      imageType,
      style,
      aspectRatio,
      quality,
      guidanceScale,
      steps,
      seed: useRandomSeed ? undefined : seed,
    };
    setEstimatedCost(service.calculateEstimatedCost(request));
  }, [prompt, negativePrompt, imageType, style, aspectRatio, quality, guidanceScale, steps, seed, useRandomSeed, service]);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      setError('プロンプトを入力してください');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const request: ImageGenerationRequest = {
        prompt: prompt.trim(),
        negativePrompt: negativePrompt.trim() || undefined,
        imageType,
        style,
        aspectRatio,
        quality,
        guidanceScale,
        steps,
        seed: useRandomSeed ? undefined : seed,
      };

      const result = await service.generateImage(request);

      if (result.success) {
        setGeneratedImages(result.images);
        setGenerationHistory(service.getGenerationHistory());
        setTabValue(1); // Switch to results tab
      } else {
        setError(result.error || '画像生成に失敗しました');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : '画像生成中にエラーが発生しました');
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, negativePrompt, imageType, style, aspectRatio, quality, guidanceScale, steps, seed, useRandomSeed, service]);

  // const handleImageTypeChange = (newType: ImageGenerationRequest['imageType']) => {
  //   setImageType(newType);
  //   const preset = IMAGE_GENERATION_PRESETS[newType];
  //   if (preset) {
  //     setStyle(preset.style);
  //     setAspectRatio(preset.aspectRatio);
  //     setNegativePrompt(preset.prompts.negativePrompt);
  //   }
  // };

  const handleUsePreset = (presetType: keyof typeof IMAGE_GENERATION_PRESETS) => {
    const preset = IMAGE_GENERATION_PRESETS[presetType];
    setImageType(presetType);
    setStyle(preset.style as typeof style);
    setAspectRatio(preset.aspectRatio);
    setNegativePrompt(preset.prompts.negativePrompt);
  };

  const handleImageDownload = (image: GeneratedImage) => {
    const link = document.createElement('a');
    link.href = image.url;
    link.download = `${image.id}.png`;
    link.click();
  };

  const handleImageSelect = (image: GeneratedImage) => {
    if (onImageSelected) {
      onImageSelected(image);
    }
    onClose();
  };

  const getImageTypeIcon = (type: string) => {
    switch (type) {
      case 'character': return <Person />;
      case 'location': return <Home />;
      case 'item': return <Build />;
      case 'scene': return <Landscape />;
      case 'map': return <Map />;
      case 'portrait': return <PhotoCamera />;
      default: return <Image />;
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Stack direction="row" spacing={2} alignItems="center">
          <Image color="primary" />
          <Typography variant="h6">AI画像生成</Typography>
          <Box sx={{ flexGrow: 1 }} />
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
            <Tab label="生成設定" />
            <Tab label="生成結果" />
            <Tab label="履歴" />
          </Tabs>
        </Box>

        {/* Generation Settings Tab */}
        <CustomTabPanel value={tabValue} index={0}>
          <Stack spacing={3}>
            {/* Error Display */}
            {error && (
              <Alert severity="error" onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            {/* Image Type Selection */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  画像タイプ
                </Typography>
                <Grid container spacing={2}>
                  {Object.entries(IMAGE_GENERATION_PRESETS).map(([type, _preset]) => (
                    <Grid xs={6} sm={4} md={2} key={type}>
                      <Card
                        sx={{
                          cursor: 'pointer',
                          border: imageType === type ? 2 : 1,
                          borderColor: imageType === type ? 'primary.main' : 'divider',
                        }}
                        onClick={() => handleUsePreset(type as keyof typeof IMAGE_GENERATION_PRESETS)}
                      >
                        <CardContent sx={{ textAlign: 'center', p: 2 }}>
                          {getImageTypeIcon(type)}
                          <Typography variant="caption" display="block">
                            {type}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>

            {/* Main Prompt */}
            <TextField
              label="画像の説明（プロンプト）"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              multiline
              rows={3}
              fullWidth
              placeholder="生成したい画像を詳しく説明してください..."
              disabled={isGenerating}
            />

            {/* Basic Settings */}
            <Grid container spacing={2}>
              <Grid xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>スタイル</InputLabel>
                  <Select
                    value={style}
                    onChange={(e) => setStyle(e.target.value as typeof style)}
                    disabled={isGenerating}
                  >
                    <MenuItem value="fantasy">ファンタジー</MenuItem>
                    <MenuItem value="realistic">リアリスティック</MenuItem>
                    <MenuItem value="anime">アニメ</MenuItem>
                    <MenuItem value="artistic">アーティスティック</MenuItem>
                    <MenuItem value="technical">テクニカル</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>アスペクト比</InputLabel>
                  <Select
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value as typeof aspectRatio)}
                    disabled={isGenerating}
                  >
                    <MenuItem value="1:1">正方形 (1:1)</MenuItem>
                    <MenuItem value="16:9">横長 (16:9)</MenuItem>
                    <MenuItem value="9:16">縦長 (9:16)</MenuItem>
                    <MenuItem value="4:3">横長 (4:3)</MenuItem>
                    <MenuItem value="3:4">縦長 (3:4)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>品質</InputLabel>
                  <Select
                    value={quality}
                    onChange={(e) => setQuality(e.target.value as typeof quality)}
                    disabled={isGenerating}
                  >
                    <MenuItem value="draft">ドラフト（高速）</MenuItem>
                    <MenuItem value="standard">標準</MenuItem>
                    <MenuItem value="high">高品質（低速）</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid xs={12} sm={6}>
                <Box>
                  <Typography variant="body2" color="textSecondary">
                    推定コスト: ${estimatedCost.toFixed(4)}
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            {/* Advanced Settings */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography>詳細設定</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={3}>
                  <TextField
                    label="ネガティブプロンプト"
                    value={negativePrompt}
                    onChange={(e) => setNegativePrompt(e.target.value)}
                    multiline
                    rows={2}
                    fullWidth
                    placeholder="避けたい要素を入力..."
                    disabled={isGenerating}
                  />

                  <Box>
                    <Typography gutterBottom>
                      ガイダンススケール: {guidanceScale}
                    </Typography>
                    <Slider
                      value={guidanceScale}
                      onChange={(_, value) => setGuidanceScale(value as number)}
                      min={1}
                      max={20}
                      step={0.5}
                      disabled={isGenerating}
                    />
                  </Box>

                  <Box>
                    <Typography gutterBottom>
                      ステップ数: {steps}
                    </Typography>
                    <Slider
                      value={steps}
                      onChange={(_, value) => setSteps(value as number)}
                      min={10}
                      max={150}
                      step={10}
                      disabled={isGenerating}
                    />
                  </Box>

                  <FormControlLabel
                    control={
                      <Switch
                        checked={useRandomSeed}
                        onChange={(e) => setUseRandomSeed(e.target.checked)}
                        disabled={isGenerating}
                      />
                    }
                    label="ランダムシード使用"
                  />

                  {!useRandomSeed && (
                    <TextField
                      label="シード値"
                      type="number"
                      value={seed || ''}
                      onChange={(e) => setSeed(e.target.value ? parseInt(e.target.value) : undefined)}
                      disabled={isGenerating}
                    />
                  )}
                </Stack>
              </AccordionDetails>
            </Accordion>

            {/* Generation Progress */}
            {isGenerating && (
              <Box>
                <LinearProgress />
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  画像を生成中...
                </Typography>
              </Box>
            )}
          </Stack>
        </CustomTabPanel>

        {/* Results Tab */}
        <CustomTabPanel value={tabValue} index={1}>
          <Grid container spacing={2}>
            {generatedImages.map((image) => (
              <Grid xs={12} sm={6} md={4} key={image.id}>
                <Card>
                  <CardMedia
                    component="img"
                    height="200"
                    image={image.url}
                    alt={image.prompt}
                  />
                  <CardContent>
                    <Typography variant="body2" color="textSecondary" noWrap>
                      {image.prompt}
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                      <Chip label={image.style} size="small" />
                      <Chip label={`${image.dimensions.width}×${image.dimensions.height}`} size="small" />
                    </Stack>
                  </CardContent>
                  <CardActions>
                    <Button size="small" onClick={() => handleImageDownload(image)}>
                      <Download />
                    </Button>
                    <Button size="small" onClick={() => handleImageSelect(image)}>
                      選択
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </CustomTabPanel>

        {/* History Tab */}
        <CustomTabPanel value={tabValue} index={2}>
          <Grid container spacing={2}>
            {generationHistory.slice(0, 20).map((image) => (
              <Grid xs={12} sm={6} md={4} key={image.id}>
                <Card>
                  <CardMedia
                    component="img"
                    height="150"
                    image={image.url}
                    alt={image.prompt}
                  />
                  <CardContent>
                    <Typography variant="body2" color="textSecondary" noWrap>
                      {image.prompt}
                    </Typography>
                    <Typography variant="caption" display="block">
                      {image.generatedAt.toLocaleDateString()}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button size="small" onClick={() => handleImageSelect(image)}>
                      再利用
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </CustomTabPanel>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={isGenerating}>
          キャンセル
        </Button>
        {tabValue === 0 && (
          <Button
            variant="contained"
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            startIcon={<Image />}
          >
            {isGenerating ? '生成中...' : '画像生成'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default AIImageGenerator;