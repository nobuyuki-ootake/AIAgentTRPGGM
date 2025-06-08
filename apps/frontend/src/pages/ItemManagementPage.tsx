import React, { useState, useMemo } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
  Chip,
  Card,
  CardContent,
  Divider,
  Grid,
  IconButton,
  TextField,
  InputAdornment,
  Alert,
} from "@mui/material";
import {
  Inventory as InventoryIcon,
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Category as CategoryIcon,
  Star as StarIcon,
  ShoppingCart as ShopIcon,
  Event as EventIcon,
  Settings as SettingsIcon,
  DeveloperMode as DeveloperModeIcon,
  PlayArrow as PlayIcon,
} from "@mui/icons-material";
import { useRecoilValue, useRecoilState } from "recoil";
import { currentCampaignState, developerModeState } from "../store/atoms";
import {
  Item,
  ItemType,
  ItemCategory,
  ItemRarity,
  ItemLocation,
  BaseLocation,
  TRPGCampaign,
} from "@trpg-ai-gm/types";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`item-tabpanel-${index}`}
      aria-labelledby={`item-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const ItemManagementPage: React.FC = () => {
  const currentCampaign = useRecoilValue(currentCampaignState);
  const [developerMode, setDeveloperMode] = useRecoilState(developerModeState);
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<ItemType | "all">("all");
  const [filterRarity, setFilterRarity] = useState<ItemRarity | "all">("all");

  // キャンペーンからアイテムとアイテム場所を取得
  const items = currentCampaign?.items || [];
  const itemLocations = currentCampaign?.itemLocations || [];
  const bases = currentCampaign?.bases || [];

  // フィルタリングされたアイテムリスト
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === "all" || item.type === filterType;
      const matchesRarity = filterRarity === "all" || item.rarity === filterRarity;
      
      return matchesSearch && matchesType && matchesRarity;
    });
  }, [items, searchTerm, filterType, filterRarity]);

  // タイプ別アイテム数のカウント
  const itemCounts = useMemo(() => {
    const counts = {
      all: items.length,
      consumable: 0,
      equipment: 0,
      key_item: 0,
      material: 0,
      quest_item: 0,
      currency: 0,
      other: 0,
    };

    items.forEach((item) => {
      counts[item.type]++;
    });

    return counts;
  }, [items]);

  // レアリティ別アイテム数のカウント
  const rarityCounts = useMemo(() => {
    const counts = {
      all: items.length,
      common: 0,
      uncommon: 0,
      rare: 0,
      epic: 0,
      legendary: 0,
      artifact: 0,
    };

    items.forEach((item) => {
      counts[item.rarity]++;
    });

    return counts;
  }, [items]);

  // アイテムの入手場所情報を取得
  const getItemLocations = (itemId: string): ItemLocation[] => {
    return itemLocations.filter((location) => location.itemId === itemId);
  };

  // 拠点名を取得
  const getBaseName = (baseId: string): string => {
    const base = bases.find((b) => b.id === baseId);
    return base ? base.name : "不明な拠点";
  };

  // レアリティの色を取得
  const getRarityColor = (rarity: ItemRarity): string => {
    switch (rarity) {
      case "common": return "#9e9e9e";
      case "uncommon": return "#4caf50";
      case "rare": return "#2196f3";
      case "epic": return "#9c27b0";
      case "legendary": return "#ff9800";
      case "artifact": return "#f44336";
      default: return "#9e9e9e";
    }
  };

  // タブ変更ハンドラー
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // アイテムカード表示コンポーネント
  const ItemCard: React.FC<{ item: Item }> = ({ item }) => {
    const locations = getItemLocations(item.id);
    
    return (
      <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <CardContent sx={{ flex: 1 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
            <Typography variant="h6" component="div" sx={{ flex: 1 }}>
              {item.name}
            </Typography>
            <Chip
              label={item.rarity}
              size="small"
              sx={{
                backgroundColor: getRarityColor(item.rarity),
                color: "white",
                fontWeight: "bold",
              }}
            />
          </Box>
          
          <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
            <Chip label={item.type} variant="outlined" size="small" />
            <Chip label={item.category} variant="outlined" size="small" />
          </Box>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {item.description}
          </Typography>
          
          {item.value && (
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>価値:</strong> {item.value} G
            </Typography>
          )}
          
          {item.weight && (
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>重量:</strong> {item.weight} kg
            </Typography>
          )}
          
          {locations.length > 0 && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                入手場所:
              </Typography>
              {locations.map((location) => (
                <Box key={location.id} sx={{ mb: 1 }}>
                  <Typography variant="body2">
                    <strong>{getBaseName(location.locationId)}</strong> ({location.locationType})
                  </Typography>
                  {location.price && (
                    <Typography variant="caption" color="text.secondary">
                      価格: {location.price} {location.currency || "G"}
                    </Typography>
                  )}
                </Box>
              ))}
            </>
          )}
        </CardContent>
      </Card>
    );
  };

  // アイテム統計表示コンポーネント
  const ItemStatistics: React.FC = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <CategoryIcon />
          アイテム統計
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>
              タイプ別アイテム数:
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              <Chip label={`全て: ${itemCounts.all}`} />
              <Chip label={`消耗品: ${itemCounts.consumable}`} />
              <Chip label={`装備: ${itemCounts.equipment}`} />
              <Chip label={`キーアイテム: ${itemCounts.key_item}`} />
              <Chip label={`素材: ${itemCounts.material}`} />
              <Chip label={`その他: ${itemCounts.other}`} />
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>
              レアリティ別アイテム数:
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              <Chip label={`コモン: ${rarityCounts.common}`} sx={{ backgroundColor: getRarityColor("common"), color: "white" }} />
              <Chip label={`アンコモン: ${rarityCounts.uncommon}`} sx={{ backgroundColor: getRarityColor("uncommon"), color: "white" }} />
              <Chip label={`レア: ${rarityCounts.rare}`} sx={{ backgroundColor: getRarityColor("rare"), color: "white" }} />
              <Chip label={`エピック: ${rarityCounts.epic}`} sx={{ backgroundColor: getRarityColor("epic"), color: "white" }} />
              <Chip label={`レジェンダリー: ${rarityCounts.legendary}`} sx={{ backgroundColor: getRarityColor("legendary"), color: "white" }} />
              <Chip label={`アーティファクト: ${rarityCounts.artifact}`} sx={{ backgroundColor: getRarityColor("artifact"), color: "white" }} />
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="h5" sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <InventoryIcon />
                アイテム管理
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={developerMode}
                    onChange={(e) => setDeveloperMode(e.target.checked)}
                    color="primary"
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {developerMode ? <DeveloperModeIcon /> : <PlayIcon />}
                    {developerMode ? '開発者モード' : 'プレイモード'}
                  </Box>
                }
              />
            </Box>
            
            {developerMode && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => {
                  // TODO: アイテム追加ダイアログを開く
                  console.log("アイテム追加ダイアログを開く");
                }}
              >
                アイテム追加
              </Button>
            )}
          </Box>
          
          {/* モード説明 */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {developerMode 
                ? '🛠️ 開発者モード: アイテムの管理・編集を行います'
                : '🎮 プレイモード: アイテム情報を閲覧します'
              }
            </Typography>
          </Box>
          
          <Divider />
        </Box>

        {/* アイテムが存在しない場合の表示 */}
        {items.length === 0 ? (
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              アイテムが登録されていません
            </Typography>
            <Typography variant="body2">
              アイテム管理システムでは、ゲーム内で使用する様々なアイテムを管理できます。
              消耗品、装備、キーアイテムなどを登録して、どの拠点で入手できるかも設定できます。
            </Typography>
            {developerMode && (
              <Box sx={{ mt: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => {
                    // TODO: アイテム追加ダイアログを開く
                    console.log("最初のアイテムを追加");
                  }}
                >
                  最初のアイテムを追加
                </Button>
              </Box>
            )}
          </Alert>
        ) : (
          <>
            {/* アイテム統計 */}
            <ItemStatistics />

            {/* 検索・フィルター */}
            <Box sx={{ mb: 3 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    placeholder="アイテム名で検索..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <TextField
                    select
                    fullWidth
                    label="タイプでフィルター"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as ItemType | "all")}
                    SelectProps={{ native: true }}
                  >
                    <option value="all">全てのタイプ</option>
                    <option value="consumable">消耗品</option>
                    <option value="equipment">装備</option>
                    <option value="key_item">キーアイテム</option>
                    <option value="material">素材</option>
                    <option value="quest_item">クエストアイテム</option>
                    <option value="currency">通貨</option>
                    <option value="other">その他</option>
                  </TextField>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <TextField
                    select
                    fullWidth
                    label="レアリティでフィルター"
                    value={filterRarity}
                    onChange={(e) => setFilterRarity(e.target.value as ItemRarity | "all")}
                    SelectProps={{ native: true }}
                  >
                    <option value="all">全てのレアリティ</option>
                    <option value="common">コモン</option>
                    <option value="uncommon">アンコモン</option>
                    <option value="rare">レア</option>
                    <option value="epic">エピック</option>
                    <option value="legendary">レジェンダリー</option>
                    <option value="artifact">アーティファクト</option>
                  </TextField>
                </Grid>
              </Grid>
            </Box>

            {/* アイテムタブ */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
              <Tabs value={tabValue} onChange={handleTabChange}>
                <Tab label={`全てのアイテム (${filteredItems.length})`} />
                <Tab label={`消耗品 (${filteredItems.filter(i => i.type === 'consumable').length})`} />
                <Tab label={`装備 (${filteredItems.filter(i => i.type === 'equipment').length})`} />
                <Tab label={`キーアイテム (${filteredItems.filter(i => i.type === 'key_item').length})`} />
              </Tabs>
            </Box>

            {/* アイテム表示 */}
            <TabPanel value={tabValue} index={0}>
              <Grid container spacing={3}>
                {filteredItems.map((item) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
                    <ItemCard item={item} />
                  </Grid>
                ))}
              </Grid>
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <Grid container spacing={3}>
                {filteredItems.filter(item => item.type === 'consumable').map((item) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
                    <ItemCard item={item} />
                  </Grid>
                ))}
              </Grid>
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              <Grid container spacing={3}>
                {filteredItems.filter(item => item.type === 'equipment').map((item) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
                    <ItemCard item={item} />
                  </Grid>
                ))}
              </Grid>
            </TabPanel>

            <TabPanel value={tabValue} index={3}>
              <Grid container spacing={3}>
                {filteredItems.filter(item => item.type === 'key_item').map((item) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
                    <ItemCard item={item} />
                  </Grid>
                ))}
              </Grid>
            </TabPanel>
          </>
        )}
      </Paper>
    </Box>
  );
};

export default ItemManagementPage;