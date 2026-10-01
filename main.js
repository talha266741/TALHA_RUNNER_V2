const { entrypoints } = require("uxp");
const { app, ScriptLanguage, UndoModes } = require("indesign");

const CORE_VERSION = "1.0.0";
const BUNDLED_RUNTIME_VERSION = "2.1.0";
const UPDATE_MANIFEST_URL = "https://raw.githubusercontent.com/talha266741/TALHA_RUNNER_V2/main/update.json";
const CACHE_SOURCE_KEY = "talhaRunnerRuntimeSource";
const CACHE_VERSION_KEY = "talhaRunnerRuntimeVersion";
const PREVIOUS_SOURCE_KEY = "talhaRunnerRuntimePreviousSource";
const PREVIOUS_VERSION_KEY = "talhaRunnerRuntimePreviousVersion";

const bundledRuntimeFactory = require("./runtime.js");
let activeRuntime = null;
let panelVisible = false;

function compareVersions(a, b) {
    const aa = String(a || "0").split(".").map(Number);
    const bb = String(b || "0").split(".").map(Number);
    const length = Math.max(aa.length, bb.length);
    for (let i = 0; i < length; i++) {
        const av = Number.isFinite(aa[i]) ? aa[i] : 0;
        const bv = Number.isFinite(bb[i]) ? bb[i] : 0;
        if (av > bv) return 1;
        if (av < bv) return -1;
    }
    return 0;
}

function compileRuntime(source) {
    if (!source || !String(source).trim()) throw new Error("Runtime içeriği boş");
    const moduleObject = { exports: {} };
    const exportsObject = moduleObject.exports;
    const loader = new Function("module", "exports", String(source));
    loader(moduleObject, exportsObject);
    if (typeof moduleObject.exports !== "function") throw new Error("Runtime geçerli bir factory dışa aktarmıyor");
    return moduleObject.exports;
}

function getCachedRuntime() {
    try {
        const source = localStorage.getItem(CACHE_SOURCE_KEY);
        const version = localStorage.getItem(CACHE_VERSION_KEY);
        if (!source || !version) return null;
        return { factory: compileRuntime(source), source: source, version: version, origin: "cache" };
    } catch (error) {
        console.error("Cached runtime yüklenemedi; yerleşik runtime kullanılacak.", error);
        return null;
    }
}

function buildContext(runtimeVersion, runtimeSource) {
    return {
        app: app,
        ScriptLanguage: ScriptLanguage,
        UndoModes: UndoModes,
        runtimeVersion: runtimeVersion,
        runtimeSource: runtimeSource,
        coreVersion: CORE_VERSION,
        core: {
            checkAndInstallUpdate: checkAndInstallUpdate,
            getCoreVersion: function () { return CORE_VERSION; },
            getRuntimeVersion: function () { return getCurrentRuntimeVersion(); }
        }
    };
}

function getCurrentRuntimeVersion() {
    try {
        return localStorage.getItem(CACHE_VERSION_KEY) || BUNDLED_RUNTIME_VERSION;
    } catch (e) {
        return BUNDLED_RUNTIME_VERSION;
    }
}

function activateRuntime(factory, version, origin) {
    if (activeRuntime && typeof activeRuntime.dispose === "function") {
        try { activeRuntime.dispose(); } catch (e) { console.error(e); }
    }
    const instance = factory(buildContext(version, origin));
    if (!instance || typeof instance.initialize !== "function") throw new Error("Runtime initialize() sağlamıyor");
    instance.initialize();
    activeRuntime = instance;
}

function activateBestAvailableRuntime() {
    const cached = getCachedRuntime();
    if (cached) {
        try {
            activateRuntime(cached.factory, cached.version, "cache");
            return;
        } catch (error) {
            console.error("Cached runtime başlatılamadı; yerleşik runtime'a dönülüyor.", error);
        }
    }
    activateRuntime(bundledRuntimeFactory, BUNDLED_RUNTIME_VERSION, "bundled");
}

async function fetchText(url) {
    const separator = url.indexOf("?") >= 0 ? "&" : "?";
    const response = await fetch(url + separator + "t=" + Date.now(), { cache: "no-store" });
    if (!response.ok) throw new Error("HTTP " + response.status);
    return await response.text();
}

async function checkAndInstallUpdate() {
    const manifestText = await fetchText(UPDATE_MANIFEST_URL);
    let manifest;
    try { manifest = JSON.parse(manifestText); } catch (e) { throw new Error("update.json okunamadı"); }

    if (!manifest || manifest.schemaVersion !== 1) throw new Error("Desteklenmeyen update manifesti");
    if (!manifest.runtimeVersion || !manifest.runtimeUrl) throw new Error("Güncelleme bilgisi eksik");
    if (manifest.minCoreVersion && compareVersions(CORE_VERSION, manifest.minCoreVersion) < 0) {
        throw new Error("Bu güncelleme daha yeni bir Core gerektiriyor (" + manifest.minCoreVersion + ")");
    }

    const currentVersion = getCurrentRuntimeVersion();
    if (compareVersions(manifest.runtimeVersion, currentVersion) <= 0) {
        return { updated: false, version: currentVersion, message: "✓ Zaten güncel: " + currentVersion };
    }

    const candidateSource = await fetchText(manifest.runtimeUrl);
    const candidateFactory = compileRuntime(candidateSource);

    const oldSource = localStorage.getItem(CACHE_SOURCE_KEY);
    const oldVersion = localStorage.getItem(CACHE_VERSION_KEY);
    if (oldSource && oldVersion) {
        localStorage.setItem(PREVIOUS_SOURCE_KEY, oldSource);
        localStorage.setItem(PREVIOUS_VERSION_KEY, oldVersion);
    }

    try {
        if (panelVisible) activateRuntime(candidateFactory, manifest.runtimeVersion, "cache");
        localStorage.setItem(CACHE_SOURCE_KEY, candidateSource);
        localStorage.setItem(CACHE_VERSION_KEY, manifest.runtimeVersion);
        return { updated: true, version: manifest.runtimeVersion, message: "✓ Güncellendi" };
    } catch (error) {
        if (oldSource && oldVersion) {
            try {
                localStorage.setItem(CACHE_SOURCE_KEY, oldSource);
                localStorage.setItem(CACHE_VERSION_KEY, oldVersion);
                if (panelVisible) activateRuntime(compileRuntime(oldSource), oldVersion, "cache");
            } catch (rollbackError) { console.error("Rollback başarısız", rollbackError); }
        } else {
            try {
                localStorage.removeItem(CACHE_SOURCE_KEY);
                localStorage.removeItem(CACHE_VERSION_KEY);
                if (panelVisible) activateRuntime(bundledRuntimeFactory, BUNDLED_RUNTIME_VERSION, "bundled");
            } catch (rollbackError) { console.error("Yerleşik runtime'a dönüş başarısız", rollbackError); }
        }
        throw error;
    }
}

entrypoints.setup({
    commands: {
        showAlert: function () { alert("Talha Runner V2"); }
    },
    panels: {
        showPanel: {
            show: function () {
                panelVisible = true;
                activateBestAvailableRuntime();
            },
            hide: function () {
                panelVisible = false;
            },
            destroy: function () {
                panelVisible = false;
                if (activeRuntime && typeof activeRuntime.dispose === "function") {
                    try { activeRuntime.dispose(); } catch (e) {}
                }
                activeRuntime = null;
            }
        }
    }
});
