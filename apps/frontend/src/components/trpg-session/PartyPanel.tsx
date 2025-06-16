import React, { useState, useCallback } from "react";
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Divider,
} from "@mui/material";
import { LocationOn, ImageNotSupported } from "@mui/icons-material";
import { TRPGCharacter, NPCCharacter } from "@trpg-ai-gm/types";
import PartyCharacterDisplay from "./PartyCharacterDisplay";

interface PartyPanelProps {
  playerCharacters: TRPGCharacter[];
  npcs?: NPCCharacter[];
  selectedCharacter?: TRPGCharacter | NPCCharacter;
  onSelectCharacter: (character: TRPGCharacter | NPCCharacter) => void;
  currentLocation?: string;
  currentLocationImage?: string;
  isSessionStarted?: boolean;
}

const PartyPanel: React.FC<PartyPanelProps> = ({
  playerCharacters,
  npcs = [],
  selectedCharacter,
  onSelectCharacter,
  currentLocation,
  currentLocationImage,
  isSessionStarted = false,
}) => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleCharacterSelect = useCallback((character: TRPGCharacter | NPCCharacter) => {
    onSelectCharacter(character);
  }, [onSelectCharacter]);

  return (
    <Paper
      elevation={2}
      sx={{
        height: "100%",
        maxHeight: "100%", // 親の高さを超えないよう明示的に制限
        display: "flex",
        flexDirection: "column",
        minHeight: 0, // flexbox子要素として適切に動作
        overflow: "hidden",
      }}
    >
      {/* 現在地表示エリア */}
      <Card sx={{ m: 1, mb: 0 }}>
        <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <LocationOn color="primary" fontSize="small" />
            <Typography variant="subtitle2" color="primary" fontWeight="bold">
              現在の場所
            </Typography>
          </Box>

          {/* 現在地イメージ表示スペース */}
          <Box
            sx={{
              width: "100%",
              height: 80,
              bgcolor: "grey.100",
              borderRadius: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mb: 1,
              border: "1px dashed",
              borderColor: "grey.300",
            }}
          >
            {currentLocationImage ? (
              <img
                src={currentLocationImage}
                alt={currentLocation || "現在地"}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  borderRadius: 4,
                }}
              />
            ) : (
              <Box sx={{ textAlign: "center", color: "grey.500" }}>
                <ImageNotSupported fontSize="large" />
                <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                  画像なし
                </Typography>
              </Box>
            )}
          </Box>

          {/* 現在地名表示 */}
          <Typography
            variant="body2"
            color={currentLocation ? "text.primary" : "text.secondary"}
            sx={{ textAlign: "center" }}
          >
            {currentLocation || "現在地なし"}
          </Typography>
        </CardContent>
      </Card>

      <Divider sx={{ mx: 1 }} />

      <Box sx={{ flex: 1, overflow: "hidden" }}>
        <PartyCharacterDisplay
          playerCharacters={playerCharacters}
          npcs={npcs}
          selectedCharacter={selectedCharacter || null}
          tabValue={tabValue}
          onTabChange={handleTabChange}
          onCharacterSelect={handleCharacterSelect}
          isSessionStarted={isSessionStarted}
        />
      </Box>
    </Paper>
  );
};

export default PartyPanel;
