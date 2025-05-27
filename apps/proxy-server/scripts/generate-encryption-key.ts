import { randomBytes } from 'crypto';

/**
 * AES-256-GCM用の32バイト暗号化キーを生成する
 */
function generateEncryptionKey() {
  // 32バイト (256ビット) の乱数を生成
  const key = randomBytes(32);

  // 16進数文字列に変換
  const hexKey = key.toString('hex');

  console.log('ENCRYPTION_KEY用の32バイトキーを生成しました:');
  console.log(hexKey);
  console.log('\n.envファイルに以下の行を追加してください:');
  console.log(`ENCRYPTION_KEY=${hexKey}`);
}

// 実行
generateEncryptionKey();
