import React from "react";
import {
  Card,
  CardContent,
  Typography,
  IconButton,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Stack,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { CultureElement } from "@novel-ai-assistant/types";

interface CultureItemProps {
  culture: CultureElement;
  onEdit: (culture: CultureElement) => void;
  onDelete: (id: string) => void;
}

export const CultureItem: React.FC<CultureItemProps> = ({
  culture,
  onEdit,
  onDelete,
}) => {
  return (
    <Box sx={{ mb: 2 }}>
      <Card>
        <CardContent>
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography variant="h6" component="div">
              {culture.name}
            </Typography>
            <Box>
              <IconButton
                size="small"
                onClick={() => onEdit(culture)}
                aria-label="編集"
              >
                <EditIcon />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => onDelete(culture.id)}
                aria-label="削除"
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          </Box>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 1, mb: 2 }}
          >
            {culture.description}
          </Typography>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>価値観と習慣</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="subtitle2" gutterBottom>
                価値観:
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
                {culture.values.map((value, index) => (
                  <Chip
                    key={`value-${index}`}
                    label={value}
                    size="small"
                    sx={{ mb: 1 }}
                  />
                ))}
                {culture.values.length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    登録されている価値観はありません
                  </Typography>
                )}
              </Stack>

              <Typography variant="subtitle2" gutterBottom>
                習慣:
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {culture.customs.map((custom, index) => (
                  <Chip
                    key={`custom-${index}`}
                    label={custom}
                    size="small"
                    sx={{ mb: 1 }}
                  />
                ))}
                {culture.customs.length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    登録されている習慣はありません
                  </Typography>
                )}
              </Stack>
            </AccordionDetails>
          </Accordion>

          {(culture.socialStructure ||
            culture.government ||
            culture.religion ||
            culture.language ||
            culture.art ||
            culture.technology) && (
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>詳細情報</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={1}>
                  {culture.socialStructure && (
                    <Box>
                      <Typography variant="subtitle2">社会構造:</Typography>
                      <Typography variant="body2">
                        {culture.socialStructure}
                      </Typography>
                    </Box>
                  )}
                  {culture.government && (
                    <Box>
                      <Typography variant="subtitle2">統治形態:</Typography>
                      <Typography variant="body2">
                        {culture.government}
                      </Typography>
                    </Box>
                  )}
                  {culture.religion && (
                    <Box>
                      <Typography variant="subtitle2">宗教:</Typography>
                      <Typography variant="body2">
                        {culture.religion}
                      </Typography>
                    </Box>
                  )}
                  {culture.language && (
                    <Box>
                      <Typography variant="subtitle2">言語:</Typography>
                      <Typography variant="body2">
                        {culture.language}
                      </Typography>
                    </Box>
                  )}
                  {culture.art && (
                    <Box>
                      <Typography variant="subtitle2">芸術:</Typography>
                      <Typography variant="body2">{culture.art}</Typography>
                    </Box>
                  )}
                  {culture.technology && (
                    <Box>
                      <Typography variant="subtitle2">技術:</Typography>
                      <Typography variant="body2">
                        {culture.technology}
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </AccordionDetails>
            </Accordion>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};
