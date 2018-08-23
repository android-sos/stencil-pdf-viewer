import { Component } from "@stencil/core";


@Component({
    tag: 'hive-pdf-sidebar',
    styleUrl: 'sidebar.scss',
    shadow: true
})
export class HivePDFSidebarComponent {

    render() {
        return (
            <div id="sidebarContainer">
                <div id="toolbarSidebar">
                    <div class="splitToolbarButton toggled">
                        <button id="viewThumbnail" class="toolbarButton toggled" title="Show Thumbnails" tabindex="2" data-l10n-id="thumbs">
                            <span data-l10n-id="thumbs_label">Thumbnails</span>
                        </button>
                        <button id="viewOutline" class="toolbarButton" title="Show Document Outline (double-click to expand/collapse all items)" tabindex="3" data-l10n-id="document_outline">
                            <span data-l10n-id="document_outline_label">Document Outline</span>
                        </button>
                        <button id="viewAttachments" class="toolbarButton" title="Show Attachments" tabindex="4" data-l10n-id="attachments">
                            <span data-l10n-id="attachments_label">Attachments</span>
                        </button>
                    </div>
                </div>
                <div id="sidebarContent">
                    <div id="thumbnailView">
                    </div>
                    <div id="outlineView" class="hidden">
                    </div>
                    <div id="attachmentsView" class="hidden">
                    </div>
                </div>
                <div id="sidebarResizer" class="hidden"></div>
            </div>
        );
    }
}
