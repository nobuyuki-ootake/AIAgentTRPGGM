import React from "react";
import { Box } from "@mui/material";

interface WorldBuildingTabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const WorldBuildingTabPanel: React.FC<WorldBuildingTabPanelProps> = ({
  children,
  value,
  index,
  ...other
}) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`worldbuilding-tabpanel-${index}`}
      aria-labelledby={`worldbuilding-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

export default WorldBuildingTabPanel;
