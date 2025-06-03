import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Chip,
  Alert,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Divider,
  CircularProgress,
  LinearProgress,
  Stack,
  IconButton,
} from '@mui/material';
import {
  Close,
  AutoAwesome,
  CheckCircle,
  Error as ErrorIcon,
  Info,
  Campaign,
  Group,
  Map,
  Timeline,
  Settings,
} from '@mui/icons-material';
import { TRPGCampaign, TRPGCharacter, BaseLocation } from '@trpg-ai-gm/types';
import { useAIChatIntegration } from '../../hooks/useAIChatIntegration';
import { v4 as uuidv4 } from 'uuid';

interface CampaignCreationWizardProps {
  open: boolean;
  onClose: () => void;
  onComplete: (campaign: TRPGCampaign) => void;
}

interface WizardStep {
  label: string;
  description: string;
  icon: React.ReactNode;
}

interface BasicSettings {
  title: string;
  synopsis: string;
  gameSystem: string;
  genre: string;
  maxDays: number;
  maxPlayers: number;
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

interface WorldSettings {
  worldName: string;
  worldType: 'fantasy' | 'modern' | 'scifi' | 'historical' | 'custom';
  cultureStyle: string;
  technologyLevel: string;
  magicLevel: string;
  aiWorldGeneration: boolean;
}

interface CharacterSettings {
  startingLevel: number;
  allowedRaces: string[];
  allowedClasses: string[];
  startingGold: number;
  aiCharacterGeneration: boolean;
  pcCount: number;
  npcCount: number;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

const steps: WizardStep[] = [
  {
    label: 'キャンペーン基本設定',
    description: 'タイトル、ゲームシステム、難易度などの基本情報',
    icon: <Campaign />
  },
  {
    label: '世界観構築',
    description: '世界設定、文化、技術レベルなどの環境設定',
    icon: <Map />
  },
  {
    label: 'キャラクター設定',
    description: 'PC/NPCの初期設定とルール設定',
    icon: <Group />
  },
  {
    label: 'ストーリー構成',
    description: 'メインプロット、サブクエスト、タイムライン',
    icon: <Timeline />
  },
  {
    label: '設定確認・調整',
    description: '全体の整合性チェックと最終調整',
    icon: <Settings />
  }
];

const gameSystemOptions = [
  { value: 'stormbringer', label: 'Stormbringer' },
  { value: 'dnd5e', label: 'D&D 5th Edition' },
  { value: 'pathfinder', label: 'Pathfinder' },
  { value: 'call_of_cthulhu', label: 'Call of Cthulhu' },
  { value: 'shadowrun', label: 'Shadowrun' },
  { value: 'vampire', label: 'Vampire: The Masquerade' },
  { value: 'custom', label: 'カスタムシステム' }
];

const genreOptions = [
  { value: 'fantasy', label: 'ファンタジー', description: '魔法と冒険の世界' },
  { value: 'horror', label: 'ホラー', description: '恐怖と神秘の物語' },
  { value: 'scifi', label: 'SF', description: '未来と技術の探求' },
  { value: 'modern', label: 'モダン', description: '現代を舞台にした物語' },
  { value: 'historical', label: '歴史', description: '過去の時代設定' },
  { value: 'cyberpunk', label: 'サイバーパンク', description: 'ハイテク・ローライフ' },
  { value: 'mystery', label: 'ミステリー', description: '謎解きと推理' },
  { value: 'adventure', label: 'アドベンチャー', description: '探検と発見' }
];

export const CampaignCreationWizard: React.FC<CampaignCreationWizardProps> = ({
  open,
  onClose,
  onComplete
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [basicSettings, setBasicSettings] = useState<BasicSettings>({
    title: '',
    synopsis: '',
    gameSystem: 'stormbringer',
    genre: 'fantasy',
    maxDays: 30,
    maxPlayers: 4,
    difficultyLevel: 'intermediate'
  });
  
  const [worldSettings, setWorldSettings] = useState<WorldSettings>({
    worldName: '',
    worldType: 'fantasy',
    cultureStyle: '',
    technologyLevel: 'medieval',
    magicLevel: 'high',
    aiWorldGeneration: true
  });
  
  const [characterSettings, setCharacterSettings] = useState<CharacterSettings>({
    startingLevel: 1,
    allowedRaces: ['human', 'elf', 'dwarf', 'halfling'],
    allowedClasses: ['warrior', 'wizard', 'rogue', 'cleric'],
    startingGold: 100,
    aiCharacterGeneration: true,
    pcCount: 4,
    npcCount: 8
  });
  
  const [storySettings, setStorySettings] = useState({
    mainQuest: '',
    subQuests: [] as string[],
    themes: [] as string[],
    aiStoryGeneration: true
  });
  
  const [validation, setValidation] = useState<ValidationResult>({
    isValid: true,
    errors: [],
    warnings: []
  });
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [currentGenerationStep, setCurrentGenerationStep] = useState('');

  const { openAIAssist } = useAIChatIntegration();

  // バリデーション関数
  const validateStep = useCallback((step: number): ValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    switch (step) {
      case 0: // 基本設定
        if (!basicSettings.title.trim()) errors.push('キャンペーンタイトルは必須です');
        if (!basicSettings.synopsis.trim()) warnings.push('あらすじを入力すると、より良いキャンペーンが作成できます');
        if (basicSettings.maxDays < 1) errors.push('最大日数は1日以上である必要があります');
        if (basicSettings.maxPlayers < 1) errors.push('最大プレイヤー数は1人以上である必要があります');
        break;
        
      case 1: // 世界観
        if (!worldSettings.worldName.trim()) warnings.push('世界名を設定すると、より没入感のある体験が得られます');
        break;
        
      case 2: // キャラクター
        if (characterSettings.startingLevel < 1) errors.push('開始レベルは1以上である必要があります');
        if (characterSettings.allowedRaces.length === 0) warnings.push('利用可能な種族を選択してください');
        if (characterSettings.allowedClasses.length === 0) warnings.push('利用可能なクラスを選択してください');
        if (characterSettings.pcCount < 1) errors.push('PC数は1人以上である必要があります');
        break;
        
      case 3: // ストーリー
        if (!storySettings.mainQuest.trim()) warnings.push('メインクエストを設定すると、明確な目標が得られます');
        break;
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }, [basicSettings, worldSettings, characterSettings, storySettings]);

  // AI生成機能
  const generateWithAI = useCallback(async (type: string) => {
    setIsGenerating(true);
    setGenerationProgress(0);
    
    try {
      switch (type) {
        case 'world':
          setCurrentGenerationStep('世界設定を生成中...');
          await generateWorldSettings();
          break;
        case 'story':
          setCurrentGenerationStep('ストーリー設定を生成中...');
          await generateStorySettings();
          break;
        case 'complete':
          await generateCompleteCampaign();
          break;
      }
    } catch (error) {
      console.error('AI生成エラー:', error);
    } finally {
      setIsGenerating(false);
      setGenerationProgress(100);
    }
  }, [basicSettings, worldSettings]);

  const generateWorldSettings = async () => {
    const prompt = `以下の基本設定に基づいて、TRPGキャンペーンの世界設定を生成してください：

**基本設定:**
- タイトル: ${basicSettings.title}
- ゲームシステム: ${basicSettings.gameSystem}
- ジャンル: ${basicSettings.genre}
- あらすじ: ${basicSettings.synopsis}

以下のJSON形式で回答してください：
{
  "worldName": "世界名",
  "cultureStyle": "文化的特徴",
  "technologyLevel": "技術レベル",
  "locations": [
    {
      "name": "場所名",
      "type": "場所のタイプ",
      "description": "詳細説明"
    }
  ],
  "cultures": [
    {
      "name": "文化名",
      "description": "文化の説明"
    }
  ]
}`;

    return new Promise((resolve) => {
      openAIAssist(
        'world-generation',
        {
          title: '世界設定生成',
          description: 'キャンペーンの世界設定をAIが生成します',
          defaultMessage: prompt,
          onComplete: (result) => {
            try {
              const aiResponse = typeof result.content === 'string' 
                ? JSON.parse(result.content) 
                : result.content;
              
              setWorldSettings(prev => ({
                ...prev,
                worldName: aiResponse.worldName || prev.worldName,
                cultureStyle: aiResponse.cultureStyle || prev.cultureStyle
              }));
              
              resolve(aiResponse);
            } catch (error) {
              console.error('AI世界設定解析エラー:', error);
              resolve({});
            }
          }
        },
        { basicSettings }
      );
    });
  };

  const generateStorySettings = async () => {
    const prompt = `以下の設定に基づいて、TRPGキャンペーンのストーリー設定を生成してください：

**基本設定:**
- タイトル: ${basicSettings.title}
- ゲームシステム: ${basicSettings.gameSystem}
- ジャンル: ${basicSettings.genre}
- 最大日数: ${basicSettings.maxDays}日

**世界設定:**
- 世界名: ${worldSettings.worldName}
- 世界タイプ: ${worldSettings.worldType}

以下のJSON形式で回答してください：
{
  "mainQuest": "メインクエストの説明",
  "subQuests": ["サブクエスト1", "サブクエスト2", "サブクエスト3"],
  "themes": ["テーマ1", "テーマ2"],
  "plotPoints": [
    {
      "day": 1,
      "title": "イベントタイトル",
      "description": "イベント説明"
    }
  ]
}`;

    return new Promise((resolve) => {
      openAIAssist(
        'story-generation',
        {
          title: 'ストーリー設定生成',
          description: 'キャンペーンのストーリー設定をAIが生成します',
          defaultMessage: prompt,
          onComplete: (result) => {
            try {
              const aiResponse = typeof result.content === 'string' 
                ? JSON.parse(result.content) 
                : result.content;
              
              setStorySettings(prev => ({
                ...prev,
                mainQuest: aiResponse.mainQuest || prev.mainQuest,
                subQuests: aiResponse.subQuests || prev.subQuests,
                themes: aiResponse.themes || prev.themes
              }));
              
              resolve(aiResponse);
            } catch (error) {
              console.error('AIストーリー設定解析エラー:', error);
              resolve({});
            }
          }
        },
        { basicSettings, worldSettings }
      );
    });
  };

  const generateCompleteCampaign = async () => {
    setCurrentGenerationStep('完全なキャンペーンを生成中...');
    
    // 段階的に生成
    setGenerationProgress(20);
    await generateWorldSettings();
    
    setGenerationProgress(60);
    await generateStorySettings();
    
    setGenerationProgress(80);
    setCurrentGenerationStep('最終調整中...');
    
    // 最終的なキャンペーンオブジェクトを作成
    const campaign: TRPGCampaign = {
      id: uuidv4(),
      title: basicSettings.title,
      synopsis: basicSettings.synopsis,
      gameSystem: basicSettings.gameSystem,
      genre: basicSettings.genre,
      maxDays: basicSettings.maxDays,
      difficultyLevel: basicSettings.difficultyLevel,
      worldBuilding: {
        worldName: worldSettings.worldName,
        worldType: worldSettings.worldType,
        cultureStyle: worldSettings.cultureStyle,
        technologyLevel: worldSettings.technologyLevel,
        magicLevel: worldSettings.magicLevel
      },
      characters: [],
      npcs: [],
      enemies: [],
      bases: [],
      quests: [],
      sessions: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    setGenerationProgress(100);
    onComplete(campaign);
  };

  // ステップ移動
  const handleNext = () => {
    const validation = validateStep(activeStep);
    setValidation(validation);
    
    if (validation.isValid) {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleStepClick = (step: number) => {
    // 前のステップまでのバリデーション
    for (let i = 0; i < step; i++) {
      const stepValidation = validateStep(i);
      if (!stepValidation.isValid) {
        setValidation(stepValidation);
        return;
      }
    }
    setActiveStep(step);
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return renderBasicSettings();
      case 1:
        return renderWorldSettings();
      case 2:
        return renderCharacterSettings();
      case 3:
        return renderStorySettings();
      case 4:
        return renderFinalReview();
      default:
        return null;
    }
  };

  const renderBasicSettings = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="キャンペーンタイトル"
          value={basicSettings.title}
          onChange={(e) => setBasicSettings(prev => ({ ...prev, title: e.target.value }))}
          placeholder="例: 失われた王国の秘密"
          error={validation.errors.some(err => err.includes('タイトル'))}
        />
      </Grid>
      
      <Grid item xs={12}>
        <TextField
          fullWidth
          multiline
          rows={3}
          label="あらすじ・概要"
          value={basicSettings.synopsis}
          onChange={(e) => setBasicSettings(prev => ({ ...prev, synopsis: e.target.value }))}
          placeholder="キャンペーンの概要や背景を入力してください"
        />
      </Grid>
      
      <Grid item xs={6}>
        <FormControl fullWidth>
          <InputLabel>ゲームシステム</InputLabel>
          <Select
            value={basicSettings.gameSystem}
            onChange={(e) => setBasicSettings(prev => ({ ...prev, gameSystem: e.target.value }))}
          >
            {gameSystemOptions.map(option => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      
      <Grid item xs={6}>
        <FormControl fullWidth>
          <InputLabel>ジャンル</InputLabel>
          <Select
            value={basicSettings.genre}
            onChange={(e) => setBasicSettings(prev => ({ ...prev, genre: e.target.value }))}
          >
            {genreOptions.map(option => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      
      <Grid item xs={4}>
        <TextField
          fullWidth
          type="number"
          label="最大日数"
          value={basicSettings.maxDays}
          onChange={(e) => setBasicSettings(prev => ({ ...prev, maxDays: parseInt(e.target.value) || 1 }))}
          inputProps={{ min: 1, max: 365 }}
        />
      </Grid>
      
      <Grid item xs={4}>
        <TextField
          fullWidth
          type="number"
          label="最大プレイヤー数"
          value={basicSettings.maxPlayers}
          onChange={(e) => setBasicSettings(prev => ({ ...prev, maxPlayers: parseInt(e.target.value) || 1 }))}
          inputProps={{ min: 1, max: 8 }}
        />
      </Grid>
      
      <Grid item xs={4}>
        <FormControl fullWidth>
          <InputLabel>難易度レベル</InputLabel>
          <Select
            value={basicSettings.difficultyLevel}
            onChange={(e) => setBasicSettings(prev => ({ ...prev, difficultyLevel: e.target.value as any }))}
          >
            <MenuItem value="beginner">初心者</MenuItem>
            <MenuItem value="intermediate">中級者</MenuItem>
            <MenuItem value="advanced">上級者</MenuItem>
            <MenuItem value="expert">エキスパート</MenuItem>
          </Select>
        </FormControl>
      </Grid>
    </Grid>
  );

  const renderWorldSettings = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">世界観設定</Typography>
          <Button
            variant="outlined"
            startIcon={<AutoAwesome />}
            onClick={() => generateWithAI('world')}
            disabled={isGenerating || !basicSettings.title}
          >
            AI生成
          </Button>
        </Box>
      </Grid>
      
      <Grid item xs={6}>
        <TextField
          fullWidth
          label="世界名"
          value={worldSettings.worldName}
          onChange={(e) => setWorldSettings(prev => ({ ...prev, worldName: e.target.value }))}
          placeholder="例: アルカディア大陸"
        />
      </Grid>
      
      <Grid item xs={6}>
        <FormControl fullWidth>
          <InputLabel>世界タイプ</InputLabel>
          <Select
            value={worldSettings.worldType}
            onChange={(e) => setWorldSettings(prev => ({ ...prev, worldType: e.target.value as any }))}
          >
            <MenuItem value="fantasy">ファンタジー</MenuItem>
            <MenuItem value="modern">現代</MenuItem>
            <MenuItem value="scifi">SF</MenuItem>
            <MenuItem value="historical">歴史</MenuItem>
            <MenuItem value="custom">カスタム</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      
      <Grid item xs={12}>
        <TextField
          fullWidth
          multiline
          rows={2}
          label="文化的特徴"
          value={worldSettings.cultureStyle}
          onChange={(e) => setWorldSettings(prev => ({ ...prev, cultureStyle: e.target.value }))}
          placeholder="この世界の文化的特徴や社会構造を記述してください"
        />
      </Grid>
      
      <Grid item xs={6}>
        <TextField
          fullWidth
          label="技術レベル"
          value={worldSettings.technologyLevel}
          onChange={(e) => setWorldSettings(prev => ({ ...prev, technologyLevel: e.target.value }))}
          placeholder="例: 中世、近世、現代、未来"
        />
      </Grid>
      
      <Grid item xs={6}>
        <TextField
          fullWidth
          label="魔法レベル"
          value={worldSettings.magicLevel}
          onChange={(e) => setWorldSettings(prev => ({ ...prev, magicLevel: e.target.value }))}
          placeholder="例: なし、低、中、高"
        />
      </Grid>
      
      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Switch
              checked={worldSettings.aiWorldGeneration}
              onChange={(e) => setWorldSettings(prev => ({ ...prev, aiWorldGeneration: e.target.checked }))}
            />
          }
          label="AI自動世界生成を使用する"
        />
      </Grid>
    </Grid>
  );

  const renderCharacterSettings = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>キャラクター設定</Typography>
      </Grid>
      
      <Grid item xs={4}>
        <TextField
          fullWidth
          type="number"
          label="開始レベル"
          value={characterSettings.startingLevel}
          onChange={(e) => setCharacterSettings(prev => ({ ...prev, startingLevel: parseInt(e.target.value) || 1 }))}
          inputProps={{ min: 1, max: 20 }}
        />
      </Grid>
      
      <Grid item xs={4}>
        <TextField
          fullWidth
          type="number"
          label="PC数"
          value={characterSettings.pcCount}
          onChange={(e) => setCharacterSettings(prev => ({ ...prev, pcCount: parseInt(e.target.value) || 1 }))}
          inputProps={{ min: 1, max: 8 }}
        />
      </Grid>
      
      <Grid item xs={4}>
        <TextField
          fullWidth
          type="number"
          label="NPC数"
          value={characterSettings.npcCount}
          onChange={(e) => setCharacterSettings(prev => ({ ...prev, npcCount: parseInt(e.target.value) || 1 }))}
          inputProps={{ min: 1, max: 20 }}
        />
      </Grid>
      
      <Grid item xs={6}>
        <TextField
          fullWidth
          type="number"
          label="開始所持金"
          value={characterSettings.startingGold}
          onChange={(e) => setCharacterSettings(prev => ({ ...prev, startingGold: parseInt(e.target.value) || 0 }))}
          inputProps={{ min: 0 }}
        />
      </Grid>
      
      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Switch
              checked={characterSettings.aiCharacterGeneration}
              onChange={(e) => setCharacterSettings(prev => ({ ...prev, aiCharacterGeneration: e.target.checked }))}
            />
          }
          label="AIキャラクター自動生成を使用する"
        />
      </Grid>
    </Grid>
  );

  const renderStorySettings = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">ストーリー構成</Typography>
          <Button
            variant="outlined"
            startIcon={<AutoAwesome />}
            onClick={() => generateWithAI('story')}
            disabled={isGenerating || !basicSettings.title}
          >
            AI生成
          </Button>
        </Box>
      </Grid>
      
      <Grid item xs={12}>
        <TextField
          fullWidth
          multiline
          rows={3}
          label="メインクエスト"
          value={storySettings.mainQuest}
          onChange={(e) => setStorySettings(prev => ({ ...prev, mainQuest: e.target.value }))}
          placeholder="キャンペーンの主要な目標や物語を記述してください"
        />
      </Grid>
      
      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Switch
              checked={storySettings.aiStoryGeneration}
              onChange={(e) => setStorySettings(prev => ({ ...prev, aiStoryGeneration: e.target.checked }))}
            />
          }
          label="AIストーリー自動生成を使用する"
        />
      </Grid>
    </Grid>
  );

  const renderFinalReview = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>設定確認・調整</Typography>
        <Alert severity="info" sx={{ mb: 3 }}>
          設定内容を確認してください。「完了」ボタンでキャンペーンが作成されます。
        </Alert>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>基本設定</Typography>
            <Typography><strong>タイトル:</strong> {basicSettings.title}</Typography>
            <Typography><strong>ゲームシステム:</strong> {gameSystemOptions.find(g => g.value === basicSettings.gameSystem)?.label}</Typography>
            <Typography><strong>ジャンル:</strong> {genreOptions.find(g => g.value === basicSettings.genre)?.label}</Typography>
            <Typography><strong>最大日数:</strong> {basicSettings.maxDays}日</Typography>
            <Typography><strong>最大プレイヤー数:</strong> {basicSettings.maxPlayers}人</Typography>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>世界観</Typography>
            <Typography><strong>世界名:</strong> {worldSettings.worldName || '未設定'}</Typography>
            <Typography><strong>世界タイプ:</strong> {worldSettings.worldType}</Typography>
            <Typography><strong>技術レベル:</strong> {worldSettings.technologyLevel}</Typography>
            <Typography><strong>魔法レベル:</strong> {worldSettings.magicLevel}</Typography>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12}>
        <Box textAlign="center">
          <Button
            variant="contained"
            size="large"
            startIcon={<AutoAwesome />}
            onClick={() => generateWithAI('complete')}
            disabled={isGenerating}
            sx={{ minWidth: 200 }}
          >
            AI完全生成で完了
          </Button>
        </Box>
      </Grid>
    </Grid>
  );

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{ sx: { minHeight: '80vh' } }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h5">キャンペーン作成ウィザード</Typography>
          <IconButton onClick={onClose} disabled={isGenerating}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((step, index) => (
            <Step key={step.label} completed={index < activeStep}>
              <StepLabel 
                icon={step.icon}
                onClick={() => handleStepClick(index)}
                sx={{ cursor: 'pointer' }}
              >
                <Box>
                  <Typography variant="body2">{step.label}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {step.description}
                  </Typography>
                </Box>
              </StepLabel>
            </Step>
          ))}
        </Stepper>
        
        {/* エラー・警告表示 */}
        {validation.errors.length > 0 && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="subtitle2">エラー:</Typography>
            {validation.errors.map((error, index) => (
              <Typography key={index} variant="body2">• {error}</Typography>
            ))}
          </Alert>
        )}
        
        {validation.warnings.length > 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="subtitle2">警告:</Typography>
            {validation.warnings.map((warning, index) => (
              <Typography key={index} variant="body2">• {warning}</Typography>
            ))}
          </Alert>
        )}
        
        {/* 生成進行状況 */}
        {isGenerating && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" gutterBottom>{currentGenerationStep}</Typography>
            <LinearProgress variant="determinate" value={generationProgress} />
          </Box>
        )}
        
        {/* ステップコンテンツ */}
        <Box sx={{ minHeight: 400 }}>
          {renderStepContent()}
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={isGenerating}>
          キャンセル
        </Button>
        
        {activeStep > 0 && (
          <Button onClick={handleBack} disabled={isGenerating}>
            戻る
          </Button>
        )}
        
        {activeStep < steps.length - 1 ? (
          <Button 
            variant="contained" 
            onClick={handleNext}
            disabled={isGenerating || !validation.isValid}
          >
            次へ
          </Button>
        ) : (
          <Button 
            variant="contained" 
            onClick={() => generateWithAI('complete')}
            disabled={isGenerating || !validation.isValid}
            startIcon={isGenerating ? <CircularProgress size={20} /> : <CheckCircle />}
          >
            {isGenerating ? '生成中...' : '完了'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CampaignCreationWizard;