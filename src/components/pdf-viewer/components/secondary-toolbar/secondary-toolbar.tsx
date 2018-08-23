import { Component } from "@stencil/core";

@Component({
    tag: 'hive-pdf-secondary-toolbar',
    styleUrl: 'secondary-toolbar.scss',
    shadow: true
})
export class HivePDFSecondaryToolbarComponent {

    render() {
        return (
            <div id="secondaryToolbar" class="secondaryToolbar hidden doorHangerRight">
                <div id="secondaryToolbarButtonContainer">
                    <button id="secondaryPresentationMode" class="secondaryToolbarButton presentationMode visibleLargeView" title="Switch to Presentation Mode" tabindex="51" data-l10n-id="presentation_mode">
                        <span data-l10n-id="presentation_mode_label">Presentation Mode</span>
                    </button>

                    <button id="secondaryOpenFile" class="secondaryToolbarButton openFile visibleLargeView" title="Open File" tabindex="52" data-l10n-id="open_file">
                        <span data-l10n-id="open_file_label">Open</span>
                    </button>

                    <button id="secondaryPrint" class="secondaryToolbarButton print visibleMediumView" title="Print" tabindex="53" data-l10n-id="print">
                        <span data-l10n-id="print_label">Print</span>
                    </button>

                    <button id="secondaryDownload" class="secondaryToolbarButton download visibleMediumView" title="Download" tabindex="54" data-l10n-id="download">
                        <span data-l10n-id="download_label">Download</span>
                    </button>

                    <a href="#" id="secondaryViewBookmark" class="secondaryToolbarButton bookmark visibleSmallView" title="Current view (copy or open in new window)" tabindex="55" data-l10n-id="bookmark">
                        <span data-l10n-id="bookmark_label">Current View</span>
                    </a>

                    <div class="horizontalToolbarSeparator visibleLargeView"></div>

                    <button id="firstPage" class="secondaryToolbarButton firstPage" title="Go to First Page" tabindex="56" data-l10n-id="first_page">
                        <span data-l10n-id="first_page_label">Go to First Page</span>
                    </button>
                    <button id="lastPage" class="secondaryToolbarButton lastPage" title="Go to Last Page" tabindex="57" data-l10n-id="last_page">
                        <span data-l10n-id="last_page_label">Go to Last Page</span>
                    </button>

                    <div class="horizontalToolbarSeparator"></div>

                    <button id="pageRotateCw" class="secondaryToolbarButton rotateCw" title="Rotate Clockwise" tabindex="58" data-l10n-id="page_rotate_cw">
                        <span data-l10n-id="page_rotate_cw_label">Rotate Clockwise</span>
                    </button>
                    <button id="pageRotateCcw" class="secondaryToolbarButton rotateCcw" title="Rotate Counterclockwise" tabindex="59" data-l10n-id="page_rotate_ccw">
                        <span data-l10n-id="page_rotate_ccw_label">Rotate Counterclockwise</span>
                    </button>

                    <div class="horizontalToolbarSeparator"></div>

                    <button id="cursorSelectTool" class="secondaryToolbarButton selectTool toggled" title="Enable Text Selection Tool" tabindex="60" data-l10n-id="cursor_text_select_tool">
                        <span data-l10n-id="cursor_text_select_tool_label">Text Selection Tool</span>
                    </button>
                    <button id="cursorHandTool" class="secondaryToolbarButton handTool" title="Enable Hand Tool" tabindex="61" data-l10n-id="cursor_hand_tool">
                        <span data-l10n-id="cursor_hand_tool_label">Hand Tool</span>
                    </button>

                    <div class="horizontalToolbarSeparator"></div>

                    <button id="scrollVertical" class="secondaryToolbarButton scrollVertical toggled" title="Use Vertical Scrolling" tabindex="62" data-l10n-id="scroll_vertical">
                        <span data-l10n-id="scroll_vertical_label">Vertical Scrolling</span>
                    </button>
                    <button id="scrollHorizontal" class="secondaryToolbarButton scrollHorizontal" title="Use Horizontal Scrolling" tabindex="63" data-l10n-id="scroll_horizontal">
                        <span data-l10n-id="scroll_horizontal_label">Horizontal Scrolling</span>
                    </button>
                    <button id="scrollWrapped" class="secondaryToolbarButton scrollWrapped" title="Use Wrapped Scrolling" tabindex="64" data-l10n-id="scroll_wrapped">
                        <span data-l10n-id="scroll_wrapped_label">Wrapped Scrolling</span>
                    </button>

                    <div class="horizontalToolbarSeparator"></div>

                    <button id="spreadNone" class="secondaryToolbarButton spreadNone toggled" title="Do not join page spreads" tabindex="65" data-l10n-id="spread_none">
                        <span data-l10n-id="spread_none_label">No Spreads</span>
                    </button>
                    <button id="spreadOdd" class="secondaryToolbarButton spreadOdd" title="Join page spreads starting with odd-numbered pages" tabindex="66" data-l10n-id="spread_odd">
                        <span data-l10n-id="spread_odd_label">Odd Spreads</span>
                    </button>
                    <button id="spreadEven" class="secondaryToolbarButton spreadEven" title="Join page spreads starting with even-numbered pages" tabindex="67" data-l10n-id="spread_even">
                        <span data-l10n-id="spread_even_label">Even Spreads</span>
                    </button>

                    <div class="horizontalToolbarSeparator"></div>

                    <button id="documentProperties" class="secondaryToolbarButton documentProperties" title="Document Properties…" tabindex="68" data-l10n-id="document_properties">
                        <span data-l10n-id="document_properties_label">Document Properties…</span>
                    </button>
                </div>
            </div>
        );
    }
}
