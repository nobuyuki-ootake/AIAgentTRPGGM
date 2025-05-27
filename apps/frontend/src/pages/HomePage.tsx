import React from "react";
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Paper,
  List,
  ListItem,
  ListItemText,
  Container,
  Stack,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { styled } from "@mui/material/styles";
import { useHome } from "../hooks/useHome";
import ProjectCard from "../components/home/ProjectCard";

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
}));

const HomePage: React.FC = () => {
  const {
    projects,
    currentProject,
    newProjectTitle,
    setNewProjectTitle,
    dialogOpen,
    deleteDialogOpen,
    handleOpenDialog,
    handleCloseDialog,
    handleCreateProject,
    handleSelectProject,
    handleOpenDeleteDialog,
    handleCloseDeleteDialog,
    handleDeleteProject,
  } = useHome();

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 4,
          }}
        >
          <Typography variant="h4" component="h1" gutterBottom>
            小説創作支援ツール
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenDialog}
          >
            新規プロジェクト
          </Button>
        </Box>

        <StyledPaper>
          <Typography variant="h5" component="h2" gutterBottom>
            プロジェクト一覧
          </Typography>
          {projects.length === 0 ? (
            <Typography variant="body1" color="textSecondary" sx={{ my: 2 }}>
              プロジェクトがありません。新規プロジェクトを作成してください。
            </Typography>
          ) : (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3, mt: 2 }}>
              {projects.map((project) => (
                <Box
                  key={project.id}
                  sx={{
                    width: {
                      xs: "100%",
                      sm: "calc(50% - 16px)",
                      md: "calc(33.33% - 16px)",
                    },
                  }}
                >
                  <ProjectCard
                    project={project}
                    isSelected={currentProject?.id === project.id}
                    onSelect={() => handleSelectProject(project)}
                    onDelete={handleOpenDeleteDialog.bind(null, project.id)}
                  />
                </Box>
              ))}
            </Box>
          )}
        </StyledPaper>

        <Stack direction={{ xs: "column", md: "row" }} spacing={4}>
          <Box sx={{ flex: 1 }}>
            <StyledPaper>
              <Typography variant="h5" component="h2" gutterBottom>
                ツールの特徴
              </Typography>
              <List>
                <ListItem>
                  <ListItemText
                    primary="物語の構造化"
                    secondary="あらすじ、プロット、キャラクター設定などを体系的に管理できます。"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="世界観構築支援"
                    secondary="小説の世界観や設定を詳細に作り込むための各種ツールを提供します。"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="タイムライン管理"
                    secondary="物語の時系列を視覚的に管理し、整合性を保ちながら創作できます。"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="AIアシスタント連携"
                    secondary="創作過程でAIアシスタントからアドバイスやアイデアを得られます。"
                  />
                </ListItem>
              </List>
            </StyledPaper>
          </Box>
          <Box sx={{ flex: 1 }}>
            <StyledPaper>
              <Typography variant="h5" component="h2" gutterBottom>
                使い方
              </Typography>
              <List>
                <ListItem>
                  <ListItemText
                    primary="1. プロジェクトの作成"
                    secondary="「新規プロジェクト」ボタンから小説のプロジェクトを作成します。"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="2. 設定の作成"
                    secondary="あらすじ、プロット、キャラクター、世界観などの設定を作成します。"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="3. タイムラインの整理"
                    secondary="物語の出来事を時系列順に配置し、整合性を確認します。"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="4. 執筆と編集"
                    secondary="設定に基づいて執筆を進め、必要に応じてAIのサポートを受けられます。"
                  />
                </ListItem>
              </List>
            </StyledPaper>
          </Box>
        </Stack>
      </Box>

      {/* 新規プロジェクト作成ダイアログ */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>新規プロジェクト作成</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="プロジェクト名"
            type="text"
            fullWidth
            value={newProjectTitle}
            onChange={(e) => setNewProjectTitle(e.target.value)}
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            キャンセル
          </Button>
          <Button
            onClick={handleCreateProject}
            color="primary"
            variant="contained"
            disabled={!newProjectTitle.trim()}
          >
            作成
          </Button>
        </DialogActions>
      </Dialog>

      {/* プロジェクト削除確認ダイアログ */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>プロジェクトの削除</DialogTitle>
        <DialogContent>
          <Typography>このプロジェクトを削除してもよろしいですか？</Typography>
          <Typography variant="body2" color="error" sx={{ mt: 1 }}>
            この操作は元に戻せません。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} color="primary">
            キャンセル
          </Button>
          <Button
            onClick={handleDeleteProject}
            color="error"
            variant="contained"
          >
            削除
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default HomePage;
