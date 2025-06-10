import React, { useState } from 'react';
import {
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  FileDownload as DownloadIcon,
  PictureAsPdf as PdfIcon,
  DataObject as JsonIcon,
  TableChart as CsvIcon,
  Print as PrintIcon,
} from '@mui/icons-material';
import { TRPGCharacter, TRPGCampaign } from '@trpg-ai-gm/types';
import {
  exportCharacterSheetPDF,
  exportCampaignJSON,
  exportCharactersCSV,
} from '../../utils/characterSheetExport';

interface ExportMenuProps {
  campaign: TRPGCampaign | undefined;
  characters: TRPGCharacter[];
  selectedCharacter?: TRPGCharacter;
  disabled?: boolean;
}

type ExportType = 'character-pdf' | 'campaign-json' | 'characters-csv' | 'print-character';

const ExportMenu: React.FC<ExportMenuProps> = ({
  campaign,
  characters,
  selectedCharacter,
  disabled = false,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [selectedExportType, setSelectedExportType] = useState<ExportType>('character-pdf');
  const [selectedCharacterForExport, setSelectedCharacterForExport] = useState<string>(
    selectedCharacter?.id || ''
  );
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string>('');

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleExportMenuClick = (exportType: ExportType) => {
    setSelectedExportType(exportType);
    setExportDialogOpen(true);
    handleClose();
  };

  const handleExportDialogClose = () => {
    setExportDialogOpen(false);
    setExportError('');
  };

  const handleExport = async () => {
    setIsExporting(true);
    setExportError('');

    try {
      switch (selectedExportType) {
        case 'character-pdf':
          if (selectedCharacterForExport) {
            const character = characters.find(c => c.id === selectedCharacterForExport);
            if (character) {
              exportCharacterSheetPDF(character);
            } else {
              throw new Error('選択されたキャラクターが見つかりません');
            }
          } else {
            throw new Error('エクスポートするキャラクターを選択してください');
          }
          break;

        case 'campaign-json':
          if (!campaign) {
            throw new Error('エクスポートするキャンペーンがありません');
          }
          exportCampaignJSON(campaign);
          break;

        case 'characters-csv':
          if (characters.length === 0) {
            throw new Error('エクスポートするキャラクターがありません');
          }
          exportCharactersCSV(characters, campaign?.title || 'キャンペーン');
          break;

        case 'print-character':
          if (selectedCharacterForExport) {
            const character = characters.find(c => c.id === selectedCharacterForExport);
            if (character) {
              // 印刷用の新しいウィンドウを開く
              handlePrintCharacterSheet(character);
            } else {
              throw new Error('選択されたキャラクターが見つかりません');
            }
          } else {
            throw new Error('印刷するキャラクターを選択してください');
          }
          break;

        default:
          throw new Error('不明なエクスポートタイプです');
      }

      // 成功した場合はダイアログを閉じる
      setTimeout(() => {
        setExportDialogOpen(false);
      }, 1000);

    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'エクスポート中にエラーが発生しました');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrintCharacterSheet = (character: TRPGCharacter) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('印刷ウィンドウを開けませんでした。ポップアップブロッカーを確認してください。');
    }

    const printContent = generatePrintHTML(character);
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // 印刷ダイアログを表示
    printWindow.focus();
    printWindow.print();
  };

  const generatePrintHTML = (character: TRPGCharacter): string => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${character.name} - Character Sheet</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 20px; }
          .section { margin-bottom: 20px; }
          .section h3 { border-bottom: 2px solid #333; padding-bottom: 5px; }
          .attributes { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
          .skills { margin-top: 10px; }
          .skills h4 { margin: 15px 0 5px 0; }
          .skill-list { margin-left: 20px; }
          @media print { body { margin: 10px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Stormbringer Character Sheet</h1>
          <h2>${character.name}</h2>
        </div>
        
        <div class="section">
          <h3>Basic Information</h3>
          <p><strong>Profession:</strong> ${character.profession}</p>
          <p><strong>Gender:</strong> ${character.gender}</p>
          <p><strong>Age:</strong> ${character.age}</p>
          <p><strong>Nation:</strong> ${character.nation}</p>
          <p><strong>Religion:</strong> ${character.religion}</p>
          <p><strong>Player:</strong> ${character.player}</p>
        </div>

        <div class="section">
          <h3>Attributes</h3>
          <div class="attributes">
            <div>STR: ${character.attributes.STR}</div>
            <div>CON: ${character.attributes.CON}</div>
            <div>SIZ: ${character.attributes.SIZ}</div>
            <div>INT: ${character.attributes.INT}</div>
            <div>POW: ${character.attributes.POW}</div>
            <div>DEX: ${character.attributes.DEX}</div>
            <div>CHA: ${character.attributes.CHA}</div>
          </div>
        </div>

        <div class="section">
          <h3>Derived Values</h3>
          <div class="attributes">
            <div>HP: ${character.derived.HP}</div>
            <div>MP: ${character.derived.MP}</div>
            <div>SW: ${character.derived.SW}</div>
            <div>RES: ${character.derived.RES}</div>
          </div>
        </div>

        <div class="section">
          <h3>Armor</h3>
          <div class="attributes">
            <div>Head: ${character.armor.head}</div>
            <div>Body: ${character.armor.body}</div>
            <div>Left Arm: ${character.armor.leftArm}</div>
            <div>Right Arm: ${character.armor.rightArm}</div>
            <div>Left Leg: ${character.armor.leftLeg}</div>
            <div>Right Leg: ${character.armor.rightLeg}</div>
          </div>
        </div>

        <div class="section">
          <h3>Skills</h3>
          <div class="skills">
            ${Object.entries(character.skills).map(([category, skills]) => `
              <h4>${category.replace(/Skills$/, ' Skills')}</h4>
              <div class="skill-list">
                ${skills && skills.length > 0 
                  ? skills.map(skill => `<p>${skill.name}: ${skill.value}%</p>`).join('')
                  : '<p>No skills in this category</p>'
                }
              </div>
            `).join('')}
          </div>
        </div>

        ${character.description ? `
          <div class="section">
            <h3>Description</h3>
            <p>${character.description}</p>
          </div>
        ` : ''}
      </body>
      </html>
    `;
  };

  const getExportTypeLabel = (type: ExportType): string => {
    switch (type) {
      case 'character-pdf':
        return 'キャラクターシート PDF出力';
      case 'campaign-json':
        return 'キャンペーン JSON エクスポート';
      case 'characters-csv':
        return 'キャラクター一覧 CSV エクスポート';
      case 'print-character':
        return 'キャラクターシート印刷';
      default:
        return 'エクスポート';
    }
  };

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<DownloadIcon />}
        onClick={handleClick}
        disabled={disabled}
      >
        エクスポート
      </Button>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
        <MenuItem onClick={() => handleExportMenuClick('character-pdf')}>
          <ListItemIcon>
            <PdfIcon />
          </ListItemIcon>
          <ListItemText primary="キャラクターシート PDF" />
        </MenuItem>

        <MenuItem onClick={() => handleExportMenuClick('print-character')}>
          <ListItemIcon>
            <PrintIcon />
          </ListItemIcon>
          <ListItemText primary="キャラクターシート印刷" />
        </MenuItem>

        <Divider />

        <MenuItem onClick={() => handleExportMenuClick('campaign-json')}>
          <ListItemIcon>
            <JsonIcon />
          </ListItemIcon>
          <ListItemText primary="キャンペーン JSON" />
        </MenuItem>

        <MenuItem onClick={() => handleExportMenuClick('characters-csv')}>
          <ListItemIcon>
            <CsvIcon />
          </ListItemIcon>
          <ListItemText primary="キャラクター一覧 CSV" />
        </MenuItem>
      </Menu>

      <Dialog open={exportDialogOpen} onClose={handleExportDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>{getExportTypeLabel(selectedExportType)}</DialogTitle>
        <DialogContent>
          {exportError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {exportError}
            </Alert>
          )}

          {(selectedExportType === 'character-pdf' || selectedExportType === 'print-character') && (
            <FormControl component="fieldset" sx={{ mt: 2 }}>
              <FormLabel component="legend">エクスポートするキャラクター</FormLabel>
              <RadioGroup
                value={selectedCharacterForExport}
                onChange={(e) => setSelectedCharacterForExport(e.target.value)}
              >
                {characters.map((character) => (
                  <FormControlLabel
                    key={character.id}
                    value={character.id}
                    control={<Radio />}
                    label={`${character.name} (${character.profession})`}
                  />
                ))}
              </RadioGroup>
            </FormControl>
          )}

          {selectedExportType === 'campaign-json' && (
            <Box sx={{ mt: 2 }}>
              <p>キャンペーン「{campaign?.title || 'キャンペーン'}」の全データをJSONファイルとしてエクスポートします。</p>
            </Box>
          )}

          {selectedExportType === 'characters-csv' && (
            <Box sx={{ mt: 2 }}>
              <p>
                {characters.length}人のキャラクターデータをCSVファイルとしてエクスポートします。
                スプレッドシートアプリケーションで開くことができます。
              </p>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleExportDialogClose} disabled={isExporting}>
            キャンセル
          </Button>
          <Button
            onClick={handleExport}
            variant="contained"
            disabled={isExporting}
            startIcon={isExporting ? <CircularProgress size={20} /> : <DownloadIcon />}
          >
            {isExporting ? 'エクスポート中...' : 'エクスポート'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ExportMenu;