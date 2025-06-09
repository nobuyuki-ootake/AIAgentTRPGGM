import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Chip,
  Stack,
  Paper,
  IconButton,
} from '@mui/material';
import {
  CloudUpload,
  Description,
  Person,
  CheckCircle,
  Error as ErrorIcon,
  Info,
  Close,
} from '@mui/icons-material';
import { TRPGCharacter } from '@trpg-ai-gm/types';
import { TRPGImportUtil, ExternalFormat, ImportError } from '../../utils/TRPGImportUtil';

interface CharacterImportDialogProps {
  open: boolean;
  onClose: () => void;
  onImport: (character: TRPGCharacter) => void;
  existingCharacterNames?: string[];
}

const formatOptions = [
  { value: ExternalFormat.GENERIC_JSON, label: '汎用JSON形式', extension: '.json' },
  { value: ExternalFormat.UDONARIUM, label: 'ユドナリウム', extension: '.xml' },
  { value: ExternalFormat.FOUNDRY_VTT, label: 'Foundry VTT', extension: '.json' },
  { value: ExternalFormat.ROLL20, label: 'Roll20', extension: '.json' },
  { value: ExternalFormat.D_AND_D_BEYOND, label: 'D&D Beyond', extension: '.json' },
  { value: ExternalFormat.GENERIC_CSV, label: 'CSV形式', extension: '.csv' },
];

const steps = ['ファイル選択', 'フォーマット確認', 'データ確認', 'インポート完了'];

