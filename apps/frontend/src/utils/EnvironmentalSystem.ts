import { BaseLocation, TRPGCharacter, WeatherPattern, ClimateType, TerrainType } from '@trpg-ai-gm/types';

/**
 * 🌍 環境要因システム
 * 
 * 天候、地形、気候などの環境要因がゲームプレイに与える影響を
 * 計算・管理するシステム
 */
export class EnvironmentalSystem {
  
  /**
   * 🌤️ 現在の天候を生成
   */
  static generateCurrentWeather(location: BaseLocation, season: string = 'spring'): {
    condition: string;
    temperature: number;
    precipitation: number;
    windSpeed: number;
    visibility: string;
    effects: string[];
  } {
    const { environmentalFactors } = location;
    
    if (!environmentalFactors) {
      return {
        condition: '晴れ',
        temperature: 20,
        precipitation: 0,
        windSpeed: 5,
        visibility: '良好',
        effects: []
      };
    }

    const { climate, weatherPatterns } = environmentalFactors;
    
    // 季節に応じた天候パターンを選択
    const seasonPattern = weatherPatterns?.find(pattern => 
      pattern.season.toLowerCase() === season.toLowerCase()
    ) || weatherPatterns?.[0];

    if (!seasonPattern) {
      return this.getDefaultWeatherForClimate(climate);
    }

    // ランダムな天候条件を選択
    const randomCondition = seasonPattern.conditions[
      Math.floor(Math.random() * seasonPattern.conditions.length)
    ];

    // 温度を計算（パターンの範囲内でランダム）
    const tempRange = seasonPattern.temperature;
    const temperature = Math.round(
      tempRange.min + Math.random() * (tempRange.max - tempRange.min)
    );

    // 降水量
    const precipitation = seasonPattern.precipitation * Math.random();

    // 風速（気候とコンディションに基づく）
    let windSpeed = 5; // デフォルト
    if (randomCondition.includes('嵐') || randomCondition.includes('台風')) {
      windSpeed = 15 + Math.random() * 20;
    } else if (randomCondition.includes('風')) {
      windSpeed = 10 + Math.random() * 10;
    } else if (randomCondition.includes('穏やか')) {
      windSpeed = 1 + Math.random() * 5;
    }

    // 視界
    let visibility = '良好';
    if (randomCondition.includes('霧') || randomCondition.includes('靄')) {
      visibility = '不良';
    } else if (randomCondition.includes('雨') || randomCondition.includes('雪')) {
      visibility = '普通';
    }

    // 天候効果を計算
    const effects = this.calculateWeatherEffects(randomCondition, temperature, windSpeed, precipitation);

    return {
      condition: randomCondition,
      temperature,
      precipitation,
      windSpeed,
      visibility,
      effects
    };
  }

  /**
   * 🌡️ 気候別デフォルト天候
   */
  static getDefaultWeatherForClimate(climate: ClimateType): {
    condition: string;
    temperature: number;
    precipitation: number;
    windSpeed: number;
    visibility: string;
    effects: string[];
  } {
    switch (climate) {
      case 'tropical':
        return {
          condition: '高温多湿',
          temperature: 30,
          precipitation: 0.3,
          windSpeed: 8,
          visibility: '良好',
          effects: ['汗による不快感', '水分補給の必要性']
        };
      
      case 'arctic':
        return {
          condition: '極寒',
          temperature: -20,
          precipitation: 0.1,
          windSpeed: 12,
          visibility: '普通',
          effects: ['凍傷リスク', '防寒具必須', '移動速度減少']
        };
      
      case 'desert':
        return {
          condition: '乾燥',
          temperature: 35,
          precipitation: 0.05,
          windSpeed: 6,
          visibility: '良好',
          effects: ['脱水症状リスク', '砂嵐の可能性']
        };
      
      case 'mountain':
        return {
          condition: '冷涼',
          temperature: 10,
          precipitation: 0.2,
          windSpeed: 10,
          visibility: '良好',
          effects: ['高山病リスク', '気温変化激しい']
        };
      
      case 'coastal':
        return {
          condition: '海風',
          temperature: 22,
          precipitation: 0.2,
          windSpeed: 12,
          visibility: '良好',
          effects: ['塩分による装備腐食', '湿気']
        };
      
      case 'magical':
        return {
          condition: '魔法的擾乱',
          temperature: 18,
          precipitation: 0.1,
          windSpeed: 5,
          visibility: '変動',
          effects: ['魔法効果不安定', '超常現象']
        };
      
      default:
        return {
          condition: '温帯',
          temperature: 20,
          precipitation: 0.15,
          windSpeed: 7,
          visibility: '良好',
          effects: []
        };
    }
  }

