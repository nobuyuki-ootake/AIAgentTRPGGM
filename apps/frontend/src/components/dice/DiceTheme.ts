export interface DiceTheme {
  name: string;
  colors: {
    d4: string;
    d6: string;
    d8: string;
    d10: string;
    d12: string;
    d20: string;
  };
  material?: 'standard' | 'metallic' | 'glass' | 'neon';
  textColor?: string;
  glowEffect?: boolean;
}

export const DICE_THEMES: { [key: string]: DiceTheme } = {
  classic: {
    name: 'クラシック',
    colors: {
      d4: '#ff6b6b',
      d6: '#4ecdc4',
      d8: '#45b7d1',
      d10: '#96ceb4',
      d12: '#ffeaa7',
      d20: '#dda0dd'
    },
    material: 'standard',
    textColor: 'white'
  },
  fantasy: {
    name: 'ファンタジー',
    colors: {
      d4: '#8B4513',
      d6: '#DAA520',
      d8: '#4B0082',
      d10: '#228B22',
      d12: '#DC143C',
      d20: '#FF4500'
    },
    material: 'metallic',
    textColor: '#FFD700',
    glowEffect: true
  },
  cyberpunk: {
    name: 'サイバーパンク',
    colors: {
      d4: '#00FFFF',
      d6: '#FF1493',
      d8: '#00FF00',
      d10: '#FFD700',
      d12: '#FF69B4',
      d20: '#9400D3'
    },
    material: 'neon',
    textColor: '#FFFFFF',
    glowEffect: true
  },
  nature: {
    name: 'ナチュラル',
    colors: {
      d4: '#8FBC8F',
      d6: '#DEB887',
      d8: '#5F9EA0',
      d10: '#D2691E',
      d12: '#9ACD32',
      d20: '#CD853F'
    },
    material: 'standard',
    textColor: '#2F4F4F'
  },
  fire: {
    name: '炎',
    colors: {
      d4: '#FF0000',
      d6: '#FF4500',
      d8: '#FF6347',
      d10: '#FF8C00',
      d12: '#FFA500',
      d20: '#FFD700'
    },
    material: 'metallic',
    textColor: '#FFFF00',
    glowEffect: true
  },
  ice: {
    name: '氷',
    colors: {
      d4: '#B0E0E6',
      d6: '#87CEEB',
      d8: '#87CEFA',
      d10: '#00BFFF',
      d12: '#1E90FF',
      d20: '#0000FF'
    },
    material: 'glass',
    textColor: '#FFFFFF'
  }
};