import React from "react";
import { Paper, Typography } from "@mui/material";

interface WritingPreviewProps {
  content: string;
}

const WritingPreview: React.FC<WritingPreviewProps> = ({ content }) => {
  return (
    <Paper elevation={1} sx={{ p: 3 }}>
      <Typography
        variant="body1"
        sx={{
          whiteSpace: "pre-wrap",
          lineHeight: 1.8,
          fontFamily: '"Noto Serif JP", serif',
        }}
      >
        {content}
      </Typography>
    </Paper>
  );
};

export default WritingPreview;
