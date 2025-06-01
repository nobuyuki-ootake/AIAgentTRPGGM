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
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Chip,
  CircularProgress,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Group as GroupIcon,
  Security as EnemyIcon,
  Groups as NPCIcon,
} from "@mui/icons-material";
import { CampaignIcon, DiceD20Icon } from "../components/icons/TRPGIcons";
import { styled } from "@mui/material/styles";
import { useTRPGHome } from "../hooks/useTRPGHome";

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
}));

const HomePage: React.FC = () => {
  const {
    campaigns,
    currentCampaign,
    newCampaignTitle,
    setNewCampaignTitle,
    newCampaignSummary,
    setNewCampaignSummary,
    dialogOpen,
    deleteDialogOpen,
    campaignToDelete,
    isLoading,
    handleOpenDialog,
    handleCloseDialog,
    handleCreateCampaign,
    handleSelectCampaign,
    handleOpenDeleteDialog,
    handleCloseDeleteDialog,
    handleDeleteCampaign,
  } = useTRPGHome();

  if (isLoading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>TRPG管理システムを初期化中...</Typography>
        </Box>
      </Container>
    );
  }

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
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <DiceD20Icon sx={{ fontSize: 48, mr: 2, color: 'primary.main' }} />
              <Typography variant="h3" component="h1">
                TRPG AIエージェントGM
              </Typography>
            </Box>
            <Typography variant="subtitle1" color="text.secondary">
              AIがゲームマスターをサポートする次世代TRPGキャンペーン管理システム
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenDialog}
            size="large"
          >
            新規キャンペーン
          </Button>
        </Box>

        <StyledPaper>
          <Typography variant="h5" gutterBottom>
            キャンペーン一覧
          </Typography>
          
          {campaigns.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 8 }}>
              <CampaignIcon sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                キャンペーンがありません
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                新規キャンペーンを作成して、TRPG管理を始めましょう
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenDialog}
              >
                最初のキャンペーンを作成
              </Button>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {campaigns.map((campaign) => (
                <Grid item xs={12} sm={6} md={4} key={campaign.id}>
                  <Card 
                    sx={{ 
                      height: "100%", 
                      display: "flex", 
                      flexDirection: "column",
                      cursor: "pointer",
                      border: currentCampaign?.id === campaign.id ? 2 : 1,
                      borderColor: currentCampaign?.id === campaign.id ? "primary.main" : "divider",
                      "&:hover": {
                        boxShadow: 3
                      }
                    }}
                    onClick={() => handleSelectCampaign(campaign.id)}
                  >
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                        <CampaignIcon color="primary" sx={{ mr: 1 }} />
                        <Typography variant="h6" component="h2" noWrap>
                          {campaign.title}
                        </Typography>
                      </Box>
                      
                      {campaign.summary && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {campaign.summary}
                        </Typography>
                      )}
                      
                      <Typography variant="caption" color="text.secondary">
                        更新日: {new Date(campaign.updatedAt).toLocaleDateString()}
                      </Typography>
                      
                      {currentCampaign?.id === campaign.id && (
                        <Chip
                          label="選択中"
                          color="primary"
                          size="small"
                          sx={{ mt: 1 }}
                        />
                      )}
                    </CardContent>
                    
                    <CardActions sx={{ justifyContent: "space-between", px: 2, pb: 2 }}>
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <Chip
                          icon={<GroupIcon />}
                          label="PC"
                          size="small"
                          variant="outlined"
                        />
                        <Chip
                          icon={<NPCIcon />}
                          label="NPC"
                          size="small"
                          variant="outlined"
                        />
                        <Chip
                          icon={<EnemyIcon />}
                          label="敵"
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                      
                      <IconButton
                        size="small"
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDeleteDialog(campaign.id);
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </StyledPaper>

        {/* 機能説明・使用方法 */}
        <StyledPaper>
          <Typography variant="h6" gutterBottom>
            🎲 TRPG AI エージェント GM の機能
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" gutterBottom color="primary">
                📋 キャンペーン管理
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • 複数ゲームシステム対応（Stormbringer、D&D 5e、Pathfinder等）<br />
                • キャンペーン設定・世界観構築<br />
                • プロット・クエスト管理<br />
                • タイムライン・スケジュール管理<br />
                • 拠点・地理情報管理
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" gutterBottom color="primary">
                👥 キャラクター管理
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • PCキャラクターシート作成・管理<br />
                • NPCデータベース構築<br />
                • エネミー情報管理<br />
                • 能力値・スキル・装備管理<br />
                • キャラクターシート印刷・エクスポート
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" gutterBottom color="primary">
                🤖 AI エージェント機能
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • AI GM アシスタント<br />
                • 自動キャラクター生成<br />
                • シナリオ・イベント提案<br />
                • NPC会話生成<br />
                • 世界観設定自動補完
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom color="primary">
                🎮 セッション機能
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • リアルタイムセッション画面<br />
                • 多彩なダイスロール機能<br />
                • チャット・ログ管理<br />
                • 戦闘管理・ターン制御<br />
                • セッション履歴記録
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom color="primary">
                🛠️ 開発者機能
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • 開発者モード・プレイモード切り替え<br />
                • シナリオ事前設計<br />
                • デバッグ・テスト機能<br />
                • データエクスポート・インポート<br />
                • カスタマイズ設定
              </Typography>
            </Grid>
          </Grid>
        </StyledPaper>

        {/* 新規キャンペーン作成ダイアログ */}
        <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>新規キャンペーン作成</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="キャンペーン名"
              fullWidth
              variant="outlined"
              value={newCampaignTitle}
              onChange={(e) => setNewCampaignTitle(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="概要・説明"
              fullWidth
              multiline
              rows={3}
              variant="outlined"
              value={newCampaignSummary}
              onChange={(e) => setNewCampaignSummary(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>キャンセル</Button>
            <Button 
              onClick={handleCreateCampaign} 
              variant="contained"
              disabled={!newCampaignTitle.trim()}
            >
              作成
            </Button>
          </DialogActions>
        </Dialog>

        {/* 削除確認ダイアログ */}
        <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
          <DialogTitle>キャンペーンを削除</DialogTitle>
          <DialogContent>
            <Typography>
              このキャンペーンを削除してもよろしいですか？<br />
              この操作は元に戻せません。
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDeleteDialog}>キャンセル</Button>
            <Button onClick={handleDeleteCampaign} color="error" variant="contained">
              削除
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default HomePage;