  /**
   * ⚡ 天候効果の計算
   */
  static calculateWeatherEffects(condition: string, temperature: number, windSpeed: number, precipitation: number): string[] {
    const effects: string[] = [];

    // 温度による効果
    if (temperature < -10) {
      effects.push('極寒：体力消耗増加、凍傷リスク');
    } else if (temperature < 0) {
      effects.push('寒冷：移動速度減少、防寒具推奨');
    } else if (temperature > 35) {
      effects.push('酷暑：脱水リスク、集中力減少');
    } else if (temperature > 30) {
      effects.push('高温：水分補給頻度増加');
    }

    // 風速による効果
    if (windSpeed > 20) {
      effects.push('強風：飛行不可、遠距離攻撃ペナルティ');
    } else if (windSpeed > 15) {
      effects.push('風：射撃精度低下、火気注意');
    }

    // 降水による効果
    if (precipitation > 0.5) {
      effects.push('豪雨：視界不良、移動困難');
    } else if (precipitation > 0.3) {
      effects.push('雨：視界減少、滑りやすい地面');
    }

    // 特定の天候条件による効果
    if (condition.includes('霧')) {
      effects.push('濃霧：視界大幅減少、隠密行動有利');
    }
    if (condition.includes('雪')) {
      effects.push('降雪：足跡残る、移動速度減少');
    }
    if (condition.includes('嵐')) {
      effects.push('嵐：屋外活動危険、雷撃リスク');
    }
    if (condition.includes('砂嵐')) {
      effects.push('砂嵐：視界ゼロ、装備損傷リスク');
    }

    return effects;
  }

  /**
   * 🗺️ 地形による移動修正を計算
   */
  static calculateTerrainMovementModifier(terrain: TerrainType, weather?: any): number {
    let modifier = 1.0; // 基本修正値

    // 地形による基本修正
    switch (terrain) {
      case 'plains':
        modifier = 1.0; // 平地は標準
        break;
      case 'forest':
        modifier = 0.75; // 森林は25%減速
        break;
      case 'mountain':
        modifier = 0.5; // 山岳は50%減速
        break;
      case 'desert':
        modifier = 0.6; // 砂漠は40%減速
        break;
      case 'swamp':
        modifier = 0.4; // 湿地は60%減速
        break;
      case 'urban':
        modifier = 1.1; // 都市部は10%加速（整備された道）
        break;
      case 'ruins':
        modifier = 0.7; // 遺跡は30%減速
        break;
      case 'underground':
        modifier = 0.8; // 地下は20%減速
        break;
      case 'aerial':
        modifier = 2.0; // 空中は2倍速（飛行可能な場合）
        break;
      default:
        modifier = 1.0;
    }

    // 天候による追加修正
    if (weather) {
      if (weather.condition.includes('雨') || weather.condition.includes('雪')) {
        modifier *= 0.8; // 雨雪で20%減速
      }
      if (weather.condition.includes('嵐')) {
        modifier *= 0.6; // 嵐で40%減速
      }
      if (weather.condition.includes('霧')) {
        modifier *= 0.7; // 霧で30%減速
      }
      if (weather.windSpeed > 15) {
        modifier *= 0.9; // 強風で10%減速
      }
    }

    return modifier;
  }

