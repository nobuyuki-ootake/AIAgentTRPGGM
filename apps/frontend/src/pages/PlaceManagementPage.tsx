import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Button,
  Card,
  CardContent,
  CardActions,
  Chip,
  Grid,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  SmartToy as SmartToyIcon,
  Save as SaveIcon,
  Add as AddIcon,
  Search as SearchIcon,
  LocationOn as LocationOnIcon,
  Explore as ExploreIcon,
  Home as HomeIcon,
} from "@mui/icons-material";
import { useAIChatIntegration } from "../hooks/useAIChatIntegration";
import { useRecoilValue } from "recoil";
import { currentCampaignState } from "../store/atoms";
import { PlaceManagementProvider, usePlaceManagementContext } from "../contexts/PlaceManagementContext";
import { usePlaceManagementAI } from "../hooks/usePlaceManagementAI";
import { ProgressSnackbar } from "../components/ui/ProgressSnackbar";
import { UnsavedChangesDialog } from "../components/common/UnsavedChangesDialog";
import { useUnsavedChanges } from "../hooks/useUnsavedChanges";
import { toast } from "sonner";
import {
  PlaceManagementCategory,
  PlaceManagementElement,
} from "@trpg-ai-gm/types";

// タブパネルコンポーネント
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`place-management-tabpanel-${index}`}
      aria-labelledby={`place-management-tab-${index}`}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

// 場所カードコンポーネント
interface PlaceCardProps {
  place: PlaceManagementElement;
  onEdit: (place: PlaceManagementElement) => void;
  onDelete: (id: string) => void;
  category: PlaceManagementCategory;
}

const PlaceCard: React.FC<PlaceCardProps> = ({ place, onEdit, onDelete, category }) => {
  const getCategoryColor = (cat: PlaceManagementCategory) => {
    switch (cat) {
      case "settlement": return "primary";
      case "dungeon": return "error";
      case "wilderness": return "success";
      case "landmark": return "warning";
      case "base": return "info";
      case "hidden": return "secondary";
      default: return "default";
    }
  };

  const getCategoryLabel = (cat: PlaceManagementCategory) => {
    switch (cat) {
      case "settlement": return "集落・街";
      case "dungeon": return "ダンジョン";
      case "wilderness": return "野外・自然";
      case "landmark": return "ランドマーク";
      case "base": return "プレイヤー拠点";
      case "hidden": return "隠し場所";
      case "travel_route": return "移動ルート";
      case "event_location": return "イベント場所";
      default: return "その他";
    }
  };

  return (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
          <Typography variant="h6" component="div" noWrap>
            {place.name}
          </Typography>
          <Chip 
            label={getCategoryLabel(category)} 
            color={getCategoryColor(category)}
            size="small"
          />
        </Box>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {place.type}
        </Typography>
        
        <Typography variant="body2" sx={{ 
          display: "-webkit-box",
          WebkitLineClamp: 3,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          minHeight: "3.6em"
        }}>
          {place.description}
        </Typography>
        
        {/* 拠点固有の情報 */}
        {place.placeCategory === "base" && place.importance && (
          <Box sx={{ mt: 1 }}>
            <Chip 
              label={place.importance} 
              variant="outlined" 
              size="small"
            />
          </Box>
        )}
      </CardContent>
      
      <CardActions>
        <Button size="small" onClick={() => onEdit(place)}>
          編集
        </Button>
        <Button size="small" color="error" onClick={() => onDelete(place.id)}>
          削除
        </Button>
      </CardActions>
    </Card>
  );
};

