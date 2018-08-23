import { Component } from "@stencil/core";

@Component({
    tag: 'hive-pdf-error-wrapper',
    styleUrl: 'error-wrapper.scss',
    shadow: true
})
export class HivePDFErrorWrapper {

    render() {
        return (
            <div id="errorWrapper" hidden>
                <div id="errorMessageLeft">
                    <span id="errorMessage"></span>
                    <button id="errorShowMore" data-l10n-id="error_more_info">
                        More Information
                                </button>
                    <button id="errorShowLess" data-l10n-id="error_less_info" hidden>
                        Less Information
                                </button>
                </div>
                <div id="errorMessageRight">
                    <button id="errorClose" data-l10n-id="error_close">
                        Close
                                </button>
                </div>
                <div class="clearBoth"></div>
                <textarea id="errorMoreInfo" hidden readonly="readonly"></textarea>
            </div>
        );
    }
}
