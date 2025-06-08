import React from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Alert,
  Divider,
} from "@mui/material";
import {
  LocationOn as LocationIcon,
  Home as HomeIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
} from "@mui/icons-material";
import { StartingLocationInfo } from "@trpg-ai-gm/types";

interface StartingLocationSelectProps {
  currentStartingLocation?: StartingLocationInfo | null;
  locationId: string;
  locationName: string;
  locationType: "base" | "location";
  locationDescription?: string;
  locationImageUrl?: string;
  onSetAsStartingLocation: (locationId: string, locationName: string, locationType: "base" | "location") => void;
  onRemoveStartingLocation?: () => void;
  disabled?: boolean;
}

export const StartingLocationSelect: React.FC<StartingLocationSelectProps> = ({
  currentStartingLocation,
  locationId,
  locationName,
  locationType,
  locationDescription,
  locationImageUrl,
  onSetAsStartingLocation,
  onRemoveStartingLocation,
  disabled = false,
}) => {
  const isCurrentStartingLocation = 
    currentStartingLocation?.id === locationId && 
    currentStartingLocation?.type === locationType;

  const handleSetAsStarting = () => {
    onSetAsStartingLocation(locationId, locationName, locationType);
  };

  const handleRemoveStarting = () => {
    if (onRemoveStartingLocation) {
      onRemoveStartingLocation();
    }
  };

  return (
    <Box sx={{ mt: 1 }}>
      <Divider sx={{ mb: 1 }} />
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {locationType === "base" ? <HomeIcon color="primary" /> : <LocationIcon color="secondary" />}
          <Typography variant="body2" color="text.secondary">
            ゲーム開始場所設定
          </Typography>
        </Box>
        
        {isCurrentStartingLocation ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Chip
              icon={<StarIcon />}
              label="現在の開始場所"
              color="warning"
              size="small"
              variant="filled"
            />
            <Button
              variant="outlined"
              size="small"
              onClick={handleRemoveStarting}
              disabled={disabled}
              color="secondary"
            >
              解除
            </Button>
          </Box>
        ) : (
          <Button
            variant="contained"
            size="small"
            startIcon={<StarBorderIcon />}
            onClick={handleSetAsStarting}
            disabled={disabled}
            color="primary"
          >
            開始場所に設定
          </Button>
        )}
      </Box>
      
      {isCurrentStartingLocation && (
        <Alert 
          severity="success" 
          sx={{ mt: 1, mb: 1 }}
          icon={<StarIcon />}
        >
          <Typography variant="body2">
            この{locationType === "base" ? "拠点" : "場所"}がゲーム開始場所として設定されています。
            TRPGセッション時に、キャラクターたちはここからゲームを開始します。
          </Typography>
        </Alert>
      )}
    </Box>
  );
};

// 現在の開始場所設定状況を表示するコンポーネント
interface CurrentStartingLocationDisplayProps {
  currentStartingLocation?: StartingLocationInfo | null;
  onClearStartingLocation?: () => void;
  compact?: boolean;
}

export const CurrentStartingLocationDisplay: React.FC<CurrentStartingLocationDisplayProps> = ({
  currentStartingLocation,
  onClearStartingLocation,
  compact = false,
}) => {
  if (!currentStartingLocation) {
    return (
      <Alert severity="info" sx={{ mb: 2 }}>
        <Typography variant="body2">
          ゲーム開始場所が設定されていません。拠点または場所から開始場所を選択してください。
        </Typography>
      </Alert>
    );
  }

  if (compact) {
    return (
      <Box sx={{ mb: 2 }}>
        <Card variant="outlined">
          <CardContent sx={{ py: 1, "&:last-child": { pb: 1 } }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                {currentStartingLocation.type === "base" ? 
                  <HomeIcon color="primary" /> : 
                  <LocationIcon color="secondary" />
                }
                <Box>
                  <Typography variant="body2" fontWeight="bold">
                    {currentStartingLocation.name}
                  </Typography>
                  <Chip
                    label={currentStartingLocation.type === "base" ? "拠点" : "探索地"}
                    size="small"
                    color={currentStartingLocation.type === "base" ? "primary" : "secondary"}
                    variant="outlined"
                  />
                </Box>
              </Box>
              {onClearStartingLocation && (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={onClearStartingLocation}
                  color="secondary"
                >
                  解除
                </Button>
              )}
            </Box>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2 }}>
          <Box sx={{ display: "flex", gap: 2, flexGrow: 1 }}>
            {currentStartingLocation.imageUrl && (
              <Box
                component="img"
                src={currentStartingLocation.imageUrl}
                alt={currentStartingLocation.name}
                sx={{
                  width: 80,
                  height: 60,
                  objectFit: "cover",
                  borderRadius: 1,
                  border: "2px solid",
                  borderColor: "warning.main",
                }}
              />
            )}
            <Box sx={{ flexGrow: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                <StarIcon color="warning" />
                <Typography variant="h6" color="warning.main">
                  現在の開始場所
                </Typography>
              </Box>
              <Typography variant="h5" gutterBottom>
                {currentStartingLocation.name}
              </Typography>
              <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
                <Chip
                  icon={currentStartingLocation.type === "base" ? <HomeIcon /> : <LocationIcon />}
                  label={currentStartingLocation.type === "base" ? "拠点" : "探索地"}
                  color={currentStartingLocation.type === "base" ? "primary" : "secondary"}
                  variant="filled"
                />
              </Box>
              {currentStartingLocation.description && (
                <Typography variant="body2" color="text.secondary">
                  {currentStartingLocation.description}
                </Typography>
              )}
              <Typography variant="caption" color="text.disabled" sx={{ mt: 1, display: "block" }}>
                設定日時: {new Date(currentStartingLocation.setAt).toLocaleString()}
              </Typography>
            </Box>
          </Box>
          {onClearStartingLocation && (
            <Button
              variant="outlined"
              onClick={onClearStartingLocation}
              color="secondary"
            >
              開始場所を解除
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};