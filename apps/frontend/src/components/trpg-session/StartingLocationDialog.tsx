import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Box,
  Chip,
  Alert,
} from "@mui/material";
import { LocationOn, Info } from "@mui/icons-material";
import type { BaseLocation, StartingLocationInfo } from "@trpg-ai-gm/types";

interface StartingLocationDialogProps {
  open: boolean;
  onClose: () => void;
  bases: BaseLocation[];
  currentStartingLocation?: StartingLocationInfo | null;
  onSetStartingLocation: (location: StartingLocationInfo) => void;
}

export const StartingLocationDialog: React.FC<StartingLocationDialogProps> = ({
  open,
  onClose,
  bases,
  currentStartingLocation,
  onSetStartingLocation,
}) => {
  const [selectedLocationId, setSelectedLocationId] = useState<string>("");
  const [selectedBase, setSelectedBase] = useState<BaseLocation | null>(null);

  // 利用可能な拠点をフィルタリング（プレイヤー拠点として使える場所のみ）
  const availableBases = bases.filter(
    (base) =>
      base.features.playerBase &&
      base.meta.unlocked &&
      base.importance !== "隠し拠点",
  );

  useEffect(() => {
    if (currentStartingLocation) {
      setSelectedLocationId(currentStartingLocation.id);
      const base = bases.find((b) => b.id === currentStartingLocation.id);
      setSelectedBase(base || null);
    } else if (availableBases.length > 0) {
      // デフォルトで最初の利用可能な拠点を選択
      const firstBase = availableBases[0];
      setSelectedLocationId(firstBase.id);
      setSelectedBase(firstBase);
    }
  }, [currentStartingLocation, bases, availableBases]);

  const handleLocationChange = (locationId: string) => {
    setSelectedLocationId(locationId);
    const base = bases.find((b) => b.id === locationId);
    setSelectedBase(base || null);
  };

  const handleConfirm = () => {
    if (selectedBase) {
      const startingLocationInfo: StartingLocationInfo = {
        id: selectedBase.id,
        name: selectedBase.name,
        type: "base",
        description: selectedBase.description,
        imageUrl: selectedBase.imageUrl,
        setAt: new Date(),
        isActive: true,
      };
      onSetStartingLocation(startingLocationInfo);
      onClose();
    }
  };

  const canStartSession = selectedBase && availableBases.length > 0;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      data-testid="starting-location-dialog"
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <LocationOn color="primary" />
          ゲーム開始場所の設定
        </Box>
      </DialogTitle>

      <DialogContent>
        {availableBases.length === 0 ? (
          <Alert severity="warning" sx={{ mb: 2 }}>
            利用可能な開始場所がありません。拠点タブでプレイヤー拠点として使用可能な場所を設定してください。
          </Alert>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              セッション開始時にパーティーが配置される場所を選択してください。
              選択できるのは、プレイヤー拠点として利用可能で、アンロック済みの場所のみです。
            </Typography>

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>開始場所</InputLabel>
              <Select
                value={selectedLocationId}
                label="開始場所"
                onChange={(e) => handleLocationChange(e.target.value)}
                data-testid="location-select"
              >
                {availableBases.map((base) => (
                  <MenuItem key={base.id} value={base.id}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography>{base.name}</Typography>
                      <Chip
                        label={base.rank}
                        size="small"
                        variant="outlined"
                        color={
                          base.importance === "主要拠点" ? "primary" : "default"
                        }
                      />
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {selectedBase && (
              <Card sx={{ mb: 2 }}>
                <Box display="flex">
                  {selectedBase.imageUrl && (
                    <CardMedia
                      component="img"
                      sx={{ width: 160, height: 120, objectFit: "cover" }}
                      image={selectedBase.imageUrl}
                      alt={selectedBase.name}
                    />
                  )}
                  <Box
                    sx={{ display: "flex", flexDirection: "column", flex: 1 }}
                  >
                    <CardContent sx={{ flex: "1 0 auto", pb: 1 }}>
                      <Typography component="div" variant="h6">
                        {selectedBase.name}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 1 }}
                      >
                        {selectedBase.type} • {selectedBase.region}
                      </Typography>
                      <Typography variant="body2">
                        {selectedBase.description}
                      </Typography>
                    </CardContent>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        px: 2,
                        pb: 1,
                      }}
                    >
                      <Box display="flex" gap={1} flexWrap="wrap">
                        {selectedBase.features.fastTravel && (
                          <Chip
                            label="高速移動可能"
                            size="small"
                            color="primary"
                          />
                        )}
                        {selectedBase.features.questHub && (
                          <Chip
                            label="クエスト拠点"
                            size="small"
                            color="secondary"
                          />
                        )}
                        {selectedBase.threats.dangerLevel === "低" && (
                          <Chip label="安全" size="small" color="success" />
                        )}
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </Card>
            )}

            {currentStartingLocation && (
              <Alert severity="info" icon={<Info />} sx={{ mt: 2 }}>
                現在の開始場所: {currentStartingLocation.name}
                {selectedLocationId === currentStartingLocation.id
                  ? " (変更なし)"
                  : " → " + selectedBase?.name + " (変更予定)"}
              </Alert>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>キャンセル</Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={!canStartSession}
          data-testid="confirm-starting-location"
        >
          開始場所を設定
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StartingLocationDialog;