  /**
   * 🎲 環境による技能判定修正を計算
   */
  static calculateEnvironmentalSkillModifiers(
    location: BaseLocation,
    skillType: string,
    weather?: any
  ): {
    modifier: number;
    reasons: string[];
  } {
    let modifier = 0;
    const reasons: string[] = [];

    const { environmentalFactors } = location;
    if (!environmentalFactors) {
      return { modifier: 0, reasons: [] };
    }

    const { terrain, climate } = environmentalFactors;

    // 地形による修正
    switch (skillType.toLowerCase()) {
      case 'stealth':
      case 'sneak':
        if (terrain === 'forest') {
          modifier += 2;
          reasons.push('森林による隠密ボーナス');
        } else if (terrain === 'urban') {
          modifier -= 2;
          reasons.push('都市部による隠密ペナルティ');
        } else if (terrain === 'desert') {
          modifier -= 1;
          reasons.push('砂漠による隠密ペナルティ');
        }
        break;

      case 'perception':
      case 'awareness':
        if (terrain === 'mountain') {
          modifier += 1;
          reasons.push('山岳地帯による見通しボーナス');
        } else if (terrain === 'forest') {
          modifier -= 1;
          reasons.push('森林による視界ペナルティ');
        }
        break;

      case 'survival':
        if (climate === 'arctic') {
          modifier -= 3;
          reasons.push('極寒気候による生存ペナルティ');
        } else if (climate === 'desert') {
          modifier -= 2;
          reasons.push('砂漠気候による生存ペナルティ');
        } else if (terrain === 'wilderness') {
          modifier += 1;
          reasons.push('自然環境による生存ボーナス');
        }
        break;

      case 'athletics':
      case 'climb':
        if (terrain === 'mountain') {
          modifier -= 2;
          reasons.push('山岳地帯による運動ペナルティ');
        } else if (terrain === 'swamp') {
          modifier -= 3;
          reasons.push('湿地による運動ペナルティ');
        }
        break;
    }

    // 天候による修正
    if (weather) {
      if (weather.visibility === '不良') {
        if (['perception', 'awareness', 'investigation'].includes(skillType.toLowerCase())) {
          modifier -= 3;
          reasons.push('視界不良による知覚ペナルティ');
        }
      }

      if (weather.effects.includes('強風')) {
        if (['acrobatics', 'ranged_attack'].includes(skillType.toLowerCase())) {
          modifier -= 2;
          reasons.push('強風による技能ペナルティ');
        }
      }

      if (weather.temperature < 0) {
        if (['dexterity', 'sleight_of_hand'].includes(skillType.toLowerCase())) {
          modifier -= 1;
          reasons.push('寒冷による器用さペナルティ');
        }
      }
    }

    return { modifier, reasons };
  }

  /**
   * 🏃‍♂️ キャラクターへの環境影響を計算
   */
  static calculateEnvironmentalEffectsOnCharacter(
    character: TRPGCharacter,
    location: BaseLocation,
    weather?: any,
    timeInEnvironment: number = 1 // 時間（時間単位）
  ): {
    healthEffects: string[];
    statusEffects: string[];
    equipmentEffects: string[];
    recommendations: string[];
  } {
    const healthEffects: string[] = [];
    const statusEffects: string[] = [];
    const equipmentEffects: string[] = [];
    const recommendations: string[] = [];

    const { environmentalFactors } = location;
    if (!environmentalFactors) {
      return { healthEffects, statusEffects, equipmentEffects, recommendations };
    }

    // 気候による長期効果
    if (timeInEnvironment > 2) { // 2時間以上
      switch (environmentalFactors.climate) {
        case 'arctic':
          healthEffects.push('体温低下リスク');
          statusEffects.push('寒冷による疲労蓄積');
          recommendations.push('防寒具の着用', '定期的な休憩');
          break;
        
        case 'desert':
          healthEffects.push('脱水症状リスク');
          statusEffects.push('高温による疲労');
          recommendations.push('水分補給頻度増加', '日陰での休憩');
          break;
        
        case 'tropical':
          healthEffects.push('熱中症リスク');
          statusEffects.push('高湿度による不快感');
          recommendations.push('塩分補給', '軽装での活動');
          break;
      }
    }

    // 地形による装備への影響
    switch (environmentalFactors.terrain) {
      case 'swamp':
        equipmentEffects.push('金属装備の腐食加速');
        equipmentEffects.push('革製品の劣化');
        recommendations.push('装備の定期的手入れ');
        break;
      
      case 'desert':
        equipmentEffects.push('砂による機械装備の故障リスク');
        recommendations.push('装備の砂除去');
        break;
      
      case 'mountain':
        equipmentEffects.push('低温による金属脆化');
        recommendations.push('装備の温度管理');
        break;
    }

    // 天候による即座の影響
    if (weather) {
      weather.effects.forEach((effect: string) => {
        if (effect.includes('脱水')) {
          healthEffects.push('即座の水分補給必要');
        }
        if (effect.includes('凍傷')) {
          healthEffects.push('皮膚保護必要');
        }
        if (effect.includes('装備損傷')) {
          equipmentEffects.push('装備保護必要');
        }
      });
    }

    // 自然災害による影響
    if (environmentalFactors.naturalHazards) {
      environmentalFactors.naturalHazards.forEach(hazard => {
        switch (hazard) {
          case '地震':
            statusEffects.push('不安定な足場による移動ペナルティ');
            break;
          case '火山活動':
            healthEffects.push('有毒ガスによる呼吸器への影響');
            break;
          case '洪水':
            statusEffects.push('移動制限');
            equipmentEffects.push('装備の水濡れ');
            break;
        }
      });
    }

    return { healthEffects, statusEffects, equipmentEffects, recommendations };
  }

