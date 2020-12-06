const fs = require('fs');
const handlebars = require('handlebars');
const vscode = require('vscode');

const VIEW_TYPE = 'SqlResultsView';

class SqlResultsView {
    /**
     * @param {vscode.Uri} extensionUri 
     */
    constructor(extensionUri, {onDispose}) {
        this.extensionUri = extensionUri;
        this.view = this.createWebView(onDispose);
        this.initHandlebars();
    }

    showResults(sqlResults) {
        console.log('Rendering SQL results');
        this.view.webview.html = this.sqlResultsToHtml(sqlResults);
        this.view.reveal();
    }

    showError(message) {
        this.view.webview.html = this.renderTemplate('error.hbs', {message});
    }

    showLoader(loading=true) {
        this.view.webview.html = this.renderTemplate('loading.hbs', {loading})
    }

    /**
     * Renders html from given columnNames and rows
     * 
     * @returns {string}
     */
    sqlResultsToHtml({columnNames, rows, time}) {
        return this.renderTemplate('index.hbs', {time, rows, 'column_names': columnNames});
    }

    /**
     * Renders an hbs template and returns a string.
     * 
     * @param template {string}
     * @param context {Object}
     */
    renderTemplate(template, context) {
        try {
            const templateData = fs.readFileSync(this.mediaPath(template).fsPath);
            const render = handlebars.compile(templateData.toString());

            return render(context);
        } catch (error) {
            throw new Error(`Failed to compile index.hbs: ${error.message}`)
        }
    }

    mediaPath(file) {
        return vscode.Uri.joinPath(this.extensionUri, 'media', file);
    }

    mediaUri(file) {
        return this.view.webview.asWebviewUri(this.mediaPath(file));
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

    initHandlebars() {
        const context = this;
        const nonce = this.nonce();

        handlebars.registerHelper('media_uri', function(file) { return context.mediaUri(file) });
        handlebars.registerHelper('nonce', function() { return nonce });
        handlebars.registerHelper('csp_source', function() { return context.view.webview.cspSource });
    }
}

module.exports = SqlResultsView;
