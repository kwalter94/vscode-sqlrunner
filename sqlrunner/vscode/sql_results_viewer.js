const vscode = require('vscode');

const VIEW_TYPE = 'SqlResultsViewer';

class SqlResultsViewer {
    constructor(onDispose) {
        this.view = this.createWebView(onDispose);
    }

    renderSqlResults(sqlResults) {
        this.view.webview.html = this.sqlResultsToHtml(sqlResults);
        this.view.reveal();
    }

    sqlResultsToHtml({columnNames, rows}) {
        const headerCells = columnNames.map(column => `<th>${column}</th>`);
        const bodyCells = rows.map(row => row.map(cell => `<td>${cell}</td>`)).join('\n');

        return `
            <!DOCTYPE html>
            <html>
                <head>
                    <title>SqlRunner</title>
                    <style>
                        th {
                            background-color: silver;
                        }

                        th, td {
                            border: 1px solid black;
                        }

                        td {
                            padding-left: 20px;
                            padding-right: 20px;
                        }
                    </style>
                </head>
                <body>
                    <table>
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

    createWebView(onDispose) {
        const view = vscode.window.createWebviewPanel(
            VIEW_TYPE,
            'SQL Results Viewer',
            vscode.ViewColumn.Beside
        );

        view.onDidDispose(onDispose, null, []);

        return view;
    }
}

module.exports = SqlResultsViewer;
