// @ts-nocheck
import jsPDF from 'jspdf';
import { TRPGCharacter, TRPGCampaign } from '@trpg-ai-gm/types';

// PDF生成用のフォント設定
const setupJapaneseFonts = (doc: jsPDF) => {
  // 日本語フォント設定（可能な場合）
  try {
    // デフォルトフォントでの対応
    doc.setFont('helvetica');
  } catch (error) {
    console.warn('日本語フォントの設定に失敗しました:', error);
  }
};

// Stormbringerキャラクターシート用のPDF生成
export const generateStormbringerCharacterSheetPDF = (character: TRPGCharacter): Blob => {
  const doc = new jsPDF();
  setupJapaneseFonts(doc);

  // A4サイズの設定
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let currentY = margin;

  // ヘッダー
  doc.setFontSize(20);
  doc.text('Stormbringer Character Sheet', pageWidth / 2, currentY, { align: 'center' });
  currentY += 20;

  // キャラクター基本情報
  doc.setFontSize(16);
  doc.text('Character Information', margin, currentY);
  currentY += 10;

  doc.setFontSize(12);
  const basicInfo = [
    `Name: ${character.name}`,
    `Profession: ${character.profession}`,
    `Gender: ${character.gender}`,
    `Age: ${character.age}`,
    `Nation: ${character.nation}`,
    `Religion: ${character.religion}`,
    `Player: ${character.player}`,
  ];

  basicInfo.forEach(info => {
    doc.text(info, margin, currentY);
    currentY += 8;
  });

  currentY += 10;

  // 能力値
  doc.setFontSize(16);
  doc.text('Attributes', margin, currentY);
  currentY += 10;

  doc.setFontSize(12);
  const attributes = [
    `STR (Strength): ${character.attributes.STR}`,
    `CON (Constitution): ${character.attributes.CON}`,
    `SIZ (Size): ${character.attributes.SIZ}`,
    `INT (Intelligence): ${character.attributes.INT}`,
    `POW (Power): ${character.attributes.POW}`,
    `DEX (Dexterity): ${character.attributes.DEX}`,
    `CHA (Charisma): ${character.attributes.CHA}`,
  ];

  // 2列で表示
  attributes.forEach((attr, index) => {
    const x = index % 2 === 0 ? margin : pageWidth / 2;
    doc.text(attr, x, currentY);
    if (index % 2 === 1 || index === attributes.length - 1) {
      currentY += 8;
    }
  });

  currentY += 10;

  // 派生値
  doc.setFontSize(16);
  doc.text('Derived Values', margin, currentY);
  currentY += 10;

  doc.setFontSize(12);
  const derived = [
    `HP (Hit Points): ${character.derived.HP}`,
    `MP (Magic Points): ${character.derived.MP}`,
    `SW (Strike Rank): ${character.derived.SW}`,
    `RES (Resistance): ${character.derived.RES}`,
  ];

  derived.forEach((der, index) => {
    const x = index % 2 === 0 ? margin : pageWidth / 2;
    doc.text(der, x, currentY);
    if (index % 2 === 1 || index === derived.length - 1) {
      currentY += 8;
    }
  });

  currentY += 15;

  // 防具
  if (currentY > pageHeight - 60) {
    doc.addPage();
    currentY = margin;
  }

  doc.setFontSize(16);
  doc.text('Armor', margin, currentY);
  currentY += 10;

  doc.setFontSize(12);
  const armor = [
    `Head: ${character.armor.head}`,
    `Body: ${character.armor.body}`,
    `Left Arm: ${character.armor.leftArm}`,
    `Right Arm: ${character.armor.rightArm}`,
    `Left Leg: ${character.armor.leftLeg}`,
    `Right Leg: ${character.armor.rightLeg}`,
  ];

  armor.forEach((arm, index) => {
    const x = index % 2 === 0 ? margin : pageWidth / 2;
    doc.text(arm, x, currentY);
    if (index % 2 === 1 || index === armor.length - 1) {
      currentY += 8;
    }
  });

  currentY += 15;

  // 武器
  if (currentY > pageHeight - 100) {
    doc.addPage();
    currentY = margin;
  }

  doc.setFontSize(16);
  doc.text('Weapons', margin, currentY);
  currentY += 10;

  doc.setFontSize(10);
  if (character.weapons && character.weapons.length > 0) {
    character.weapons.forEach((weapon, index) => {
      if (currentY > pageHeight - 30) {
        doc.addPage();
        currentY = margin;
      }
      doc.text(`${index + 1}. ${weapon.name} - Damage: ${weapon.damage}, SR: ${weapon.strikeRank}`, margin, currentY);
      currentY += 8;
    });
  } else {
    doc.text('No weapons equipped', margin, currentY);
    currentY += 8;
  }

  currentY += 15;

  // スキル
  if (currentY > pageHeight - 150) {
    doc.addPage();
    currentY = margin;
  }

  doc.setFontSize(16);
  doc.text('Skills', margin, currentY);
  currentY += 10;

  doc.setFontSize(10);
  
  // スキルカテゴリを順番に表示
  const skillCategories = [
    { name: 'Agility Skills', skills: character.skills.AgilitySkills },
    { name: 'Communication Skills', skills: character.skills.CommunicationSkills },
    { name: 'Knowledge Skills', skills: character.skills.KnowledgeSkills },
    { name: 'Manipulation Skills', skills: character.skills.ManipulationSkills },
    { name: 'Perception Skills', skills: character.skills.PerceptionSkills },
    { name: 'Stealth Skills', skills: character.skills.StealthSkills },
    { name: 'Magic Skills', skills: character.skills.MagicSkills },
    { name: 'Weapon Skills', skills: character.skills.WeaponSkills },
  ];

  skillCategories.forEach(category => {
    if (currentY > pageHeight - 50) {
      doc.addPage();
      currentY = margin;
    }

    doc.setFontSize(12);
    doc.text(category.name, margin, currentY);
    currentY += 8;

    doc.setFontSize(10);
    if (category.skills && category.skills.length > 0) {
      category.skills.forEach(skill => {
        if (currentY > pageHeight - 20) {
          doc.addPage();
          currentY = margin;
        }
        doc.text(`  ${skill.name}: ${skill.value}%`, margin, currentY);
        currentY += 6;
      });
    } else {
      doc.text('  No skills in this category', margin, currentY);
      currentY += 6;
    }
    currentY += 5;
  });

  // 説明・背景
  if (character.description) {
    if (currentY > pageHeight - 60) {
      doc.addPage();
      currentY = margin;
    }

    doc.setFontSize(16);
    doc.text('Description', margin, currentY);
    currentY += 10;

    doc.setFontSize(10);
    const splitDescription = doc.splitTextToSize(character.description, pageWidth - 2 * margin);
    doc.text(splitDescription, margin, currentY);
  }

  // PDFをBlobとして返す
  return doc.output('blob');
};

