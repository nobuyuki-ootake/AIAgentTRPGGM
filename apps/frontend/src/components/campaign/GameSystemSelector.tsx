import React, { useState } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Typography,
  Chip,
  Box,
  SelectChangeEvent,
} from '@mui/material';

// サポートされるゲームシステムの定義
export interface GameSystem {
  id: string;
  name: string;
  shortName: string;
  description: string;
  complexity: 'beginner' | 'intermediate' | 'advanced';
  category: 'fantasy' | 'modern' | 'sci-fi' | 'horror' | 'universal';
  features: string[];
  diceSystem: string;
  isDefault?: boolean;
}

// ゲームシステムの定義リスト
export const GAME_SYSTEMS: GameSystem[] = [
  {
    id: 'stormbringer',
    name: 'Stormbringer',
    shortName: 'STB',
    description: 'エターナルチャンピオンの世界を舞台とした、混沌と秩序の戦いを描くTRPG',
    complexity: 'intermediate',
    category: 'fantasy',
    features: ['パーセンタイル判定', '能力値ベース', 'カオス魔法', '武器破壊'],
    diceSystem: 'D100',
    isDefault: true,
  },
  {
    id: 'dnd5e',
    name: 'Dungeons & Dragons 5th Edition',
    shortName: 'D&D 5e',
    description: '世界で最も人気のあるTRPGの最新版。バランスの取れたルールと豊富なリソース',
    complexity: 'beginner',
    category: 'fantasy',
    features: ['アドバンテージ/ディスアドバンテージ', 'レベル制', 'スペルスロット', 'クラス/種族'],
    diceSystem: 'D20',
  },
  {
    id: 'pathfinder2e',
    name: 'Pathfinder 2nd Edition',
    shortName: 'PF2e',
    description: 'D&Dの流れを汲む戦術的なファンタジーTRPG。高いカスタマイズ性が特徴',
    complexity: 'advanced',
    category: 'fantasy',
    features: ['3アクション制', '習熟度システム', 'アーキタイプ', '詳細な戦術'],
    diceSystem: 'D20',
  },
  {
    id: 'coc7e',
    name: 'Call of Cthulhu 7th Edition',
    shortName: 'CoC 7e',
    description: 'クトゥルフ神話の恐怖を体験するホラーTRPG',
    complexity: 'intermediate',
    category: 'horror',
    features: ['正気度システム', '技能判定', '神話的恐怖', '調査重視'],
    diceSystem: 'D100',
  },
  {
    id: 'savage_worlds',
    name: 'Savage Worlds',
    shortName: 'SW',
    description: 'あらゆるジャンルに対応できる汎用システム',
    complexity: 'beginner',
    category: 'universal',
    features: ['ワイルドダイス', 'Fast! Furious! Fun!', 'ベニーシステム', 'ジャンル対応'],
    diceSystem: 'ポリヘドラル',
  },
  {
    id: 'fate_core',
    name: 'Fate Core',
    shortName: 'Fate',
    description: 'ナラティブ重視の汎用システム。プレイヤーの物語創造を重視',
    complexity: 'intermediate',
    category: 'universal',
    features: ['アスペクト', 'フェイトポイント', 'ナラティブ', '共同創作'],
    diceSystem: 'Fate Dice (dF)',
  },
];

interface GameSystemSelectorProps {
  selectedSystemId?: string;
  onSystemChange: (systemId: string, system: GameSystem) => void;
  showDetails?: boolean;
}

const GameSystemSelector: React.FC<GameSystemSelectorProps> = ({
  selectedSystemId,
  onSystemChange,
  showDetails = true,
}) => {
  const [selected, setSelected] = useState<string>(
    selectedSystemId || GAME_SYSTEMS.find(sys => sys.isDefault)?.id || ''
  );

  const selectedSystem = GAME_SYSTEMS.find(sys => sys.id === selected);

  const handleChange = (event: SelectChangeEvent<string>) => {
    const systemId = event.target.value;
    const system = GAME_SYSTEMS.find(sys => sys.id === systemId);
    if (system) {
      setSelected(systemId);
      onSystemChange(systemId, system);
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'beginner':
        return 'success';
      case 'intermediate':
        return 'warning';
      case 'advanced':
        return 'error';
      default:
        return 'default';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'fantasy':
        return 'primary';
      case 'modern':
        return 'secondary';
      case 'sci-fi':
        return 'info';
      case 'horror':
        return 'error';
      case 'universal':
        return 'success';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel id="game-system-select-label">ゲームシステム</InputLabel>
        <Select
          labelId="game-system-select-label"
          id="game-system-select"
          value={selected}
          label="ゲームシステム"
          onChange={handleChange}
        >
          {GAME_SYSTEMS.map((system) => (
            <MenuItem key={system.id} value={system.id}>
              {system.name} ({system.shortName})
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {showDetails && selectedSystem && (
        <Card sx={{ mt: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="h6" component="div">
                {selectedSystem.name}
              </Typography>
              <Chip
                label={selectedSystem.complexity}
                size="small"
                color={getComplexityColor(selectedSystem.complexity)}
              />
              <Chip
                label={selectedSystem.category}
                size="small"
                color={getCategoryColor(selectedSystem.category)}
              />
              <Chip
                label={selectedSystem.diceSystem}
                size="small"
                variant="outlined"
              />
            </Box>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {selectedSystem.description}
            </Typography>

            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              主な特徴:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {selectedSystem.features.map((feature, index) => (
                <Chip
                  key={index}
                  label={feature}
                  size="small"
                  variant="outlined"
                  color="default"
                />
              ))}
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default GameSystemSelector;