  /**
   * 🎯 環境に基づくイベント生成
   */
  static generateEnvironmentalEvents(
    location: BaseLocation,
    weather?: any,
    timeOfDay?: string
  ): Array<{
    type: 'weather' | 'hazard' | 'discovery' | 'encounter';
    name: string;
    description: string;
    probability: number;
    effects: string[];
  }> {
    const events: Array<{
      type: 'weather' | 'hazard' | 'discovery' | 'encounter';
      name: string;
      description: string;
      probability: number;
      effects: string[];
    }> = [];

    const { environmentalFactors } = location;
    if (!environmentalFactors) return events;

    // 天候イベント
    if (weather) {
      if (weather.condition.includes('嵐')) {
        events.push({
          type: 'weather',
          name: '嵐の激化',
          description: '嵐がさらに激しくなり、屋外での活動が極めて危険になった',
          probability: 0.3,
          effects: ['視界ゼロ', '移動不可', '雷撃リスク']
        });
      }
    }

    // 自然災害イベント
    if (environmentalFactors.naturalHazards) {
      environmentalFactors.naturalHazards.forEach(hazard => {
        events.push({
          type: 'hazard',
          name: `${hazard}の発生`,
          description: `突然の${hazard}が発生し、周囲の状況が変化した`,
          probability: 0.1,
          effects: [`${hazard}による直接的影響`, '地形変化の可能性']
        });
      });
    }

    // 地形特有の発見イベント
    switch (environmentalFactors.terrain) {
      case 'ruins':
        events.push({
          type: 'discovery',
          name: '古代の遺物発見',
          description: '崩れた石の下から古代の遺物らしきものが見つかった',
          probability: 0.2,
          effects: ['考古学的価値', '魔法的性質の可能性']
        });
        break;
      
      case 'forest':
        events.push({
          type: 'discovery',
          name: '薬草の発見',
          description: '珍しい薬草を発見した。適切に処理すれば有用かもしれない',
          probability: 0.25,
          effects: ['回復アイテム化可能', '錬金術素材']
        });
        break;
      
      case 'mountain':
        events.push({
          type: 'discovery',
          name: '鉱石の露頭',
          description: '岩肌に金属光沢を放つ鉱石の露頭を発見した',
          probability: 0.15,
          effects: ['鉱物資源', '装備素材']
        });
        break;
    }

    // 時間帯特有のイベント
    if (timeOfDay === 'night') {
      events.push({
        type: 'encounter',
        name: '夜行性生物との遭遇',
        description: '夜の闇の中で、何らかの生物の気配を感じた',
        probability: 0.4,
        effects: ['戦闘の可能性', '逃走の選択肢']
      });
    }

    return events;
  }

  /**
   * 📊 環境情報サマリーを生成
   */
  static generateEnvironmentalSummary(location: BaseLocation, weather?: any): string {
    let summary = `## 🌍 環境情報: ${location.name}\n\n`;

    const { environmentalFactors } = location;
    if (!environmentalFactors) {
      summary += '環境情報が設定されていません。\n';
      return summary;
    }

    // 基本環境情報
    summary += `**気候**: ${environmentalFactors.climate}\n`;
    summary += `**地形**: ${environmentalFactors.terrain}\n`;

    // 天候情報
    if (weather) {
      summary += `**現在の天候**: ${weather.condition}\n`;
      summary += `**気温**: ${weather.temperature}°C\n`;
      summary += `**風速**: ${weather.windSpeed}m/s\n`;
      summary += `**視界**: ${weather.visibility}\n`;
      
      if (weather.effects.length > 0) {
        summary += `**天候効果**: ${weather.effects.join(', ')}\n`;
      }
    }

    // 移動への影響
    const movementModifier = this.calculateTerrainMovementModifier(environmentalFactors.terrain, weather);
    summary += `**移動速度修正**: ${(movementModifier * 100).toFixed(0)}%\n`;

    // 自然災害リスク
    if (environmentalFactors.naturalHazards?.length) {
      summary += `**自然災害リスク**: ${environmentalFactors.naturalHazards.join(', ')}\n`;
    }

    summary += '\n';

    return summary;
  }
}

export default EnvironmentalSystem;