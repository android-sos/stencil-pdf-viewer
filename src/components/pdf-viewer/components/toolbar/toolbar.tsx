import { Component } from "@stencil/core";

@Component({
    tag: 'hive-pdf-toolbar',
    styleUrl: 'toolbar.scss',
    shadow: true,
})
export class HivePDFToolbarComponent {

    render() {
        return (
            <div id="toolbarContainer">
                <div id="toolbarViewer">
                    <div id="toolbarViewerLeft">
                        <hive-pdf-toolbar-btn id="sidebarToggle" title="Toggle Sidebar" data-l10n-id="toggle_sidebar">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                                <g data-name="Layer 1">
                                    <path d="M3.25 1A2.25 2.25 0 0 0 1 3.25v17.5A2.25 2.25 0 0 0 3.25 23H11V1zM8 19.5a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-3a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5zm0-6a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-3a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5zm0-6a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-3a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5z"></path>
                                    <path class="3b3139a5-06b2-43d8-b27d-af3b8c8645ab" d="M11 2h9.75A1.25 1.25 0 0 1 22 3.25v17.5A1.25 1.25 0 0 1 20.75 22H11"></path>
                                </g>
                            </svg>
                        </hive-pdf-toolbar-btn>

                        {/* <button id="sidebarToggle" class="toolbarButton" title="Toggle Sidebar" tabindex="11" data-l10n-id="toggle_sidebar">
                            <span data-l10n-id="toggle_sidebar_label">Toggle Sidebar</span>
                        </button> */}
                        {/* <div class="toolbarButtonSpacer"></div> */}


                        {/* <button id="viewFind" class="toolbarButton" title="Find in Document" tabindex="12" data-l10n-id="findbar">
                            <span data-l10n-id="findbar_label">Find</span>
                        </button> */}
                        <div class="page-indicators">
                            <button id="previous" class="page-indicator previous" title="Previous Page" data-l10n-id="previous">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                                    <path d="M7.5 12.5l9 9v-18z"></path>
                                </svg>
                            </button>
                            {/* <div class="splitToolbarButtonSeparator"></div> */}
                            <input type="number" id="pageNumber" title="Page" value="1" size={4} min="1" data-l10n-id="page" />
                            <button id="next" class="page-indicator next" title="Next Page" data-l10n-id="next">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                                    <path d="M16.5 12.5l-9 9v-18z"></path>
                                </svg>
                            </button>
                            <span id="numPages" class="toolbarLabel"></span>
                        </div>
                    </div>
                    <div id="toolbarViewerMiddle">
                        <hive-pdf-toolbar-btn id="zoomOut" title="Zoom Out" data-l10-id="zoom_out">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                                <path d="M4.5 8h9v2h-9z" opacity=".5"></path>
                                <path d="M9 18a9 9 0 1 1 9-9 9.01 9.01 0 0 1-9 9zM9 2a7 7 0 1 0 7 7 7.008 7.008 0 0 0-7-7z"></path>
                                <path d="M20.556 23.03l-5.793-5.793 2.475-2.475 5.793 5.793a1 1 0 0 1 0 1.414l-1.06 1.06a1 1 0 0 1-1.415.001z" opacity=".66"></path>
                            </svg>
                        </hive-pdf-toolbar-btn>

                            {/* <button id="zoomOut" class="toolbarButton zoomOut" title="Zoom Out" tabindex="21" data-l10n-id="zoom_out">
                                <span data-l10n-id="zoom_out_label">Zoom Out</span>
                            </button> */}
                            {/* <div class="splitToolbarButtonSeparator"></div> */}

                        <hive-pdf-toolbar-btn id="zoomIn" title="Zoom In" data-l10n-id="zoom_in">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                                <path opacity=".5" d="M13.5 8H10V4.5H8V8H4.5v2H8v3.5h2V10h3.5V8z"></path>
                                <path d="M9 18a9 9 0 1 1 9-9 9.01 9.01 0 0 1-9 9zM9 2a7 7 0 1 0 7 7 7.008 7.008 0 0 0-7-7z"></path>
                                <path d="M20.556 23.03l-5.793-5.793 2.475-2.475 5.793 5.793a1 1 0 0 1 0 1.414l-1.06 1.06a1 1 0 0 1-1.415.001z" opacity=".66"></path>
                            </svg>
                        </hive-pdf-toolbar-btn>

                            {/* <button id="zoomIn" class="toolbarButton zoomIn" title="Zoom In" tabindex="22" data-l10n-id="zoom_in">
                                <span data-l10n-id="zoom_in_label">Zoom In</span>
                            </button> */}
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
                    <div id="toolbarViewerRight">
                        <button id="presentationMode" class="toolbarButton presentationMode hiddenLargeView" title="Switch to Presentation Mode" tabindex="31" data-l10n-id="presentation_mode">
                            <span data-l10n-id="presentation_mode_label">Presentation Mode</span>
                        </button>

                        <button id="openFile" class="toolbarButton openFile hiddenLargeView" title="Open File" tabindex="32" data-l10n-id="open_file">
                            <span data-l10n-id="open_file_label">Open</span>
                        </button>

                        <hive-pdf-toolbar-btn title="Print" id="print" data-l10n-id="print">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                                <path d="M23 8.5v10a1.5 1.5 0 0 1-1.5 1.5H19v3H5v-3H2.5A1.5 1.5 0 0 1 1 18.5v-10A1.5 1.5 0 0 1 2.5 7H5V1h14v6h2.5A1.5 1.5 0 0 1 23 8.5z" fill="none" stroke="currentColor" stroke-miterlimit="10" stroke-width="2"></path>
                                <circle cx="19" cy="13" r="1"></circle>
                                <path fill="none" stroke="currentColor" stroke-miterlimit="10" opacity=".25" d="M18.5 8v2h-13V8"></path>
                                <path d="M23 15v3.5a1.5 1.5 0 0 1-1.5 1.5H18v-3H6v3H2.5A1.5 1.5 0 0 1 1 18.5V15z" opacity=".5"></path>
                            </svg>
                        </hive-pdf-toolbar-btn>

                        {/* <button id="print" class="toolbarButton print hiddenMediumView" title="Print" tabindex="33" data-l10n-id="print">
                            <span data-l10n-id="print_label">Print</span>
                        </button> */}

                        <hive-pdf-toolbar-btn title="Download" id="download" data-l10n-id="download">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                                <g id="6d7384b7-96b5-449c-8962-cda9c3365571" data-name="Layer 1">
                                    <polygon stroke="#F6F7FA" fill="#F6F7FA" opacity="0.76" points="13 14 13 10 11 10 11 14 8 14 12 18 16 14 13 14" />
                                    <rect stroke="#F6F7FA" fill="#F6F7FA" x="10.5" y="6.5" width="3" height="2" transform="translate(4.5 19.5) rotate(-90)" opacity="0.66" />
                                    <rect stroke="#F6F7FA" fill="#F6F7FA" x="11" y="3" width="2" height="2" transform="translate(8 16) rotate(-90)" opacity="0.33" />
                                    <path d="M3,17v2.5A1.5,1.5,0,0,0,4.5,21h15A1.5,1.5,0,0,0,21,19.5V17" fill="none" stroke="#FFFFFF" stroke-linecap="round" stroke-miterlimit="10" stroke-width="2" />
                                </g>
                            </svg>
                        </hive-pdf-toolbar-btn>

                        {/* <button id="download" class="toolbarButton download hiddenMediumView" title="Download" tabindex="34" data-l10n-id="download">
                            <span data-l10n-id="download_label">Download</span>
                        </button> */}
                        <a href="#" id="viewBookmark" class="toolbarButton bookmark hiddenSmallView" title="Current view (copy or open in new window)" tabindex="35" data-l10n-id="bookmark">
                            <span data-l10n-id="bookmark_label">Current View</span>
                        </a>

                        <div class="verticalToolbarSeparator hiddenSmallView"></div>

                        <hive-pdf-toolbar-btn id="secondaryToolbarToggle" title="Tools" data-l10n-id="tools">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                                <path d="M12.58 3a.61.61 0 0 1 .61.52l.38 2.55a6.09 6.09 0 0 1 1.51.63l2.07-1.53a.61.61 0 0 1 .8.06l.82.82a.61.61 0 0 1 .06.8L17.3 8.92a6.09 6.09 0 0 1 .63 1.51l2.55.38a.61.61 0 0 1 .52.61v1.16a.61.61 0 0 1-.52.61l-2.55.38a6.09 6.09 0 0 1-.63 1.51l1.53 2.07a.61.61 0 0 1-.06.8l-.82.82a.61.61 0 0 1-.8.06l-2.07-1.53a6.09 6.09 0 0 1-1.51.63l-.38 2.55a.61.61 0 0 1-.61.52h-1.16a.61.61 0 0 1-.61-.52l-.38-2.55a6.09 6.09 0 0 1-1.51-.63l-2.07 1.53a.61.61 0 0 1-.8-.06L5.23 18a.61.61 0 0 1-.06-.8l1.53-2.12a6.09 6.09 0 0 1-.63-1.51l-2.55-.38a.61.61 0 0 1-.52-.61v-1.16a.61.61 0 0 1 .52-.61l2.55-.38a6.09 6.09 0 0 1 .63-1.51L5.17 6.85A.61.61 0 0 1 5.23 6L6 5.23a.61.61 0 0 1 .8-.06L8.92 6.7a6.09 6.09 0 0 1 1.51-.63l.38-2.55a.61.61 0 0 1 .61-.52h1.16M12 15.5A3.5 3.5 0 1 0 8.5 12a3.5 3.5 0 0 0 3.5 3.5M12.58 1h-1.16a2.63 2.63 0 0 0-2.59 2.23l-.12.83-.71-.5a2.61 2.61 0 0 0-3.4.25l-.82.82A2.63 2.63 0 0 0 3.56 8l.5.67-.83.12A2.63 2.63 0 0 0 1 11.42v1.16a2.63 2.63 0 0 0 2.23 2.58l.83.12-.5.67a2.63 2.63 0 0 0 .25 3.4l.82.82a2.61 2.61 0 0 0 3.4.25l.67-.5.12.83a2.63 2.63 0 0 0 2.6 2.25h1.16a2.63 2.63 0 0 0 2.58-2.23l.12-.83.67.5a2.61 2.61 0 0 0 3.4-.25l.82-.82a2.63 2.63 0 0 0 .25-3.4l-.5-.67.83-.12a2.63 2.63 0 0 0 2.25-2.6v-1.16a2.63 2.63 0 0 0-2.23-2.58l-.83-.12.5-.67a2.63 2.63 0 0 0-.25-3.4l-.82-.82A2.61 2.61 0 0 0 16 3.56l-.67.5-.12-.83A2.63 2.63 0 0 0 12.58 1zM12 13.5a1.5 1.5 0 1 1 1.5-1.5 1.5 1.5 0 0 1-1.5 1.5z"></path>
                            </svg>
                        </hive-pdf-toolbar-btn>

                        {/* <button id="secondaryToolbarToggle" class="toolbarButton" title="Tools" tabindex="36" data-l10n-id="tools">
                            <span data-l10n-id="tools_label">Tools</span>
                        </button> */}

                        <hive-pdf-toolbar-btn id="viewFind" title="Find in Document" data-l10n-id="findbar">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                                <path d="M21.48 18.95l-4.15-4.15-2.53 2.53 4.15 4.15a1.08 1.08 0 0 0 1.52 0l1-1a1.08 1.08 0 0 0 .01-1.53z" opacity=".75"></path>
                                <circle cx="9.5" cy="9.5" r="6.5" fill="none" stroke-miterlimit="10" stroke-width="2" stroke="currentColor"></circle>
                            </svg>
                        </hive-pdf-toolbar-btn>
                    </div>

                </div>
                <div id="loadingBar">
                    <div class="progress">
                        <div class="glimmer">
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
