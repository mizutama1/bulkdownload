<script>
document.addEventListener('DOMContentLoaded', function() {
    const imageUrlInput = document.getElementById('imageUrl');
    const addButton = document.getElementById('addButton');
    const imageList = document.getElementById('imageList');
    const downloadAllButton = document.getElementById('downloadAllButton');
    
    const urls = [];

    // URLを正規化（プロトコルを補完）する関数
    function normalizeUrl(inputUrl) {
        let url = inputUrl.trim();
        
        if (url.length < 5) return null; 

        if (url.startsWith('data:')) {
            return url;
        }

        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url;
        } 
        
        if (url.startsWith('//')) {
            return 'https:' + url;
        }
        
        try {
            const testUrl = new URL('https://' + url); 
            return 'https://' + url;
        } catch (e) {
             return null;
        }
    }

    // URLからファイル名部分を推測する関数
    function getFileName(url) {
        if (url.startsWith('data:')) {
            const mimeTypeMatch = url.match(/^data:image\/([^;]+)/);
            const type = mimeTypeMatch ? mimeTypeMatch[1] : '不明';
            return `data:形式 (${type})`;
        }
        
        try {
            const urlObject = new URL(url);
            const path = urlObject.pathname;
            const filename = path.substring(path.lastIndexOf('/') + 1);
            
            if (filename.length > 0 && filename.includes('.')) {
                return filename;
            } else {
                return urlObject.hostname.replace('www.', '') + '...';
            }
        } catch (e) {
            return `URLが無効`;
        }
    }

    // URLを追加する関数
    function addImage() {
        const rawUrl = imageUrlInput.value;
        const url = normalizeUrl(rawUrl);

        if (!url) {
            alert('有効な画像URLを入力してください。');
            return;
        }

        if (urls.includes(url)) {
            alert('このURLは既に追加されています。');
            return;
        }
        
        urls.push(url);
        renderList();
        imageUrlInput.value = ''; 
        imageUrlInput.focus();
    }
    
    // リストを描画する関数
    function renderList() {
        imageList.innerHTML = ''; 
        
        urls.forEach((url, index) => {
            const listItem = document.createElement('li');
            listItem.className = 'image-item';
            listItem.setAttribute('data-url', url);

            // ×アイコンがクリックされたら削除を実行
            listItem.onclick = function(e) {
                const rect = listItem.getBoundingClientRect();
                const iconArea = {
                    x1: rect.right - 30,
                    y1: rect.top,
                    x2: rect.right,
                    y2: rect.top + 30
                };
                
                // アイコンのクリックエリア内かチェック
                if (e.clientX >= iconArea.x1 && e.clientX <= iconArea.x2 && 
                    e.clientY >= iconArea.y1 && e.clientY <= iconArea.y2) {
                    removeImage(url);
                    e.stopPropagation(); 
                }
            };


            // プレビューコンテナ
            const previewContainer = document.createElement('div');
            previewContainer.className = 'image-preview-container';

            // プレビュー画像
            const img = document.createElement('img');
            img.src = url;
            img.alt = '画像プレビュー';
            
            // 画像の読み込み失敗時の処理 (プレースホルダーSVGを表示)
            img.onerror = function() {
                this.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiByeD0iNCIgZmlsbD0iI0REQURERCIvPgo8cGF0aCBkPSJNMTIgMTdMMTcgMTJMMTQgOUw1IDE4TDUgMTdIOC41TDEyIDE3WiIgc3Ryb2tlPSIjNzc3Nzc3IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8Y2lyY2xlIGN4PSI5LjUiIGN5PSI5LjUiIHI9IjEuNSIgZmlsbD0iIzc3Nzc3NyIvPgo8L2F2Zz4='; 
            };
            
            previewContainer.appendChild(img);

            // 情報 (画像の上に重ねる)
            const infoDiv = document.createElement('div');
            infoDiv.className = 'image-info';
            const fileName = getFileName(url);
            
            // ファイル名を表示
            infoDiv.innerHTML = `<strong>${index + 1}.</strong> ${fileName}`; 

            listItem.appendChild(previewContainer);
            listItem.appendChild(infoDiv); 
            imageList.appendChild(listItem);
        });
        
        // ダウンロードボタンの状態を更新
        downloadAllButton.disabled = urls.length === 0;
    }

    // URLをリストから削除する関数
    function removeImage(urlToRemove) {
        const index = urls.indexOf(urlToRemove);
        if (index > -1) {
            urls.splice(index, 1);
            renderList();
        }
    }

    /**
     * 連番を指定された桁数で文字列化する関数
     * @param {number} number 連番 (1, 2, 3...)
     * @param {number} totalDigits 指定された桁数 (1, 2, 3...)
     * @returns {string} ゼロパディングされた連番文字列
     */
    function getSequenceString(number, totalDigits) {
        if (totalDigits <= 1) {
            // #が1つ、またはそれ以下の場合、パディングなし
            return number.toString();
        }
        
        // 2桁以上のパディングが必要な場合
        return number.toString().padStart(totalDigits, '0');
    }


    // 全てダウンロードする関数
    function downloadAllImages() {
        if (urls.length === 0) {
            alert('ダウンロードする画像がリストにありません。');
            return;
        }
        
        // 1. プロンプトで連番パターンを取得
        let pattern = prompt("ダウンロードファイル名のパターンを入力してください。\n連番を入れたい場所に「#」を桁数分入力してください。", "photo-##");

        if (pattern === null) {
            return;
        }
        
        let usePattern = pattern.trim();
        
        // 正規表現で連続した # の塊（#+）を一つだけ見つける
        const placeholderMatch = usePattern.match(/(#+)/);
        
        let placeholder = null;
        let totalDigits = 2; // デフォルトは2桁
        
        if (placeholderMatch) {
            placeholder = placeholderMatch[0]; // 例: "###"
            totalDigits = placeholder.length;   // 例: 3
        } else {
            // # が全くない場合、デフォルトとして末尾に "-##" を付けて、2桁の連番とする
            usePattern = usePattern + "-##";
            placeholder = "##";
            totalDigits = 2; 
        }
        
        // パターンから連番を除いた部分が空欄だった場合の処理
        if (usePattern.replace(placeholder, '').trim() === "") {
             usePattern = "image-" + placeholder;
        }


        downloadAllButton.disabled = true;
        downloadAllButton.textContent = `ダウンロード中... (${urls.length}ファイル)`;


        // URLごとにダウンロード処理を実行
        urls.forEach((url, index) => {
            const link = document.createElement('a');
            link.href = url.trim();
            
            let ext = 'png'; 

            // 拡張子を取得
            if (!url.startsWith('data:')) {
                try {
                    const urlPath = new URL(url.trim()).pathname; 
                    const lastSegment = urlPath.substring(urlPath.lastIndexOf('/') + 1);
                    if (lastSegment) {
                        // クエリパラメータやフラグメントを無視して拡張子を取得
                        const match = lastSegment.match(/\.([a-z0-9]+)([\?#]|$)/i);
                        if (match) {
                            ext = match[1].toLowerCase();
                            if (ext === 'jpeg') ext = 'jpg';
                        }
                    }
                } catch (e) {
                    // do nothing
                }
            } else {
                // data:URLの場合
                const mimeTypeMatch = url.match(/^data:image\/([^;]+)/);
                ext = mimeTypeMatch ? mimeTypeMatch[1].replace('image/', '').replace('jpeg', 'jpg') : 'png';
            }
            
            // 2. パターンと連番を組み合わせてファイル名を生成
            const sequenceNumberString = getSequenceString(index + 1, totalDigits); 
            
            // プレースホルダーを連番に置き換える (最初のマッチだけ置き換える)
            const baseFilename = usePattern.replace(placeholder, sequenceNumberString);

            const filename = `${baseFilename}.${ext}`;
            
            link.download = filename;
            
            // ダウンロードをトリガー
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });

        // 全てのダウンロードトリガー後にボタンを元に戻す
        setTimeout(() => {
            downloadAllButton.disabled = false;
            downloadAllButton.textContent = 'リストの画像を全てダウンロード';
            alert(`${urls.length} 個のダウンロードを開始しました。`);
        }, 1500); 
    }

    // イベントリスナーの設定
    addButton.addEventListener('click', addImage);
    imageUrlInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault(); 
            addImage();
        }
    });
    downloadAllButton.addEventListener('click', downloadAllImages);
});
</script>