const vscode = require('vscode');

const HbsTemplateRenderer = require('./hbs_template_renderer');

const VIEW_ID = 'sqlrunner.tables_panel';

/**
 * Displays a list of all tables in a database
 * 
 * @implements {vscode.WebviewViewProvider}
 */
class TablesPanel {
    /**
     * @param {vscode.Uri} extensionUri 
     */
    constructor(extensionUri) {
        this.extensionUri = extensionUri;
        this.panel = null;
        this.templateRenderer = null;
    }

    /**
     * @param {vscode.WebviewView} webviewView 
     * @param {vscode.WebviewViewResolveContext} context 
     * @param {vscode.CancellationToken} _token 
     */
    resolveWebviewView(webviewView, context, _token) {
        console.log('TablesPanel: Initializing panel...')
        this.panel = webviewView;
        this.templateRenderer = new HbsTemplateRenderer(this.extensionUri, this.panel.webview);

        this.panel.webview.options = {
            enableScripts: true,
            localResourceRoots: [this.extensionUri]
        };
    }

    showTables(tables) {
        this.renderTemplate('tables.hbs', {tables});
    }

    renderTemplate(template, context) {
        if (!this.panel) {
            console.warn('TablesPanelProvider: panel not initialized');
            return;
        }

        this.panel.webview.html = this.templateRenderer.render(template, context);
        console.log(this.panel.webview.html)
    }
}

module.exports = {VIEW_ID, TablesPanel};
