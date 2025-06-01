import React, { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Card,
  CardContent,
  Chip,
  Stack,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  LocationCity,
  Home,
  Castle,
  Store,
} from "@mui/icons-material";
import { useWorldBuildingContext } from "../../contexts/WorldBuildingContext";
import { v4 as uuidv4 } from "uuid";

// 拠点の型定義
export interface Base {
  id: string;
  name: string;
  type: "village" | "city" | "castle" | "camp" | "other";
  description: string;
  facilities: string[];
  npcs: string[]; // NPC IDのリスト
  services: string[];
  defenseLevel: number; // 1-10
  population?: number;
  notes?: string;
}

const BaseTab: React.FC = () => {
  const { bases = [], setBases, handleFieldChange } = useWorldBuildingContext();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBase, setEditingBase] = useState<Base | null>(null);
  const [formData, setFormData] = useState<Base>({
    id: "",
    name: "",
    type: "village",
    description: "",
    facilities: [],
    npcs: [],
    services: [],
    defenseLevel: 5,
    population: 0,
    notes: "",
  });
  const [newFacility, setNewFacility] = useState("");
  const [newService, setNewService] = useState("");

  // ダイアログを開く
  const handleOpenDialog = (base?: Base) => {
    if (base) {
      setEditingBase(base);
      setFormData(base);
    } else {
      setEditingBase(null);
      setFormData({
        id: uuidv4(),
        name: "",
        type: "village",
        description: "",
        facilities: [],
        npcs: [],
        services: [],
        defenseLevel: 5,
        population: 0,
        notes: "",
      });
    }
    setDialogOpen(true);
  };

  // ダイアログを閉じる
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingBase(null);
    setNewFacility("");
    setNewService("");
  };

  // 拠点を保存
  const handleSaveBase = () => {
    if (!formData.name.trim()) return;

    let newBases: Base[];
    if (editingBase) {
      newBases = bases.map((b) =>
        b.id === editingBase.id ? formData : b
      );
    } else {
      newBases = [...bases, formData];
    }
    
    setBases(newBases);
    handleFieldChange();
    handleCloseDialog();
  };

  // 拠点を削除
  const handleDeleteBase = (id: string) => {
    if (window.confirm("この拠点を削除してもよろしいですか？")) {
      const newBases = bases.filter((b) => b.id !== id);
      setBases(newBases);
      handleFieldChange();
    }
  };

  // フォーム入力の処理
  const handleFormChange = (
    field: keyof Base,
    value: string | number | string[]
  ) => {
    setFormData({ ...formData, [field]: value });
  };

  // 施設を追加
  const handleAddFacility = () => {
    if (newFacility.trim()) {
      handleFormChange("facilities", [...formData.facilities, newFacility.trim()]);
      setNewFacility("");
    }
  };

  // サービスを追加
  const handleAddService = () => {
    if (newService.trim()) {
      handleFormChange("services", [...formData.services, newService.trim()]);
      setNewService("");
    }
  };

  // 拠点タイプのアイコンを取得
  const getBaseIcon = (type: string) => {
    switch (type) {
      case "village":
        return <Home />;
      case "city":
        return <LocationCity />;
      case "castle":
        return <Castle />;
      case "camp":
        return <Store />;
      default:
        return <Home />;
    }
  };

  // 拠点タイプの表示名を取得
  const getBaseTypeName = (type: string) => {
    switch (type) {
      case "village":
        return "村";
      case "city":
        return "都市";
      case "castle":
        return "城";
      case "camp":
        return "野営地";
      case "other":
        return "その他";
      default:
        return "不明";
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h6">拠点・ベース設定</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          新規拠点
        </Button>
      </Box>

      {/* 拠点リスト */}
      <List>
        {bases.map((base, index) => (
          <React.Fragment key={base.id}>
            {index > 0 && <Divider />}
            <ListItem>
              <Card sx={{ width: "100%", my: 1 }}>
                <CardContent>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <Box sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                        {getBaseIcon(base.type)}
                        <Typography variant="h6" sx={{ ml: 1 }}>
                          {base.name}
                        </Typography>
                        <Chip
                          label={getBaseTypeName(base.type)}
                          size="small"
                          sx={{ ml: 1 }}
                        />
                        <Chip
                          label={`防御力: ${base.defenseLevel}/10`}
                          size="small"
                          sx={{ ml: 1 }}
                          color={base.defenseLevel >= 7 ? "success" : base.defenseLevel >= 4 ? "warning" : "error"}
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {base.description}
                      </Typography>
                      {base.population && (
                        <Typography variant="body2" color="text.secondary">
                          人口: {base.population.toLocaleString()}人
                        </Typography>
                      )}
                      {base.facilities.length > 0 && (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            施設:
                          </Typography>
                          <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mt: 0.5 }}>
                            {base.facilities.map((facility, i) => (
                              <Chip key={i} label={facility} size="small" variant="outlined" />
                            ))}
                          </Stack>
                        </Box>
                      )}
                      {base.services.length > 0 && (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            サービス:
                          </Typography>
                          <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mt: 0.5 }}>
                            {base.services.map((service, i) => (
                              <Chip key={i} label={service} size="small" color="primary" variant="outlined" />
                            ))}
                          </Stack>
                        </Box>
                      )}
                    </Box>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(base)}
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteBase(base.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </ListItem>
          </React.Fragment>
        ))}
      </List>

      {bases.length === 0 && (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <Typography color="text.secondary">
            まだ拠点が設定されていません
          </Typography>
        </Box>
      )}

      {/* 拠点編集ダイアログ */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingBase ? "拠点を編集" : "新規拠点を作成"}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3}>
            <TextField
              label="拠点名"
              value={formData.name}
              onChange={(e) => handleFormChange("name", e.target.value)}
              fullWidth
              required
            />

            <TextField
              label="拠点タイプ"
              select
              value={formData.type}
              onChange={(e) => handleFormChange("type", e.target.value)}
              fullWidth
              SelectProps={{ native: true }}
            >
              <option value="village">村</option>
              <option value="city">都市</option>
              <option value="castle">城</option>
              <option value="camp">野営地</option>
              <option value="other">その他</option>
            </TextField>

            <TextField
              label="説明"
              value={formData.description}
              onChange={(e) => handleFormChange("description", e.target.value)}
              multiline
              rows={3}
              fullWidth
            />

            <TextField
              label="人口"
              type="number"
              value={formData.population || ""}
              onChange={(e) => handleFormChange("population", parseInt(e.target.value) || 0)}
              fullWidth
            />

            <TextField
              label="防御力 (1-10)"
              type="number"
              value={formData.defenseLevel}
              onChange={(e) => handleFormChange("defenseLevel", Math.min(10, Math.max(1, parseInt(e.target.value) || 5)))}
              fullWidth
              inputProps={{ min: 1, max: 10 }}
            />

            {/* 施設 */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                施設
              </Typography>
              <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
                <TextField
                  placeholder="宿屋、鍛冶屋、教会など"
                  value={newFacility}
                  onChange={(e) => setNewFacility(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAddFacility()}
                  size="small"
                  fullWidth
                />
                <Button onClick={handleAddFacility} variant="outlined" size="small">
                  追加
                </Button>
              </Box>
              <Stack direction="row" spacing={0.5} flexWrap="wrap">
                {formData.facilities.map((facility, index) => (
                  <Chip
                    key={index}
                    label={facility}
                    onDelete={() => handleFormChange("facilities", formData.facilities.filter((_, i) => i !== index))}
                    size="small"
                  />
                ))}
              </Stack>
            </Box>

            {/* サービス */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                サービス
              </Typography>
              <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
                <TextField
                  placeholder="武器販売、回復、情報収集など"
                  value={newService}
                  onChange={(e) => setNewService(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAddService()}
                  size="small"
                  fullWidth
                />
                <Button onClick={handleAddService} variant="outlined" size="small">
                  追加
                </Button>
              </Box>
              <Stack direction="row" spacing={0.5} flexWrap="wrap">
                {formData.services.map((service, index) => (
                  <Chip
                    key={index}
                    label={service}
                    onDelete={() => handleFormChange("services", formData.services.filter((_, i) => i !== index))}
                    size="small"
                    color="primary"
                  />
                ))}
              </Stack>
            </Box>

            <TextField
              label="備考"
              value={formData.notes || ""}
              onChange={(e) => handleFormChange("notes", e.target.value)}
              multiline
              rows={2}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>キャンセル</Button>
          <Button onClick={handleSaveBase} variant="contained" disabled={!formData.name.trim()}>
            保存
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BaseTab;