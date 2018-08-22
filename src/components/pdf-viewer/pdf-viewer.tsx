import { Component, Prop, Element, Event, EventEmitter, Watch } from '@stencil/core';
import { PDFJSStatic, PDFViewerParams, PDFSource } from 'pdfjs-dist';
import PDFJS from 'pdfjs-dist/build/pdf';
import PDFJSViewer from 'pdfjs-dist/web/pdf_viewer';

import { getFilenameFromUrl, version, build } from 'pdfjs-dist/lib/pdf';
import { RendererType, getPDFFileNameFromURL } from 'pdfjs-dist/lib/web/ui_utils';
import { DefaultExternalServices } from 'pdfjs-dist/lib/web/app';
import { LinkTarget } from 'pdfjs-dist/lib/display/dom_utils';

import PDFJSThumbnailViewer from 'pdfjs-dist/lib/web/pdf_thumbnail_viewer';
import PDFJSOutlineViewer from 'pdfjs-dist/lib/web/pdf_outline_viewer';
import PDFJSAttachmentViewer from 'pdfjs-dist/lib/web/pdf_attachment_viewer';
import PDFJSPDFLinkService from 'pdfjs-dist/lib/web/pdf_link_service';
import PDFJSFindController from 'pdfjs-dist/lib/web/pdf_find_controller';
import PDFJSFindBar from 'pdfjs-dist/lib/web/pdf_find_bar';
import PDFJSOverlayManager from 'pdfjs-dist/lib/web/overlay_manager';
import PDFJSGlobalEventBus from 'pdfjs-dist/lib/web/dom_events';
import PDFJSRenderingQueue from 'pdfjs-dist/lib/web/pdf_rendering_queue';
import PDFJSHistory from 'pdfjs-dist/lib/web/pdf_history';
import PDFJSDocumentProperties from 'pdfjs-dist/lib/web/pdf_document_properties';
import PDFJSCursorToosl from 'pdfjs-dist/lib/web/pdf_cursor_tools';
import PDFJSToolbar from 'pdfjs-dist/lib/web/toolbar';
import PDFJSSecondaryToolbar from 'pdfjs-dist/lib/web/secondary_toolbar';
import PDFJSPDFPresentationMode from 'pdfjs-dist/lib/web/pdf_presentation_mode';
import PDFJSPasswordPrompt from 'pdfjs-dist/lib/web/password_prompt';
import PDFJSSidebar from 'pdfjs-dist/lib/web/pdf_sidebar';
import PDFJSSidebarResizer from 'pdfjs-dist/lib/web/pdf_sidebar_resizer';
import PDFJSDownloadManager from 'pdfjs-dist/lib/web/download_manager';

declare global {
    const PDFJS: PDFJSStatic;
}

@Component({
    tag: 'hive-pdf-viewer',
    styleUrl: 'pdf-viewer.scss',
    shadow: true,
    assetsDir: 'vendor'
})
export class PdfViewerComponent {

    @Element() private element: HTMLElement;

    @Prop() singlePageMode = false;
    @Prop({ context: 'publicPath' }) private publicPath: string;
    @Prop({mutable: true}) url: string | Uint8Array | PDFSource;
    /**
     * Whether to enable WebGL.
     */
    @Prop() enableWebGL = false;
    /**
     * Controls if the text layer is enabled, and the selection mode that is used.\n 0 = Disabled.\n 1 = Enabled.\n 2 = (Experimental) Enabled, with enhanced text selection.
     */
    @Prop() textLayerMode: 0 | 1 | 2 = 1;
    @Prop() renderInteractiveForms = true;
    @Prop() disablePageLabels = false;
    @Prop() disablePageMode = false;
    /**
     * Whether to prevent the extension from reporting the extension and browser version to the extension developers.
     */
    @Prop() disableTelemetry = false;
    @Prop() supportsPrinting = false;
    /**
     * Controls how external links will be opened.\n 0 = default.\n 1 = replaces current window.\n 2 = new window/tab.\n 3 = parent.\n 4 = in top window.
     */
    @Prop() externalLinkTarget: 0 | 1 | 2 | 3 | 4 = 0;
    @Prop() externalLinkRel: 'noopener' | 'noreferrer' | 'nofollow' = 'nofollow';
    @Prop() locale = 'en';
    @Prop({mutable: true}) baseUrl = '';
    /**
     * Whether to disable streaming for requests (not recommended).
     */
    @Prop() disableStream = false;
    /**
     * Whether to disable range requests (not recommended).
     */
    @Prop() disableRange = false;
    @Prop() disableAutoFetch = false;
    /**
     * Whether to disable @font-face and fall back to canvas rendering (this is more resource-intensive).
     */
    @Prop() disableFontFace = false;
    /**
     * Whether to enable debugging tools.
     */
    @Prop() pdfBugEnabled = false;
    @Prop() disableCreateObjectURL = true;
    @Prop() renderer: 'canvas' | 'svg' = 'canvas';
    @Prop() useOnlyCssZoom = false;
    /**
     * The cursor tool that is enabled upon load.\n 0 = Text selection tool.\n 1 = Hand tool.
     */
    @Prop() cursorToolOnLoad: 0 | 1 = 0;
    /**
     * Controls the state of the sidebar upon load.\n 0 = do not show sidebar.\n 1 = show thumbnails in sidebar.\n 2 = show document outline in sidebar.\n 3 = Show attachments in sidebar.
     */
    @Prop() sidebarViewOnLoad: 0 | 1 | 2 | 3 = 0;
    /**
     * Default zoom level of the viewer. Accepted values: 'auto', 'page-actual', 'page-width', 'page-height', 'page-fit', or a zoom level in percents.
     */
    @Prop() defaultZoomValue = '';
    /**
     * Whether to view PDF documents in the last page and position upon opening the viewer.
     */
    @Prop() showPreviousViewOnLoad = true;
    /**
     * When enabled, pages whose orientation differ from the first page are rotated when printed.
     */
    @Prop() enablePrintAutoRotate = false;
    /**
     * Controls how the viewer scrolls upon load.\n 0 = Vertical scrolling.\n 1 = Horizontal scrolling.\n 2 = Wrapped scrolling.
     */
    @Prop() scrollModeOnLoad = 0;
    /**
     * "Whether the viewer should join pages into spreads upon load.\n 0 = No spreads.\n 1 = Odd spreads.\n 2 = Even spreads.
     */
    @Prop() spreadModeOnLoad: 0 | 1 | 2 = 0;

    @Prop() imageResourcesPath = './images/';

    @Prop() cMapPacked = true;

    @Prop() cMapUrl = '../web/cmaps/';

    @Prop() maxCanvasPixels = 16777216;


    @Watch('url') urlChanged() {
        // this.open();
    }

    @Event() pageChange: EventEmitter;
    @Event() progressChange: EventEmitter;

    @Event() firstPage: EventEmitter;


    pdfViewer: any;
    pdfThumbnailViewer: any;
    pdfOutlineViewer: any;
    pdfAttachmentViewer: any;
    pdfSidebar: any;
    pdfSidebarResizer: any;

    pdfLinkService: any;
    findController: any;
    findBar: any;
    overlayManager: any;
    passwordPrompt: any;

    pdfLoadingTask: any;
    pdfDocument: any;
    pdfRenderingQueue: any;
    pdfHistory: any;
    pdfDocumentProperties: any;
    pdfCursorTools: any;
    pdfPresentationMode: any;

    externalServices =  Object.assign({}, DefaultExternalServices, {
        createPreferences: function() {
            return {
                getAll: () => {
                    return new Promise(resolve => {
                        resolve(this);
                    });
                }
            };
        },
        createDownloadManager: function(options) {
            return new PDFJSDownloadManager.DownloadManager(options);
        },
        createL10n: function(ref) {
            const locale = ref.locale || 'en-US';
            const rtlLanguages = ['az', 'zh-CN', 'zh-HK', 'zh-TW'];
            return {
                getDirection: () => {
                    return new Promise(resolve => {
                        resolve(rtlLanguages.indexOf(locale) !== -1 ? 'rtl' : 'ltr');
                    });
                },
                getLanguage: () => {
                    return new Promise(resolve => {
                        resolve(locale);
                    });
                },
                translate: (container: HTMLElement) => {
                    return new Promise(resolve => {
                        resolve(container);
                    });
                },
                get: (i18nKey: string, options, replacement) => {
                    // this.l10n.get('of_pages', { pagesCount: pagesCount }, 'of {{pagesCount}}').then(function (msg) {
                    //     items.numPages.textContent = msg;
                    // });
                    console.log(`i18n get: ${i18nKey}`, options);
                    return new Promise(resolve => {
                        resolve(`${i18nKey} ${replacement}`); // TODO fix this
                    })
                }

            };
        }
    });
    printService: any;

    pagesCount = 0;

    toolbar: any;
    secondaryToolbar;

    eventBus: any;
    l10n: any;
    downloadManager: any;

    documentInfo: any;
    metadata: any;
    contentDispositionFilename: any;
    downloadComplete = false;
    initialized = false;
    isViewerEmbedded = (window.parent !== window);
    fellback = false;

    preferences: any;
    appConfig: any;

