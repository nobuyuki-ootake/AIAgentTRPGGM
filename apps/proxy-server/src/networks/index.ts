import { mastra } from '../mastra';
import {
  novelAssistant,
  plotAdvisor,
  characterDesigner,
  styleEditor,
  worldBuildingAssistant,
} from '../agents';
import {
  plotAnalyzer,
  characterAnalyzer,
  textAnalyzer,
  worldBuildingAnalyzer,
  storyGenerator,
} from '../tools';

/**
 * ノベル作成エージェントネットワーク
 */
export const novelCreationNetwork = mastra
  .network('novel-creation')
  .description('小説作成を包括的に支援するエージェントネットワーク')
  .agents([
    novelAssistant,
    plotAdvisor,
    characterDesigner,
    styleEditor,
    worldBuildingAssistant,
  ])
  .router(async () => {
    // 入力メッセージとコンテキストは現在の実装では利用できないため、
    // デフォルトのエージェントを返す
    return 'novel-assistant';
  });

/**
 * プロット開発エージェントネットワーク
 */
export const plotDevelopmentNetwork = mastra
  .network('plot-development')
  .description('物語のプロット開発に特化したエージェントネットワーク')
  .agents([plotAdvisor, characterDesigner, worldBuildingAssistant])
  .tools([plotAnalyzer, characterAnalyzer])
  .router(async () => {
    // デフォルトはプロットアドバイザー
    return 'plot-advisor';
  });

/**
 * 文章改善エージェントネットワーク
 */
export const writingImprovementNetwork = mastra
  .network('writing-improvement')
  .description('文章表現の改善に特化したエージェントネットワーク')
  .agents([styleEditor, plotAdvisor])
  .tools([textAnalyzer])
  .router(async () => {
    // デフォルトは文体エディター
    return 'style-editor';
  });

// ネットワークをエクスポート
export const networks = {
  novelCreationNetwork,
  plotDevelopmentNetwork,
  writingImprovementNetwork,
};
