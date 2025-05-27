import React from "react";
import { Box, Typography, Button, Paper } from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";

interface WorldMapTabProps {
  mapImageUrl: string;
  onMapImageUpload: (url: string) => void;
}

const WorldMapTab: React.FC<WorldMapTabProps> = ({
  mapImageUrl,
  onMapImageUpload,
}) => {
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // 実際の実装ではファイルをサーバーにアップロードし、
      // 返されたURLをhandleMapImageUploadに渡します
      // ここでは仮にファイル名をURLとして扱います
      const mockUrl = URL.createObjectURL(file);
      onMapImageUpload(mockUrl);
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        ワールドマップ
      </Typography>
      <Typography paragraph sx={{ mb: 3 }}>
        世界の地図をアップロードしましょう。マップがあることで、地名や場所の関係性が明確になります。
      </Typography>

      {mapImageUrl ? (
        <Box sx={{ width: "100%", textAlign: "center", mb: 2 }}>
          <Paper
            elevation={3}
            sx={{
              display: "inline-block",
              p: 2,
              maxWidth: "100%",
              boxSizing: "border-box",
            }}
          >
            <img
              src={mapImageUrl}
              alt="ワールドマップ"
              style={{
                maxWidth: "100%",
                maxHeight: "70vh",
                objectFit: "contain",
              }}
            />
          </Paper>
        </Box>
      ) : (
        <Box
          sx={{
            width: "100%",
            height: "300px",
            border: "2px dashed #ccc",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mb: 3,
          }}
        >
          <Typography variant="body1" color="textSecondary">
            マップがまだアップロードされていません
          </Typography>
        </Box>
      )}

      <Box sx={{ textAlign: "center" }}>
        <input
          accept="image/*"
          style={{ display: "none" }}
          id="map-upload-button"
          type="file"
          onChange={handleFileUpload}
        />
        <label htmlFor="map-upload-button">
          <Button
            variant="contained"
            component="span"
            startIcon={<CloudUploadIcon />}
          >
            マップをアップロード
          </Button>
        </label>
      </Box>
    </Box>
  );
};

export default WorldMapTab;