    render() {
        return (
            <div>
                <div id="outerContainer">
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
                    <div id="mainContainer">
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
                        <div class="toolbar">
                            <div id="toolbarContainer">
                                <div id="toolbarViewer">
                                    <div id="toolbarViewerLeft">
                                        <button id="sidebarToggle" class="toolbarButton" title="Toggle Sidebar" tabindex="11" data-l10n-id="toggle_sidebar">
                                            <span data-l10n-id="toggle_sidebar_label">Toggle Sidebar</span>
                                        </button>
                                        <div class="toolbarButtonSpacer"></div>
                                        <button id="viewFind" class="toolbarButton" title="Find in Document" tabindex="12" data-l10n-id="findbar">
                                            <span data-l10n-id="findbar_label">Find</span>
                                        </button>
                                        <div class="splitToolbarButton hiddenSmallView">
                                            <button class="toolbarButton pageUp" title="Previous Page" id="previous" tabindex="13" data-l10n-id="previous">
                                                <span data-l10n-id="previous_label">Previous</span>
                                            </button>
                                            <div class="splitToolbarButtonSeparator"></div>
                                            <button class="toolbarButton pageDown" title="Next Page" id="next" tabindex="14" data-l10n-id="next">
                                                <span data-l10n-id="next_label">Next</span>
                                            </button>
                                        </div>
                                        <input type="number" id="pageNumber" class="toolbarField pageNumber" title="Page" value="1" size={4} min="1" tabindex="15" data-l10n-id="page" />
                                        <span id="numPages" class="toolbarLabel"></span>
                                        </div>
                                        <div id="toolbarViewerRight">
                                            <button id="presentationMode" class="toolbarButton presentationMode hiddenLargeView" title="Switch to Presentation Mode" tabindex="31" data-l10n-id="presentation_mode">
                                                <span data-l10n-id="presentation_mode_label">Presentation Mode</span>
                                            </button>

                                            <button id="openFile" class="toolbarButton openFile hiddenLargeView" title="Open File" tabindex="32" data-l10n-id="open_file">
                                                <span data-l10n-id="open_file_label">Open</span>
                                            </button>

                                            <button id="print" class="toolbarButton print hiddenMediumView" title="Print" tabindex="33" data-l10n-id="print">
                                                <span data-l10n-id="print_label">Print</span>
                                            </button>

                                            <button id="download" class="toolbarButton download hiddenMediumView" title="Download" tabindex="34" data-l10n-id="download">
                                                <span data-l10n-id="download_label">Download</span>
                                            </button>
                                            <a href="#" id="viewBookmark" class="toolbarButton bookmark hiddenSmallView" title="Current view (copy or open in new window)" tabindex="35" data-l10n-id="bookmark">
                                                <span data-l10n-id="bookmark_label">Current View</span>
                                            </a>

                                            <div class="verticalToolbarSeparator hiddenSmallView"></div>

                                            <button id="secondaryToolbarToggle" class="toolbarButton" title="Tools" tabindex="36" data-l10n-id="tools">
                                                <span data-l10n-id="tools_label">Tools</span>
                                            </button>
                                        </div>
                                        <div id="toolbarViewerMiddle">
                                            <div class="splitToolbarButton">
                                                <button id="zoomOut" class="toolbarButton zoomOut" title="Zoom Out" tabindex="21" data-l10n-id="zoom_out">
                                                    <span data-l10n-id="zoom_out_label">Zoom Out</span>
                                                </button>
                                                <div class="splitToolbarButtonSeparator"></div>
                                                <button id="zoomIn" class="toolbarButton zoomIn" title="Zoom In" tabindex="22" data-l10n-id="zoom_in">
                                                    <span data-l10n-id="zoom_in_label">Zoom In</span>
                                                </button>
                                            </div>
                                            <span id="scaleSelectContainer" class="dropdownToolbarButton">
                                                <select id="scaleSelect" title="Zoom" tabindex="23" data-l10n-id="zoom">
                                                    <option id="pageAutoOption" title="" value="auto" selected data-l10n-id="page_scale_auto">Automatic Zoom</option>
                                                    <option id="pageActualOption" title="" value="page-actual" data-l10n-id="page_scale_actual">Actual Size</option>
                                                    <option id="pageFitOption" title="" value="page-fit" data-l10n-id="page_scale_fit">Page Fit</option>
                                                    <option id="pageWidthOption" title="" value="page-width" data-l10n-id="page_scale_width">Page Width</option>
                                                    <option id="customScaleOption" title="" value="custom" disabled hidden></option>
                                                    <option title="" value="0.5" data-l10n-id="page_scale_percent" data-l10n-args='{ "scale": 50 }'>50%</option>
                                                    <option title="" value="0.75" data-l10n-id="page_scale_percent" data-l10n-args='{ "scale": 75 }'>75%</option>
                                                    <option title="" value="1" data-l10n-id="page_scale_percent" data-l10n-args='{ "scale": 100 }'>100%</option>
                                                    <option title="" value="1.25" data-l10n-id="page_scale_percent" data-l10n-args='{ "scale": 125 }'>125%</option>
                                                    <option title="" value="1.5" data-l10n-id="page_scale_percent" data-l10n-args='{ "scale": 150 }'>150%</option>
                                                    <option title="" value="2" data-l10n-id="page_scale_percent" data-l10n-args='{ "scale": 200 }'>200%</option>
                                                    <option title="" value="3" data-l10n-id="page_scale_percent" data-l10n-args='{ "scale": 300 }'>300%</option>
                                                    <option title="" value="4" data-l10n-id="page_scale_percent" data-l10n-args='{ "scale": 400 }'>400%</option>
                                                </select>
                                            </span>
                                        </div>
                                    </div>
                                    <div id="loadingBar">
                                        <div class="progress">
                                            <div class="glimmer">
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        <div id="viewerContainer">
                            <div id="viewer" class="pdfViewer"></div>
                        </div>
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
                    </div>
                    <div id="overlayContainer" class="hidden">
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
                        <div id="documentPropertiesOverlay" class="container hidden">
                            <div class="dialog">
                                <div class="row">
                                    <span data-l10n-id="document_properties_file_name">File name:</span> <p id="fileNameField">-</p>
                                </div>
                                <div class="row">
                                    <span data-l10n-id="document_properties_file_size">File size:</span> <p id="fileSizeField">-</p>
                                </div>
                                <div class="separator"></div>
                                <div class="row">
                                    <span data-l10n-id="document_properties_title">Title:</span> <p id="titleField">-</p>
                                </div>
                                <div class="row">
                                    <span data-l10n-id="document_properties_author">Author:</span> <p id="authorField">-</p>
                                </div>
                                <div class="row">
                                    <span data-l10n-id="document_properties_subject">Subject:</span> <p id="subjectField">-</p>
                                </div>
                                <div class="row">
                                    <span data-l10n-id="document_properties_keywords">Keywords:</span> <p id="keywordsField">-</p>
                                </div>
                                <div class="row">
                                    <span data-l10n-id="document_properties_creation_date">Creation Date:</span> <p id="creationDateField">-</p>
                                </div>
                                <div class="row">
                                    <span data-l10n-id="document_properties_modification_date">Modification Date:</span> <p id="modificationDateField">-</p>
                                </div>
                                <div class="row">
                                    <span data-l10n-id="document_properties_creator">Creator:</span> <p id="creatorField">-</p>
                                </div>
                                <div class="separator"></div>
                                <div class="row">
                                    <span data-l10n-id="document_properties_producer">PDF Producer:</span> <p id="producerField">-</p>
                                </div>
                                <div class="row">
                                    <span data-l10n-id="document_properties_version">PDF Version:</span> <p id="versionField">-</p>
                                </div>
                                <div class="row">
                                    <span data-l10n-id="document_properties_page_count">Page Count:</span> <p id="pageCountField">-</p>
                                </div>
                                <div class="row">
                                    <span data-l10n-id="document_properties_page_size">Page Size:</span> <p id="pageSizeField">-</p>
                                </div>
                                <div class="buttonRow">
                                    <button id="documentPropertiesClose" class="overlayButton"><span data-l10n-id="document_properties_close">Close</span></button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div id="printContainer"></div>
            </div>
        )
    }

    componentWillLoad() {
        PDFJS.GlobalWorkerOptions.workerSrc = `${this.publicPath}vendor/pdf.worker.min.js`;
    }

    componentDidLoad() {
        this.initialize()
            .then(() => {
                this.webViewerInitialized();
            });
    }

    initialize() {
        this.preferences = this.externalServices.createPreferences();
        this.appConfig = this.viewerParams;
        return this._readPreferences().then(() => {
            return this._initializeL10n();
        }).then(() => {
            if (this.isViewerEmbedded && this.externalLinkTarget === LinkTarget.NONE) {
                this.externalLinkTarget = LinkTarget.TOP;
            }
            return this._initializeViewerComponents();
        }).then(() => {
            // Bind the various event handlers *after* the viewer has been
            // initialized, to prevent errors if an event arrives too soon.
            this.bindEvents();
            // this.bindWindowEvents();
            // We can start UI localization now.
            let appContainer = this.appConfig.appContainer || document.documentElement;
            this.l10n.translate(appContainer).then(() => {
                // Dispatch the 'localized' event on the `eventBus` once the viewer
                // has been fully initialized and translated.
                this.eventBus.dispatch('localized');
            });

            this.initialized = true;
        });
    }

    webViewerInitialized() {
        console.log('web viewer initialized');

        let file;

        console.log('file url', this.url);

        file = this.url;
        if (!file) {
            file = window.location.href.split('#')[0];
        }

        if (!this.supportsPrinting) {
            this.appConfig.toolbar.print.classList.add('hidden');
            this.appConfig.secondaryToolbar.printButton.classList.add('hidden');
        }

        if (!this.supportsFullscreen) {
            this.appConfig.toolbar.presentationModeButton.classList.add('hidden');
            this.appConfig.secondaryToolbar.presentationModeButton.classList.add('hidde');
        }

        if (this.supportsIntegratedFind) {
            this.appConfig.toolbar.viewFind.classList.add('hidden');
        }

        this.appConfig.mainContainer.addEventListener('transitionend', function(evt) {
            if (evt.target ===/** mainContainer **/ this) {
                // TODO this is not going to work here
                this.eventBus.dispatch('resize', {
                    source: this
                });
            }
        }, true);

        this.appConfig.sidebar.toggleButton.addEventListener('click', () => {
            this.pdfSidebar.toggle();
        });

        Promise.resolve().then(() => {
            this.webViewerOpenFileViaURL(file);
        }).catch(reason => {
            console.log('An error occured while loading the PDF', reason);
        })

    }

    webViewerOpenFileViaURL(file) {
        console.debug(`webViewerOpenFileViaURL`, file);
        if (file && file.lastIndexOf('file:', 0) === 0) {
            // file:-scheme. Load the contents in the main thread because QtWebKit
            // cannot load file:-URLs in a Web Worker. file:-URLs are usually loaded
            // very quickly, so there is no need to set up progress event listeners.
            this.setTitleUsingUrl(file);
            let xhr = new XMLHttpRequest();
            xhr.onload = () => {
                this.open(new Uint8Array(xhr.response));
            };
            try {
                xhr.open('GET', file);
                xhr.responseType = 'arraybuffer';
                xhr.send();
            } catch (ex) {
                throw ex;
            }
            return;
        }
        if (file) {
            this.open(file);
        }
    }


