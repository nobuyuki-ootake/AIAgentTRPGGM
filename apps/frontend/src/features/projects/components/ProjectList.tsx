import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useProjectList } from "../hooks/useProjectList";
import { useProjectExport } from "../hooks/useProjectExport";
import { ProjectImportDialog } from "./ProjectImportDialog";
import { LocalStorageManager } from "../../../utils/localStorage";
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
  Alert,
  Divider,
  Menu,
  MenuItem,
  Tooltip,
  Snackbar,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import TextSnippetIcon from "@mui/icons-material/TextSnippet";
import BarChartIcon from "@mui/icons-material/BarChart";
import UploadFileIcon from "@mui/icons-material/UploadFile";

interface ProjectListProps {
  onProjectSelect?: (projectId: string) => void;
}

export const ProjectList = ({ onProjectSelect }: ProjectListProps) => {
  const navigate = useNavigate();
  const { projects, loading, error, deleteProject, loadProjects } =
    useProjectList();
  const { exportProject, isExporting, error: exportError } = useProjectExport();
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // エクスポートメニュー用の状態
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(
    null
  );
  const [exportingProjectId, setExportingProjectId] = useState<string | null>(
    null
  );

  // 通知用の状態
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  // インポートダイアログ用の状態
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  // コンポーネントマウント時にLocalStorageの内容を確認するためのデバッグログ
  useEffect(() => {
    const projectsStr = localStorage.getItem("novelProjects");
    const currentProjectId = localStorage.getItem("currentProjectId");
    const managerProjectList = localStorage.getItem("novel_project_list");

    console.log("=== ProjectList マウント時のデバッグ ===");
    console.log("LocalStorage - novelProjects:", projectsStr);
    console.log("LocalStorage - currentProjectId:", currentProjectId);
    console.log("LocalStorage - novel_project_list:", managerProjectList);

    if (projectsStr) {
      try {
        const lsProjects = JSON.parse(projectsStr);
        console.log("LocalStorage内のプロジェクト:", lsProjects);

        console.log("useProjectListで取得したプロジェクト:", projects);

        // IDの比較
        if (projects && lsProjects) {
          console.log("=== プロジェクトID比較 ===");
          for (const proj of projects) {
            console.log(`画面表示ID: ${proj.id}, タイトル: ${proj.title}`);
          }
          for (const lsProj of lsProjects) {
            console.log(
              `LocalStorageID: ${lsProj.id}, タイトル: ${
                lsProj.title || lsProj.name
              }`
            );
          }
        }
      } catch (error) {
        console.error("LocalStorageデータのパースエラー:", error);
      }
    }
  }, [projects]);

  // 新規プロジェクト作成ページへ遷移
  const handleCreateNew = () => {
    navigate("/projects/new");
  };

  // プロジェクト選択処理
  const handleSelectProject = (projectId: string) => {
    console.log("プロジェクトが選択されました", projectId);
    console.log("onProjectSelect存在確認:", !!onProjectSelect);

    if (onProjectSelect) {
      console.log("onProjectSelectを使用します (リストアイテム)");
      onProjectSelect(projectId);
      return;
    }

    console.log(
      "onProjectSelectがないため、直接ナビゲーションを実行します (リストアイテム)"
    );
    // プロジェクトのデータをローカルストレージから取得
    const projectsStr = localStorage.getItem("novelProjects");
    console.log(
      "localStorageから取得したデータ (リストアイテム):",
      projectsStr
    );

    if (projectsStr) {
      try {
        const projects = JSON.parse(projectsStr) as { id: string }[];
        console.log("パース後のプロジェクト (リストアイテム):", projects);

        const project = projects.find((p) => p.id === projectId);
        console.log("見つかったプロジェクト (リストアイテム):", project);

        if (project) {
          // Recoilステートに設定するためにlocalStorageに保存
          localStorage.setItem("currentProjectId", projectId);
          console.log("currentProjectIdを設定 (リストアイテム):", projectId);

          // シノプシスページへナビゲート
          console.log("シノプシスページへナビゲート開始 (リストアイテム)");
          navigate("/synopsis");
          console.log("ナビゲーション完了 (リストアイテム)");
        } else {
          console.error(
            "指定されたIDのプロジェクトが見つかりません (リストアイテム):",
            projectId
          );
        }
      } catch (error) {
        console.error("プロジェクトの読み込みエラー (リストアイテム):", error);
      }
    } else {
      console.error(
        "novelProjectsがlocalStorageに存在しません (リストアイテム)"
      );
    }
  };

  // 削除ダイアログを開く
  const handleDeleteClick = (projectId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // クリックイベントの伝播を止める
    setSelectedProject(projectId);
    setDeleteDialogOpen(true);
  };

  // プロジェクト削除処理
  const handleDeleteConfirm = () => {
    if (selectedProject) {
      deleteProject(selectedProject);
      setDeleteDialogOpen(false);
      setSelectedProject(null);
    }
  };

  // 削除ダイアログを閉じる
  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setSelectedProject(null);
  };

  // プロジェクト編集ページへ遷移
  const handleEditClick = (projectId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // クリックイベントの伝播を止める
    console.log("編集ボタンがクリックされました", projectId);
    console.log("onProjectSelect存在確認:", !!onProjectSelect);

    // プロジェクト選択処理を実行 - 常にonProjectSelectを優先使用
    if (onProjectSelect) {
      console.log("onProjectSelectを使用します (編集ボタン)");

      // LocalStorageManagerからプロジェクト情報を取得してNovelProject形式に変換
      const managerProject = LocalStorageManager.loadProject(projectId);
      console.log(
        "LocalStorageManagerから取得したプロジェクト:",
        managerProject
      );

      if (managerProject) {
        // 一時的にnovelProjectsにも保存して互換性を確保
        const novelProjectData = {
          id: managerProject.id,
          title: managerProject.title,
          synopsis: managerProject.synopsis || "",
          createdAt: new Date(managerProject.createdAt),
          updatedAt: new Date(managerProject.updatedAt),
          characters: managerProject.characters || [],
          worldBuilding: managerProject.worldBuilding || {
            id: "",
            setting: "",
            rules: [],
            places: [],
            cultures: [],
            history: "",
          },
          timeline: managerProject.timeline || [],
          chapters: managerProject.chapters || [],
          plot: [],
          feedback: [],
        };

        // novelProjectsにもプロジェクトを保存
        const existingProjects = localStorage.getItem("novelProjects");
        let projects = existingProjects ? JSON.parse(existingProjects) : [];

        // 既存のプロジェクトを置き換えるか、新しく追加
        const existingIndex = projects.findIndex(
          (p: any) => p.id === projectId
        );
        if (existingIndex >= 0) {
          projects[existingIndex] = novelProjectData;
        } else {
          projects.push(novelProjectData);
        }

        localStorage.setItem("novelProjects", JSON.stringify(projects));
        localStorage.setItem("currentProjectId", projectId);

        console.log("変換したプロジェクトデータ:", novelProjectData);
      }

      onProjectSelect(projectId);
      return; // ここで処理終了
    }

    console.log("onProjectSelectがないため、直接ナビゲーションを実行します");
    // プロジェクトのデータをローカルストレージから取得
    const projectsStr = localStorage.getItem("novelProjects");
    console.log("localStorageから取得したデータ:", projectsStr);

    if (projectsStr) {
      try {
        const projects = JSON.parse(projectsStr) as { id: string }[];
        console.log("パース後のプロジェクト:", projects);

        const project = projects.find((p) => p.id === projectId);
        console.log("見つかったプロジェクト:", project);

        if (project) {
          // Recoilステートに設定するためにlocalStorageに保存
          localStorage.setItem("currentProjectId", projectId);
          console.log("currentProjectIdを設定:", projectId);

          // シノプシスページへナビゲート
          console.log("シノプシスページへナビゲート開始");
          navigate("/synopsis");
          console.log("ナビゲーション完了");
        } else {
          console.error(
            "指定されたIDのプロジェクトが見つかりません:",
            projectId
          );
        }
      } catch (error) {
        console.error("プロジェクトの読み込みエラー:", error);
      }
    } else {
      console.error("novelProjectsがlocalStorageに存在しません");
    }
  };

  // エクスポートメニューを開く
  const handleExportClick = (
    projectId: string,
    event: React.MouseEvent<HTMLElement>
  ) => {
    event.stopPropagation(); // クリックイベントの伝播を止める
    setExportingProjectId(projectId);
    setExportMenuAnchor(event.currentTarget);
  };

  // エクスポートメニューを閉じる
  const handleExportMenuClose = () => {
    setExportMenuAnchor(null);
  };

  // プロジェクトをエクスポートする
  const handleExport = async (format: "json" | "text" | "stats") => {
    if (exportingProjectId) {
      const result = await exportProject(exportingProjectId, format);

      // 結果を通知
      let message = "";
      if (result) {
        switch (format) {
          case "json":
            message = "プロジェクトをJSONとしてエクスポートしました";
            break;
          case "text":
            message = "プロジェクトをテキストとしてエクスポートしました";
            break;
          case "stats":
            message = "プロジェクトの統計情報をエクスポートしました";
            break;
        }
      } else {
        message = exportError || "エクスポートに失敗しました";
      }

      setSnackbarMessage(message);
      setSnackbarOpen(true);
    }

    handleExportMenuClose();
  };

  // スナックバーを閉じる
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  // 日付フォーマット関数
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(dateString).toLocaleDateString("ja-JP", options);
  };

  // インポートダイアログを開く
  const handleImportClick = () => {
    setImportDialogOpen(true);
  };

  // インポートダイアログを閉じる
  const handleImportDialogClose = () => {
    setImportDialogOpen(false);
  };

  // インポート成功時の処理
  const handleImportSuccess = () => {
    // プロジェクト一覧を再読み込み
    loadProjects();

    // 成功メッセージを表示
    setSnackbarMessage("プロジェクトが正常にインポートされました");
    setSnackbarOpen(true);
  };

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h5" component="h1">
          プロジェクト一覧
        </Typography>
        <Box>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<UploadFileIcon />}
            onClick={handleImportClick}
            sx={{ mr: 2 }}
          >
            インポート
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleCreateNew}
          >
            新規作成
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper elevation={2}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress />
          </Box>
        ) : projects.length === 0 ? (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <Typography variant="body1" color="text.secondary">
              プロジェクトがありません。新しいプロジェクトを作成してください。
            </Typography>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleCreateNew}
              sx={{ mt: 2 }}
            >
              プロジェクトを作成
            </Button>
          </Box>
        ) : (
          <List>
            {projects.map((project, index) => (
              <Box key={project.id}>
                {index > 0 && <Divider />}
                <ListItem
                  onClick={() => handleSelectProject(project.id)}
                  sx={{
                    py: 2,
                    "&:hover": {
                      bgcolor: "rgba(0, 0, 0, 0.04)",
                      cursor: "pointer",
                    },
                  }}
                >
                  <ListItemText
                    primary={project.title}
                    secondary={`最終更新: ${formatDate(project.updatedAt)}`}
                    primaryTypographyProps={{ fontWeight: "medium" }}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      aria-label="edit"
                      onClick={(e) => handleEditClick(project.id, e)}
                      sx={{ mr: 1 }}
                    >
                      <EditIcon />
                    </IconButton>
                    <Tooltip title="エクスポート">
                      <IconButton
                        edge="end"
                        aria-label="export"
                        sx={{ mr: 1 }}
                        onClick={(e) => handleExportClick(project.id, e)}
                        disabled={isExporting}
                      >
                        <FileDownloadIcon />
                      </IconButton>
                    </Tooltip>
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={(e) => handleDeleteClick(project.id, e)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              </Box>
            ))}
          </List>
        )}
      </Paper>

      {/* 削除確認ダイアログ */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>プロジェクトの削除</DialogTitle>
        <DialogContent>
          <DialogContentText>
            このプロジェクトを削除してもよろしいですか？この操作は元に戻せません。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="primary">
            キャンセル
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            削除する
          </Button>
        </DialogActions>
      </Dialog>

      {/* エクスポートメニュー */}
      <Menu
        anchorEl={exportMenuAnchor}
        open={Boolean(exportMenuAnchor)}
        onClose={handleExportMenuClose}
      >
        <MenuItem onClick={() => handleExport("json")} disabled={isExporting}>
          <FileDownloadIcon fontSize="small" sx={{ mr: 1 }} />
          JSONとしてエクスポート
        </MenuItem>
        <MenuItem onClick={() => handleExport("text")} disabled={isExporting}>
          <TextSnippetIcon fontSize="small" sx={{ mr: 1 }} />
          テキストとしてエクスポート
        </MenuItem>
        <MenuItem onClick={() => handleExport("stats")} disabled={isExporting}>
          <BarChartIcon fontSize="small" sx={{ mr: 1 }} />
          統計情報をエクスポート
        </MenuItem>
      </Menu>

      {/* 通知用スナックバー */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={5000}
        onClose={handleSnackbarClose}
        message={snackbarMessage}
      />

      {/* インポートダイアログ */}
      <ProjectImportDialog
        open={importDialogOpen}
        onClose={handleImportDialogClose}
        onSuccess={handleImportSuccess}
      />
    </Box>
  );
};
