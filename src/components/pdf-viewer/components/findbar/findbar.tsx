import { Component } from "@stencil/core";

@Component({
    tag: 'hive-pdf-findbar',
    styleUrl: 'findbar.scss',
    shadow: true
})
export class HivePDFFindbarComponent {

    render() {
        return (
            <div class="findbar hidden doorHanger" id="findbar">
                <div id="findbarInputContainer">
                    <input id="findInput" class="toolbarField" title="Find" placeholder="Find in document…" tabindex="91" data-l10n-id="find_input" />
                    <div class="splitToolbarButton">
                        <button id="findPrevious" class="toolbarButton findPrevious" title="Find the previous occurrence of the phrase" tabindex="92" data-l10n-id="find_previous">
                            <span data-l10n-id="find_previous_label">Previous</span>
                        </button>
                        <div class="splitToolbarButtonSeparator"></div>
                        <button id="findNext" class="toolbarButton findNext" title="Find the next occurrence of the phrase" tabindex="93" data-l10n-id="find_next">
                            <span data-l10n-id="find_next_label">Next</span>
                        </button>
                    </div>
                </div>

                <div id="findbarOptionsContainer">
                    <input type="checkbox" id="findHighlightAll" class="toolbarField" tabindex="94" />
                    <label class="toolbarLabel" data-l10n-id="find_highlight">Highlight all</label>
                    <input type="checkbox" id="findMatchCase" class="toolbarField" tabindex="95" />
                    <label class="toolbarLabel" data-l10n-id="find_match_case_label">Match case</label>
                    <span id="findResultsCount" class="toolbarLabel hidden"></span>
                </div>

                <div id="findbarMessageContainer">
                    <span id="findMsg" class="toolbarLabel"></span>
                </div>
            </div>
        );
    }
}