    private _initializeViewerComponents() {
        let appConfig = this.appConfig;
        return new Promise(resolve => {
            this.overlayManager = new PDFJSOverlayManager.OverlayManager();

            let eventBus = appConfig.eventBus || PDFJSGlobalEventBus.getGlobalEventBus();
            this.eventBus = eventBus;
            console.debug('Initialized eventBus', eventBus);

            let pdfRenderingQueue = new PDFJSRenderingQueue.PDFRenderingQueue();
            pdfRenderingQueue.OnIdle = this.cleanup.bind(this);
            this.pdfRenderingQueue = pdfRenderingQueue;
            console.debug('Initialized pdfRenderingQueue', pdfRenderingQueue);

            let pdfLinkService = new PDFJSPDFLinkService.PDFLinkService({
                eventBus: this.eventBus,
                externalLinkTarget: this.externalLinkTarget,
                externaLinkRel: this.externalLinkRel
            });
            this.pdfLinkService = pdfLinkService;
            console.debug('Initialized pdfLinkService', pdfLinkService);

            let downloadManager = this.externalServices.createDownloadManager({
                disableCreateObjectURL: this.disableCreateObjectURL
            });
            this.downloadManager = downloadManager;
            console.debug('Initialized downloadManager', downloadManager);

            let container = appConfig.mainContainer;
            console.debug('container', container);
            let viewer = appConfig.viewerContainer;
            console.debug('viewer', viewer);

            if (this.singlePageMode) {
                this.pdfViewer = new PDFJSViewer.PDFSinglePageViewer(this.viewerParams);
            }
            else {
                this.viewerParams.eventBus = this.eventBus;
                this.pdfViewer = new PDFJSViewer.PDFViewer({
                    container,
                    viewer,
                    eventBus,
                    renderineQueue: pdfRenderingQueue,
                    linkService: pdfLinkService,
                    downloadManager,
                    renderer: this.renderer,
                    enableWebGL: this.enableWebGL,
                    l10n: this.l10n,
                    textLayerMode: this.textLayerMode,
                    imageResourcesPath: this.imageResourcesPath,
                    renderInteractiveForms: this.renderInteractiveForms,
                    enablePrintAutoRotate: this.enablePrintAutoRotate,
                    useOnlyCssZoom: this.useOnlyCssZoom,
                    maxCanvasPixels: this.maxCanvasPixels,
                });
            }
            console.debug('Initialized pdfViewer', this.pdfViewer);

            pdfRenderingQueue.setViewer(this.pdfViewer);
            pdfLinkService.setViewer(this.pdfViewer);

            let thumbnailContainer = appConfig.sidebar.thumbnailView;
            this.pdfThumbnailViewer = new PDFJSThumbnailViewer.PDFThumbnailViewer({
                container: thumbnailContainer,
                renderingQueue: pdfRenderingQueue,
                linkService: this.pdfLinkService,
                l10n: this.l10n
            });
            console.debug('Initialized pdfThumbnailViewer', this.pdfThumbnailViewer);
            pdfRenderingQueue.setThumbnailViewer(this.pdfThumbnailViewer);

            this.pdfHistory = new PDFJSHistory.PDFHistory({
                linkService: pdfLinkService,
                eventBus
            });
            console.debug('Initialied pdfHistory', this.pdfHistory);

            this.findController = new PDFJSFindController.PDFFindController({
                pdfViewer: this.pdfViewer,
                eventBus: this.eventBus
            });

            this.findController.onUpdateResultsCount = matchCount => {
                if (this.supportsIntegratedFind) {
                    return;
                }
                this.findBar.updateResultsCount(matchCount);
            };

            this.findController.onUpdateState = (state, previous, matchCount) => {
                if (this.supportsIntegratedFind) {
                    this.externalServices.updateFindControlState({
                        result: state,
                        findPrevious: previous,
                    });
                } else {
                    this.findBar.updateUIState(state, previous, matchCount);
                }
            };

            this.pdfViewer.setFindController(this.findController);
            console.debug('Initialized findController', this.findController);

            let findBarConfig = Object.create(appConfig.findBar);
            findBarConfig.findController = this.findController;
            findBarConfig.eventBus = this.eventBus;
            this.findBar = new PDFJSFindBar.PDFFindBar(findBarConfig, this.l10n);

            this.pdfDocumentProperties = new PDFJSDocumentProperties.PDFDocumentProperties(
                appConfig.documentProperties,
                this.overlayManager,
                eventBus,
                this.l10n
            );

            console.debug('Initialized pdfDocumentProperties', this.pdfDocumentProperties);

            this.pdfCursorTools = new PDFJSCursorToosl.PDFCursorTools({
                container,
                eventBus,
                cursorToolOnLoad: this.cursorToolOnLoad
            });

            console.debug('Initialized pdfCursorTools', this.pdfCursorTools);

            this.toolbar = new PDFJSToolbar.Toolbar(appConfig.toolbar, container, eventBus, this.l10n);
            console.debug('Initialized toolbar', this.toolbar);

            this.secondaryToolbar = new PDFJSSecondaryToolbar.SecondaryToolbar(appConfig.secondaryToolbar, container, eventBus);
            console.debug('Initialized secondaryToolbar', this.secondaryToolbar);

            if (this.supportsFullscreen) {
                this.pdfPresentationMode = new PDFJSPDFPresentationMode.PDFPresentationMode({
                    container,
                    viewer,
                    pdfViewer: this.pdfViewer,
                    eventBus,
                    contextMenuitems: appConfig.fullscreen
                });
                console.debug('Initialized pdfPresentationMode', this.pdfPresentationMode);
            }

            this.passwordPrompt = new PDFJSPasswordPrompt.PasswordPrompt(appConfig.passwordOverlay,
                this.overlayManager, this.l10n);
            console.debug('Initialized passwordPrompt', this.passwordPrompt);

            this.pdfOutlineViewer = new PDFJSOutlineViewer.PDFOutlineViewer({
                container: appConfig.sidebar.outlineView,
                linkService: this.pdfLinkService,
                eventBus: this.eventBus
            });
            console.debug('Initialized pdfOutlineViewer', this.pdfOutlineViewer);

            this.pdfAttachmentViewer = new PDFJSAttachmentViewer.PDFAttachmentViewer({
                container: appConfig.sidebar.attachmentsView,
                eventBus: this.eventBus,
                downloadManager: null
            });
            console.debug('Initialized pdfAttachmentViewer', this.pdfAttachmentViewer);

            let sidebarConfig = Object.create(appConfig.sidebar);
            sidebarConfig.pdfViewer = this.pdfViewer;
            sidebarConfig.pdfThumbnailViewer = this.pdfThumbnailViewer;
            sidebarConfig.pdfOutlineViewer = this.pdfOutlineViewer;
            sidebarConfig.eventBus = eventBus;
            this.pdfSidebar = new PDFJSSidebar.PDFSidebar(sidebarConfig, this.l10n);
            this.pdfSidebar.onToggled = this.forceRendering.bind(this);
            console.debug('Initialized pdfSidebar', this.pdfSidebar);

            this.pdfSidebarResizer = new PDFJSSidebarResizer.PDFSidebarResizer(appConfig.sidebarResizer,
                eventBus, this.l10n);
            console.debug('Initialized pdfSidebarResizer', this.pdfSidebarResizer);
            resolve(undefined);

        });
    }


    private _readPreferences() {
        // const OVERRIDES = {
        //     disableFontFace: true,
        //     disableRange: true,
        //     disableStream: true,
        //     textLayerMode: TextLayerMode.DISABLE,
        // };

        // return this.preferences.getAll().then(function (prefs) {
        //     for (let name in prefs) {
        //         if ((name in OVERRIDES) && this[name] === OVERRIDES[name]) {
        //             continue;
        //         }
        //         this[name] = prefs[name];
        //     }
        // }, function () { });
        return new Promise(resolve => resolve());
    }

    forceRendering() {
        this.pdfRenderingQueue.printing = this.printing;
        this.pdfRenderingQueue.isThumbnailViewEnabled =
            this.pdfSidebar.isThumbnailViewVisible;
        this.pdfRenderingQueue.renderHighestPriority();
    }

    cleanup() {
        if (!this.pdfDocument) {
            return; // run cleanup when document is loaded
        }
        this.pdfViewer.cleanup();
        this.pdfThumbnailViewer.cleanup();

        // We don't want to remove fonts used by active page SVGs.
        if (this.pdfViewer.renderer !== RendererType.SVG) {
            this.pdfDocument.cleanup();
        }
    };

    bindEvents() {
        const {
            eventBus,
            webViewerFirstPage
        } = this;
        this.eventBus.on('resize', () => {
            console.log('resize');
        }); // webViewerResize);
        // this.eventBus.on('hashchange', webViewerHashchange);
        // this.eventBus.on('beforeprint', _boundEvents.beforePrint);
        // this.eventBus.on('afterprint', _boundEvents.afterPrint);
        // this.eventBus.on('pagerendered', webViewerPageRendered);
        // this.eventBus.on('textlayerrendered', webViewerTextLayerRendered);
        // this.eventBus.on('updateviewarea', webViewerUpdateViewarea);
        // this.eventBus.on('pagechanging', webViewerPageChanging);
        // this.eventBus.on('scalechanging', webViewerScaleChanging);
        // this.eventBus.on('rotationchanging', webViewerRotationChanging);
        // this.eventBus.on('sidebarviewchanged', webViewerSidebarViewChanged);
        // this.eventBus.on('pagemode', webViewerPageMode);
        // this.eventBus.on('namedaction', webViewerNamedAction);
        // this.eventBus.on('presentationmodechanged', webViewerPresentationModeChanged);
        // this.eventBus.on('presentationmode', webViewerPresentationMode);
        // this.eventBus.on('openfile', webViewerOpenFile);
        // this.eventBus.on('print', webViewerPrint);
        // this.eventBus.on('download', webViewerDownload);
        eventBus.on('firstpage', webViewerFirstPage);
        // eventBus.on('lastpage', webViewerLastPage);
        // this.eventBus.on('nextpage', (event) => {
        //     console.log('nextpage', event);
        // });
        // this.eventBus.on('previouspage', webViewerPreviousPage);
        // this.eventBus.on('zoomin', webViewerZoomIn);
        // this.eventBus.on('zoomout', webViewerZoomOut);
        // this.eventBus.on('pagenumberchanged', webViewerPageNumberChanged);
        // this.eventBus.on('scalechanged', webViewerScaleChanged);
        // this.eventBus.on('rotatecw', webViewerRotateCw);
        // this.eventBus.on('rotateccw', webViewerRotateCcw);
        // this.eventBus.on('switchscrollmode', webViewerSwitchScrollMode);
        // this.eventBus.on('scrollmodechanged', webViewerScrollModeChanged);
        // this.eventBus.on('switchspreadmode', webViewerSwitchSpreadMode);
        // this.eventBus.on('spreadmodechanged', webViewerSpreadModeChanged);
        // this.eventBus.on('documentproperties', webViewerDocumentProperties);
        // this.eventBus.on('find', webViewerFind);
        // this.eventBus.on('findfromurlhash', webViewerFindFromUrlHash);
        // if (typeof PDFJSDev === 'undefined' || PDFJSDev.test('GENERIC')) {
            this.eventBus.on('fileinputchange', () => {
                console.log('webViewerFileInputChange');
            });
        // }

        eventBus.on('documentload', () => {
            console.log('document loaded');
        });
    }

