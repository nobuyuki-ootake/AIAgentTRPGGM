import React from "react";
import { Box, TextField, Typography, Divider } from "@mui/material";

interface TechnologyScienceTabProps {
  techLevel: string;
  onTechLevelChange: (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  transportation: string;
  onTransportationChange: (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  communication: string;
  onCommunicationChange: (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  medicine: string;
  onMedicineChange: (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  weapons: string;
  onWeaponsChange: (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  energy: string;
  onEnergyChange: (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  dailyTech: string;
  onDailyTechChange: (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
}

const TechnologyScienceTab: React.FC<TechnologyScienceTabProps> = ({
  techLevel,
  onTechLevelChange,
  transportation,
  onTransportationChange,
  communication,
  onCommunicationChange,
  medicine,
  onMedicineChange,
  weapons,
  onWeaponsChange,
  energy,
  onEnergyChange,
  dailyTech,
  onDailyTechChange,
}) => {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        テクノロジーと科学
      </Typography>

      <TextField
        fullWidth
        multiline
        rows={3}
        label="技術レベル"
        placeholder="世界の全体的な技術水準（中世、現代、未来など）と科学的理解について記述してください"
        value={techLevel}
        onChange={onTechLevelChange}
        variant="outlined"
        margin="normal"
      />

      <Divider sx={{ my: 2 }} />

      <TextField
        fullWidth
        multiline
        rows={3}
        label="輸送と移動"
        placeholder="人々や物資の移動手段、輸送技術について記述してください"
        value={transportation}
        onChange={onTransportationChange}
        variant="outlined"
        margin="normal"
      />

      <Divider sx={{ my: 2 }} />

      <TextField
        fullWidth
        multiline
        rows={3}
        label="通信"
        placeholder="情報伝達の方法、通信技術、メディアについて記述してください"
        value={communication}
        onChange={onCommunicationChange}
        variant="outlined"
        margin="normal"
      />

      <Divider sx={{ my: 2 }} />

      <TextField
        fullWidth
        multiline
        rows={3}
        label="医療と健康"
        placeholder="医学の発展、治療法、平均寿命、一般的な疾病などについて記述してください"
        value={medicine}
        onChange={onMedicineChange}
        variant="outlined"
        margin="normal"
      />

      <Divider sx={{ my: 2 }} />

      <TextField
        fullWidth
        multiline
        rows={3}
        label="武器と防衛"
        placeholder="軍事技術、武器の種類、防衛システムについて記述してください"
        value={weapons}
        onChange={onWeaponsChange}
        variant="outlined"
        margin="normal"
      />

      <Divider sx={{ my: 2 }} />

      <TextField
        fullWidth
        multiline
        rows={3}
        label="エネルギー"
        placeholder="エネルギー源、発電方法、資源利用について記述してください"
        value={energy}
        onChange={onEnergyChange}
        variant="outlined"
        margin="normal"
      />

      <Divider sx={{ my: 2 }} />

      <TextField
        fullWidth
        multiline
        rows={3}
        label="日常的なテクノロジー"
        placeholder="人々の日常生活で使用される技術について記述してください"
        value={dailyTech}
        onChange={onDailyTechChange}
        variant="outlined"
        margin="normal"
      />

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mt: 2, textAlign: "center" }}
      >
        テクノロジーと科学のレベルは世界の設定に一貫性を与え、物語の可能性と制約を設定します。
      </Typography>
    </Box>
  );
};

export default TechnologyScienceTab;
