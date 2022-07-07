import * as fs from 'fs';
import * as handlebars from 'handlebars';
import * as vscode from 'vscode';

/**
 * Render handlebars templates for a given webview.
 */
export default class HbsTemplateRenderer {
    private extensionUri: vscode.Uri;
    private webview: vscode.Webview;

    /**
     * @param {vscode.Uri} extensionUri 
     * @param {vscode.Webview} webview
     */
    constructor(extensionUri: vscode.Uri, webview: vscode.Webview) {
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
    render(template: string, context: object): string {
        try {
            const templateData = fs.readFileSync(this.mediaPath(template).fsPath);
            const render = handlebars.compile(templateData.toString());
            const html = render(context);

            return html;
        } catch (error: any) {
            throw new Error(`Failed to compile index.hbs: ${error.message}`);
        }
    }

    mediaPath(file: string): vscode.Uri {
        return vscode.Uri.joinPath(this.extensionUri, 'media', file);
    }

    mediaUri(file: string): vscode.Uri {
        return this.webview.asWebviewUri(this.mediaPath(file));
    }

    nonce(): string {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }

        return text;
    }

    initHandlebars() {
        handlebars.registerHelper('media_uri', (file) => this.mediaUri(file));
        handlebars.registerHelper('nonce', () => this.nonce);
        handlebars.registerHelper('csp_source', () => this.webview.cspSource);
    }
}
