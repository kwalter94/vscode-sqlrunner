const fs = require('fs');
const handlebars = require('handlebars');
const vscode = require('vscode');

/**
 * Render handlebars templates for a given webview.
 */
class HbsTemplateRenderer {
    /**
     * @param {vscode.Uri} extensionUri 
     * @param {vscode.Webview} webview
     */
    constructor(extensionUri, webview) {
        this.extensionUri = extensionUri;
        this.webview = webview;
        this.initHandlebars();
    }

    /**
     * Renders an hbs template and returns a string.
     * 
     * @param template {string}
     * @param context {Object}
     */
    render(template, context) {
        try {
            const templateData = fs.readFileSync(this.mediaPath(template).fsPath);
            const render = handlebars.compile(templateData.toString());
            const html = render(context)

            console.log(html);

            return html;
        } catch (error) {
            throw new Error(`Failed to compile index.hbs: ${error.message}`)
        }
    }

    mediaPath(file) {
        return vscode.Uri.joinPath(this.extensionUri, 'media', file);
    }

    mediaUri(file) {
        return this.webview.asWebviewUri(this.mediaPath(file));
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
        handlebars.registerHelper('csp_source', function() { return context.webview.cspSource });
    }
}

module.exports = HbsTemplateRenderer;
