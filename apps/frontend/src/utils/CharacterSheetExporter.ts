import jsPDF from 'jspdf';
import { TRPGCharacter, TRPGCampaign } from '@trpg-ai-gm/types';
import { GameSystemManager, UnifiedCharacterStats } from './GameSystemManager';
import { SpellPowerManager } from './SpellPowerSystem';

/**
 * 📄 キャラクターシート印刷・エクスポートシステム
 * 
 * 様々なTRPGシステムに対応したキャラクターシート生成
 * PDF出力、CSV出力、印刷対応など
 */

export interface ExportOptions {
  format: 'pdf' | 'csv' | 'json' | 'print';
  includePortrait: boolean;
  includeSpells: boolean;
  includeEquipment: boolean;
  includeNotes: boolean;
  gameSystem: string;
  template?: 'official' | 'compact' | 'detailed';
}

export interface SheetSection {
  title: string;
  content: string | any[];
  position: { x: number; y: number; width: number; height: number };
  style?: {
    fontSize?: number;
    fontWeight?: 'normal' | 'bold';
    align?: 'left' | 'center' | 'right';
  };
}

/**
 * 📋 キャラクターシートエクスポーター
 */
export class CharacterSheetExporter {
  private gameSystemManager: GameSystemManager;
  private spellManager: SpellPowerManager;
  
  constructor(gameSystem: string) {
    this.gameSystemManager = new GameSystemManager(gameSystem);
    this.spellManager = new SpellPowerManager(gameSystem);
  }

  /**
   * 📄 PDF形式でエクスポート
   */
  async exportToPDF(
    character: TRPGCharacter, 
    campaign: TRPGCampaign,
    options: ExportOptions
  ): Promise<Blob> {
    const pdf = new jsPDF();
    const unifiedStats = this.gameSystemManager.convertCharacterToSystem(character);

    // ページ設定
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;

    let currentY = margin;

    // 🎨 ヘッダー部分
    currentY = this.renderPDFHeader(pdf, character, campaign, currentY, pageWidth, margin);

    // 📊 基本能力値
    currentY = this.renderPDFAttributes(pdf, unifiedStats, currentY, pageWidth, margin, options.gameSystem);

    // 🎯 スキル
    currentY = this.renderPDFSkills(pdf, unifiedStats, currentY, pageWidth, margin, options.gameSystem);

    // ⚔️ 装備
    if (options.includeEquipment) {
      currentY = this.renderPDFEquipment(pdf, unifiedStats, currentY, pageWidth, margin);
    }

    // 🔮 呪文・能力
    if (options.includeSpells && character.systemStats?.[options.gameSystem]?.magic) {
      currentY = this.renderPDFSpells(pdf, character.systemStats[options.gameSystem].magic, currentY, pageWidth, margin);
    }

    // 📝 キャラクター詳細
    currentY = this.renderPDFDetails(pdf, character, currentY, pageWidth, margin);

    // 🖼️ ポートレート
    if (options.includePortrait && character.imageUrl) {
      await this.renderPDFPortrait(pdf, character.imageUrl, pageWidth, margin);
    }

    // フッター
    this.renderPDFFooter(pdf, pageHeight, pageWidth, margin);

    return pdf.output('blob');
  }

