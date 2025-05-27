import React from "react";
import { Box, Checkbox, Typography, Paper } from "@mui/material";
import { useRecoilState } from "recoil";
import { selectedElementsState, SelectedElement } from "../../store/atoms";

interface SelectableElementProps {
  id: string;
  type: "plot" | "character" | "chapter" | "worldbuilding";
  title: string;
  description?: string;
  additionalContent?: Record<
    string,
    string | number | boolean | string[] | undefined | null
  >;
}

const SelectableElement: React.FC<SelectableElementProps> = ({
  id,
  type,
  title,
  description,
  additionalContent,
}) => {
  const [selectedElements, setSelectedElements] = useRecoilState(
    selectedElementsState
  );

  // 現在の要素が選択されているかチェック
  const isSelected = selectedElements.some(
    (element) => element.id === id && element.type === type
  );

  // チェックボックスの状態変更時のハンドラ
  const handleChange = () => {
    if (isSelected) {
      // 選択されている場合は選択解除
      setSelectedElements(
        selectedElements.filter(
          (element) => !(element.id === id && element.type === type)
        )
      );
    } else {
      // 選択されていない場合は選択に追加
      const newElement: SelectedElement = {
        id,
        type,
        content: {
          title,
          description,
          ...additionalContent,
        },
      };
      setSelectedElements([...selectedElements, newElement]);
    }
  };

  return (
    <Paper
      elevation={1}
      sx={{
        p: 2,
        mb: 1,
        display: "flex",
        alignItems: "flex-start",
        borderLeft: isSelected ? "4px solid #4caf50" : "none",
        transition: "all 0.2s ease",
        backgroundColor: isSelected ? "rgba(76, 175, 80, 0.08)" : "white",
      }}
    >
      <Checkbox
        checked={isSelected}
        onChange={handleChange}
        color="primary"
        sx={{ mr: 1 }}
      />
      <Box>
        <Typography variant="subtitle1" fontWeight="bold">
          {title}
        </Typography>
        {description && (
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        )}
      </Box>
    </Paper>
  );
};

export default SelectableElement;
