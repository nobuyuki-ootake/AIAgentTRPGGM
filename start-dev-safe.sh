#!/bin/bash

# VSCode安全連携用Docker起動スクリプト
# VSCodeハングを防止するための安全機能付き

echo "🔒 VSCode連携安全Docker起動スクリプト"
echo "=================================="

# 関数: Docker状態の詳細チェック
check_docker_status() {
    echo "🔍 詳細なDocker状態チェック中..."
    
    # Docker デーモンの状態確認
    if ! docker info >/dev/null 2>&1; then
        echo "❌ Dockerデーモンが起動していません"
        echo "💡 Docker Desktopを起動してください"
        exit 1
    fi
    
    # プロジェクト関連コンテナの確認
    echo "📋 プロジェクト関連コンテナ:"
    docker ps --filter "name=frontend" --filter "name=proxy" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    
    # ポート使用状況の確認
    echo ""
    echo "🌐 ポート使用状況確認:"
    if lsof -i :5173 >/dev/null 2>&1; then
        echo "⚠️  ポート5173が使用中です"
        lsof -i :5173
    fi
    if lsof -i :4001 >/dev/null 2>&1; then
        echo "⚠️  ポート4001が使用中です"
        lsof -i :4001
    fi
}

# 関数: 安全な停止処理
safe_docker_stop() {
    echo "🛑 安全にコンテナを停止中..."
    
    # グレースフル停止（30秒タイムアウト）
    docker compose -f docker-compose.dev.yml down --timeout 30
    
    # 強制停止が必要な場合
    REMAINING=$(docker ps --filter "name=frontend" --filter "name=proxy" -q)
    if [ ! -z "$REMAINING" ]; then
        echo "⚠️  一部コンテナが残っています。強制停止します..."
        docker stop $REMAINING
        docker rm $REMAINING
    fi
    
    echo "✅ コンテナ停止完了"
}

# 関数: VSCode環境チェック
check_vscode_env() {
    echo "🔧 VSCode環境チェック中..."
    
    # VSCodeプロセスの確認
    if pgrep -f "code" >/dev/null 2>&1; then
        echo "✅ VSCode起動中"
        
        # 大量のプロセスチェック（ハング判定）
        VSCODE_PROCESSES=$(pgrep -f "code" | wc -l)
        if [ "$VSCODE_PROCESSES" -gt 10 ]; then
            echo "⚠️  VSCodeプロセスが多数検出されました ($VSCODE_PROCESSES個)"
            echo "VSCodeがハングしている可能性があります"
            echo "続行前にVSCodeを再起動することを推奨します"
            echo "続行しますか？ (y/N)"
            read -r response
            if [[ ! "$response" =~ ^[Yy]$ ]]; then
                echo "🚫 処理をキャンセルしました"
                exit 0
            fi
        fi
    else
        echo "ℹ️  VSCode未起動"
    fi
}

# メイン処理
main() {
    echo "開始前チェックを実行します..."
    echo ""
    
    # 各種チェック実行
    check_docker_status
    echo ""
    check_vscode_env
    echo ""
    
    # 最終確認
    echo "🚀 Docker環境を起動しますか？"
    echo "オプション:"
    echo "  1) 通常起動"
    echo "  2) ビルド付き起動"  
    echo "  3) クリーンビルド起動"
    echo "  q) キャンセル"
    echo ""
    echo -n "選択してください (1/2/3/q): "
    read -r choice
    
    case $choice in
        1)
            echo "🐳 通常起動を開始します..."
            safe_docker_stop
            docker compose -f docker-compose.dev.yml up frontend-dev
            ;;
        2)
            echo "🏗️  ビルド付き起動を開始します..."
            safe_docker_stop
            docker compose -f docker-compose.dev.yml up --build frontend-dev
            ;;
        3)
            echo "🧹 クリーンビルド起動を開始します..."
            safe_docker_stop
            docker system prune -af
            docker compose -f docker-compose.dev.yml up --build frontend-dev
            ;;
        q|Q)
            echo "🚫 キャンセルしました"
            exit 0
            ;;
        *)
            echo "❌ 無効な選択です"
            exit 1
            ;;
    esac
}

# スクリプト実行
main "$@"