    unbindEvents() {
        const { eventBus } = this;
        // eventBus.off('resize', webViewerResize);
        // eventBus.off('hashchange', webViewerHashchange);
        // eventBus.off('beforeprint', _boundEvents.beforePrint);
        // eventBus.off('afterprint', _boundEvents.afterPrint);
        // eventBus.off('pagerendered', webViewerPageRendered);
        // eventBus.off('textlayerrendered', webViewerTextLayerRendered);
        // eventBus.off('updateviewarea', webViewerUpdateViewarea);
        // eventBus.off('pagechanging', webViewerPageChanging);
        // eventBus.off('scalechanging', webViewerScaleChanging);
        // eventBus.off('rotationchanging', webViewerRotationChanging);
        // eventBus.off('sidebarviewchanged', webViewerSidebarViewChanged);
        // eventBus.off('pagemode', webViewerPageMode);
        // eventBus.off('namedaction', webViewerNamedAction);
        // eventBus.off('presentationmodechanged', webViewerPresentationModeChanged);
        // eventBus.off('presentationmode', webViewerPresentationMode);
        // eventBus.off('openfile', webViewerOpenFile);
        // eventBus.off('print', webViewerPrint);
        // eventBus.off('download', webViewerDownload);
        eventBus.off('firstpage', this.webViewerFirstPage);
        // eventBus.off('lastpage', webViewerLastPage);
        // eventBus.off('nextpage', webViewerNextPage);
        // eventBus.off('previouspage', webViewerPreviousPage);
        // eventBus.off('zoomin', webViewerZoomIn);
        // eventBus.off('zoomout', webViewerZoomOut);
        // eventBus.off('pagenumberchanged', webViewerPageNumberChanged);
        // eventBus.off('scalechanged', webViewerScaleChanged);
        // eventBus.off('rotatecw', webViewerRotateCw);
        // eventBus.off('rotateccw', webViewerRotateCcw);
        // eventBus.off('switchscrollmode', webViewerSwitchScrollMode);
        // eventBus.off('scrollmodechanged', webViewerScrollModeChanged);
        // eventBus.off('switchspreadmode', webViewerSwitchSpreadMode);
        // eventBus.off('spreadmodechanged', webViewerSpreadModeChanged);
        // eventBus.off('documentproperties', webViewerDocumentProperties);
        // eventBus.off('find', webViewerFind);
        // eventBus.off('findfromurlhash', webViewerFindFromUrlHash);
        // if (typeof PDFJSDev === 'undefined' || PDFJSDev.test('GENERIC')) {
        //     eventBus.off('fileinputchange', webViewerFileInputChange);
        // }
    }

    webViewerFirstPage() {
        console.log('********* *(*(*(*(*( in here');
    }

    webViewerLastPage() {
        console.log('last page');
    }

    private _initializeL10n() {
        this.l10n = this.externalServices.createL10n({
            locale: this.locale
        });
        return this.l10n.getDirection().then(dir => {
            document.getElementsByTagName('html')[0].dir = dir;
        });
    }


    get viewerParams(): PDFViewerParams | any {
        return {
            eventBus: this.eventBus,
            linkService: this.pdfLinkService,
            enableWebGL: this.enableWebGL,
            appContainer: document.body,
            mainContainer: this.element.shadowRoot.querySelector('#viewerContainer'),
            viewerContainer: this.element.shadowRoot.querySelector('#viewer'),
            toolbar: {
                container: this.element.shadowRoot.querySelector('#toolbarViewer'),
                numPages: this.element.shadowRoot.querySelector('#numPages'),
                pageNumber: this.element.shadowRoot.querySelector('#pageNumber'),
                scaleSelectContainer: this.element.shadowRoot.querySelector('#scaleSelectContainer'),
                scaleSelect: this.element.shadowRoot.querySelector('#scaleSelect'),
                customScaleOption: this.element.shadowRoot.querySelector('#customScaleOption'),
                previous: this.element.shadowRoot.querySelector('#previous'),
                next: this.element.shadowRoot.querySelector('#next'),
                zoomIn: this.element.shadowRoot.querySelector('#zoomIn'),
                zoomOut: this.element.shadowRoot.querySelector('#zoomOut'),
                viewFind: this.element.shadowRoot.querySelector('#viewFind'),
                openFile: this.element.shadowRoot.querySelector('#openFile'),
                print: this.element.shadowRoot.querySelector('#print'),
                presentationModeButton: this.element.shadowRoot.querySelector('#presentationMode'),
                download: this.element.shadowRoot.querySelector('#download'),
                viewBookmark: this.element.shadowRoot.querySelector('#viewBookmark'),
            },
            secondaryToolbar: {
                toolbar: this.element.shadowRoot.querySelector('#secondaryToolbar'),
                toggleButton: this.element.shadowRoot.querySelector('#secondaryToolbarToggle'),
                toolbarButtonContainer:
                    this.element.shadowRoot.querySelector('#secondaryToolbarButtonContainer'),
                presentationModeButton:
                    this.element.shadowRoot.querySelector('#secondaryPresentationMode'),
                openFileButton: this.element.shadowRoot.querySelector('#secondaryOpenFile'),
                printButton: this.element.shadowRoot.querySelector('#secondaryPrint'),
                downloadButton: this.element.shadowRoot.querySelector('#secondaryDownload'),
                viewBookmarkButton: this.element.shadowRoot.querySelector('#secondaryViewBookmark'),
                firstPageButton: this.element.shadowRoot.querySelector('#firstPage'),
                lastPageButton: this.element.shadowRoot.querySelector('#lastPage'),
                pageRotateCwButton: this.element.shadowRoot.querySelector('#pageRotateCw'),
                pageRotateCcwButton: this.element.shadowRoot.querySelector('#pageRotateCcw'),
                cursorSelectToolButton: this.element.shadowRoot.querySelector('#cursorSelectTool'),
                cursorHandToolButton: this.element.shadowRoot.querySelector('#cursorHandTool'),
                scrollVerticalButton: this.element.shadowRoot.querySelector('#scrollVertical'),
                scrollHorizontalButton: this.element.shadowRoot.querySelector('#scrollHorizontal'),
                scrollWrappedButton: this.element.shadowRoot.querySelector('#scrollWrapped'),
                spreadNoneButton: this.element.shadowRoot.querySelector('#spreadNone'),
                spreadOddButton: this.element.shadowRoot.querySelector('#spreadOdd'),
                spreadEvenButton: this.element.shadowRoot.querySelector('#spreadEven'),
                documentPropertiesButton: this.element.shadowRoot.querySelector('#documentProperties'),
            },
            fullscreen: {
                contextFirstPage: this.element.shadowRoot.querySelector('#contextFirstPage'),
                contextLastPage: this.element.shadowRoot.querySelector('#contextLastPage'),
                contextPageRotateCw: this.element.shadowRoot.querySelector('#contextPageRotateCw'),
                contextPageRotateCcw: this.element.shadowRoot.querySelector('#contextPageRotateCcw'),
            },
            sidebar: {
                // Divs (and sidebar button)
                outerContainer: this.element.shadowRoot.querySelector('#outerContainer'),
                viewerContainer: this.element.shadowRoot.querySelector('#viewerContainer'),
                toggleButton: this.element.shadowRoot.querySelector('#sidebarToggle'),
                // Buttons
                thumbnailButton: this.element.shadowRoot.querySelector('#viewThumbnail'),
                outlineButton: this.element.shadowRoot.querySelector('#viewOutline'),
                attachmentsButton: this.element.shadowRoot.querySelector('#viewAttachments'),
                // Views
                thumbnailView: this.element.shadowRoot.querySelector('#thumbnailView'),
                outlineView: this.element.shadowRoot.querySelector('#outlineView'),
                attachmentsView: this.element.shadowRoot.querySelector('#attachmentsView'),
            },
            sidebarResizer: {
                outerContainer: this.element.shadowRoot.querySelector('#outerContainer'),
                resizer: this.element.shadowRoot.querySelector('#sidebarResizer'),
            },
            findBar: {
                bar: this.element.shadowRoot.querySelector('#findbar'),
                toggleButton: this.element.shadowRoot.querySelector('#viewFind'),
                findField: this.element.shadowRoot.querySelector('#findInput'),
                highlightAllCheckbox: this.element.shadowRoot.querySelector('#findHighlightAll'),
                caseSensitiveCheckbox: this.element.shadowRoot.querySelector('#findMatchCase'),
                findMsg: this.element.shadowRoot.querySelector('#findMsg'),
                findResultsCount: this.element.shadowRoot.querySelector('#findResultsCount'),
                findStatusIcon: this.element.shadowRoot.querySelector('#findStatusIcon'),
                findPreviousButton: this.element.shadowRoot.querySelector('#findPrevious'),
                findNextButton: this.element.shadowRoot.querySelector('#findNext'),
            },
            passwordOverlay: {
                overlayName: 'passwordOverlay',
                container: this.element.shadowRoot.querySelector('#passwordOverlay'),
                label: this.element.shadowRoot.querySelector('#passwordText'),
                input: this.element.shadowRoot.querySelector('#password'),
                submitButton: this.element.shadowRoot.querySelector('#passwordSubmit'),
                cancelButton: this.element.shadowRoot.querySelector('#passwordCancel'),
            },
            documentProperties: {
                overlayName: 'documentPropertiesOverlay',
                container: this.element.shadowRoot.querySelector('#documentPropertiesOverlay'),
                closeButton: this.element.shadowRoot.querySelector('#documentPropertiesClose'),
                fields: {
                    'fileName': this.element.shadowRoot.querySelector('#fileNameField'),
                    'fileSize': this.element.shadowRoot.querySelector('#fileSizeField'),
                    'title': this.element.shadowRoot.querySelector('#titleField'),
                    'author': this.element.shadowRoot.querySelector('#authorField'),
                    'subject': this.element.shadowRoot.querySelector('#subjectField'),
                    'keywords': this.element.shadowRoot.querySelector('#keywordsField'),
                    'creationDate': this.element.shadowRoot.querySelector('#creationDateField'),
                    'modificationDate': this.element.shadowRoot.querySelector('#modificationDateField'),
                    'creator': this.element.shadowRoot.querySelector('#creatorField'),
                    'producer': this.element.shadowRoot.querySelector('#producerField'),
                    'version': this.element.shadowRoot.querySelector('#versionField'),
                    'pageCount': this.element.shadowRoot.querySelector('#pageCountField'),
                    'pageSize': this.element.shadowRoot.querySelector('#pageSizeField'),
                    'linearized': this.element.shadowRoot.querySelector('#linearizedField'),
                },
            },
            errorWrapper: {
                container: this.element.shadowRoot.querySelector('#errorWrapper'),
                errorMessage: this.element.shadowRoot.querySelector('#errorMessage'),
                closeButton: this.element.shadowRoot.querySelector('#errorClose'),
                errorMoreInfo: this.element.shadowRoot.querySelector('#errorMoreInfo'),
                moreInfoButton: this.element.shadowRoot.querySelector('#errorShowMore'),
                lessInfoButton: this.element.shadowRoot.querySelector('#errorShowLess'),
            },
            printContainer: this.element.shadowRoot.querySelector('#printContainer'),
            openFileInputName: 'fileInput',
            debuggerScriptPath: './debugger.js',
        } as any;
    }

