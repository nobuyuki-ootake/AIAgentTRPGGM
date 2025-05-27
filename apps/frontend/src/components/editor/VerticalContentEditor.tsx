import React, { useCallback } from "react";
import { Descendant, Editor } from "slate";
import {
  Slate,
  Editable,
  RenderElementProps,
  RenderLeafProps,
} from "slate-react";
import { styled } from "@mui/material/styles";
import { Box, Paper } from "@mui/material";
import type { CustomElement, CustomText } from "../../types/slate";

// スタイル付きコンポーネント
const VerticalEditorContainer = styled(Paper)(({ theme }) => ({
  width: "100%",
  flexGrow: 1, // 親のBox内で高さを最大限利用する
  display: "flex", // 中のGridPaperをflexアイテムとして扱うため
  flexDirection: "column", // GridPaperを縦に配置（現在は1つだけだが将来的な拡張性）
  overflow: "hidden", // VerticalEditorContainer自体はスクロールさせず、中の要素でスクロール
  padding: theme.spacing(1),
  backgroundColor: "#f8f8f8",
}));

const GridPaperContainer = styled(Box)(() => ({
  // GridPaperをラップするコンテナを追加
  width: "100%",
  flexGrow: 1,
  overflowX: "hidden", // 水平スクロールはこちらで担当
  overflowY: "hidden", // PaperSheetの高さは固定なので、ここはhidden
  paddingBottom: "16px", // スクロールバーのためのスペース（任意）
}));

const GridPaper = styled(Box)(() => ({
  display: "inline-flex", // PaperSheetを横並びにするため(現在は1つ)
  flexDirection: "row",
  gap: "16px",
  padding: "8px", // GridPaperContainerに移しても良い
  minHeight: "590px", // PaperSheetの高さに合わせる
  width: "max-content",
  // margin: "0 auto", // 中央寄せは一旦解除、GridPaperContainerの幅が100%なので不要なはず
}));

const PaperSheet = styled(Box)(({ theme }) => ({
  width: "max-content", // コンテンツ幅に追従
  minWidth: "min(max(600px, 70vw), 1000px)", // 最小幅を調整 (600px以上、かつビューポート70%か1000pxの小さい方)
  height: "590px",
  position: "relative",
  backgroundColor: "white",
  boxShadow: theme.shadows[1],
  border: "1px solid #ddd",
  overflow: "hidden", // PaperSheet自体はスクロールさせない
  display: "flex",
  justifyContent: "flex-end",
  alignItems: "flex-start",
  padding: "18px",
  // グリッド表示を削除
  // "&::before": {
  //   content: '""',
  //   position: "absolute",
  //   top: "18px",
  //   right: "18px",
  //   bottom: "18px",
  //   left: "18px",
  //   backgroundSize: "18px 25px",
  //   backgroundImage: `
  //     linear-gradient(to right, #eee 1px, transparent 1px),
  //     linear-gradient(to bottom, #eee 1px, transparent 1px)
  //   `,
  //   zIndex: 1,
  //   pointerEvents: "none",
  // },
}));

const StyledEditable = styled(Editable)(() => ({
  width: "max-content",
  minWidth: "calc(100% - 36px)",
  height: "100%",
  outline: "none",
  writingMode: "vertical-rl",
  WebkitWritingMode: "vertical-rl",
  msWritingMode: "vertical-rl",
  textOrientation: "mixed",
  fontSize: "18px",
  fontFamily:
    '"Noto Serif JP", "Yu Mincho", "YuMincho", "Hiragino Mincho Pro", serif',
  lineHeight: "1.6",
  letterSpacing: "0.05em",
  overflowWrap: "break-word",
  wordBreak: "keep-all",
  whiteSpace: "pre-wrap",
  position: "relative",
  zIndex: 2,
  backgroundColor: "transparent",
  padding: 0,
  margin: 0,
  overflowY: "auto",
  "& > div": {
    margin: 0,
    padding: 0,
  },
  "& p": {
    margin: 0,
    padding: 0,
    lineHeight: "inherit",
  },
  "& div:empty": {
    minHeight: "1.6em",
    height: "1.6em",
  },
  "& br": {
    lineHeight: "inherit",
  },
  "& div:has(br:only-child)": {
    height: "1.6em",
    minHeight: "1.6em",
  },
}));

interface VerticalContentEditorProps {
  value: Descendant[];
  onChange: (value: Descendant[]) => void;
  editorRef: React.RefObject<Editor | null>;
  onSelectionChange?: () => void;
  key?: number; // エディタの再作成用
  // placeholder?: string; // 必要に応じて追加
  // readOnly?: boolean; // 必要に応じて追加
}

const DefaultElement = (props: RenderElementProps) => {
  return (
    <div
      {...props.attributes}
      style={{
        margin: 0,
        padding: 0,
        lineHeight: "inherit",
      }}
    >
      {props.children}
    </div>
  );
};

const PageBreakElement = (props: RenderElementProps) => {
  return (
    <div
      {...props.attributes}
      contentEditable={false}
      data-slate-type="page-break"
    >
      <span>改ページ</span>
      {props.children}
    </div>
  );
};

const Leaf = ({ attributes, children, leaf }: RenderLeafProps) => {
  const baseStyle: React.CSSProperties = {
    margin: 0,
    padding: 0,
    lineHeight: "inherit",
  };

  const customLeaf = leaf as CustomText;

  const style: React.CSSProperties = {
    ...baseStyle,
    ...(customLeaf.bold && { fontWeight: "bold" }),
    ...(customLeaf.italic && { fontStyle: "italic" }),
    ...(customLeaf.underline && { textDecoration: "underline" }),
  };

  return (
    <span {...attributes} style={style}>
      {children}
    </span>
  );
};

function VerticalContentEditor({
  value,
  onChange,
  editorRef,
  onSelectionChange,
}: // placeholder = "(本文)", // デフォルトプレースホルダー
// readOnly = false,
VerticalContentEditorProps): React.ReactNode {
  const renderElement = useCallback((props: RenderElementProps) => {
    switch ((props.element as CustomElement).type) {
      case "page-break":
        return <PageBreakElement {...props} />;
      case "paragraph":
        return <DefaultElement {...props} />;
      default:
        return <DefaultElement {...props} />;
    }
  }, []);

  const renderLeaf = useCallback((props: RenderLeafProps) => {
    return <Leaf {...props} />;
  }, []);

  if (!editorRef.current) {
    return null;
  }
  // editorRef.current が null でないことを確認した後で CustomEditor にキャスト
  const editor = editorRef.current as Editor;

  return (
    <VerticalEditorContainer>
      <GridPaperContainer>
        <GridPaper>
          <PaperSheet>
            <Slate
              editor={editor}
              initialValue={value}
              onValueChange={onChange}
            >
              <StyledEditable
                renderElement={renderElement}
                renderLeaf={renderLeaf}
                placeholder="執筆を開始..."
                onSelect={onSelectionChange}
              />
            </Slate>
          </PaperSheet>
        </GridPaper>
      </GridPaperContainer>
    </VerticalEditorContainer>
  );
}

export default VerticalContentEditor;
