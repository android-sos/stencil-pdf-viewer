import PDFJSDownloadManager from 'pdfjs-dist/lib/web/download_manager';
import { TranslationService } from './translation';

export class HivePDFExternalServices {

    supportsIntegratedFind = false;
    supportsDocumentFonts = true;
    supportsDocumentColors = true;
    supportedMouseWheelZoomModifierKeys = {
        ctrlKey: true,
        metaKey: true
    };

    updateFindControlState(data) {
        console.log('updateFindControlState', data);
    }

    initPassiveLoading(callbacks) {
        console.log('initPassiveLoading', callbacks);
    }

    fallback(data, callback) {
        // console.log('fallback', data, callback);
    }

    reportTelemetry(data) {
        console.log('reportTelemetry', JSON.stringify(data));
    }

    createDownloadManager(options) {
        return new PDFJSDownloadManager.DownloadManager(options);
    }

    createPreferences() {
        return {
            showPreviousViewOnLoad: true,
            defaultZoomValue: '',
            sidebarViewOnLoad: 0,
            cursorToolOnLoad: 0,
            enableWebGL: false,
            pdfBugEnabled: false,
            disableRange: false,
            disableStream: false,
            disableAutoFetch: false,
            disableFontFace: false,
            textLayerMode: 1,
            useOnlyCssZoom: false,
            externalLinkTarget: 0,
            renderer: 'canvas',
            renderInteractiveForms: false,
            enablePrintAutoRotate: false,
            disablePageMode: false,
            disablePageLabels: false,
            scrollModeOnLoad: 0,
            spreadModeOnLoad: 0
        };
    }

    createL10n(options) {
        return new TranslationService(navigator.language || options);
    }

}