    load(pdfDocument) {
        this.pdfDocument = pdfDocument;

        pdfDocument.getDownloadInfo().then(() => {
            this.downloadComplete = true;
            // TODO this.loadingBar.hide();
            firstPagePromise.then(() => {
                this.eventBus.dispatch('documentload', {
                    source: this
                });
            });
        });
        // let pageModePromise = pdfDocument.getPageMode().catch(() => {
        //     /* Avoid breaking initial rendering; ignoring errors. */
        // });

        let pdfViewer = this.pdfViewer;
        pdfViewer.setDocument(pdfDocument);
        this.pdfLinkService.setDocument(pdfDocument);
        console.log('set document', pdfDocument);
        let firstPagePromise = pdfViewer.firstPagePromise;
        let pagesPromise = pdfViewer.pagesPromise;
        let onePageRendered = pdfViewer.onePageRendered;

        let pdfThumbnailViewer = this.pdfThumbnailViewer;
        pdfThumbnailViewer.setDocument(pdfDocument);

        firstPagePromise.then((pdfPage) => {
            console.log('firstPagePromise', pdfPage);
        });

        pdfDocument.getPageLabels().then(labels => {
            if (!labels || this.disablePageLabels) {
                return;
            }
            let i = 0,
                numLabels = labels.length;
            if (numLabels !== this.pagesCount) {
                console.error('The number of Page Labels does not match the number of pages in the document.');
            }
            // Ignore page labels that correspond to standard page numbering.
            while (i < numLabels && labels[i] === (i + 1).toString()) {
                i++;
            }
            if (i === numLabels) {
                return;
            }
            pdfViewer.setPageLabels(labels);
            pdfThumbnailViewer.setPageLabels(labels);
            // Changing toolbar page display to use labels and we need to set
            // the label of the current page.
            this.toolbar.setPagesCount(pdfDocument.numPages, true);
            this.toolbar.setPageNumber(pdfViewer.currentPageNumber,
                pdfViewer.currentPageLabel);
        });

        pagesPromise.then(() => {
            if (!this.supportsPrinting) {
                return;
            }
        });

        const animationStarted = new Promise(function(resolve) {
            window.requestAnimationFrame(resolve);
        });

        Promise.all([onePageRendered, animationStarted]).then(() => {
            pdfDocument.getOutline().then(outline => {
                this.pdfOutlineViewer.render({
                    outline
                });
            });
            pdfDocument.getAttachments().then(attachments => {
                this.pdfAttachmentViewer.render({
                    attachments
                });
            });
        });

        pdfDocument.getMetadata().then(
            ({
                info,
                metadata,
                contentDispositionFilename
            }) => {
                this.documentInfo = info;
                this.metadata = metadata;
                this.contentDispositionFilename = contentDispositionFilename;
                // Provides some basic debug information
                console.log('PDF ' + pdfDocument.fingerprint + ' [' +
                    info.PDFFormatVersion + ' ' + (info.Producer || '-').trim() +
                    ' / ' + (info.Creator || '-').trim() + ']' +
                    ' (PDF.js: ' + ('' || '-') +
                    (this.enableWebGL? ' [WebGL]' : '') + ')');

                let pdfTitle;
                if (metadata && metadata.has('dc:title')) {
                    let title = metadata.get('dc:title');
                    // Ghostscript sometimes return 'Untitled', sets the title to 'Untitled'
                    if (title !== 'Untitled') {
                        pdfTitle = title;
                    }
                }

                if (!pdfTitle && info && info['Title']) {
                    pdfTitle = info['Title'];
                }

                if (pdfTitle) {
                    this.setTitle(
                        `${pdfTitle} - ${contentDispositionFilename || document.title}`);
                } else if (contentDispositionFilename) {
                    this.setTitle(contentDispositionFilename);
                }

                if (info.IsAcroFormPresent) {
                    console.warn('Warning: AcroForm/XFA is not supported');
                    // this.fallback(UNSUPPORTED_FEATURES.forms);
                }
            }
        );

    }

    setTitleUsingUrl(url = '') {
        this.url = url;
        this.baseUrl = url.split('#')[0];
        let title = getPDFFileNameFromURL(url, '');
        if (!title) {
            try {
                title = decodeURIComponent(getFilenameFromUrl(url)) || url;
            } catch (ex) {
                // decodeURIComponent may throw URIError,
                // fall back to using the unprocessed url in that case
                title = url;
            }
        }
        this.setTitle(title);
    }

    setTitle(title: string) {
        if (this.isViewerEmbedded) {
            // Embedded PDF viewers should not be changing their parent page's title.
            return;
        }
        document.title = title;
    }

    fallback(featureId) {
        if (this.fellback) {
            return;
        }
        this.fellback = true;
        this.externalServices.fallback({
            featureId,
            url: this.baseUrl,
        }, function response(download) {
            if (!download) {
                return;
            }
            // PDFViewerApplication.download();
        });
    }

    get supportsIntegratedFind() {
        return this.externalServices.supportsIntegratedFind;
    }

    get printing() {
        return !!this.printService;
    }


    private async open(file, args?: any) {
        if (this.pdfLoadingTask) {
            // We need to destroy already opened document.
            return this.close().then(() => {
                // ... and repeat the open() call.
                return this.open(file, args);
            });
        }

        let parameters = Object.create(null);
        // URL
        if (typeof file === 'string') {
            this.setTitleUsingUrl(file);
            parameters.url = file;
        } else if (file && 'byteLength' in file) { // ArrayBuffer
            parameters.data = file;
        } else if (file.url && file.originalUrl) {
            this.setTitleUsingUrl(file.originalUrl);
            parameters.url = file.url;
        }
        parameters.docBaseUrl = this.baseUrl;

        let loadingTask = PDFJS.getDocument(parameters);
        this.pdfLoadingTask = loadingTask;

        loadingTask.onPassword = (updateCallback, reason) => {
            // Password prompt;
            console.log('updateCallback', updateCallback);
            console.log('reason', reason);
        }

        loadingTask.onProgress = ({ loaded, total }) => {
            this.progress(loaded / total);
        };

        loadingTask.onUnsupportedFeature = null; // this.fallback.bind(this);

        return loadingTask.promise.then((pdfDocument) => {
            this.load(pdfDocument);
        }, (exception) => {
            // Ignore errors for previously opened PDF files.
            if (loadingTask !== this.pdfLoadingTask) {
                return;
            }
            let message = exception && exception.message;
            let loadingErrorMessage;
            console.log('error', message);
            // if (exception instanceof InvalidPDFException) {

            // }
            return loadingErrorMessage.then((msg) => {
                this.error(msg, {
                    message
                });
                throw new Error(msg);
            })
        });

    }

    get supportsFullscreen() {
        let support = document.fullscreenEnabled
            || (document as any).mozFullScreenEnabled
            || (document as any).webkitFullscreenEnabled
            || (document as any).msFullscreenEnabled;

        return support;
    }

    progress(level) {
        let percent = Math.round(level * 100);

        this.progressChange.emit(percent);
    }

    // private _bindPageChangeEvent() {
    //     this.viewerContainer.addEventListener('pagechange', (event: Event & PDFPageProxy) => {
    //         this.pageChange.emit(event.pageNumber);
    //     });
    // }

    get viewerContainer() {
        return this.element.shadowRoot.querySelector('#viewerContainer');
    }

