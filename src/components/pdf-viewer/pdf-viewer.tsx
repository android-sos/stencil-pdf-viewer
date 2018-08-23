import { Component, Prop, Element, Event, EventEmitter, Watch } from '@stencil/core';
import { PDFJSStatic, PDFViewerParams, PDFSource } from 'pdfjs-dist';
import PDFJS from 'pdfjs-dist/build/pdf';
import PDFJSViewer from 'pdfjs-dist/web/pdf_viewer';

import { getFilenameFromUrl, version, build, UNSUPPORTED_FEATURES } from 'pdfjs-dist/lib/pdf';
import { RendererType, getPDFFileNameFromURL, MAX_SCALE, MIN_SCALE, PresentationModeState, DEFAULT_SCALE_VALUE, isValidRotation } from 'pdfjs-dist/lib/web/ui_utils';
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
import PDFJSViewHistory from 'pdfjs-dist/lib/web/view_history';
import { HivePDFExternalServices } from './services/external-services';

declare global {
    const PDFJS: PDFJSStatic;
}

const DEFAULT_SCALE_DELTA = 1.1;
const FORCE_PAGES_LOADED_TIMEOUT = 10000; // ms

@Component({
    tag: 'hive-pdf-viewer',
    styleUrl: 'pdf-viewer.scss',
    shadow: true,
    assetsDir: 'vendor'
})
export class PdfViewerComponent {

    @Element() private element: HTMLElement;

    @Prop({mutable: true}) page = 1;

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
    @Prop() locale = 'en-US';
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

    @Prop() disableHistory = true;


    @Watch('url') urlChanged() {
        // this.open();
    }

    @Watch('page') pageChanged() {
        this.webViewerPageChanging({
            pageNumber: this.page
        });
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

    externalServices = new HivePDFExternalServices();

    printService: any;

    pagesCount = 0;

    initialRotation = 0;

    toolbar: any;
    secondaryToolbar;

    eventBus: any;
    l10n: any;
    downloadManager: any;

    initialBookmark = document.location.hash.substring(1);
    documentInfo: any;
    metadata: any;
    contentDispositionFilename: any;
    downloadComplete = false;
    initialized = false;
    isInitialViewSet = false;
    isViewerEmbedded = (window.parent !== window);
    fellback = false;
    store: any;

    preferences: any;
    appConfig: any;

    render() {
        return (
            <div>
                <div id="outerContainer">
                    <hive-pdf-sidebar />
                    <div id="mainContainer">
                        <hive-pdf-findbar />
                        <hive-pdf-secondary-toolbar />
                        <hive-pdf-toolbar />
                        <div id="viewerContainer">
                            <div id="viewer" class="pdfViewer"></div>
                        </div>
                        <hive-pdf-error-wrapper />
                    </div>
                    <div id="overlayContainer" class="hidden">
                        <hive-pdf-password-dialog />
                        <hive-pdf-document-properties-dialog />
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
        let file;

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
                if (this.eventBus) {
                    this.eventBus.dispatch('resize', {
                        source: this
                    });
                }
            }
        }, true);

        this.appConfig.sidebar.toggleButton.addEventListener('click', () => {
            console.log('pdfSidebar toggle emitted');
            this.pdfSidebar.toggle();
        });

