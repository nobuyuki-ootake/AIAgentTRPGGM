import React, { useCallback, useMemo } from "react";
import { createEditor, Descendant } from "slate";
import {
  Slate,
  Editable,
  withReact,
  RenderElementProps,
  RenderLeafProps,
} from "slate-react";
import { Box, Paper } from "@mui/material";
import { styled } from "@mui/material/styles";
import { CustomElement, CustomText } from "../../types/slate";

// スタイル付きコンポーネント
const VerticalEditorContainer = styled(Paper)(({ theme }) => ({
  width: "100%",
  overflowX: "auto",
  overflowY: "auto",
  padding: theme.spacing(1),
  backgroundColor: "#f8f8f8",
  display: "flex",
  justifyContent: "flex-start",
  direction: "ltr", // 左から右への配置（デフォルト）
}));

const GridPaper = styled(Box)(() => ({
  display: "flex",
  flexDirection: "row", // 原稿用紙を横に並べる
  gap: "16px", // 間隔を縮小（24px -> 16px）
  padding: "8px", // パディングを縮小（16px -> 8px）
  minHeight: "600px", // 最低高さを拡大
  direction: "ltr", // 左から右への配置（デフォルト）
}));

const PaperSheet = styled(Box)(({ theme }) => ({
  width: "540px", // 幅を縮小 (600px -> 540px)
  height: "500px", // サイズを拡大：25行 × 20px
  position: "relative",
  backgroundColor: "white",
  boxShadow: theme.shadows[1],
  border: "1px solid #ddd",
  overflow: "hidden",
  display: "flex",
  justifyContent: "flex-start", // 左揃え（縦書きでは右上から始まる）
  alignItems: "flex-start", // 上揃え
  // 左右の余白を縮小
  "&::before": {
    content: '""',
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    background: `
      linear-gradient(90deg, #f5f5f5 20px, transparent 20px, transparent calc(100% - 20px), #f5f5f5 calc(100% - 20px)),
      linear-gradient(180deg, #f5f5f5 20px, transparent 20px, transparent calc(100% - 20px), #f5f5f5 calc(100% - 20px))
    `,
    zIndex: 1,
    pointerEvents: "none",
  },
}));

// 原稿用紙のグリッド部分
const GridContainer = styled(Box)(() => ({
  width: "480px", // 幅を調整 (500px -> 480px)
  height: "460px", // マージン含む
  margin: "20px 0",
  position: "relative",
  writingMode: "vertical-rl", // 縦書き
  WebkitWritingMode: "vertical-rl", // Safari対応
  msWritingMode: "vertical-rl", // IE対応
  textOrientation: "upright", // 文字を縦に正立させる
  display: "block", // flexからblockに変更
  overflow: "hidden",
  "&::before": {
    content: '""',
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    background: `
      linear-gradient(90deg, transparent 24px, #dddddd 24px, #dddddd 25px),
      linear-gradient(180deg, transparent 24px, #dddddd 24px, #dddddd 25px)
    `,
    backgroundSize: "25px 25px", // マスのサイズを拡大
    backgroundPosition: "0px 0px",
    pointerEvents: "none",
    zIndex: 1,
  },
}));

// 原稿用紙用のスタイル
const manuscriptStyle: React.CSSProperties = {
  position: "absolute",
  top: 0,
  right: 0,
  width: "100%",
  height: "100%",
  outline: "none",
  fontSize: "18px", // フォントサイズを拡大
  lineHeight: "25px", // 行の高さを拡大
  textOrientation: "upright", // 文字を縦に正立させる
  caretColor: "black",
  padding: "0",
  margin: "0",
  zIndex: 2,
  writingMode: "vertical-rl", // 縦書き
  WebkitWritingMode: "vertical-rl", // Safari対応
  msWritingMode: "vertical-rl", // IE対応
  wordBreak: "keep-all", // 単語の途中で改行しない
  overflowWrap: "break-word", // 長い単語の折り返し
};

// 表示専用のページのスタイル
const readonlyPageStyle: React.CSSProperties = {
  ...manuscriptStyle,
  userSelect: "none", // テキスト選択を防止
};

interface VerticalEditorProps {
  value: Descendant[];
  onChange: (value: Descendant[]) => void;
}