    error(message, moreInfo) {
        let moreInfoText = [this.l10n.get('error_version_info', {
            version: version || '?',
            build: build || '?',
        },
            'PDF.js v{{version}} (build: {{build}})')];
        if (moreInfo) {
            moreInfoText.push(
                this.l10n.get('error_message', {
                    message: moreInfo.message,
                },
                    'Message: {{message}}'));
            if (moreInfo.stack) {
                moreInfoText.push(
                    this.l10n.get('error_stack', {
                        stack: moreInfo.stack,
                    },
                        'Stack: {{stack}}'));
            } else {
                if (moreInfo.filename) {
                    moreInfoText.push(
                        this.l10n.get('error_file', {
                            file: moreInfo.filename,
                        },
                            'File: {{file}}'));
                }
                if (moreInfo.lineNumber) {
                    moreInfoText.push(
                        this.l10n.get('error_line', {
                            line: moreInfo.lineNumber,
                        },
                            'Line: {{line}}'));
                }
            }
        }

        Promise.all(moreInfoText).then((parts) => {
            console.error(message + '\n' + parts.join('\n'));
        });
        // this.fallback();
    }

    /**
     * Closes opened PDF document.
     * @returns {Promise} - Returns the promise, which is resolved when all
     *                      destruction is completed.
     */
    close() {
        let errorWrapper = this.appConfig.errorWrapper.container;
        errorWrapper.setAttribute('hidden', 'true');

        if (!this.pdfLoadingTask) {
            return Promise.resolve();
        }

        let promise = this.pdfLoadingTask.destroy();
        this.pdfLoadingTask = null;

        if (this.pdfDocument) {
            this.pdfDocument = null;

            this.pdfThumbnailViewer.setDocument(null);
            this.pdfViewer.setDocument(null);
            this.pdfLinkService.setDocument(null, null);
            this.pdfDocumentProperties.setDocument(null, null);
        }
        // this.store = null;
        // this.isInitialViewSet = false;
        this.downloadComplete = false;
        this.url = '';
        this.baseUrl = '';
        this.contentDispositionFilename = null;

        this.pdfSidebar.reset();
        this.pdfOutlineViewer.reset();
        this.pdfAttachmentViewer.reset();

        this.findController.reset();
        this.findBar.reset();
        this.toolbar.reset();
        this.secondaryToolbar.reset();

        return promise;
    }


}

// import { Component, Prop, Element, Event, EventEmitter, Listen, Watch, State } from '@stencil/core';

// import { PDFJSStatic, PDFViewerParams, PDFProgressData, PDFDocumentProxy, PDFSource, PDFPageProxy } from 'pdfjs-dist';
// import PDFJS from 'pdfjs-dist/build/pdf';
// import PDFJSViewer from 'pdfjs-dist/web/pdf_viewer';
// import PDFJSThumbnailViewer from 'pdfjs-dist/lib/web/pdf_thumbnail_viewer';
// import PDFJSRenderingQueue from 'pdfjs-dist/lib/web/pdf_rendering_queue';
// import PDFJSSidebar from 'pdfjs-dist/lib/web/pdf_sidebar';

// import printJS from 'print-js';

// declare global {
//     const PDFJS: PDFJSStatic;
// }

// @Component({
//     tag: 'hive-pdf-viewer',
//     styleUrl: 'pdf-viewer.scss',
//     shadow: true,
//     assetsDir: 'vendor'
// })
// export class PdfViewerComponent {

//     render() {
//         return (
//             <div id="mainContainer">
//                 <div class="toolbar">
//                     <div class="toolbar-left">
//                         <button id="outlineButton" class="hidden"></button>
//                         <button class="toolbar-btn" title="Side Drawer" id="thumbnailButton"
//                             hidden={!this.enableSideDrawer}
//                             onClick={() => this.toggleSideDrawer()}>
//                             <svg class="side-drawer-btn" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
//                                 <g id="e236b97c-3920-4be5-b6a8-a5eb5d413154" data-name="Layer 1">
//                                     <path d="M3.25 1A2.25 2.25 0 0 0 1 3.25v17.5A2.25 2.25 0 0 0 3.25 23H11V1zM8 19.5a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-3a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5zm0-6a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-3a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5zm0-6a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-3a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5z"></path>
//                                     <path class="right-path" d="M11 2h9.75A1.25 1.25 0 0 1 22 3.25v17.5A1.25 1.25 0 0 1 20.75 22H11"></path>
//                                 </g>
//                             </svg>
//                         </button>
//                         <div class="page-section">
//                             <span>Page </span>
//                             <button class="prev-btn" title="Previous Page" disabled={this.currentPage === 1}
//                                 onClick={() => this.prevPage()}>
//                                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M7.5 12.5l9 9v-18z"></path></svg>
//                             </button>
//                             <input
//                                 type="number"
//                                 min="1"
//                                 max={this.totalPages}
//                                 value={this.currentPage}
//                                 onChange={(event) => this.handlePageInput(event)}
//                             >
//                             </input>
//                             <button class="next-btn" title="Next Page" disabled={this.currentPage === this.totalPages}
//                                 onClick={() => this.nextPage()}>
//                                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
//                                     <path d="M16.5 12.5l-9 9v-18z"></path>
//                                 </svg>
//                             </button>
//                             <span>&nbsp;of&nbsp;</span>
//                             <span>{this.totalPages}</span>
//                         </div>
//                         <div class="page-number">
//                             <strong>{this.currentPage}</strong>
//                             &nbsp;
//                             /
//                             &nbsp;
//                                 <span>{this.totalPages}</span>
//                         </div>
//                         <button class="toolbar-btn" title="Zoom Out"
//                             disabled={this.zoom <= this.minZoom}
//                             onClick={() => this.zoomOut()}>
//                             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
//                                 <path d="M4.5 8h9v2h-9z" opacity=".5"></path>
//                                 <path d="M9 18a9 9 0 1 1 9-9 9.01 9.01 0 0 1-9 9zM9 2a7 7 0 1 0 7 7 7.008 7.008 0 0 0-7-7z"></path>
//                                 <path d="M20.556 23.03l-5.793-5.793 2.475-2.475 5.793 5.793a1 1 0 0 1 0 1.414l-1.06 1.06a1 1 0 0 1-1.415.001z" opacity=".66"></path>
//                             </svg>
//                         </button>
//                         <button class="toolbar-btn" title="Zoom In"
//                             disabled={this.zoom >= this.maxZoom}
//                             onClick={() => this.zoomIn()}>
//                             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
//                                 <path opacity=".5" d="M13.5 8H10V4.5H8V8H4.5v2H8v3.5h2V10h3.5V8z"></path>
//                                 <path d="M9 18a9 9 0 1 1 9-9 9.01 9.01 0 0 1-9 9zM9 2a7 7 0 1 0 7 7 7.008 7.008 0 0 0-7-7z"></path>
//                                 <path d="M20.556 23.03l-5.793-5.793 2.475-2.475 5.793 5.793a1 1 0 0 1 0 1.414l-1.06 1.06a1 1 0 0 1-1.415.001z" opacity=".66"></path>
//                             </svg>
//                         </button>
//                         <button class="toolbar-btn" title="Fit Page"
//                             onClick={() => this.toggleFitToPage()}
//                             hidden={!this.fitToPage}>
//                             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
//                                 <path d="M20.25 2A1.75 1.75 0 0 1 22 3.75v16.5A1.75 1.75 0 0 1 20.25 22H3.75A1.75 1.75 0 0 1 2 20.25V3.75A1.75 1.75 0 0 1 3.75 2h16.5m0-2H3.75A3.754 3.754 0 0 0 0 3.75v16.5A3.754 3.754 0 0 0 3.75 24h16.5A3.754 3.754 0 0 0 24 20.25V3.75A3.754 3.754 0 0 0 20.25 0z" opacity=".33"></path>
//                                 <path d="M20 9.657V4h-5.657L20 9.657zM4 14.343V20h5.657L4 14.343z"></path>
//                                 <path d="M15.758 9.657l-1.414-1.414 2.121-2.121 1.414 1.414zm-8.223 8.221l-1.414-1.414 2.121-2.121 1.414 1.414z" opacity=".75"></path>
//                                 <path d="M12.222 10.364l1.06-1.06 1.415 1.413-1.06 1.061zm-2.918 2.919l1.06-1.06 1.415 1.414-1.061 1.06z" opacity=".33"></path>
//                             </svg>
//                         </button>
//                         <button class="toolbar-btn" title="Fit Width"
//                             onClick={() => this.toggleFitToPage()}
//                             hidden={this.fitToPage}>
//                             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
//                                 <path d="M20.25 2A1.75 1.75 0 0 1 22 3.75v16.5A1.75 1.75 0 0 1 20.25 22H3.75A1.75 1.75 0 0 1 2 20.25V3.75A1.75 1.75 0 0 1 3.75 2h16.5m0-2H3.75A3.754 3.754 0 0 0 0 3.75v16.5A3.754 3.754 0 0 0 3.75 24h16.5A3.754 3.754 0 0 0 24 20.25V3.75A3.754 3.754 0 0 0 20.25 0z" opacity=".33"></path>
//                                 <path d="M19 16l4-4-4-4v8zM5 8l-4 4 4 4V8z"></path><path d="M19 13h-3v-2h3zM8 13H5v-2h3z" opacity=".75"></path>
//                                 <path d="M13 11h1.5v2H13zm-3.5 0H11v2H9.5z" opacity=".33"></path>
//                             </svg>
//                         </button>
//                         <button class="toolbar-btn" title="Rotate Counter Clockwise"
//                             onClick={() => this.rotateCounterClockwise()}
//                             hidden={!this.enableRotate}>
//                             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
//                                 <g data-name="Layer 1">
//                                     <path d="M22.75 1H1.25A1.25 1.25 0 0 0 0 2.25v19.5A1.25 1.25 0 0 0 1.25 23h21.5A1.25 1.25 0 0 0 24 21.75V2.25A1.25 1.25 0 0 0 22.75 1zM18 20H6V4h12z" opacity=".2"></path>
//                                     <path d="M18 20H6V4h12zM4 2v20h16V2z" opacity=".5"></path><path d="M11 8l1 1-1 1v2.5L7 9l4-3.5V8z"></path>
//                                     <path d="M8.46 16.54A5 5 0 0 1 7 13h2a3 3 0 0 0 .88 2.12z" opacity=".2"></path>
//                                     <path d="M12 18a5 5 0 0 1-3.54-1.46l1.42-1.42A3 3 0 0 0 12 16z" opacity=".4"></path>
//                                     <path d="M15.54 16.54l-1.42-1.42A3 3 0 0 0 15 13h2a5 5 0 0 1-1.46 3.54z" opacity=".8"></path>
//                                     <path d="M12 18v-2a3 3 0 0 0 2.12-.88l1.42 1.42A5 5 0 0 1 12 18z" opacity=".6"></path>
//                                     <path d="M17 13h-2a3 3 0 0 0-3-3h-1V8h1a5 5 0 0 1 5 5z"></path>
//                                 </g>
//                             </svg>
//                         </button>
//                         <button class="toolbar-btn" title="Rotate Clockwise"
//                             onClick={() => this.rotateClockwise()}
//                             hidden={!this.enableRotate}>
//                             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
//                                 <g data-name="Layer 1"><path d="M22.75 1H1.25A1.25 1.25 0 0 0 0 2.25v19.5A1.25 1.25 0 0 0 1.25 23h21.5A1.25 1.25 0 0 0 24 21.75V2.25A1.25 1.25 0 0 0 22.75 1zM18 20H6V4h12z" opacity=".2"></path>
//                                     <path d="M18 20H6V4h12zM4 2v20h16V2z" opacity=".5"></path>
//                                     <path d="M12 8l-1 1 1 1v2l3-3-3-3v2z"></path>
//                                     <path d="M15.54 16.54l-1.42-1.42A3 3 0 0 0 15 13h2a5 5 0 0 1-1.46 3.54z" opacity=".2"></path>
//                                     <path d="M12 18v-2a3 3 0 0 0 2.12-.88l1.42 1.42A5 5 0 0 1 12 18z" opacity=".4"></path>
//                                     <path d="M8.46 16.54A5 5 0 0 1 7 13h2a3 3 0 0 0 .88 2.12z" opacity=".8"></path>
//                                     <path d="M12 18a5 5 0 0 1-3.54-1.46l1.42-1.42A3 3 0 0 0 12 16z" opacity=".6"></path>
//                                     <path d="M9 13H7a5 5 0 0 1 5-5v2a3 3 0 0 0-3 3z"></path>
//                                 </g>
//                             </svg>
//                         </button>
//                     </div>
//                     <div class="toolbar-right">
//                         <button class="toolbar-btn" title="Print Document"
//                             onClick={() => this.printDialog()}
//                             hidden={!this.allowPrint}>
//                             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
//                                 <path d="M23 8.5v10a1.5 1.5 0 0 1-1.5 1.5H19v3H5v-3H2.5A1.5 1.5 0 0 1 1 18.5v-10A1.5 1.5 0 0 1 2.5 7H5V1h14v6h2.5A1.5 1.5 0 0 1 23 8.5z" fill="none" stroke="currentColor" stroke-miterlimit="10" stroke-width="2"></path>
//                                 <circle cx="19" cy="13" r="1"></circle>
//                                 <path fill="none" stroke="currentColor" stroke-miterlimit="10" opacity=".25" d="M18.5 8v2h-13V8"></path>
//                                 <path d="M23 15v3.5a1.5 1.5 0 0 1-1.5 1.5H18v-3H6v3H2.5A1.5 1.5 0 0 1 1 18.5V15z" opacity=".5"></path>
//                             </svg>
//                         </button>
//                         <button class="toolbar-btn" title="Search Document"
//                             onClick={() => this.toggleSearch()}>
//                             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
//                                 <path d="M21.48 18.95l-4.15-4.15-2.53 2.53 4.15 4.15a1.08 1.08 0 0 0 1.52 0l1-1a1.08 1.08 0 0 0 .01-1.53z" opacity=".75"></path>
//                                 <circle cx="9.5" cy="9.5" r="6.5" fill="none" stroke-miterlimit="10" stroke-width="2" stroke="currentColor"></circle>
//                             </svg>
//                         </button>
//                     </div>
//                 </div>
//                 <div class="search-container" hidden={!this.searchOpen}>
//                     <div class="search-form">
//                         <input type="text" name="search" autocomplete="off"
//                             onInput={(event) => this.handleSearch(event)}
//                             onKeyUp={(event) => this.handleSearchNext(event)}
//                             placeholder="Search Document"
//                             value={this.searchQuery} />
//                         <div class="search-form-result" hidden={this.searchQuery.trim().length < 1}>
//                             <div>
//                                 <span>{this.currentMatchIndex}</span>
//                                 <span>&nbsp;of&nbsp;</span>
//                                 <span>{this.totalMatchCount}</span>
//                             </div>
//                         </div>
//                         <div class="search-control">
//                             <button class="search-control-btn search-control-btn-prev"
//                                 onClick={() => this.searchNext(true)}
//                                 title="Previous">
//                                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
//                                     <path d="M12 8l9 9H3z"></path>
//                                 </svg>
//                             </button>
//                             <button class="search-control-btn search-control-btn-next"
//                                 onClick={() => this.searchNext()}
//                                 title="Next">
//                                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
//                                     <path d="M12 17l9-9H3z"></path>
//                                 </svg>
//                             </button>
//                         </div>
//                     </div>
//                     <a class="search-close-btn"
//                         onClick={() => this.closeSearch()}>Close</a>
//                 </div>
//                 <div id="pdf-outline">
//                     <div id="sideDrawer">
//                         <div class="thumbnail-viewer"></div>
//                     </div>
//                     <div id="outlineViewer">
//                     </div>
//                     <div id="viewerContainer">
//                         <div class="pdf-viewer"></div>
//                     </div>
//                 </div>
//             </div>
//         );
//     }