// JSON形式でキャンペーンをエクスポート
export const exportCampaignToJSON = (campaign: TRPGCampaign): string => {
  return JSON.stringify(campaign, null, 2);
};

// CSV形式でキャラクターデータをエクスポート
export const exportCharactersToCSV = (characters: TRPGCharacter[]): string => {
  if (characters.length === 0) {
    return 'No characters to export';
  }

  // CSVヘッダー
  const headers = [
    'Name', 'Profession', 'Gender', 'Age', 'Nation', 'Religion', 'Player',
    'STR', 'CON', 'SIZ', 'INT', 'POW', 'DEX', 'CHA',
    'HP', 'MP', 'SW', 'RES',
    'Head Armor', 'Body Armor', 'Left Arm Armor', 'Right Arm Armor', 'Left Leg Armor', 'Right Leg Armor',
    'Description'
  ];

  // CSVデータ
  const csvData = characters.map(char => [
    char.name,
    char.profession,
    char.gender,
    char.age,
    char.nation,
    char.religion,
    char.player,
    char.attributes.STR,
    char.attributes.CON,
    char.attributes.SIZ,
    char.attributes.INT,
    char.attributes.POW,
    char.attributes.DEX,
    char.attributes.CHA,
    char.derived.HP,
    char.derived.MP,
    char.derived.SW,
    char.derived.RES,
    char.armor.head,
    char.armor.body,
    char.armor.leftArm,
    char.armor.rightArm,
    char.armor.leftLeg,
    char.armor.rightLeg,
    `"${char.description.replace(/"/g, '""')}"` // CSVエスケープ
  ]);

  // CSV文字列を作成
  const csvContent = [headers.join(',')]
    .concat(csvData.map(row => row.join(',')))
    .join('\n');

  return csvContent;
};

// ファイルダウンロード用ヘルパー関数
export const downloadFile = (content: string | Blob, filename: string, mimeType: string) => {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // メモリリークを防ぐためにURLを解放
  URL.revokeObjectURL(url);
};

// 使用例用のエクスポート関数
export const exportCharacterSheetPDF = (character: TRPGCharacter) => {
  const pdfBlob = generateStormbringerCharacterSheetPDF(character);
  downloadFile(pdfBlob, `${character.name}_character_sheet.pdf`, 'application/pdf');
};

export const exportCampaignJSON = (campaign: TRPGCampaign) => {
  const jsonContent = exportCampaignToJSON(campaign);
  downloadFile(jsonContent, `${campaign.title}_campaign.json`, 'application/json');
};

export const exportCharactersCSV = (characters: TRPGCharacter[], campaignName: string) => {
  const csvContent = exportCharactersToCSV(characters);
  downloadFile(csvContent, `${campaignName}_characters.csv`, 'text/csv');
};