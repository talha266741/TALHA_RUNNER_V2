const { entrypoints } = require("uxp");
const { app, ScriptLanguage, UndoModes } = require("indesign");

const CORE_VERSION = "1.0.1";
const BUNDLED_RUNTIME_VERSION = "2.1.0";
const UPDATE_MANIFEST_URL = "https://raw.githubusercontent.com/talha266741/TALHA_RUNNER_V2/main/update.json";
const CACHE_SOURCE_KEY = "talhaRunnerRuntimeSource";
const CACHE_VERSION_KEY = "talhaRunnerRuntimeVersion";
const PREVIOUS_SOURCE_KEY = "talhaRunnerRuntimePreviousSource";
const PREVIOUS_VERSION_KEY = "talhaRunnerRuntimePreviousVersion";

const bundledRuntimeFactory = require("./runtime-bundled.js");
let activeRuntime = null;
let activeRuntimeVersion = BUNDLED_RUNTIME_VERSION;
let activeRuntimeOrigin = "bundled";
let panelVisible = false;
let updateInProgress = false;

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
    const loader = new Function("module", "exports", String(source));
    loader(moduleObject, moduleObject.exports);
    if (typeof moduleObject.exports !== "function") throw new Error("Runtime geçerli bir factory dışa aktarmıyor");
    return moduleObject.exports;
}

function readStoredRuntime(sourceKey, versionKey, origin) {
    try {
        const source = localStorage.getItem(sourceKey);
        const version = localStorage.getItem(versionKey);
        if (!source || !version) return null;
        return { factory: compileRuntime(source), source: source, version: version, origin: origin };
    } catch (error) {
        console.error(origin + " runtime okunamadı.", error);
        return null;
    }
}

function clearStoredRuntime(sourceKey, versionKey) {
    try {
        localStorage.removeItem(sourceKey);
        localStorage.removeItem(versionKey);
    } catch (e) {}
}

function buildContext(runtimeVersion, runtimeOrigin) {
    return {
        app: app,
        ScriptLanguage: ScriptLanguage,
        UndoModes: UndoModes,
        runtimeVersion: runtimeVersion,
        runtimeOrigin: runtimeOrigin,
        coreVersion: CORE_VERSION,
        core: {
            checkAndInstallUpdate: checkAndInstallUpdate,
            getCoreVersion: function () { return CORE_VERSION; },
            getRuntimeVersion: function () { return activeRuntimeVersion; },
            getRuntimeOrigin: function () { return activeRuntimeOrigin; }
        }
    };
}

function activateRuntime(factory, version, origin) {
    const oldRuntime = activeRuntime;
    if (oldRuntime && typeof oldRuntime.dispose === "function") {
        try { oldRuntime.dispose(); } catch (e) { console.error("Eski runtime dispose hatası", e); }
    }

    let instance;
    try {
        instance = factory(buildContext(version, origin));
        if (!instance || typeof instance.initialize !== "function") throw new Error("Runtime initialize() sağlamıyor");
        instance.initialize();
    } catch (error) {
        activeRuntime = null;
        throw error;
    }

    activeRuntime = instance;
    activeRuntimeVersion = version;
    activeRuntimeOrigin = origin;
}

function activateBestAvailableRuntime() {
    const cached = readStoredRuntime(CACHE_SOURCE_KEY, CACHE_VERSION_KEY, "cache");
    if (cached) {
        try {
            activateRuntime(cached.factory, cached.version, cached.origin);
            return;
        } catch (error) {
            console.error("Cached runtime başlatılamadı; cache temizleniyor.", error);
            clearStoredRuntime(CACHE_SOURCE_KEY, CACHE_VERSION_KEY);
        }
    }

    const previous = readStoredRuntime(PREVIOUS_SOURCE_KEY, PREVIOUS_VERSION_KEY, "previous");
    if (previous) {
        try {
            activateRuntime(previous.factory, previous.version, previous.origin);
            localStorage.setItem(CACHE_SOURCE_KEY, previous.source);
            localStorage.setItem(CACHE_VERSION_KEY, previous.version);
            return;
        } catch (error) {
            console.error("Önceki runtime da başlatılamadı; temizleniyor.", error);
            clearStoredRuntime(PREVIOUS_SOURCE_KEY, PREVIOUS_VERSION_KEY);
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
    if (updateInProgress) throw new Error("Güncelleme zaten devam ediyor");
    updateInProgress = true;

    try {
        const manifestText = await fetchText(UPDATE_MANIFEST_URL);
        let manifest;
        try { manifest = JSON.parse(manifestText); } catch (e) { throw new Error("update.json okunamadı"); }

        if (!manifest || manifest.schemaVersion !== 1) throw new Error("Desteklenmeyen update manifesti");
        if (!manifest.runtimeVersion || !manifest.runtimeUrl) throw new Error("Güncelleme bilgisi eksik");
        if (manifest.minCoreVersion && compareVersions(CORE_VERSION, manifest.minCoreVersion) < 0) {
            throw new Error("Bu güncelleme daha yeni bir Core gerektiriyor (" + manifest.minCoreVersion + ")");
        }

        const currentVersion = activeRuntimeVersion || BUNDLED_RUNTIME_VERSION;
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
            return { updated: true, version: manifest.runtimeVersion, message: "✓ Güncellendi: " + manifest.runtimeVersion };
        } catch (error) {
            console.error("Aday runtime etkinleştirilemedi; rollback uygulanıyor.", error);
            clearStoredRuntime(CACHE_SOURCE_KEY, CACHE_VERSION_KEY);

            if (oldSource && oldVersion) {
                localStorage.setItem(CACHE_SOURCE_KEY, oldSource);
                localStorage.setItem(CACHE_VERSION_KEY, oldVersion);
                if (panelVisible) activateRuntime(compileRuntime(oldSource), oldVersion, "cache");
            } else if (panelVisible) {
                activateRuntime(bundledRuntimeFactory, BUNDLED_RUNTIME_VERSION, "bundled");
            }
            throw error;
        }
    } finally {
        updateInProgress = false;
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
                if (!activeRuntime) activateBestAvailableRuntime();
            },
            hide: function () { panelVisible = false; },
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