//     handlePageInput(e) {
//         let newPageNumber = parseInt(e.target.value, 10) || 1;
//         if (this.pdfDocument) {
//             newPageNumber = this.getValidPageNumber(newPageNumber);
//         }
//         this.page = newPageNumber;
//     }

//     handleSearch(e) {
//         this.searchQuery = e.target.value;
//         this.pdfFindController.executeCommand('find', {
//             caseSensitive: false,
//             findPrevious: false,
//             highlightAll: true,
//             findResultsCount: true,
//             phraseSearch: true,
//             query: e.target.value
//         });

//     }

//     searchTimeout: any;

//     handleSearchNext(e) {
//         if (e.key === 'Enter') {
//             this.searchNext();
//         }
//         if (this.searchTimeout) {
//             clearTimeout(this.searchTimeout);
//         }
//         this.searchTimeout = setTimeout(() => {
//             this.updateMatchCount();
//         }, 300);
//     }

//     public searchNext(findPrevious = false) {
//         this.pdfFindController.executeCommand('findagain', {
//             caseSensitive: false,
//             findPrevious: findPrevious,
//             highlightAll: false,
//             findResultsCount: true,
//             phraseSearch: true,
//             query: this.searchQuery
//         });
//         this.updateMatchCount();
//     }

//     componentWillLoad() {
//         PDFJS.GlobalWorkerOptions.workerSrc = `${this.publicPath}vendor/pdf.worker.min.js`;
//     }

//     @Prop({ context: 'publicPath' }) private publicPath: string;
//     @Element() private element: HTMLElement;

//     static CSS_UNITS: number = 96.0 / 72.0;

//     public pdfLinkService: any;
//     public pdfViewer: any;
//     public pdfFindController: any;
//     public sideDrawer: any;
//     public pdfThumbnailViewer: any;
//     public renderingQueue: any;
//     public eventBus: any;
//     public pdfDocument: any;

//     @State() currentPage: number = 1;
//     @State() totalPages: number;

//     private lastLoaded: string | Uint8Array | PDFSource;
//     private resizeTimeout: NodeJS.Timer;

//     @Event() onLinkClick: EventEmitter;
//     @Event() afterLoadComplete: EventEmitter;
//     @Event() onError: EventEmitter;
//     @Event() onProgress: EventEmitter;
//     @Event() pageChange: EventEmitter;
//     pageChangeEvent() {
//         this.pageChange.emit(this.currentPage);
//     }

//     @Listen('window:resize')
//     public onPageResize() {
//         if (!this.canAutoResize || !this.pdfDocument) {
//             return;
//         }
//         if (this.resizeTimeout) {
//             clearTimeout(this.resizeTimeout);
//         }
//         this.resizeTimeout = setTimeout(() => {
//             this.updateSize();
//         }, 100);
//     }

//     private _initListeners() {
//         // Page change event
//         this.element.shadowRoot
//             .querySelector('#viewerContainer')
//             .addEventListener('pagechange', (e: any) => {
//                 this.currentPage = e.pageNumber;
//                 this.pageChange.emit(e.pageNumber);
//             })

//         this.element.shadowRoot
//             .querySelector('#viewerContainer')
//             .addEventListener('click', (e: any) => {
//                 e.preventDefault();
//                 const link = (e.target as any).closest('.linkAnnotation > a');
//                 if (link) {
//                     const href = (e.target as any).closest('.linkAnnotation > a').href || '';
//                     // Ignore internal links to the same document
//                     if (href.indexOf(`${window.location.host}/#`) !== -1) {
//                         return;
//                     }
//                     this.onLinkClick.emit(href);
//                 }
//             });
//     }

//     @Prop() src: string | Uint8Array | PDFSource;
//     @Watch('src')
//     srcChanged() {
//         this.loadPDF();
//     }

//     @Prop({ mutable: true }) page: number = 1;
//     @Watch('page')
//     pageChanged(page) {
//         this.currentPage = page;
//         this.pdfViewer.currentPageNumber = this.currentPage;
//     }

//     @Prop({ mutable: true }) zoom: number = 1;
//     @Prop() minZoom: number = 0.25;
//     @Prop() maxZoom: number = 4;

//     @Prop() rotation: number = 0;
//     @Prop({ mutable: true }) allowPrint = false;

//     @Prop({ mutable: true }) searchOpen: boolean = false;
//     searchQuery: string = '';

//     @Prop() renderText: boolean = true;
//     @Prop() originalSize: boolean = false;
//     @Prop() stickToPage: boolean = false;
//     @Prop() externalLinkTarget: string = 'blank';
//     @Prop() canAutoResize: boolean = true;
//     @Prop({ mutable: true }) fitToPage: boolean = true;
//     @Prop({ mutable: true }) openDrawer: boolean = false
//     @Prop() enableSideDrawer: boolean = true;
//     @Prop() enableRotate: boolean = true;

//     @Prop({ mutable: true }) currentMatchIndex = 0;
//     @Prop({ mutable: true }) totalMatchCount = 0;