        Promise.resolve().then(() => {
            this.webViewerOpenFileViaURL(file);
        }).catch(reason => {
            console.log('An error occured while loading the PDF', reason);
        });

    }

    webViewerOpenFileViaURL(file) {
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
            // console.debug('Initialized eventBus', eventBus);

            let pdfRenderingQueue = new PDFJSRenderingQueue.PDFRenderingQueue();
            pdfRenderingQueue.OnIdle = this.cleanup.bind(this);
            this.pdfRenderingQueue = pdfRenderingQueue;
            // console.debug('Initialized pdfRenderingQueue', pdfRenderingQueue);

            let pdfLinkService = new PDFJSPDFLinkService.PDFLinkService({
                eventBus: this.eventBus,
                externalLinkTarget: this.externalLinkTarget,
                externaLinkRel: this.externalLinkRel
            });
            this.pdfLinkService = pdfLinkService;
            // console.debug('Initialized pdfLinkService', pdfLinkService);

            let downloadManager = this.externalServices.createDownloadManager({
                disableCreateObjectURL: this.disableCreateObjectURL
            });
            this.downloadManager = downloadManager;
            // console.debug('Initialized downloadManager', downloadManager);

            let container = appConfig.mainContainer;
            let viewer = appConfig.viewerContainer;

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
            // console.debug('Initialized pdfViewer', this.pdfViewer);

            pdfRenderingQueue.setViewer(this.pdfViewer);
            pdfLinkService.setViewer(this.pdfViewer);

            let thumbnailContainer = appConfig.sidebar.thumbnailView;
            this.pdfThumbnailViewer = new PDFJSThumbnailViewer.PDFThumbnailViewer({
                container: thumbnailContainer,
                renderingQueue: pdfRenderingQueue,
                linkService: this.pdfLinkService,
                l10n: this.l10n
            });
            // console.debug('Initialized pdfThumbnailViewer', this.pdfThumbnailViewer);
            pdfRenderingQueue.setThumbnailViewer(this.pdfThumbnailViewer);

            this.pdfHistory = new PDFJSHistory.PDFHistory({
                linkService: pdfLinkService,
                eventBus
            });
            // console.debug('Initialied pdfHistory', this.pdfHistory);

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
            // console.debug('Initialized findController', this.findController);

            let findBarConfig = Object.create(appConfig.findBar);
            findBarConfig.toggleButton = appConfig.sidebar.toggleButton;
            findBarConfig.findController = this.findController;
            findBarConfig.eventBus = this.eventBus;
            this.findBar = new PDFJSFindBar.PDFFindBar(findBarConfig, this.l10n);

            this.pdfDocumentProperties = new PDFJSDocumentProperties.PDFDocumentProperties(
                appConfig.documentProperties,
                this.overlayManager,
                eventBus,
                this.l10n
            );

            // console.debug('Initialized pdfDocumentProperties', this.pdfDocumentProperties);

            this.pdfCursorTools = new PDFJSCursorToosl.PDFCursorTools({
                container,
                eventBus,
                cursorToolOnLoad: this.cursorToolOnLoad
            });

            // console.debug('Initialized pdfCursorTools', this.pdfCursorTools);

            this.toolbar = new PDFJSToolbar.Toolbar(appConfig.toolbar, container, eventBus, this.l10n);
            // console.debug('Initialized toolbar', this.toolbar);

            this.secondaryToolbar = new PDFJSSecondaryToolbar.SecondaryToolbar(appConfig.secondaryToolbar, container, eventBus);
            // console.debug('Initialized secondaryToolbar', this.secondaryToolbar);

            if (this.supportsFullscreen) {
                this.pdfPresentationMode = new PDFJSPDFPresentationMode.PDFPresentationMode({
                    container,
                    viewer,
                    pdfViewer: this.pdfViewer,
                    eventBus,
                    contextMenuitems: appConfig.fullscreen
                });
                // console.debug('Initialized pdfPresentationMode', this.pdfPresentationMode);
            }

            this.passwordPrompt = new PDFJSPasswordPrompt.PasswordPrompt(appConfig.passwordOverlay,
                this.overlayManager, this.l10n);
            // console.debug('Initialized passwordPrompt', this.passwordPrompt);

            this.pdfOutlineViewer = new PDFJSOutlineViewer.PDFOutlineViewer({
                container: appConfig.sidebar.outlineView,
                linkService: this.pdfLinkService,
                eventBus: this.eventBus
            });
            // console.debug('Initialized pdfOutlineViewer', this.pdfOutlineViewer);

            this.pdfAttachmentViewer = new PDFJSAttachmentViewer.PDFAttachmentViewer({
                container: appConfig.sidebar.attachmentsView,
                eventBus: this.eventBus,
                downloadManager: downloadManager
            });
            // console.debug('Initialized pdfAttachmentViewer', this.pdfAttachmentViewer);

            let sidebarConfig = Object.create(appConfig.sidebar);
            sidebarConfig.pdfViewer = this.pdfViewer;
            sidebarConfig.pdfThumbnailViewer = this.pdfThumbnailViewer;
            sidebarConfig.pdfOutlineViewer = this.pdfOutlineViewer;
            sidebarConfig.eventBus = eventBus;
            this.pdfSidebar = new PDFJSSidebar.PDFSidebar(sidebarConfig, this.l10n);
            this.pdfSidebar.onToggled = this.forceRendering.bind(this);
            // console.debug('Initialized pdfSidebar', this.pdfSidebar);

            this.pdfSidebarResizer = new PDFJSSidebarResizer.PDFSidebarResizer(appConfig.sidebarResizer,
                eventBus, this.l10n);
            // console.debug('Initialized pdfSidebarResizer', this.pdfSidebarResizer);
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

    setInitialView(storedHash, { rotation = null, sidebarView = null, scrollMode = null, spreadMode = null, } = {}) {
        let setRotation = (angle) => {
            if (isValidRotation(angle)) {
                this.pdfViewer.pagesRotation = angle;
            }
        };
        let setViewerModes = (scroll, spread) => {
            if (Number.isInteger(scroll)) {
                this.pdfViewer.scrollMode = scroll;
            }
            if (Number.isInteger(spread)) {
                this.pdfViewer.spreadMode = spread;
            }
        };

        // Putting these before isInitialViewSet = true prevents these values from
        // being stored in the document history (and overriding any future changes
        // made to the corresponding global preferences), just this once.
        setViewerModes(scrollMode, spreadMode);

        this.isInitialViewSet = true;
        this.pdfSidebar.setInitialView(sidebarView);

        if (this.initialBookmark) {
            setRotation(this.initialRotation);
            delete this.initialRotation;

            this.pdfLinkService.setHash(this.initialBookmark);
            this.initialBookmark = null;
        } else if (storedHash) {
            setRotation(rotation);

            this.pdfLinkService.setHash(storedHash);
        }

        // Ensure that the correct page number is displayed in the UI,
        // even if the active page didn't change during document load.
        this.toolbar.setPageNumber(this.pdfViewer.currentPageNumber,
            this.pdfViewer.currentPageLabel);
        this.secondaryToolbar.setPageNumber(this.pdfViewer.currentPageNumber);

        if (!this.pdfViewer.currentScaleValue) {
            // Scale was not initialized: invalid bookmark or scale was not specified.
            // Setting the default one.
            this.pdfViewer.currentScaleValue = DEFAULT_SCALE_VALUE;
        }
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
            eventBus
        } = this;
        eventBus.on('resize', () => this.webViewerResize());
        eventBus.on('hashchange', evt => this.webViewerHashchange(evt));
        // this.eventBus.on('beforeprint', _boundEvents.beforePrint);
        // this.eventBus.on('afterprint', _boundEvents.afterPrint);
        eventBus.on('pagerendered', evt => this.webViewerPageRendered(evt));
        eventBus.on('textlayerrendered', evt => this.webViewerTextLayerRendered(evt));
        eventBus.on('updateviewarea', evt => this.webViewerUpdateViewarea(evt));
        eventBus.on('pagechanging', evt => this.webViewerPageChanging(evt));
        eventBus.on('scalechanging', evt => this.webViewerScaleChanging(evt));
        eventBus.on('rotationchanging', evt => this.webViewerRotationChanging(evt));
        eventBus.on('sidebarviewchanged', evt => this.webViewerSidebarViewChanged(evt));
        eventBus.on('pagemode', evt => this.webViewerPageMode(evt));
        eventBus.on('namedaction', evt => this.webViewerNamedAction(evt));
        eventBus.on('presentationmodechanged', evt => this.webViewerPresentationModeChanged(evt));
        eventBus.on('presentationmode', () => this.webViewerPresentationMode());
        // this.eventBus.on('openfile', webViewerOpenFile);
        // this.eventBus.on('print', webViewerPrint);
        // this.eventBus.on('download', webViewerDownload);
        eventBus.on('firstpage', () => this.webViewerFirstPage());
        eventBus.on('lastpage', () => this.webViewerLastPage());
        eventBus.on('nextpage', () => this.webViewerNextPage());
        eventBus.on('previouspage', () => this.webViewerPreviousPage());
        eventBus.on('zoomin', () => this.webViewerZoomIn());
        eventBus.on('zoomout', () => this.webViewerZoomOut());
        eventBus.on('pagenumberchanged', evt => this.webViewerPageNumberChanged(evt));
        eventBus.on('scalechanged', evt => this.webViewerScaleChanged(evt));
        eventBus.on('rotatecw', () => this.webViewerRotateCw());
        eventBus.on('rotateccw', () => this.webViewerRotateCcw());
        eventBus.on('switchscrollmode', evt => this.webViewerSwitchScrollMode(evt));
        // eventBus.on('scrollmodechanged', evt => this.webViewerScrollModeChanged(evt));
        eventBus.on('switchspreadmode', evt => this.webViewerSwitchSpreadMode(evt));
        // eventBus.on('spreadmodechanged', evt => this.webViewerSpreadModeChanged(evt));
        this.eventBus.on('documentproperties', () => this.webViewerDocumentProperties());
        this.eventBus.on('find', evt => this.webViewerFind(evt));
        this.eventBus.on('findfromurlhash', evt => this.webViewerFindFromUrlHash(evt));
        // if (typeof PDFJSDev === 'undefined' || PDFJSDev.test('GENERIC')) {
            this.eventBus.on('fileinputchange', () => {
                console.log('webViewerFileInputChange');
            });
        // }
    }

    unbindEvents() {
        const { eventBus } = this;
        eventBus.off('resize', () => this.webViewerResize());
        eventBus.off('hashchange', evt => this.webViewerHashchange(evt));
        // eventBus.off('beforeprint', _boundEvents.beforePrint);
        // eventBus.off('afterprint', _boundEvents.afterPrint);
        eventBus.off('pagerendered', () => this.webViewerPageRendered());
        eventBus.off('textlayerrendered', evt => this.webViewerTextLayerRendered(evt));
        eventBus.off('updateviewarea', evt => this.webViewerUpdateViewarea(evt));
        eventBus.off('pagechanging', evt => this.webViewerPageChanging(evt));
        eventBus.off('scalechanging', evt => this.webViewerScaleChanging(evt));
        eventBus.off('rotationchanging', evt => this.webViewerRotationChanging(evt));
        eventBus.off('sidebarviewchanged', evt => this.webViewerSidebarViewChanged(evt));
        eventBus.off('pagemode', evt => this.webViewerPageMode(evt));
        eventBus.off('namedaction', evt => this.webViewerNamedAction(evt));
        eventBus.off('presentationmodechanged', evt => this.webViewerPresentationModeChanged(evt));
        eventBus.off('presentationmode', () => this.webViewerPresentationMode());
        // eventBus.off('openfile', webViewerOpenFile);
        // eventBus.off('print', webViewerPrint);
        // eventBus.off('download', webViewerDownload);
        eventBus.off('firstpage', () => this.webViewerFirstPage());
        eventBus.off('lastpage', () => this.webViewerLastPage());
        eventBus.off('nextpage', () => this.webViewerNextPage());
        eventBus.off('previouspage', () => this.webViewerPreviousPage());
        eventBus.off('zoomin', () => this.webViewerZoomIn());
        eventBus.off('zoomout', () => this.webViewerZoomOut());
        eventBus.off('pagenumberchanged', evt => this.webViewerPageNumberChanged(evt));
        eventBus.off('scalechanged', evt => this.webViewerScaleChanged(evt));
        eventBus.off('rotatecw', () => this.webViewerRotateCw());
        eventBus.off('rotateccw', () => this.webViewerRotateCcw());
        eventBus.off('switchscrollmode', evt => this.webViewerSwitchScrollMode(evt));
        // eventBus.off('scrollmodechanged', webViewerScrollModeChanged);
        eventBus.off('switchspreadmode', evt => this.webViewerSwitchSpreadMode(evt));
        // eventBus.off('spreadmodechanged', webViewerSpreadModeChanged);
        eventBus.off('documentproperties', () => this.webViewerDocumentProperties());
        eventBus.off('find', evt => this.webViewerFind(evt));
        eventBus.off('findfromurlhash', evt => this.webViewerFindFromUrlHash(evt));
        // if (typeof PDFJSDev === 'undefined' || PDFJSDev.test('GENERIC')) {
        //     eventBus.off('fileinputchange', webViewerFileInputChange);
        // }
    }

    webViewerResize() {
        let { pdfDocument, pdfViewer } = this;
        if (!pdfDocument) {
            return;
        }
        let currentScaleValue = pdfViewer.currentScaleValue;
        if (currentScaleValue === 'auto' ||
            currentScaleValue === 'page-fit' ||
            currentScaleValue === 'page-width') {
            // Note: the scale is constant for 'page-actual'.
            pdfViewer.currentScaleValue = currentScaleValue;
        }
        pdfViewer.update();
    }

    webViewerHashchange(evt) {
        let hash = evt.hash;
        if (!hash) {
            return;
        }
        if (!this.isInitialViewSet) {
            this.initialBookmark = hash;
        } else if (!this.pdfHistory.popStateInProgress) {
            this.pdfLinkService.setHash(hash);
        }
    }

    webViewerNamedAction(evt) {
        // Processing couple of named actions that might be useful.
        // See also PDFLinkService.executeNamedAction
        let action = evt.action;
        switch (action) {
            case 'GoToPage':
                this.appConfig.toolbar.pageNumber.select();
                break;

            case 'Find':
                if (!this.supportsIntegratedFind) {
                    this.findBar.toggle();
                }
                break;
        }
    }

    webViewerPresentationModeChanged(evt) {
        let { active, switchInProgress, } = evt;
        this.pdfViewer.presentationModeState =
            switchInProgress ? PresentationModeState.CHANGING :
                active ? PresentationModeState.FULLSCREEN : PresentationModeState.NORMAL;
    }

    webViewerPresentationMode() {
        this.requestPresentationMode();
    }

    webViewerFirstPage() {
        if (this.pdfDocument) {
            this.page = 1;
        }
    }

    webViewerLastPage() {
        if (this.pdfDocument) {
            this.page = this.pagesCount;
        }
    }

    webViewerNextPage() {
        this.page++;
    }

    webViewerPreviousPage() {
        this.page--;
    }

    webViewerSidebarViewChanged(evt) {
        this.pdfRenderingQueue.isThumbnailViewEnabled =
            this.pdfSidebar.isThumbnailViewVisible;

        let store = this.store;
        if (store && this.isInitialViewSet) {
            // Only update the storage when the document has been loaded *and* rendered.
            store.set('sidebarView', evt.view).catch(function () { });
        }
    }

    webViewerPageMode(evt) {
        // Handle the 'pagemode' hash parameter, see also `PDFLinkService_setHash`.
        let mode = evt.mode, view;
        switch (mode) {
            case 'thumbs':
                view = PDFJSSidebar.SidebarView.THUMBS;
                break;
            case 'bookmarks':
            case 'outline':
                view = PDFJSSidebar.SidebarView.OUTLINE;
                break;
            case 'attachments':
                view = PDFJSSidebar.SidebarView.ATTACHMENTS;
                break;
            case 'none':
                view = PDFJSSidebar.SidebarView.NONE;
                break;
            default:
                console.error('Invalid "pagemode" hash parameter: ' + mode);
                return;
        }
        this.pdfSidebar.switchView(view, /* forceOpen = */ true);
    }

    webViewerUpdateViewarea(evt) {
        let location = evt.location, store = this.store;

        if (store && this.isInitialViewSet) {
            store.setMultiple({
                'page': location.pageNumber,
                'zoom': location.scale,
                'scrollLeft': location.left,
                'scrollTop': location.top,
                'rotation': location.rotation,
            }).catch(function () { /* unable to write to storage */ });
        }
        let href =
            this.pdfLinkService.getAnchorUrl(location.pdfOpenParams);
        this.appConfig.toolbar.viewBookmark.href = href;
        this.appConfig.secondaryToolbar.viewBookmarkButton.href =
            href;

        // Show/hide the loading indicator in the page number input element.
        let currentPage =
            this.pdfViewer.getPageView(this.page - 1);
        let loading = currentPage.renderingState !== PDFJSRenderingQueue.RenderingStates.FINISHED;
        this.toolbar.updateLoadingIndicatorState(loading);
    }

    webViewerTextLayerRendered(evt) {
        if (evt.numTextDivs > 0 && !this.supportsDocumentColors) {
            console.error('PDF documents are not allowed to use their own colors: Allow pages to choose their own colors is deactivated in the browser');
            this.fallback();
        }
    }

    webViewerScaleChanging(evt) {
        this.toolbar.setPageScale(evt.presetValue, evt.scale);
        this.pdfViewer.update();
    }

    webViewerScaleChanged(evt) {
        this.pdfViewer.currentScaleValue = evt.value;
    }

    webViewerRotateCw() {
        this.rotatePages(90);
    }

    webViewerRotateCcw() {
        this.rotatePages(-90);
    }

    webViewerSwitchScrollMode(evt) {
        this.pdfViewer.scrollMode = evt.mode;
    }

    webViewerSwitchSpreadMode(evt) {
        this.pdfViewer.spreadMode = evt.mode;
    }

    webViewerRotationChanging(evt) {
        this.pdfThumbnailViewer.pagesRotation = evt.pagesRotation;

        this.forceRendering();
        // Ensure that the active page doesn't change during rotation.
        this.pdfViewer.currentPageNumber = evt.pageNumber;
    }

    webViewerPageChanging(evt) {
        let page = evt.pageNumber;

        this.toolbar.setPageNumber(page, evt.pageLabel || null);
        this.secondaryToolbar.setPageNumber(page);

        if (this.pdfSidebar.isThumbnailViewVisible) {
            this.pdfThumbnailViewer.scrollThumbnailIntoView(page);
        }

        // We need to update stats.
        // if (typeof Stats !== 'undefined' && Stats.enabled) {
        //     let pageView = this.pdfViewer.getPageView(page - 1);
        //     if (pageView && pageView.stats) {
        //         Stats.add(page, pageView.stats);
        //     }
        // }
    }

    webViewerPageNumberChanged(evt) {
        let pdfViewer = this.pdfViewer;
        pdfViewer.currentPageLabel = evt.value;

        // Ensure that the page number input displays the correct value, even if the
        // value entered by the user was invalid (e.g. a floating point number).
        if (evt.value !== pdfViewer.currentPageNumber.toString() &&
            evt.value !== pdfViewer.currentPageLabel) {
            this.toolbar.setPageNumber(
                pdfViewer.currentPageNumber, pdfViewer.currentPageLabel);
        }
    }

    webViewerPageRendered(evt?: any) {
        let pageNumber = evt.pageNumber;
        let pageIndex = pageNumber - 1;
        let pageView = this.pdfViewer.getPageView(pageIndex);

        // If the page is still visible when it has finished rendering,
        // ensure that the page number input loading indicator is hidden.
        if (pageNumber === this.page) {
            this.toolbar.updateLoadingIndicatorState(false);
        }

        // Prevent errors in the edge-case where the PDF document is removed *before*
        // the 'pagerendered' event handler is invoked.
        if (!pageView) {
            return;
        }

        // Use the rendered page to set the corresponding thumbnail image.
        if (this.pdfSidebar.isThumbnailViewVisible) {
            let thumbnailView = this.pdfThumbnailViewer.
                getThumbnail(pageIndex);
            thumbnailView.setImage(pageView);
        }

        // if (typeof Stats !== 'undefined' && Stats.enabled && pageView.stats) {
        //     Stats.add(pageNumber, pageView.stats);
        // }

        if (pageView.error) {
            this.l10n.get('rendering_error', null,
                'An error occurred while rendering the page.').then((msg) => {
                    this.error(msg, pageView.error);
                });
        }

        // if (typeof PDFJSDev !== 'undefined' &&
        //     PDFJSDev.test('FIREFOX || MOZCENTRAL')) {
        //     this.externalServices.reportTelemetry({
        //         type: 'pageInfo',
        //     });
        //     // It is a good time to report stream and font types.
        //     this.pdfDocument.getStats().then(function (stats) {
        //         this.externalServices.reportTelemetry({
        //             type: 'documentStats',
        //             stats,
        //         });
        //     });
        // }
    }

    webViewerZoomIn() {
        this.zoomIn();
    }

    webViewerZoomOut() {
        this.zoomOut();
    }

    webViewerFind(evt) {
        this.findController.executeCommand('find' + evt.type, {
            query: evt.query,
            phraseSearch: evt.phraseSearch,
            caseSensitive: evt.caseSensitive,
            highlightAll: evt.highlightAll,
            findPrevious: evt.findPrevious,
        });
    }

    webViewerFindFromUrlHash(evt) {
        this.findController.executeCommand('find', {
            query: evt.query,
            phraseSearch: evt.phraseSearch,
            caseSensitive: false,
            highlightAll: true,
            findPrevious: false,
        });
    }


    webViewerDocumentProperties() {
        this.pdfDocumentProperties.open();
    }

    rotatePages(delta) {
        if (!this.pdfDocument) {
            return;
        }
        let newRotation = (this.pdfViewer.pagesRotation + 360 + delta) % 360;
        this.pdfViewer.pagesRotation = newRotation;
        // Note that the thumbnail viewer is updated, and rendering is triggered,
        // in the 'rotationchanging' event handler.
    }

    zoomIn(ticks?: any) {
        let newScale = this.pdfViewer.currentScale;
        do {
            newScale = (newScale * DEFAULT_SCALE_DELTA).toFixed(2);
            newScale = Math.ceil(newScale * 10) / 10;
            newScale = Math.min(MAX_SCALE, newScale);
        } while (--ticks > 0 && newScale < MAX_SCALE);
        this.pdfViewer.currentScaleValue = newScale;
    }

    zoomOut(ticks?: any) {
        let newScale = this.pdfViewer.currentScale;
        do {
            newScale = (newScale / DEFAULT_SCALE_DELTA).toFixed(2);
            newScale = Math.floor(newScale * 10) / 10;
            newScale = Math.max(MIN_SCALE, newScale);
        } while (--ticks > 0 && newScale > MIN_SCALE);
        this.pdfViewer.currentScaleValue = newScale;
    }

    requestPresentationMode() {
        if (!this.pdfPresentationMode) {
            return;
        }
        this.pdfPresentationMode.request();
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
        const element = this.element.shadowRoot;

        const sidebar = element.querySelector('hive-pdf-sidebar');
        const toolbar = element.querySelector('hive-pdf-toolbar');
        const findbar = element.querySelector('hive-pdf-findbar');
        const secondaryToolbar = element.querySelector('hive-pdf-secondary-toolbar');

        const errorWrapper = element.querySelector('hive-pdf-error-wrapper');

        // dialogs
        const passwordDialog = element.querySelector('hive-pdf-password-dialog');
        const documentPropertiesDialog = element.querySelector('hive-pdf-document-properties-dialog');

        return {
            eventBus: this.eventBus,
            linkService: this.pdfLinkService,
            enableWebGL: this.enableWebGL,
            appContainer: document.body,
            mainContainer: element.querySelector('#viewerContainer'),
            viewerContainer: element.querySelector('#viewer'),
            toolbar: {
                container: toolbar,
                numPages: toolbar.shadowRoot.querySelector('#numPages'),
                pageNumber: toolbar.shadowRoot.querySelector('#pageNumber'),
                scaleSelectContainer: toolbar.shadowRoot.querySelector('#scaleSelectContainer'),
                scaleSelect: toolbar.shadowRoot.querySelector('#scaleSelect'),
                customScaleOption: toolbar.shadowRoot.querySelector('#customScaleOption'),
                previous: toolbar.shadowRoot.querySelector('#previous'),
                next: toolbar.shadowRoot.querySelector('#next'),
                zoomIn: toolbar.shadowRoot.querySelector('#zoomIn'),
                zoomOut: toolbar.shadowRoot.querySelector('#zoomOut'),
                viewFind: toolbar.shadowRoot.querySelector('#viewFind'),
                openFile: toolbar.shadowRoot.querySelector('#openFile'),
                print: toolbar.shadowRoot.querySelector('#print'),
                presentationModeButton: toolbar.shadowRoot.querySelector('#presentationMode'),
                download: toolbar.shadowRoot.querySelector('#download'),
                viewBookmark: toolbar.shadowRoot.querySelector('#viewBookmark'),
            },
            secondaryToolbar: {
                toolbar: secondaryToolbar.shadowRoot.querySelector('#secondaryToolbar'),
                toggleButton: toolbar.shadowRoot.querySelector('#secondaryToolbarToggle'),
                toolbarButtonContainer: secondaryToolbar.shadowRoot.querySelector('#secondaryToolbarButtonContainer'),
                presentationModeButton: secondaryToolbar.shadowRoot.querySelector('#secondaryPresentationMode'),
                openFileButton: secondaryToolbar.shadowRoot.querySelector('#secondaryOpenFile'),
                printButton: secondaryToolbar.shadowRoot.querySelector('#secondaryPrint'),
                downloadButton: secondaryToolbar.shadowRoot.querySelector('#secondaryDownload'),
                viewBookmarkButton: secondaryToolbar.shadowRoot.querySelector('#secondaryViewBookmark'),
                firstPageButton: secondaryToolbar.shadowRoot.querySelector('#firstPage'),
                lastPageButton: secondaryToolbar.shadowRoot.querySelector('#lastPage'),
                pageRotateCwButton: secondaryToolbar.shadowRoot.querySelector('#pageRotateCw'),
                pageRotateCcwButton: secondaryToolbar.shadowRoot.querySelector('#pageRotateCcw'),
                cursorSelectToolButton: secondaryToolbar.shadowRoot.querySelector('#cursorSelectTool'),
                cursorHandToolButton: secondaryToolbar.shadowRoot.querySelector('#cursorHandTool'),
                scrollVerticalButton: secondaryToolbar.shadowRoot.querySelector('#scrollVertical'),
                scrollHorizontalButton: secondaryToolbar.shadowRoot.querySelector('#scrollHorizontal'),
                scrollWrappedButton: secondaryToolbar.shadowRoot.querySelector('#scrollWrapped'),
                spreadNoneButton: secondaryToolbar.shadowRoot.querySelector('#spreadNone'),
                spreadOddButton: secondaryToolbar.shadowRoot.querySelector('#spreadOdd'),
                spreadEvenButton: secondaryToolbar.shadowRoot.querySelector('#spreadEven'),
                documentPropertiesButton: secondaryToolbar.shadowRoot.querySelector('#documentProperties'),
            },
            fullscreen: {
                contextFirstPage: element.querySelector('#contextFirstPage'),
                contextLastPage: element.querySelector('#contextLastPage'),
                contextPageRotateCw: element.querySelector('#contextPageRotateCw'),
                contextPageRotateCcw: element.querySelector('#contextPageRotateCcw'),
            },
            sidebar: {
                // Divs (and sidebar button)
                outerContainer: element.querySelector('#outerContainer'),
                viewerContainer: element.querySelector('#viewerContainer'),
                toggleButton: toolbar.shadowRoot.querySelector('#sidebarToggle'),
                // Buttons
                thumbnailButton: sidebar.shadowRoot.querySelector('#viewThumbnail'),
                outlineButton: sidebar.shadowRoot.querySelector('#viewOutline'),
                attachmentsButton: sidebar.shadowRoot.querySelector('#viewAttachments'),
                // Views
                thumbnailView: sidebar.shadowRoot.querySelector('#thumbnailView'),
                outlineView: sidebar.shadowRoot.querySelector('#outlineView'),
                attachmentsView: sidebar.shadowRoot.querySelector('#attachmentsView'),
            },
            sidebarResizer: {
                outerContainer: element.querySelector('#outerContainer'),
                resizer: sidebar.shadowRoot.querySelector('#sidebarResizer'),
            },
            findBar: {
                bar: findbar.shadowRoot.querySelector('#findbar'),
                toggleButton: toolbar.shadowRoot.querySelector('#viewFind'),
                findField: findbar.shadowRoot.querySelector('#findInput'),
                highlightAllCheckbox: findbar.shadowRoot.querySelector('#findHighlightAll'),
                caseSensitiveCheckbox: findbar.shadowRoot.querySelector('#findMatchCase'),
                findMsg: findbar.shadowRoot.querySelector('#findMsg'),
                findResultsCount: findbar.shadowRoot.querySelector('#findResultsCount'),
                findStatusIcon: findbar.shadowRoot.querySelector('#findStatusIcon'),
                findPreviousButton: findbar.shadowRoot.querySelector('#findPrevious'),
                findNextButton: findbar.shadowRoot.querySelector('#findNext'),
            },
            passwordOverlay: {
                overlayName: 'passwordOverlay',
                container: passwordDialog.shadowRoot.querySelector('#passwordOverlay'),
                label: passwordDialog.shadowRoot.querySelector('#passwordText'),
                input: passwordDialog.shadowRoot.querySelector('#password'),
                submitButton: passwordDialog.shadowRoot.querySelector('#passwordSubmit'),
                cancelButton: passwordDialog.shadowRoot.querySelector('#passwordCancel'),
            },
            documentProperties: {
                overlayName: 'documentPropertiesOverlay',
                container: documentPropertiesDialog.shadowRoot.querySelector('#documentPropertiesOverlay'),
                closeButton: element.querySelector('#documentPropertiesClose'),
                fields: {
                    'fileName': documentPropertiesDialog.shadowRoot.querySelector('#fileNameField'),
                    'fileSize': documentPropertiesDialog.shadowRoot.querySelector('#fileSizeField'),
                    'title': documentPropertiesDialog.shadowRoot.querySelector('#titleField'),
                    'author': documentPropertiesDialog.shadowRoot.querySelector('#authorField'),
                    'subject': documentPropertiesDialog.shadowRoot.querySelector('#subjectField'),
                    'keywords': documentPropertiesDialog.shadowRoot.querySelector('#keywordsField'),
                    'creationDate': documentPropertiesDialog.shadowRoot.querySelector('#creationDateField'),
                    'modificationDate': documentPropertiesDialog.shadowRoot.querySelector('#modificationDateField'),
                    'creator': documentPropertiesDialog.shadowRoot.querySelector('#creatorField'),
                    'producer': documentPropertiesDialog.shadowRoot.querySelector('#producerField'),
                    'version': documentPropertiesDialog.shadowRoot.querySelector('#versionField'),
                    'pageCount': documentPropertiesDialog.shadowRoot.querySelector('#pageCountField'),
                    'pageSize': documentPropertiesDialog.shadowRoot.querySelector('#pageSizeField'),
                    'linearized': documentPropertiesDialog.shadowRoot.querySelector('#linearizedField'),
                },
            },
            errorWrapper: {
                container: errorWrapper.shadowRoot.querySelector('#errorWrapper'),
                errorMessage: errorWrapper.shadowRoot.querySelector('#errorMessage'),
                closeButton: errorWrapper.shadowRoot.querySelector('#errorClose'),
                errorMoreInfo: errorWrapper.shadowRoot.querySelector('#errorMoreInfo'),
                moreInfoButton: errorWrapper.shadowRoot.querySelector('#errorShowMore'),
                lessInfoButton: errorWrapper.shadowRoot.querySelector('#errorShowLess'),
            },
            printContainer: element.querySelector('#printContainer'),
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
        let pageModePromise = pdfDocument.getPageMode().catch(() => {
            /* Avoid breaking initial rendering; ignoring errors. */
        });

        this.toolbar.setPagesCount(pdfDocument.numPages, false);
        this.secondaryToolbar.setPagesCount(pdfDocument.numPages);

        const store = this.store = new PDFJSViewHistory.ViewHistory(pdfDocument.fingerprint);

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
            console.log('pdfPage', pdfPage);
            // this.loadingBar.setWidth(this.appConfig.viewerContainer);
            if(!this.disableHistory && !this.isViewerEmbedded) {
                // The browsing history is only enabled when the viewer is standalone,
                // i.e. not when it is embedded in a web page.
                let resetHistory = !this.showPreviousViewOnLoad;
                this.pdfHistory.initialize(pdfDocument.fingerprint, resetHistory);

                if (this.pdfHistory.initialBookmark) {
                    this.initialBookmark = this.pdfHistory.initialBookmark;
                    this.initialRotation = this.pdfHistory.initialRotation;
                }
            }
            let initialParams = {
                bookmark: null,
                hash: null,
            };
            let storePromise = store.getMultiple({
                page: null,
                zoom: DEFAULT_SCALE_VALUE,
                scrollLeft: '0',
                scrollTop: '0',
                rotation: null,
                sidebarView: PDFJSSidebar.SidebarView.NONE,
                scrollMode: null,
                spreadMode: null,
            }).catch(() => { /* Unable to read from storage; ignoring errors. */ });

            Promise.all([storePromise, pageModePromise]).then(
                ([values = {}, pageMode]) => {
                    // Initialize the default values, from user preferences.
                    const zoom = this.defaultZoomValue;
                    let hash = zoom ? `zoom=${zoom}` : null;

                    let rotation = null;
                    let sidebarView = this.sidebarViewOnLoad;
                    let scrollMode = this.scrollModeOnLoad;
                    let spreadMode = this.spreadModeOnLoad;

                    if (values.page && this.showPreviousViewOnLoad) {
                        hash = 'page=' + values.page + '&zoom=' + (zoom || values.zoom) +
                            ',' + values.scrollLeft + ',' + values.scrollTop;

                        rotation = parseInt(values.rotation, 10);
                        sidebarView = sidebarView || (values.sidebarView as any | 0);
                        scrollMode = scrollMode || (values.scrollMode | 0);
                        spreadMode = spreadMode || (values.spreadMode as any | 0);
                    }
                    if (pageMode && !this.disablePageMode) {
                        // Always let the user preference/history take precedence.
                        sidebarView = sidebarView || this.apiPageModeToSidebarView(pageMode);
                    }
                    return {
                        hash,
                        rotation,
                        sidebarView,
                        scrollMode,
                        spreadMode,
                    };
                }).then(({ hash, rotation, sidebarView, scrollMode, spreadMode, }) => {
                    initialParams.bookmark = this.initialBookmark;
                    initialParams.hash = hash;

                    this.setInitialView(hash, {
                        rotation, sidebarView, scrollMode, spreadMode,
                    });

                    // Make all navigation keys work on document load,
                    // unless the viewer is embedded in a web page.
                    if (!this.isViewerEmbedded) {
                        pdfViewer.focus();
                    }

                    return Promise.race([
                        pagesPromise,
                        new Promise((resolve) => {
                            setTimeout(resolve, FORCE_PAGES_LOADED_TIMEOUT);
                        }),
                    ]);
                }).then(() => {
                    // For documents with different page sizes, once all pages are resolved,
                    // ensure that the correct location becomes visible on load.
                    // To reduce the risk, in very large and/or slow loading documents,
                    // that the location changes *after* the user has started interacting
                    // with the viewer, wait for either `pagesPromise` or a timeout above.

                    if (!initialParams.bookmark && !initialParams.hash) {
                        return;
                    }
                    if (pdfViewer.hasEqualPageSizes) {
                        return;
                    }
                    this.initialBookmark = initialParams.bookmark;

                    // eslint-disable-next-line no-self-assign
                    pdfViewer.currentScaleValue = pdfViewer.currentScaleValue;
                    this.setInitialView(initialParams.hash);
                }).then(function () {
                    // At this point, rendering of the initial page(s) should always have
                    // started (and may even have completed).
                    // To prevent any future issues, e.g. the document being completely
                    // blank on load, always trigger rendering here.
                    pdfViewer.update();
                });
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
                    this.fallback(UNSUPPORTED_FEATURES.forms);
                }
            }
        );

    }

    /**
     * Converts API PageMode values to the format used by`PDFSidebar`.
     * NOTE: There's also a "FullScreen" parameter which is not possible to support,
     * since the Fullscreen API used in browsers requires that entering
     * fullscreen mode only occurs as a result of a user - initiated event.
     * @param { string } mode - The API PageMode value.
     * @returns { number } A value from { SidebarView }.
    **/
    apiPageModeToSidebarView(mode) {
        switch (mode) {
            case 'UseNone':
                return PDFJSSidebar.SidebarView.NONE;
            case 'UseThumbs':
                return PDFJSSidebar.SidebarView.THUMBS;
            case 'UseOutlines':
                return PDFJSSidebar.SidebarView.OUTLINE;
            case 'UseAttachments':
                return PDFJSSidebar.SidebarView.ATTACHMENTS;
            case 'UseOC':
            // Not implemented, since we don't support Optional Content Groups yet.
        }
        return PDFJSSidebar.SidebarView.NONE; // Default value.
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

    fallback(featureId?: any) {
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
            this.download();
        });
    }

    get supportsIntegratedFind() {
        return this.externalServices.supportsIntegratedFind;
    }

    get supportsDocumentColors() {
        return this.externalServices.supportsDocumentColors;
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

        // Listen for unsupported features to trigger the fallback UI.
        loadingTask.onUnsupportedFeature = this.fallback.bind(this);

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
        this.fallback();
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
        this.isInitialViewSet = false;
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
