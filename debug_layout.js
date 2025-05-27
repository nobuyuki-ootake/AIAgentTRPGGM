// レイアウトデバッグ用のJavaScriptコード
console.log("=== Layout Debug Information ===");

// メインコンテンツエリアの情報を取得
const mainElement = document.querySelector("main");
if (mainElement) {
  const mainStyles = window.getComputedStyle(mainElement);
  console.log("Main element styles:");
  console.log("- width:", mainStyles.width);
  console.log("- margin-right:", mainStyles.marginRight);
  console.log("- flex-grow:", mainStyles.flexGrow);
  console.log("- position:", mainStyles.position);

  const rect = mainElement.getBoundingClientRect();
  console.log("Main element dimensions:");
  console.log("- left:", rect.left);
  console.log("- right:", rect.right);
  console.log("- width:", rect.width);
  console.log("- viewport width:", window.innerWidth);
}

// AIChatパネルの情報を取得
const drawerElement = document.querySelector('[role="presentation"]');
if (drawerElement) {
  const drawerStyles = window.getComputedStyle(drawerElement);
  console.log("Drawer element styles:");
  console.log("- width:", drawerStyles.width);
  console.log("- position:", drawerStyles.position);
  console.log("- right:", drawerStyles.right);

  const rect = drawerElement.getBoundingClientRect();
  console.log("Drawer element dimensions:");
  console.log("- left:", rect.left);
  console.log("- right:", rect.right);
  console.log("- width:", rect.width);
}

// 親コンテナの情報を取得
const rootContainer = document.querySelector("body > div");
if (rootContainer) {
  const containerStyles = window.getComputedStyle(rootContainer);
  console.log("Root container styles:");
  console.log("- display:", containerStyles.display);
  console.log("- width:", containerStyles.width);

  const rect = rootContainer.getBoundingClientRect();
  console.log("Root container dimensions:");
  console.log("- width:", rect.width);
}

console.log("=== End Debug Information ===");
