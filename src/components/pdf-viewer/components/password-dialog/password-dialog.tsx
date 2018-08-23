import { Component } from "@stencil/core";

@Component({
    tag: 'hive-pdf-password-dialog',
    styleUrl: 'password-dialog.scss',
    shadow: true
})
export class HivePDFPasswordDialogComponent {

    render() {
        return (
            <div id="passwordOverlay" class="container hidden">
                <div class="dialog">
                    <div class="row">
                        <p id="passwordText" data-l10n-id="password_label">Enter the password to open this PDF file:</p>
                    </div>
                    <div class="row">
                        <input type="password" id="password" class="toolbarField" />
                    </div>
                    <div class="buttonRow">
                        <button id="passwordCancel" class="overlayButton"><span data-l10n-id="password_cancel">Cancel</span></button>
                        <button id="passwordSubmit" class="overlayButton"><span data-l10n-id="password_ok">OK</span></button>
                    </div>
                </div>
            </div>
        );
    }

}
