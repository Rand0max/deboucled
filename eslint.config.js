import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        alert: 'readonly',
        confirm: 'readonly',
        prompt: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
        fetch: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        FormData: 'readonly',
        XMLHttpRequest: 'readonly',

        // Greasemonkey/Tampermonkey globals
        GMStorage: 'readonly',
        GM: 'readonly',
        GM_setValue: 'readonly',
        GM_getValue: 'readonly',
        GM_deleteValue: 'readonly',
        GM_listValues: 'readonly',
        GM_xmlhttpRequest: 'readonly',
        GM_openInTab: 'readonly',
        GM_notification: 'readonly',
        GM_setClipboard: 'readonly',
        GM_info: 'readonly',
        GM_getResourceURL: 'readonly',
        GM_getResourceText: 'readonly',
        GM_addStyle: 'readonly',
        GM_log: 'readonly',
        unsafeWindow: 'readonly',

        // Browser APIs spécifiques qui pourraient manquer
        btoa: 'readonly',
        atob: 'readonly',
        MutationObserver: 'readonly',
        Node: 'readonly',
        Event: 'readonly',
        CustomEvent: 'readonly',
        dispatchEvent: 'readonly',

        // APIs manquantes identifiées par ESLint
        DOMParser: 'readonly',
        TimeSpan: 'readonly',
        File: 'readonly',
        Blob: 'readonly',
        FileReader: 'readonly',
        IntersectionObserver: 'readonly',
        removeEventListener: 'readonly',

        // Autres APIs du navigateur courantes
        Image: 'readonly',
        Audio: 'readonly',
        WebSocket: 'readonly',
        Worker: 'readonly',
        SharedWorker: 'readonly',
        ServiceWorker: 'readonly',
        navigator: 'readonly',
        history: 'readonly',
        screen: 'readonly',
        devicePixelRatio: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        requestIdleCallback: 'readonly',
        cancelIdleCallback: 'readonly',
        getComputedStyle: 'readonly',
        matchMedia: 'readonly',
        scrollTo: 'readonly',
        scrollBy: 'readonly',
        open: 'readonly',
        close: 'readonly',
        focus: 'readonly',
        blur: 'readonly',

        // APIs de stockage et base de données
        indexedDB: 'readonly',
        caches: 'readonly',

        // APIs de géolocalisation et permissions
        geolocation: 'readonly',
        permissions: 'readonly',

        // APIs de notification
        Notification: 'readonly',

        // APIs de clipboard
        ClipboardEvent: 'readonly',

        // Types de données
        ArrayBuffer: 'readonly',
        DataView: 'readonly',
        Int8Array: 'readonly',
        Uint8Array: 'readonly',
        Uint8ClampedArray: 'readonly',
        Int16Array: 'readonly',
        Uint16Array: 'readonly',
        Int32Array: 'readonly',
        Uint32Array: 'readonly',
        Float32Array: 'readonly',
        Float64Array: 'readonly',
        BigInt64Array: 'readonly',
        BigUint64Array: 'readonly',

        // APIs de streaming et données
        ReadableStream: 'readonly',
        WritableStream: 'readonly',
        TransformStream: 'readonly',
        TextEncoder: 'readonly',
        TextDecoder: 'readonly',

        // Canvas et WebGL
        CanvasRenderingContext2D: 'readonly',
        WebGLRenderingContext: 'readonly',
        WebGL2RenderingContext: 'readonly',
        ImageData: 'readonly',
        OffscreenCanvas: 'readonly',

        // APIs réseau avancées
        AbortController: 'readonly',
        AbortSignal: 'readonly',
        Headers: 'readonly',
        Request: 'readonly',
        Response: 'readonly',
        EventSource: 'readonly',

        // APIs Web modernes
        ResizeObserver: 'readonly',
        PerformanceObserver: 'readonly',

        // Bibliothèques tierces potentielles
        distance: 'readonly',
        Swal: 'readonly',
        InfiniteScroll: 'readonly',
        ShowMore: 'readonly',
        localforage: 'readonly'
      }
    },
    rules: {
      'no-unused-vars': 'warn'
    }
  },
  {
    ignores: [
      "version",
      "documentation/**",
      "resources/**",
      "variables.js",
      "storage.js",
      "helpers.js",
      "header.js",
      "preboucles.js",
      "apidata.js",
      "jvarchiveapi.js",
      "stats.js",
      "topics.js",
      "messages.js",
      "postmessage.js",
      "settings.js",
      "privatemessages.js",
      "profile.js",
      "extras.js",
      "decensured-variables.js",
      "decensured-helpers.js",
      "decensured-api.js",
      "decensured-formatting.js",
      "decensured-topics.js",
      "decensured-messages.js",
      "decensured-ui.js",
      "decensured-chat.js",
      "decensured-widget.js",
      "decensured-users.js",
      "decensured-posting.js",
      "decensured-main.js",
      "main.js"
    ]
  }
];
