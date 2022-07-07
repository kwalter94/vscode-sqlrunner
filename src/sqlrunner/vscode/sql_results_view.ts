import * as vscode from 'vscode';
import { SqlRow } from '../plugin';

import HbsTemplateRenderer from './hbs_template_renderer';

const VIEW_TYPE = 'SqlResultsView';

export default class SqlResultsView {
    private extensionUri: vscode.Uri;
    private view: vscode.WebviewPanel;
    private templateRenderer: HbsTemplateRenderer;

    constructor(extensionUri: vscode.Uri, {onDispose}: {onDispose: (event: void) => any}) {
        this.extensionUri = extensionUri;
        this.view = this.createWebView(onDispose);
        this.templateRenderer = new HbsTemplateRenderer(extensionUri, this.view.webview);
    }

    showResults({columnNames, rows, time}: {columnNames: string[], rows: SqlRow[], time: number | null}) {
        console.log('Rendering SQL results');
        this.renderTemplate('index.hbs', {time, rows, 'column_names': columnNames});
    }

    showError(message: string) {
        this.renderTemplate('error.hbs', {message});
    }

    showLoader(loading = true) {
        this.renderTemplate('loading.hbs', {loading});
    }

    renderTemplate(template: string, context: object) {
        this.view.webview.html = this.templateRenderer.render(template, context);
        this.view.reveal();
    }

    createWebView(onDispose: (event: void) => any): vscode.WebviewPanel {
        const view = vscode.window.createWebviewPanel(VIEW_TYPE, 'SQL Results Viewer', vscode.ViewColumn.Beside);

        view.webview.options = {
            enableScripts: true,
            localResourceRoots: [this.extensionUri]
        };

        view.onDidDispose(onDispose, null, []);

        return view;
    }
}
