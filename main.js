const { entrypoints, shell } = require("uxp");
const { app, ScriptLanguage, UndoModes } = require("indesign");

const MAX_HISTORY = 20;
const FAVORITES_KEY = "talhaRunnerV2Favorites";
const RELEASES_URL = "https://github.com/talha266741/TALHA_RUNNER_V2/releases";

let history = [];
let panelRoot = null;

entrypoints.setup({
    commands: {
        showAlert: function () {
            alert("Talha Runner V2");
        }
    },
    panels: {
        showPanel: {
            show: function (event) {
                panelRoot = event && event.node ? event.node : document;
                initializeRunner();
            }
        }
    }
});

function initializeRunner() {
    const codeInput = document.getElementById("codeInput");
    const runButton = document.getElementById("runButton");
    const clearButton = document.getElementById("clearButton");
    const clearAfterRun = document.getElementById("clearAfterRun");
    const statusText = document.getElementById("statusText");
    const historyButton = document.getElementById("historyButton");
    const saveFavoriteButton = document.getElementById("saveFavoriteButton");
    const favoritesButton = document.getElementById("favoritesButton");
    const updateButton = document.getElementById("updateButton");

    if (!codeInput || !runButton) return;
    if (runButton.dataset.runnerReady === "true") return;
    runButton.dataset.runnerReady = "true";

    function setStatus(message) {
        if (statusText) statusText.textContent = message;
    }

    function addToHistory(code) {
        if (!code) return;
        if (history.length > 0 && history[0] === code) return;
        history.unshift(code);
        if (history.length > MAX_HISTORY) history.pop();
    }

    function restoreInDesignFocus() {
        try {
            if (app.activeWindow && app.activeWindow.activate) app.activeWindow.activate();
        } catch (e) {}
    }

    function focusEditor() {
        try { codeInput.focus(); } catch (e) {}
    }

    function runCode() {
        const code = codeInput.value;
        if (!code || !code.replace(/\s/g, "")) {
            setStatus("Kod alanı boş");
            return;
        }

        setStatus("Çalıştırılıyor...");
        try {
            app.doScript(code, ScriptLanguage.JAVASCRIPT, undefined, UndoModes.ENTIRE_SCRIPT, "Talha Runner V2");
            addToHistory(code);
            setStatus("✓ Tamamlandı");
            if (clearAfterRun && clearAfterRun.checked) codeInput.value = "";
        } catch (error) {
            let message = "Bilinmeyen hata";
            try { message = error && error.message ? error.message : String(error); } catch (e) {}
            setStatus("✕ " + message);
        } finally {
            restoreInDesignFocus();
        }
    }

    function clearCode() {
        codeInput.value = "";
        setStatus("Hazır");
        focusEditor();
    }

    function showHistory() {
        if (history.length === 0) {
            setStatus("Geçmiş boş");
            return;
        }

        let message = "SON ÇALIŞTIRILAN KODLAR\n\n";
        for (let i = 0; i < history.length; i++) {
            let preview = history[i].replace(/\r/g, " ").replace(/\n/g, " ");
            if (preview.length > 60) preview = preview.substring(0, 60) + "...";
            message += (i + 1) + ". " + preview + "\n";
        }

        const selection = prompt(message + "\nYüklemek istediğiniz kodun numarasını girin:", "1");
        if (selection === null) return;
        const normalized = String(selection).trim();
        if (!/^\d+$/.test(normalized)) {
            setStatus("Geçersiz geçmiş seçimi");
            return;
        }
        const index = Number(normalized) - 1;
        if (index < 0 || index >= history.length) {
            setStatus("Geçersiz geçmiş seçimi");
            return;
        }
        codeInput.value = history[index];
        setStatus("Geçmişten editöre yüklendi");
        focusEditor();
    }

    function loadFavorites() {
        try {
            const raw = localStorage.getItem(FAVORITES_KEY);
            if (!raw) return [];
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            return [];
        }
    }

    function saveFavorites(favorites) {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    }

    function saveCurrentFavorite() {
        const code = codeInput.value;
        if (!code || !code.replace(/\s/g, "")) {
            setStatus("Favoriye kaydedilecek kod yok");
            return;
        }

        const enteredName = prompt("Favori adı:", "");
        if (enteredName === null) return;
        const name = String(enteredName).trim();
        if (!name) {
            setStatus("Favori adı boş olamaz");
            return;
        }

        const favorites = loadFavorites();
        let existingIndex = -1;
        for (let i = 0; i < favorites.length; i++) {
            if (String(favorites[i].name).toLocaleLowerCase() === name.toLocaleLowerCase()) {
                existingIndex = i;
                break;
            }
        }

        if (existingIndex >= 0) {
            const overwrite = confirm("'" + favorites[existingIndex].name + "' zaten var. Üzerine yazılsın mı?");
            if (!overwrite) {
                setStatus("Favori değiştirilmedi");
                return;
            }
            favorites[existingIndex] = { name: name, code: code };
        } else {
            favorites.push({ name: name, code: code });
        }

        try {
            saveFavorites(favorites);
            setStatus("★ Favoriye kaydedildi: " + name);
        } catch (e) {
            setStatus("✕ Favori kaydedilemedi");
        }
    }

    function showFavorites() {
        let favorites = loadFavorites();
        if (favorites.length === 0) {
            setStatus("Favoriler boş");
            return;
        }

        let message = "FAVORİLER\n\n";
        for (let i = 0; i < favorites.length; i++) {
            message += (i + 1) + ". " + favorites[i].name + "\n";
        }
        message += "\nNumara = editöre yükle\nR3 = 3. favoriyi yeniden adlandır\nS3 = 3. favoriyi sil";

        const selection = prompt(message, "1");
        if (selection === null) return;
        const normalized = String(selection).trim();

        const renameMatch = /^R(\d+)$/i.exec(normalized);
        if (renameMatch) {
            const index = Number(renameMatch[1]) - 1;
            if (index < 0 || index >= favorites.length) {
                setStatus("Geçersiz favori seçimi");
                return;
            }
            const newNameInput = prompt("Yeni favori adı:", favorites[index].name);
            if (newNameInput === null) return;
            const newName = String(newNameInput).trim();
            if (!newName) {
                setStatus("Favori adı boş olamaz");
                return;
            }
            for (let i = 0; i < favorites.length; i++) {
                if (i !== index && String(favorites[i].name).toLocaleLowerCase() === newName.toLocaleLowerCase()) {
                    setStatus("Bu isimde başka favori var");
                    return;
                }
            }
            favorites[index].name = newName;
            saveFavorites(favorites);
            setStatus("Favori yeniden adlandırıldı");
            return;
        }

        const deleteMatch = /^S(\d+)$/i.exec(normalized);
        if (deleteMatch) {
            const index = Number(deleteMatch[1]) - 1;
            if (index < 0 || index >= favorites.length) {
                setStatus("Geçersiz favori seçimi");
                return;
            }
            const name = favorites[index].name;
            if (!confirm("'" + name + "' favorisi silinsin mi?")) return;
            favorites.splice(index, 1);
            saveFavorites(favorites);
            setStatus("Favori silindi: " + name);
            return;
        }

        if (!/^\d+$/.test(normalized)) {
            setStatus("Geçersiz favori seçimi");
            return;
        }
        const index = Number(normalized) - 1;
        if (index < 0 || index >= favorites.length) {
            setStatus("Geçersiz favori seçimi");
            return;
        }
        codeInput.value = favorites[index].code;
        setStatus("★ Favoriden editöre yüklendi: " + favorites[index].name);
        focusEditor();
    }

    async function openUpdates() {
        setStatus("GitHub Releases açılıyor...");
        try {
            if (!shell || typeof shell.openExternal !== "function") {
                throw new Error("UXP shell.openExternal kullanılamıyor");
            }
            await shell.openExternal(RELEASES_URL);
            setStatus("GitHub Releases tarayıcıda açıldı");
        } catch (error) {
            let message = "Güncelleme sayfası açılamadı";
            try { if (error && error.message) message += ": " + error.message; } catch (e) {}
            setStatus("✕ " + message);
        }
    }

    runButton.addEventListener("click", runCode);
    clearButton.addEventListener("click", clearCode);
    codeInput.addEventListener("keydown", function (event) {
        if (event.ctrlKey && event.key === "Enter") {
            event.preventDefault();
            runCode();
        }
    });
    if (historyButton) historyButton.addEventListener("click", showHistory);
    if (saveFavoriteButton) saveFavoriteButton.addEventListener("click", saveCurrentFavorite);
    if (favoritesButton) favoritesButton.addEventListener("click", showFavorites);
    if (updateButton) updateButton.addEventListener("click", openUpdates);

    setStatus("Hazır");
}
