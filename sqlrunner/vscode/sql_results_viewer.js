const vscode = require('vscode');

const VIEW_TYPE = 'SqlResultsViewer';

class SqlResultsViewer {
    /**
     * @param {vscode.Uri} extensionUri 
     */
    constructor(extensionUri, {onDispose}) {
        this.extensionUri = extensionUri;
        this.view = this.createWebView(onDispose);
    }

    renderSqlResults(sqlResults) {
        console.log('Rendering SQL results');
        this.view.webview.html = this.sqlResultsToHtml(sqlResults);
        this.view.reveal();
    }

    sqlResultsToHtml({columnNames, rows}) {
        const datatablesJsUri = this.mediaPath('datatables.min.js');
        const datatablesCssUri = this.mediaPath('datatables.min.css');
        const mainJsUri = this.mediaPath('main.js');
        const mainCssUri = this.mediaPath('main.css');
        const nonce = this.nonce();

        const headerCells = columnNames.map(column => `<th>${column}</th>`).join('\n');
        const bodyCells = rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('\n')}</tr>`).join('\n');
        
        return `
            <!DOCTYPE html>
            <html>
                <head>
                    <title>SqlRunner</title>
                    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${this.view.webview.cspSource}; script-src 'nonce-${nonce}';">
                    <link href="${datatablesCssUri}" rel="stylesheet" />
                    <link href="${mainCssUri}" rel="stylesheet" />
                    <script nonce="${nonce}" src="${datatablesJsUri}"></script>
                    <script nonce="${nonce}" src="${mainJsUri}"></script>
                </head>

                <body>
                    <table id="results-table" class="table table-striped">
                        <thead>
                            ${headerCells}
                        </thead>
                        <tbody>
                            ${bodyCells}
                        </tbody>
                    </table>
                </body>
            </html>
        `
    }

    mediaPath(file) {
        return this.view.webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'media', file));
    }

    createWebView(onDispose) {
        const view = vscode.window.createWebviewPanel(
            VIEW_TYPE,
            'SQL Results Viewer',
            vscode.ViewColumn.Beside
        );

        view.webview.options = {
            enableScripts: true,
            localResourceRoots: [this.extensionUri]
        };

        view.onDidDispose(onDispose, null, []);

        return view;
    }

    nonce() {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }

        return text;
    }
}

module.exports = SqlResultsViewer;