const VerticalEditor: React.FC<VerticalEditorProps> = ({ value, onChange }) => {
  // Slateエディタインスタンスの作成
  const editor = useMemo(() => withReact(createEditor()), []);

  // エディタのレンダリング関数
  const renderElement = useCallback((props: RenderElementProps) => {
    const { attributes, children, element } = props;

    switch ((element as CustomElement).type) {
      case "paragraph":
        return (
          <p
            {...attributes}
            style={{
              margin: 0,
              padding: 0,
              lineHeight: "25px", // 行の高さを拡大
              letterSpacing: "7px", // 文字間隔を調整
              textOrientation: "upright", // 文字を縦に正立させる
              writingMode: "vertical-rl", // 縦書き
              WebkitWritingMode: "vertical-rl", // Safari対応
            }}
          >
            {children}
          </p>
        );
      default:
        return (
          <p
            {...attributes}
            style={{
              margin: 0,
              padding: 0,
              lineHeight: "25px", // 行の高さを拡大
              letterSpacing: "7px", // 文字間隔を調整
              textOrientation: "upright", // 文字を縦に正立させる
              writingMode: "vertical-rl", // 縦書き
              WebkitWritingMode: "vertical-rl", // Safari対応
            }}
          >
            {children}
          </p>
        );
    }
  }, []);

  const renderLeaf = useCallback((props: RenderLeafProps) => {
    const { attributes, children, leaf } = props;
    const customText = leaf as CustomText;

    const style: React.CSSProperties = {
      fontWeight: customText.bold ? "bold" : undefined,
      fontStyle: customText.italic ? "italic" : undefined,
      textDecoration: customText.underline ? "underline" : undefined,
    };

    return (
      <span
        {...attributes}
        style={{
          ...style,
          display: "inline-block",
          width: "25px", // 幅を拡大
          height: "25px", // 高さを拡大
          textAlign: "center",
          writingMode: "vertical-rl", // 縦書き
          WebkitWritingMode: "vertical-rl", // Safari対応
          textOrientation: "upright", // 文字を縦に正立させる
        }}
      >
        {children}
      </span>
    );
  }, []);

  // ページ分割（サイズ変更に合わせて1ページあたりの文字数も変更）
  const pageCount = useMemo(() => {
    // 1ページあたり20×18=360文字（余白を考慮）
    const charsPerPage = 360;

    // テキストの長さから必要なページ数を計算
    const textLength = value.reduce((acc, node) => {
      return (
        acc +
        (node as CustomElement).children.reduce(
          (childAcc: number, child: CustomText) => {
            return childAcc + (child.text?.length || 0);
          },
          0
        )
      );
    }, 0);

    // 少なくとも1ページ、常に空ページを1つ追加
    return Math.max(1, Math.ceil(textLength / charsPerPage) + 1);
  }, [value]);

  // 指定されたページの内容を取得する関数（新しいページサイズに対応）
  const getPageContentAdjusted = (pageIndex: number): string => {
    const charsPerPage = 360; // 1ページあたり20×18=360文字（余白を考慮）
    const allText = value.reduce((acc, node) => {
      return (
        acc +
        (node as CustomElement).children.reduce(
          (childAcc: string, child: CustomText) => {
            return childAcc + (child.text || "");
          },
          ""
        )
      );
    }, "");

    return allText.substring(
      pageIndex * charsPerPage,
      (pageIndex + 1) * charsPerPage
    );
  };

  // 2ページ目以降の表示用コンポーネント
  const ReadOnlyPageContent: React.FC<{ content: string }> = ({ content }) => {
    return (
      <div
        style={{
          ...readonlyPageStyle,
          writingMode: "vertical-rl",
          WebkitWritingMode: "vertical-rl",
          textOrientation: "upright",
        }}
      >
        {content}
      </div>
    );
  };

  return (
    <VerticalEditorContainer>
      <Slate editor={editor} initialValue={value} onChange={onChange}>
        <GridPaper>
          {/* 編集可能な最初のページ */}
          <PaperSheet>
            <GridContainer>
              <Editable
                renderElement={renderElement}
                renderLeaf={renderLeaf}
                placeholder="ここに文章を入力してください..."
                style={manuscriptStyle}
                autoFocus
                spellCheck={false}
                lang="ja"
                inputMode="text"
                autoCapitalize="off"
                autoCorrect="off"
              />
            </GridContainer>
          </PaperSheet>

          {/* 追加のページ（読み取り専用） */}
          {Array.from({ length: pageCount - 1 }).map((_, index) => (
            <PaperSheet key={index + 1}>
              <GridContainer>
                <ReadOnlyPageContent
                  content={getPageContentAdjusted(index + 1)}
                />
              </GridContainer>
            </PaperSheet>
          ))}
        </GridPaper>
      </Slate>
    </VerticalEditorContainer>
  );
};

export default VerticalEditor;
