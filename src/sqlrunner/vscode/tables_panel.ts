import * as vscode from 'vscode';

import HbsTemplateRenderer from './hbs_template_renderer';

export const VIEW_ID = 'sqlrunner.tables_panel';

/**
 * Displays a list of all tables in a database
 */
export class TablesPanel implements vscode.WebviewViewProvider {
    private panel: vscode.WebviewView | null;
    private templateRenderer: HbsTemplateRenderer | null;
    private onTableClicked: (event: void) => any;
    private tables: string[] | undefined;
    
    /**
     * @param {vscode.Uri} extensionUri 
     */
    constructor(private extensionUri: vscode.Uri, {onTableClicked}: {onTableClicked: (event: void) => any}) {
        this.panel = null;
        this.templateRenderer = null;
        this.onTableClicked = onTableClicked;
    }

    resolveWebviewView(webviewView: vscode.WebviewView, context: vscode.WebviewViewResolveContext, _token: vscode.CancellationToken) {
        console.log('TablesPanel: Initializing panel...');
        this.panel = webviewView;
        this.templateRenderer = new HbsTemplateRenderer(this.extensionUri, this.panel.webview);

        this.panel.webview.onDidReceiveMessage(this.onTableClicked);

        this.panel.webview.options = {
            enableScripts: true,
            localResourceRoots: [this.extensionUri]
        };
        
        this.panel.onDidChangeVisibility(_event => this.panel?.visible && this.showTables());
        
        this.showTables();
    }
    
    setTables(tables: string[]) {
        this.tables = tables;
        
        this.showTables();
    }

    showTables() {
        if (!this.tables) {
            return;
        }

        this.renderTemplate('tables.hbs', {tables: this.tables});
    }

    renderTemplate(template: string, context: object) {
        if (!this.panel) {
            console.warn('TablesPanelProvider: panel not initialized');
            return;
        }

        if (this.templateRenderer) {
            this.panel.webview.html = this.templateRenderer.render(template, context);
        }

        console.log(this.panel.webview.html);
    }
}
