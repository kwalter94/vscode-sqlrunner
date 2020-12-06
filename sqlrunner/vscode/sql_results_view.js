const vscode = require('vscode');

const HbsTemplateRenderer = require('./hbs_template_renderer');

const VIEW_TYPE = 'SqlResultsView';

class SqlResultsView {
    /**
     * @param {vscode.Uri} extensionUri 
     */
    constructor(extensionUri, {onDispose}) {
        this.extensionUri = extensionUri;
        this.view = this.createWebView(onDispose);
        this.templateRenderer = new HbsTemplateRenderer(extensionUri, this.view.webview);
    }

    showResults({columnNames, rows, time}) {
        console.log('Rendering SQL results');
        this.renderTemplate('index.hbs', {time, rows, 'column_names': columnNames});
    }

    showError(message) {
        this.renderTemplate('error.hbs', {message});
    }

    showLoader(loading=true) {
        this.renderTemplate('loading.hbs', {loading})
    }

    renderTemplate(template, context) {
        this.view.webview.html = this.templateRenderer.render(template, context);
        this.view.reveal();
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
}

module.exports = SqlResultsView;
