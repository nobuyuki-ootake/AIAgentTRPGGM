import React, { useState } from "react";
import { Box, Typography, Button, Stack, Paper } from "@mui/material";

const MinimalTRPGSessionTest: React.FC = () => {
  const [clickCount, setClickCount] = useState(0);

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Super Simple Test Page
        </Typography>
        
        <Typography variant="h6" gutterBottom>
          Basic Button Test - Clicks: {clickCount}
        </Typography>
        
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <Button 
            variant="contained" 
            onClick={() => {
              console.log('D20 button clicked');
              setClickCount(prev => prev + 1);
            }}
            sx={{ minWidth: '80px' }}
          >
            D20
          </Button>
          <Button 
            variant="contained" 
            onClick={() => {
              console.log('D6 button clicked');
              setClickCount(prev => prev + 1);
            }}
            sx={{ minWidth: '80px' }}
          >
            D6
          </Button>
          <Button 
            variant="contained" 
            onClick={() => {
              console.log('D8 button clicked');
              setClickCount(prev => prev + 1);
            }}
            sx={{ minWidth: '80px' }}
          >
            D8
          </Button>
          <Button 
            variant="contained" 
            onClick={() => {
              console.log('D10 button clicked');
              setClickCount(prev => prev + 1);
            }}
            sx={{ minWidth: '80px' }}
          >
            D10
          </Button>
          <Button 
            variant="contained" 
            onClick={() => {
              console.log('D12 button clicked');
              setClickCount(prev => prev + 1);
            }}
            sx={{ minWidth: '80px' }}
          >
            D12
          </Button>
        </Stack>
        
        <Typography variant="body1">
          If you can see this text and the buttons above, the basic React rendering is working!
        </Typography>
      </Paper>
    </Box>
  );
};

export default MinimalTRPGSessionTest;