export const CharacterImportDialog: React.FC<CharacterImportDialogProps> = ({
  open,
  onClose,
  onImport,
  existingCharacterNames = [],
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<ExternalFormat>(ExternalFormat.GENERIC_JSON);
  const [importedCharacter, setImportedCharacter] = useState<TRPGCharacter | null>(null);
  const [errors, setErrors] = useState<ImportError[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setErrors([]);
      
      // ファイル拡張子から形式を推測
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (extension === 'xml') {
        setSelectedFormat(ExternalFormat.UDONARIUM);
      } else if (extension === 'csv') {
        setSelectedFormat(ExternalFormat.GENERIC_CSV);
      } else {
        setSelectedFormat(ExternalFormat.GENERIC_JSON);
      }
    }
  };

  const handleNext = async () => {
    if (activeStep === 0 && selectedFile) {
      setActiveStep(1);
    } else if (activeStep === 1) {
      // ファイルを解析
      setIsLoading(true);
      try {
        const result = await TRPGImportUtil.importCharacterFromFile(selectedFile!, selectedFormat);
        
        if (result.errors.length > 0) {
          setErrors(result.errors);
          setIsLoading(false);
          return;
        }
        
        if (result.character) {
          // 名前の重複チェック
          if (existingCharacterNames.includes(result.character.name)) {
            result.character.name = `${result.character.name} (インポート)`;
          }
          
          setImportedCharacter(result.character);
          setActiveStep(2);
        }
      } catch (error) {
        setErrors([{
          field: 'parse',
          message: 'ファイルの解析中にエラーが発生しました'
        }]);
      }
      setIsLoading(false);
    } else if (activeStep === 2 && importedCharacter) {
      // インポート実行
      onImport(importedCharacter);
      setActiveStep(3);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
    setSelectedFile(null);
    setImportedCharacter(null);
    setErrors([]);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">キャラクターインポート</Typography>
          <IconButton onClick={handleClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Step 0: ファイル選択 */}
        {activeStep === 0 && (
          <Box>
            <Alert severity="info" sx={{ mb: 2 }}>
              他のTRPGツールからキャラクターデータをインポートできます。
              対応形式: ユドナリウム、Foundry VTT、Roll20、D&D Beyond、汎用JSON/CSV
            </Alert>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.xml,.csv"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            
            <Paper
              sx={{
                p: 4,
                textAlign: 'center',
                cursor: 'pointer',
                border: '2px dashed',
                borderColor: 'divider',
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: 'action.hover',
                },
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                ファイルを選択またはドラッグ＆ドロップ
              </Typography>
              <Typography variant="body2" color="text.secondary">
                対応形式: .json, .xml, .csv
              </Typography>
            </Paper>
            
            {selectedFile && (
              <Box mt={2}>
                <Chip
                  icon={<Description />}
                  label={selectedFile.name}
                  onDelete={() => setSelectedFile(null)}
                  color="primary"
                />
              </Box>
            )}
          </Box>
        )}

        {/* Step 1: フォーマット確認 */}
        {activeStep === 1 && (
          <Box>
            <Typography variant="body1" gutterBottom>
              インポート形式を選択してください
            </Typography>
            
            <FormControl fullWidth sx={{ mt: 2, mb: 2 }}>
              <InputLabel>インポート形式</InputLabel>
              <Select
                value={selectedFormat}
                onChange={(e) => setSelectedFormat(e.target.value as ExternalFormat)}
                label="インポート形式"
              >
                {formatOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <Alert severity="info">
              選択した形式: <strong>{formatOptions.find(f => f.value === selectedFormat)?.label}</strong>
              <br />
              ファイル名: <strong>{selectedFile?.name}</strong>
            </Alert>
            
            {errors.length > 0 && (
              <Alert severity="error" sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  インポートエラー:
                </Typography>
                <List dense>
                  {errors.map((error, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <ErrorIcon color="error" />
                      </ListItemIcon>
                      <ListItemText
                        primary={error.field}
                        secondary={error.message}
                      />
                    </ListItem>
                  ))}
                </List>
              </Alert>
            )}
          </Box>
        )}

        {/* Step 2: データ確認 */}
        {activeStep === 2 && importedCharacter && (
          <Box>
            <Alert severity="success" sx={{ mb: 2 }}>
              キャラクターデータが正常に読み込まれました
            </Alert>
            
            <Paper sx={{ p: 2 }}>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    名前
                  </Typography>
                  <Typography variant="h6">{importedCharacter.name}</Typography>
                </Box>
                
                <Box display="flex" gap={2}>
                  <Box flex={1}>
                    <Typography variant="subtitle2" color="text.secondary">
                      国籍/種族
                    </Typography>
                    <Typography>{importedCharacter.nation}</Typography>
                  </Box>
                  <Box flex={1}>
                    <Typography variant="subtitle2" color="text.secondary">
                      職業
                    </Typography>
                    <Typography>{importedCharacter.profession}</Typography>
                  </Box>
                  <Box flex={1}>
                    <Typography variant="subtitle2" color="text.secondary">
                      年齢
                    </Typography>
                    <Typography>{importedCharacter.age}</Typography>
                  </Box>
                </Box>
                
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    能力値
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    <Chip label={`STR: ${importedCharacter.attributes.STR}`} size="small" />
                    <Chip label={`CON: ${importedCharacter.attributes.CON}`} size="small" />
                    <Chip label={`SIZ: ${importedCharacter.attributes.SIZ}`} size="small" />
                    <Chip label={`INT: ${importedCharacter.attributes.INT}`} size="small" />
                    <Chip label={`POW: ${importedCharacter.attributes.POW}`} size="small" />
                    <Chip label={`DEX: ${importedCharacter.attributes.DEX}`} size="small" />
                    <Chip label={`CHA: ${importedCharacter.attributes.CHA}`} size="small" />
                  </Stack>
                </Box>
                
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    説明
                  </Typography>
                  <Typography variant="body2">{importedCharacter.description}</Typography>
                </Box>
              </Stack>
            </Paper>
          </Box>
        )}

        {/* Step 3: インポート完了 */}
        {activeStep === 3 && (
          <Box textAlign="center" py={3}>
            <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              インポート完了！
            </Typography>
            <Typography variant="body2" color="text.secondary">
              キャラクター「{importedCharacter?.name}」が正常にインポートされました。
            </Typography>
          </Box>
        )}
        
        {isLoading && (
          <Box display="flex" justifyContent="center" py={3}>
            <CircularProgress />
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        {activeStep < 3 && (
          <>
            <Button onClick={handleClose}>キャンセル</Button>
            {activeStep > 0 && (
              <Button onClick={handleBack}>戻る</Button>
            )}
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={
                (activeStep === 0 && !selectedFile) ||
                (activeStep === 1 && errors.length > 0) ||
                isLoading
              }
            >
              {activeStep === 2 ? 'インポート' : '次へ'}
            </Button>
          </>
        )}
        {activeStep === 3 && (
          <Button variant="contained" onClick={handleClose}>
            閉じる
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CharacterImportDialog;