const PlaceManagementPageContent: React.FC = () => {
  const currentCampaign = useRecoilValue(currentCampaignState);
  const { openAIAssist } = useAIChatIntegration();
  
  // 場所管理コンテキスト
  const {
    places,
    addPlace,
    updatePlace: _updatePlace,
    deletePlace,
    filterPlacesByCategory,
    searchPlaces,
    isLoading: contextLoading,
    error: contextError,
    hasUnsavedChanges: _contextHasUnsaved,
    saveChanges,
  } = usePlaceManagementContext();

  // AI機能
  const {
    isGenerating: isAIProcessing,
    generateSinglePlace: _generateSinglePlace,
    generatePlacesByAI,
    enhancePlaceDescription: _enhancePlaceDescription,
    generateBalancedPlaceSet: _generateBalancedPlaceSet,
    analyzePlaceBalance: _analyzePlaceBalance,
    error: aiError,
    clearError: _clearAIError,
  } = usePlaceManagementAI();

  // 未保存データ管理フック
  const {
    hasUnsavedChanges: _unsavedChangesHook,
    setUnsavedChanges,
    markAsSaved,
    checkBeforeLeave,
  } = useUnsavedChanges();

  // UI状態
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<PlaceManagementCategory | "all">("all");
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  // isAIProcessingはAIフックから取得されるため削除
  const [aiProgress, _setAiProgress] = useState<number | undefined>(undefined);
  const [showProgressSnackbar, setShowProgressSnackbar] = useState(false);

  // placesはcontextから取得されるため削除

  // タブ変更ハンドラー
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // 保存処理
  const handleSaveWithConfirmation = async () => {
    try {
      const success = await saveChanges();
      if (success) {
        markAsSaved();
        toast.success("データが正常に保存されました");
      } else {
        toast.error("保存に失敗しました");
      }
    } catch (error) {
      toast.error("保存中にエラーが発生しました");
    }
  };

  // 安全なナビゲーション
  const _handleSafeNavigation = (action: () => void) => {
    const canLeave = checkBeforeLeave(action);
    if (!canLeave) {
      setPendingAction(() => action);
      setShowUnsavedDialog(true);
    }
  };

  // 場所の編集
  const handleEditPlace = (place: PlaceManagementElement) => {
    // 編集ダイアログを開く処理
    // TODO: 編集ダイアログの実装
    setUnsavedChanges(true);
  };

  // 場所の削除
  const handleDeletePlace = async (id: string) => {
    if (window.confirm("この場所を削除しますか？この操作は元に戻せません。")) {
      const success = await deletePlace(id);
      if (success) {
        toast.success("場所が削除されました");
        setUnsavedChanges(true);
      } else {
        toast.error("削除に失敗しました");
      }
    }
  };

  // AIアシスト
  const handleOpenAIAssist = (): void => {
    if (!currentCampaign) {
      toast.error("キャンペーンがロードされていません。");
      return;
    }

    if (isAIProcessing) {
      toast.warning("AI生成が既に実行中です。完了をお待ちください。");
      return;
    }

    const contextualMessage = `「${currentCampaign.title}」の場所情報について、以下の要素を考えてください。

**必須要件:**
- 拠点（NPC、アイテム取引がある場所）を2-3箇所生成してください
- 探索地域（冒険、モンスター遭遇がある場所）を2-3箇所生成してください
- 各場所に適した行動選択肢を含めてください
- プロットやキャラクターとの整合性を保ってください

**キャンペーンのあらすじ:**
${currentCampaign.synopsis || "（あらすじが設定されていません）"}

**既存のクエスト要素:**
${
  currentCampaign.quests
    ?.map((p) => `- ${p.title}: ${p.description}`)
    .join("\n") || "（クエスト要素が設定されていません）"
}

**既存のキャラクター:**
${
  currentCampaign.characters
    ?.map((c) => `- ${c.name}: ${c.description}`)
    .join("\n") || "（キャラクターが設定されていません）"
}`;

    openAIAssist(
      "place-management",
      {
        title: "AIに場所を生成してもらう",
        description:
          "どのような場所を作りたいか、指示を入力してください。拠点や探索地域の特徴、用途、雰囲気などを具体的に伝えるとよいでしょう。",
        defaultMessage: contextualMessage,
        supportsBatchGeneration: true,
        onComplete: async (result) => {
          try {
            // AI生成処理を実行
            const categories = ["settlement", "dungeon", "wilderness"];
            const generatedPlaces = await generatePlacesByAI(
              result,
              categories,
              currentCampaign,
              3
            );
            
            // 生成された場所をコンテキストに追加
            for (const place of generatedPlaces) {
              await addPlace(place);
            }
            
            setUnsavedChanges(true);
            toast.success(`${generatedPlaces.length}箇所の場所が生成されました`);
          } catch (error) {
            toast.error("場所生成中にエラーが発生しました。");
          }
        },
      },
      currentCampaign
    );
  };

  // フィルタリング処理
  const getFilteredPlaces = () => {
    let filteredPlaces = places;
    
    // タブによる基本フィルター
    switch (tabValue) {
      case 0: // 拠点
        filteredPlaces = filterPlacesByCategory("base");
        break;
      case 1: // 探索地域
        filteredPlaces = places.filter(p => 
          p.placeCategory === "dungeon" || 
          p.placeCategory === "wilderness" ||
          p.placeCategory === "landmark"
        );
        break;
      case 2: // 全て
        filteredPlaces = places;
        break;
    }

    // 検索フィルター
    if (searchQuery) {
      filteredPlaces = searchPlaces(searchQuery);
    }

    // カテゴリフィルター
    if (categoryFilter !== "all") {
      filteredPlaces = filterPlacesByCategory(categoryFilter);
    }

    return filteredPlaces;
  };

  const filteredPlaces = getFilteredPlaces();

  // ローディング・エラー表示
  if (contextLoading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center', py: 8 }}>
        <Typography variant="h6">読み込み中...</Typography>
      </Box>
    );
  }

  if (contextError || aiError) {
    return (
      <Box sx={{ p: 3, textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="error">
          エラー: {contextError || aiError}
        </Typography>
      </Box>
    );
  }

  if (!currentCampaign) {
    return (
      <Box sx={{ p: 3, textAlign: 'center', py: 8 }}>
        <Typography variant="h5" gutterBottom color="text.secondary">
          キャンペーンが選択されていません
        </Typography>
        <Typography variant="body1" sx={{ mb: 3 }} color="text.secondary">
          場所管理を行うには、まずキャンペーンを選択してください。
        </Typography>
        <Button 
          variant="contained" 
          onClick={() => window.location.href = '/'}
          sx={{ mt: 2 }}
        >
          ホームに戻ってキャンペーンを選択
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 }, maxWidth: "1200px", mx: "auto" }}>
      {/* ヘッダー */}
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 1,
          }}
        >
          <Box>
            <Typography variant="h4" gutterBottom>
              {currentCampaign.title}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              場所管理
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => {/* 新規場所作成 */}}
              disabled={isAIProcessing}
            >
              場所を追加
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<SmartToyIcon />}
              onClick={handleOpenAIAssist}
              disabled={isAIProcessing}
            >
              AIに場所を生成してもらう
            </Button>
            <Button
              variant="contained"
              color="success"
              startIcon={<SaveIcon />}
              onClick={handleSaveWithConfirmation}
              disabled={isAIProcessing}
            >
              保存
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* 検索・フィルター */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="場所を検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>カテゴリで絞り込み</InputLabel>
              <Select
                value={categoryFilter}
                label="カテゴリで絞り込み"
                onChange={(e) => setCategoryFilter(e.target.value as PlaceManagementCategory | "all")}
              >
                <MenuItem value="all">すべて</MenuItem>
                <MenuItem value="settlement">集落・街</MenuItem>
                <MenuItem value="dungeon">ダンジョン</MenuItem>
                <MenuItem value="wilderness">野外・自然</MenuItem>
                <MenuItem value="landmark">ランドマーク</MenuItem>
                <MenuItem value="base">プレイヤー拠点</MenuItem>
                <MenuItem value="hidden">隠し場所</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* タブナビゲーション */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="fullWidth"
          aria-label="place management tabs"
        >
          <Tab 
            icon={<HomeIcon />}
            label="拠点"
            sx={{ fontWeight: tabValue === 0 ? "bold" : "normal" }}
          />
          <Tab 
            icon={<ExploreIcon />}
            label="探索地域"
            sx={{ fontWeight: tabValue === 1 ? "bold" : "normal" }}
          />
          <Tab 
            icon={<LocationOnIcon />}
            label="すべての場所"
            sx={{ fontWeight: tabValue === 2 ? "bold" : "normal" }}
          />
        </Tabs>

        {/* 拠点タブ */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={2}>
            {filterPlacesByCategory("base").map((place) => (
              <Grid item xs={12} sm={6} md={4} key={place.id}>
                <PlaceCard
                  place={place}
                  onEdit={handleEditPlace}
                  onDelete={handleDeletePlace}
                  category="base"
                />
              </Grid>
            ))}
            {filterPlacesByCategory("base").length === 0 && (
              <Grid item xs={12}>
                <Typography variant="body1" color="text.secondary" textAlign="center">
                  拠点が登録されていません。「場所を追加」または「AIに場所を生成してもらう」をクリックして拠点を作成してください。
                </Typography>
              </Grid>
            )}
          </Grid>
        </TabPanel>

        {/* 探索地域タブ */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={2}>
            {places.filter(p => 
              p.placeCategory === "dungeon" || 
              p.placeCategory === "wilderness" ||
              p.placeCategory === "landmark"
            ).map((place) => (
              <Grid item xs={12} sm={6} md={4} key={place.id}>
                <PlaceCard
                  place={place}
                  onEdit={handleEditPlace}
                  onDelete={handleDeletePlace}
                  category={place.placeCategory}
                />
              </Grid>
            ))}
            {places.filter(p => 
              p.placeCategory === "dungeon" || 
              p.placeCategory === "wilderness" ||
              p.placeCategory === "landmark"
            ).length === 0 && (
              <Grid item xs={12}>
                <Typography variant="body1" color="text.secondary" textAlign="center">
                  探索地域が登録されていません。「場所を追加」または「AIに場所を生成してもらう」をクリックして探索地域を作成してください。
                </Typography>
              </Grid>
            )}
          </Grid>
        </TabPanel>

        {/* すべての場所タブ */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={2}>
            {filteredPlaces.map((place) => (
              <Grid item xs={12} sm={6} md={4} key={place.id}>
                <PlaceCard
                  place={place}
                  onEdit={handleEditPlace}
                  onDelete={handleDeletePlace}
                  category={place.placeCategory}
                />
              </Grid>
            ))}
            {filteredPlaces.length === 0 && (
              <Grid item xs={12}>
                <Typography variant="body1" color="text.secondary" textAlign="center">
                  {searchQuery || categoryFilter !== "all" 
                    ? "条件に一致する場所が見つかりません。"
                    : "場所が登録されていません。「場所を追加」または「AIに場所を生成してもらう」をクリックして場所を作成してください。"
                  }
                </Typography>
              </Grid>
            )}
          </Grid>
        </TabPanel>
      </Paper>

      {/* AI進行状況表示 */}
      <ProgressSnackbar
        open={showProgressSnackbar || isAIProcessing}
        message={`AIが場所を生成中です... ${
          aiProgress ? `${Math.round(aiProgress)}%` : ""
        }`}
        severity="info"
        progress={aiProgress}
        loading={isAIProcessing}
        onClose={() => !isAIProcessing && setShowProgressSnackbar(false)}
        position="top-center"
      />

      {/* 未保存データ警告ダイアログ */}
      <UnsavedChangesDialog
        open={showUnsavedDialog}
        onClose={() => setShowUnsavedDialog(false)}
        onSaveAndContinue={async () => {
          await handleSaveWithConfirmation();
          setShowUnsavedDialog(false);
          if (pendingAction) {
            pendingAction();
            setPendingAction(null);
          }
        }}
        onContinueWithoutSaving={() => {
          markAsSaved();
          setShowUnsavedDialog(false);
          if (pendingAction) {
            pendingAction();
            setPendingAction(null);
          }
        }}
        title="未保存の場所データがあります"
        message="拠点や場所の編集内容が保存されていません。続行する前に保存しますか？"
      />
    </Box>
  );
};

// PlaceManagementProviderでラップしたメインコンポーネント
const PlaceManagementPage: React.FC = () => {
  return (
    <PlaceManagementProvider>
      <PlaceManagementPageContent />
    </PlaceManagementProvider>
  );
};

export default PlaceManagementPage;