//     componentDidLoad() {
//         this._initListeners();
//         this.setupViewer();
//         if (this.src) {
//             this.loadPDF();
//         }
//     }

//     public setupViewer() {
//         PDFJS.disableTextLayer = !this.renderText;

//         this.pdfLinkService = new PDFJSViewer.PDFLinkService();
//         this.renderingQueue = new PDFJSRenderingQueue.PDFRenderingQueue()
//         this.setExternalLinkTarget(this.externalLinkTarget);

//         const pdfOptions: PDFViewerParams | any = {
//             container: this.element.shadowRoot.querySelector('#viewerContainer'),
//             linkService: this.pdfLinkService,
//             textLayerMode: this.renderText ? 1 : 0,
//             // This will enable forms, which are currently WIP
//             // renderInteractiveForms: true
//         };

//         this.pdfViewer = new PDFJSViewer.PDFViewer(pdfOptions);
//         this.renderingQueue.setViewer(this.pdfViewer);
//         this.pdfLinkService.setViewer(this.pdfViewer);
//         this.pdfFindController = new PDFJSViewer.PDFFindController({ pdfViewer: this.pdfViewer });
//         this.pdfViewer.setFindController(this.pdfFindController);
//         this.eventBus = new PDFJSViewer.EventBus();

//         this.pdfThumbnailViewer = new PDFJSThumbnailViewer.PDFThumbnailViewer({
//             container: this.element.shadowRoot.querySelector('#sideDrawer'),
//             linkService: this.pdfLinkService,
//             renderingQueue: this.renderingQueue
//         });

//         this.renderingQueue.setThumbnailViewer(this.pdfThumbnailViewer);
//         this.renderingQueue.isThumbnailViewEnabled = true;

//         this.sideDrawer = new PDFJSSidebar.PDFSidebar({
//             pdfViewer: this.pdfViewer,
//             pdfThumbnailViewer: this.pdfThumbnailViewer,
//             toggleButton: this.element.shadowRoot.querySelector('#thumbnailButton'),
//             outerContainer: this.element.shadowRoot.querySelector('#pdf-outline'),
//             viewerContainer: this.element.shadowRoot.querySelector('#viewerContainer'),
//             thumbnailButton: this.element.shadowRoot.querySelector('#outlineButton'),
//             thumbnailView: this.element.shadowRoot.querySelector('#sideDrawer'),
//             outlineButton: this.element.shadowRoot.querySelector('#outlineButton'),
//             outlineView: this.element.shadowRoot.querySelector('#outlineViewer'),
//             attachmentsButton: this.element.shadowRoot.querySelector('#outlineButton'),
//             attachmentsView: this.element.shadowRoot.querySelector('#outlineViewer'),
//             eventBus: this.eventBus
//         });

//     }

//     public nextPage() {
//         if (this.currentPage < this.totalPages) {
//             this.currentPage++;
//             this.pdfViewer.currentPageNumber = this.currentPage;
//         }
//     }

//     public prevPage() {
//         if (this.currentPage > 0) {
//             this.currentPage--;
//             this.pdfViewer.currentPageNumber = this.currentPage;
//         }
//     }

//     public toggleFitToPage() {
//         this.fitToPage = !this.fitToPage;
//         this.zoom = 1;
//         this.updateSize();
//     }

//     public toggleSideDrawer() {
//         this.openDrawer = !this.openDrawer;
//         if (this.openDrawer) {
//             this.zoomOut();
//             this.sideDrawer.open();
//             setTimeout(() => {
//                 this.pdfThumbnailViewer.forceRendering();
//             })
//         }
//         else {
//             this.zoomIn()
//             this.sideDrawer.close();
//         }
//     }

//     public rotateClockwise() {
//         let delta = 90;
//         if (!this.pdfDocument) {
//             return;
//         }
//         var newRotation = (this.pdfViewer.pagesRotation + 360 + delta) % 360;
//         this.pdfViewer.pagesRotation = newRotation;
//     }

//     public rotateCounterClockwise() {
//         let delta = -90;
//         if (!this.pdfDocument) {
//             return;
//         }
//         var newRotation = (this.pdfViewer.pagesRotation + 360 + delta) % 360;
//         this.pdfViewer.pagesRotation = newRotation;
//     }

//     public printDialog() {
//         printJS({
//             printable: this.src,
//             type: 'pdf',
//             showModal: true
//         });
//     }

//     public zoomOut() {
//         let ticks = 1;
//         var newScale = this.pdfViewer.currentScale;
//         do {
//             newScale = (newScale / 1.1).toFixed(2);
//             newScale = Math.floor(newScale * 10) / 10;
//             newScale = Math.max(this.minZoom, newScale);
//         } while (--ticks > 0 && newScale > this.minZoom);
//         this.pdfViewer.currentScaleValue = newScale;
//     }

//     public zoomIn() {
//         let ticks = 1;
//         var newScale = this.pdfViewer.currentScale;
//         do {
//             newScale = (newScale * 1.1).toFixed(2);
//             newScale = Math.ceil(newScale * 10) / 10;
//             newScale = Math.min(this.maxZoom, newScale);
//         } while (--ticks > 0 && newScale < this.maxZoom);
//         this.pdfViewer.currentScaleValue = newScale;
//     }

//     private updateMatchCount() {
//         this.currentMatchIndex = this.pdfFindController.selected.matchIdx + 1;
//         this.totalMatchCount = this.pdfFindController.matchCount;
//     }

//     public closeSearch() {
//         this.searchOpen = false;
//         this.handleSearch({
//             target: {
//                 value: ''
//             }
//         });
//     }

//     public toggleSearch() {
//         this.searchOpen = !this.searchOpen;
//         if (this.searchOpen) {
//             setTimeout(() => {
//                 const searchEl = this.element.shadowRoot.querySelector('input[name="search"]') as HTMLInputElement;
//                 if (searchEl) {
//                     searchEl.focus();
//                 }
//             }, 150);
//         }
//     }

//     public updateSize() {
//         this.pdfDocument.getPage(this.pdfViewer.currentPageNumber).then((page: PDFPageProxy) => {
//             const viewport = page.getViewport(this.zoom, this.rotation);
//             let scale = this.zoom;
//             let stickToPage = true;

//             // Scale the document when it shouldn't be in original size or doesn't fit into the viewport
//             if (!this.originalSize || (this.fitToPage && viewport.width > this.element.offsetWidth)) {
//                 if (this.fitToPage) {
//                     scale = this.getScaleWidth(page.getViewport(1).width);
//                 } else {
//                     scale = this.getScaleHeight(page.getViewport(1).height);
//                 }
//                 stickToPage = !this.stickToPage;
//             }

//             this.pdfViewer._setScale(scale, stickToPage);
//         });
//     }

//     private getValidPageNumber(page: number): number {
//         if (page < 1) {
//             return 1;
//         }
//         if (page > this.pdfDocument.numPages) {
//             return this.pdfDocument.numPages;
//         }
//         return page;
//     }

//     static getLinkTarget(type: string) {
//         switch (type) {
//             case 'blank':
//                 return PDFJS.LinkTarget.BLANK;
//             case 'none':
//                 return PDFJS.LinkTarget.NONE;
//             case 'self':
//                 return PDFJS.LinkTarget.SELF;
//             case 'parent':
//                 return PDFJS.LinkTarget.PARENT;
//             case 'top':
//                 return PDFJS.LinkTarget.TOP;
//         }
//         return null;
//     }

//     private setExternalLinkTarget(type: string) {
//         const linkTarget = PdfViewerComponent.getLinkTarget(type);
//         if (linkTarget !== null) {
//             this.pdfLinkService.externalLinkTarget = linkTarget;
//         }
//     }

//     private loadPDF() {
//         if (!this.src) {
//             return;
//         }
//         if (this.lastLoaded === this.src) {
//             this.update();
//             return;
//         }

//         let loadingTask: any = PDFJS.getDocument(this.src);
//         loadingTask.onProgress = (progressData: PDFProgressData) => {
//             this.onProgress.emit(progressData);
//         };

//         const src = this.src;
//         loadingTask.promise.then((pdf: PDFDocumentProxy) => {
//             this.pdfDocument = pdf;
//             this.totalPages = this.pdfDocument.numPages;
//             this.lastLoaded = src;
//             this.afterLoadComplete.emit(pdf);
//             this.update();
//         }, (error: any) => {
//             this.onError.emit(error);
//         });
//     }

//     private update() {
//         this.setupViewer();

//         if (this.pdfViewer) {
//             this.pdfViewer.setDocument(this.pdfDocument);
//         }

//         if (this.pdfThumbnailViewer) {
//             this.pdfThumbnailViewer.setDocument(this.pdfDocument);
//         }

//         if (this.pdfLinkService) {
//             this.pdfLinkService.setDocument(this.pdfDocument, null);
//         }

//         this.pdfRender();

//     }

//     private pdfRender() {
//         this.renderMultiplePages();
//     }

//     private renderMultiplePages() {
//         this.currentPage = this.getValidPageNumber(this.currentPage);

//         if (this.rotation !== 0 || this.pdfViewer.pagesRotation !== this.rotation) {
//             setTimeout(() => {
//                 this.pdfViewer.pagesRotation = this.rotation;
//             });
//         }

//         if (this.stickToPage) {
//             setTimeout(() => {
//                 this.pdfViewer.currentPageNumber = this.currentPage;
//             });
//         }

//         this.updateSize();
//     }

//     static removeAllChildNodes(element: HTMLElement) {
//         while (element.firstChild) {
//             element.removeChild(element.firstChild);
//         }
//     }

//     private getScaleWidth(viewportWidth: number) {
//         const offsetWidth = this.element.offsetWidth - 40;

//         if (offsetWidth === 0) {
//             return 1;
//         }

//         return this.zoom * (offsetWidth / viewportWidth) / PdfViewerComponent.CSS_UNITS;
//     }

//     private getScaleHeight(viewportHeight: number) {
//         const offsetHeight = this.element.offsetHeight - 40;

//         if (offsetHeight === 0) {
//             return 1;
//         }

//         return this.zoom * (offsetHeight / viewportHeight) / PdfViewerComponent.CSS_UNITS;
//     }

// }