  /**
   * 🎨 PDFヘッダー描画
   */
  private renderPDFHeader(
    pdf: jsPDF, 
    character: TRPGCharacter, 
    campaign: TRPGCampaign,
    y: number, 
    pageWidth: number, 
    margin: number
  ): number {
    // タイトル
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Character Sheet', pageWidth / 2, y, { align: 'center' });
    y += 15;

    // キャラクター名
    pdf.setFontSize(16);
    pdf.text(character.name, pageWidth / 2, y, { align: 'center' });
    y += 10;

    // キャンペーン情報
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Campaign: ${campaign.title}`, margin, y);
    pdf.text(`System: ${campaign.gameSystem}`, pageWidth - margin, y, { align: 'right' });
    y += 15;

    // 区切り線
    pdf.line(margin, y, pageWidth - margin, y);
    y += 10;

    return y;
  }

  /**
   * 📊 基本能力値描画
   */
  private renderPDFAttributes(
    pdf: jsPDF,
    stats: UnifiedCharacterStats,
    y: number,
    pageWidth: number,
    margin: number,
    gameSystem: string
  ): number {
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Attributes', margin, y);
    y += 10;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');

    const attributes = Object.entries(stats.attributes);
    const colWidth = (pageWidth - margin * 2) / 3;
    
    attributes.forEach((attr, index) => {
      const col = index % 3;
      const row = Math.floor(index / 3);
      const x = margin + col * colWidth;
      const attrY = y + row * 15;

      pdf.text(`${attr[0]}: ${attr[1]}`, x, attrY);
      
      // 修正値表示（D&D系）
      if (['dnd5e', 'pathfinder'].includes(gameSystem)) {
        const modifier = this.gameSystemManager.getStatModifier(attr[0], stats);
        pdf.text(`(${modifier >= 0 ? '+' : ''}${modifier})`, x + 40, attrY);
      }
    });

    y += Math.ceil(attributes.length / 3) * 15 + 10;

    // 派生ステータス
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Derived Stats', margin, y);
    y += 10;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');

    Object.entries(stats.derivedStats).forEach((stat, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const x = margin + col * (colWidth * 1.5);
      const statY = y + row * 12;

      pdf.text(`${stat[0]}: ${stat[1]}`, x, statY);
    });

    y += Math.ceil(Object.keys(stats.derivedStats).length / 2) * 12 + 15;

    return y;
  }

  /**
   * 🎯 スキル描画
   */
  private renderPDFSkills(
    pdf: jsPDF,
    stats: UnifiedCharacterStats,
    y: number,
    pageWidth: number,
    margin: number,
    gameSystem: string
  ): number {
    const skills = Object.entries(stats.skills);
    if (skills.length === 0) return y;

    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Skills', margin, y);
    y += 10;

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');

    const colWidth = (pageWidth - margin * 2) / 2;
    const maxRows = 25; // 1ページあたりの最大行数

    skills.slice(0, maxRows * 2).forEach((skill, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const x = margin + col * colWidth;
      const skillY = y + row * 10;

      const skillText = `${skill[0]}: ${skill[1]}`;
      if (gameSystem === 'stormbringer' || gameSystem === 'cthulhu') {
        pdf.text(`${skillText}%`, x, skillY);
      } else {
        pdf.text(skillText, x, skillY);
      }
    });

    y += Math.min(Math.ceil(skills.length / 2), maxRows) * 10 + 15;

    return y;
  }

  /**
   * ⚔️ 装備描画
   */
  private renderPDFEquipment(
    pdf: jsPDF,
    stats: UnifiedCharacterStats,
    y: number,
    pageWidth: number,
    margin: number
  ): number {
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Equipment', margin, y);
    y += 10;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');

    // 武器
    if (stats.equipment.weapons.length > 0) {
      pdf.setFont('helvetica', 'bold');
      pdf.text('Weapons:', margin, y);
      y += 8;
      pdf.setFont('helvetica', 'normal');

      stats.equipment.weapons.forEach(weapon => {
        const weaponText = `${weapon.name}${weapon.equipped ? ' (E)' : ''}`;
        pdf.text(`• ${weaponText}`, margin + 10, y);
        y += 8;
      });
      y += 5;
    }

    // 防具
    if (stats.equipment.armor.length > 0) {
      pdf.setFont('helvetica', 'bold');
      pdf.text('Armor:', margin, y);
      y += 8;
      pdf.setFont('helvetica', 'normal');

      stats.equipment.armor.forEach(armor => {
        const armorText = `${armor.name}${armor.equipped ? ' (E)' : ''}`;
        pdf.text(`• ${armorText}`, margin + 10, y);
        y += 8;
      });
      y += 5;
    }

    // その他アイテム
    if (stats.equipment.items.length > 0) {
      pdf.setFont('helvetica', 'bold');
      pdf.text('Items:', margin, y);
      y += 8;
      pdf.setFont('helvetica', 'normal');

      stats.equipment.items.slice(0, 10).forEach(item => {
        pdf.text(`• ${item.name}`, margin + 10, y);
        y += 8;
      });
      y += 10;
    }

    return y;
  }

  /**
   * 🔮 呪文・能力描画
   */
  private renderPDFSpells(
    pdf: jsPDF,
    magicSystem: any,
    y: number,
    pageWidth: number,
    margin: number
  ): number {
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Spells & Powers', margin, y);
    y += 10;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');

    // 呪文スロット（ヴァンシアン系）
    if (magicSystem.spellSlots) {
      pdf.text('Spell Slots:', margin, y);
      y += 8;
      
      magicSystem.spellSlots.forEach((slot: any) => {
        pdf.text(`Level ${slot.level}: ${slot.total - slot.used}/${slot.total}`, margin + 10, y);
        y += 8;
      });
      y += 5;
    }

    // 既知呪文
    if (magicSystem.knownSpells && magicSystem.knownSpells.length > 0) {
      pdf.text('Known Spells:', margin, y);
      y += 8;

      magicSystem.knownSpells.slice(0, 15).forEach((spell: any) => {
        pdf.text(`• ${spell.name} (Level ${spell.level})`, margin + 10, y);
        y += 8;
      });
      y += 10;
    }

    return y;
  }

  /**
   * 📝 キャラクター詳細描画
   */
  private renderPDFDetails(
    pdf: jsPDF,
    character: TRPGCharacter,
    y: number,
    pageWidth: number,
    margin: number
  ): number {
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Character Details', margin, y);
    y += 10;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');

    // 基本情報
    const details = [
      `Race: ${character.race || 'Unknown'}`,
      `Class: ${character.class || 'Unknown'}`,
      `Background: ${character.background || 'Unknown'}`,
    ];

    details.forEach(detail => {
      pdf.text(detail, margin, y);
      y += 8;
    });

    // 説明
    if (character.description) {
      y += 5;
      pdf.setFont('helvetica', 'bold');
      pdf.text('Description:', margin, y);
      y += 8;
      pdf.setFont('helvetica', 'normal');

      const lines = pdf.splitTextToSize(character.description, pageWidth - margin * 2);
      pdf.text(lines, margin, y);
      y += lines.length * 5 + 10;
    }

    return y;
  }

  /**
   * 🖼️ ポートレート描画
   */
  private async renderPDFPortrait(
    pdf: jsPDF,
    imageUrl: string,
    pageWidth: number,
    margin: number
  ): Promise<void> {
    try {
      // 新しいページを追加
      pdf.addPage();
      
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Character Portrait', pageWidth / 2, margin + 10, { align: 'center' });
      
      // 画像読み込みと描画は実装が複雑なため、プレースホルダーとする
      pdf.setFontSize(10);
      pdf.text('[Character Portrait]', pageWidth / 2, margin + 50, { align: 'center' });
      pdf.text('(Image export requires additional implementation)', pageWidth / 2, margin + 60, { align: 'center' });
    } catch (error) {
      console.error('Portrait rendering error:', error);
    }
  }

  /**
   * 📄 PDFフッター描画
   */
  private renderPDFFooter(
    pdf: jsPDF,
    pageHeight: number,
    pageWidth: number,
    margin: number
  ): void {
    const footerY = pageHeight - margin;
    
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text(
      `Generated by TRPG AI Agent GM - ${new Date().toLocaleDateString()}`,
      pageWidth / 2,
      footerY,
      { align: 'center' }
    );
  }

  /**
   * 📊 CSV形式でエクスポート
   */
  exportToCSV(
    characters: TRPGCharacter[],
    campaign: TRPGCampaign,
    options: ExportOptions
  ): string {
    const headers = [
      'Name', 'Race', 'Class', 'Level', 'HP', 'MP', 'STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'
    ];

    const rows = characters.map(character => {
      const stats = this.gameSystemManager.convertCharacterToSystem(character);
      return [
        character.name,
        character.race || '',
        character.class || '',
        stats.progression.level || 1,
        stats.health.current || 0,
        stats.magic?.current || 0,
        stats.attributes.STR || 0,
        stats.attributes.DEX || 0,
        stats.attributes.CON || 0,
        stats.attributes.INT || 0,
        stats.attributes.WIS || 0,
        stats.attributes.CHA || 0,
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }

  /**
   * 📝 JSON形式でエクスポート
   */
  exportToJSON(
    characters: TRPGCharacter[],
    campaign: TRPGCampaign,
    options: ExportOptions
  ): string {
    const exportData = {
      campaign: {
        title: campaign.title,
        gameSystem: campaign.gameSystem,
        exportDate: new Date().toISOString(),
      },
      characters: characters.map(character => ({
        ...character,
        unifiedStats: this.gameSystemManager.convertCharacterToSystem(character),
      })),
      options,
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * 🖨️ 印刷用HTML生成
   */
  generatePrintHTML(
    character: TRPGCharacter,
    campaign: TRPGCampaign,
    options: ExportOptions
  ): string {
    const stats = this.gameSystemManager.convertCharacterToSystem(character);

    return `
<!DOCTYPE html>
<html>
<head>
    <title>${character.name} - Character Sheet</title>
    <style>
        @media print {
            body { margin: 0; font-family: Arial, sans-serif; font-size: 12px; }
            .page-break { page-break-after: always; }
            .no-print { display: none; }
        }
        .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
        .section { margin-bottom: 20px; }
        .section-title { font-weight: bold; font-size: 14px; border-bottom: 1px solid #666; margin-bottom: 10px; }
        .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
        .skill-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 5px; }
        .equipment-list { list-style: none; padding: 0; }
        .equipment-list li { margin: 5px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Character Sheet</h1>
        <h2>${character.name}</h2>
        <p>Campaign: ${campaign.title} | System: ${campaign.gameSystem}</p>
    </div>

    <div class="section">
        <div class="section-title">Attributes</div>
        <div class="stats-grid">
            ${Object.entries(stats.attributes).map(([key, value]) => 
                `<div><strong>${key}:</strong> ${value}</div>`
            ).join('')}
        </div>
    </div>

    <div class="section">
        <div class="section-title">Derived Stats</div>
        <div class="stats-grid">
            ${Object.entries(stats.derivedStats).map(([key, value]) => 
                `<div><strong>${key}:</strong> ${value}</div>`
            ).join('')}
        </div>
    </div>

    ${Object.keys(stats.skills).length > 0 ? `
    <div class="section">
        <div class="section-title">Skills</div>
        <div class="skill-grid">
            ${Object.entries(stats.skills).map(([key, value]) => 
                `<div>${key}: ${value}${options.gameSystem.includes('storm') || options.gameSystem.includes('cthulhu') ? '%' : ''}</div>`
            ).join('')}
        </div>
    </div>
    ` : ''}

    ${options.includeEquipment ? `
    <div class="section">
        <div class="section-title">Equipment</div>
        ${stats.equipment.weapons.length > 0 ? `
        <h4>Weapons:</h4>
        <ul class="equipment-list">
            ${stats.equipment.weapons.map(weapon => 
                `<li>• ${weapon.name}${weapon.equipped ? ' (Equipped)' : ''}</li>`
            ).join('')}
        </ul>
        ` : ''}
        ${stats.equipment.armor.length > 0 ? `
        <h4>Armor:</h4>
        <ul class="equipment-list">
            ${stats.equipment.armor.map(armor => 
                `<li>• ${armor.name}${armor.equipped ? ' (Equipped)' : ''}</li>`
            ).join('')}
        </ul>
        ` : ''}
    </div>
    ` : ''}

    <div class="section">
        <div class="section-title">Character Details</div>
        <p><strong>Race:</strong> ${character.race || 'Unknown'}</p>
        <p><strong>Class:</strong> ${character.class || 'Unknown'}</p>
        <p><strong>Background:</strong> ${character.background || 'Unknown'}</p>
        ${character.description ? `<p><strong>Description:</strong> ${character.description}</p>` : ''}
    </div>

    <button class="no-print" onclick="window.print()">Print</button>
</body>
</html>
    `;
  }

  /**
   * 🎯 バッチエクスポート
   */
  async batchExport(
    characters: TRPGCharacter[],
    campaign: TRPGCampaign,
    options: ExportOptions
  ): Promise<{ [filename: string]: Blob | string }> {
    const results: { [filename: string]: Blob | string } = {};

    for (const character of characters) {
      const filename = `${character.name.replace(/[^a-zA-Z0-9]/g, '_')}_sheet`;

      switch (options.format) {
        case 'pdf':
          results[`${filename}.pdf`] = await this.exportToPDF(character, campaign, options);
          break;
        case 'json':
          results[`${filename}.json`] = this.exportToJSON([character], campaign, options);
          break;
        case 'print':
          results[`${filename}.html`] = this.generatePrintHTML(character, campaign, options);
          break;
      }
    }

    // CSV は全キャラクターまとめて出力
    if (options.format === 'csv') {
      results['characters.csv'] = this.exportToCSV(characters, campaign, options);
    }

    return results;
  }
}

export default CharacterSheetExporter;