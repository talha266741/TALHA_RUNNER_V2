module.exports = function createTalhaRunnerRuntime(ctx) {
    const app = ctx.app;
    const ScriptLanguage = ctx.ScriptLanguage;
    const UndoModes = ctx.UndoModes;
    const core = ctx.core;
    const MAX_HISTORY = 20;
    const FAVORITES_KEY = "talhaRunnerV2Favorites";
    let history = [];
    let listeners = [];

    function on(el, event, handler) { if (!el) return; el.addEventListener(event, handler); listeners.push([el, event, handler]); }
    function initialize() {
        const codeInput = document.getElementById("codeInput"), runButton = document.getElementById("runButton"), clearButton = document.getElementById("clearButton"), clearAfterRun = document.getElementById("clearAfterRun"), statusText = document.getElementById("statusText"), historyButton = document.getElementById("historyButton"), saveFavoriteButton = document.getElementById("saveFavoriteButton"), favoritesButton = document.getElementById("favoritesButton"), updateButton = document.getElementById("updateButton"), versionText = document.getElementById("versionText"), updateStatus = document.getElementById("updateStatus");
        if (!codeInput || !runButton) throw new Error("Runner arayüzü bulunamadı");
        if (versionText) versionText.textContent = "V2 • " + (ctx.runtimeVersion || "yerleşik");
        if (updateStatus) updateStatus.textContent = ctx.runtimeOrigin === "cache" ? "● Güncel runtime" : "● Yerleşik runtime";

        const bottom = document.querySelector(".bottom");
        if (bottom) { bottom.style.flexDirection = "row"; bottom.style.flexWrap = "nowrap"; bottom.style.gap = "6px"; }
        [saveFavoriteButton, favoritesButton, historyButton, updateButton].forEach(function (button) {
            if (button) { button.style.flex = "1 1 0"; button.style.width = "auto"; button.style.minWidth = "0"; button.style.padding = "0 4px"; button.style.fontSize = "10px"; }
        });
        if (saveFavoriteButton) { saveFavoriteButton.textContent = "★ Kaydet"; saveFavoriteButton.style.backgroundColor = "#66511f"; }
        if (favoritesButton) { favoritesButton.textContent = "★ Favoriler"; favoritesButton.style.backgroundColor = "#244f67"; }
        if (historyButton) historyButton.style.backgroundColor = "#5b365f";
        if (updateButton) updateButton.style.backgroundColor = "#285b3b";

        function setStatus(message) { if (statusText) statusText.textContent = message; }
        function addToHistory(code) { if (!code) return; if (history.length > 0 && history[0] === code) return; history.unshift(code); if (history.length > MAX_HISTORY) history.pop(); }
        function restoreInDesignFocus() { try { if (app.activeWindow && app.activeWindow.activate) app.activeWindow.activate(); } catch (e) {} }
        function focusEditor() { try { codeInput.focus(); } catch (e) {} }
        function runCode() { const code = codeInput.value; if (!code || !code.replace(/\s/g, "")) return setStatus("Kod alanı boş"); setStatus("Çalıştırılıyor..."); try { app.doScript(code, ScriptLanguage.JAVASCRIPT, undefined, UndoModes.ENTIRE_SCRIPT, "Talha Runner V2"); addToHistory(code); setStatus("✓ Tamamlandı"); if (clearAfterRun && clearAfterRun.checked) codeInput.value = ""; } catch (error) { let message = "Bilinmeyen hata"; try { message = error && error.message ? error.message : String(error); } catch (e) {} setStatus("✕ " + message); } finally { restoreInDesignFocus(); } }
        function clearCode() { codeInput.value = ""; setStatus("Hazır"); focusEditor(); }
        function showHistory() { if (history.length === 0) return setStatus("Geçmiş boş"); let message = "SON ÇALIŞTIRILAN KODLAR\n\n"; for (let i = 0; i < history.length; i++) { let preview = history[i].replace(/\r/g, " ").replace(/\n/g, " "); if (preview.length > 60) preview = preview.substring(0, 60) + "..."; message += (i + 1) + ". " + preview + "\n"; } const selection = prompt(message + "\nYüklemek istediğiniz kodun numarasını girin:", "1"); if (selection === null) return; const normalized = String(selection).trim(); if (!/^\d+$/.test(normalized)) return setStatus("Geçersiz geçmiş seçimi"); const index = Number(normalized) - 1; if (index < 0 || index >= history.length) return setStatus("Geçersiz geçmiş seçimi"); codeInput.value = history[index]; setStatus("Geçmişten editöre yüklendi"); focusEditor(); }
        function loadFavorites() { try { const raw = localStorage.getItem(FAVORITES_KEY); if (!raw) return []; const parsed = JSON.parse(raw); return Array.isArray(parsed) ? parsed : []; } catch (e) { return []; } }
        function saveFavorites(favorites) { localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites)); }
        function saveCurrentFavorite() { const code = codeInput.value; if (!code || !code.replace(/\s/g, "")) return setStatus("Favoriye kaydedilecek kod yok"); const enteredName = prompt("Favori adı:", ""); if (enteredName === null) return; const name = String(enteredName).trim(); if (!name) return setStatus("Favori adı boş olamaz"); const favorites = loadFavorites(); let existingIndex = -1; for (let i = 0; i < favorites.length; i++) if (String(favorites[i].name).toLocaleLowerCase() === name.toLocaleLowerCase()) { existingIndex = i; break; } if (existingIndex >= 0) { if (!confirm("'" + favorites[existingIndex].name + "' zaten var. Üzerine yazılsın mı?")) return setStatus("Favori değiştirilmedi"); favorites[existingIndex] = { name: name, code: code }; } else favorites.push({ name: name, code: code }); try { saveFavorites(favorites); setStatus("★ Favoriye kaydedildi: " + name); } catch (e) { setStatus("✕ Favori kaydedilemedi"); } }
        function showFavorites() { let favorites = loadFavorites(); if (favorites.length === 0) return setStatus("Favoriler boş"); let message = "FAVORİLER\n\n"; for (let i = 0; i < favorites.length; i++) message += (i + 1) + ". " + favorites[i].name + "\n"; message += "\nNumara = editöre yükle\nR3 = 3. favoriyi yeniden adlandır\nS3 = 3. favoriyi sil"; const selection = prompt(message, "1"); if (selection === null) return; const normalized = String(selection).trim(); const renameMatch = /^R(\d+)$/i.exec(normalized); if (renameMatch) { const index = Number(renameMatch[1]) - 1; if (index < 0 || index >= favorites.length) return setStatus("Geçersiz favori seçimi"); const newNameInput = prompt("Yeni favori adı:", favorites[index].name); if (newNameInput === null) return; const newName = String(newNameInput).trim(); if (!newName) return setStatus("Favori adı boş olamaz"); for (let i = 0; i < favorites.length; i++) if (i !== index && String(favorites[i].name).toLocaleLowerCase() === newName.toLocaleLowerCase()) return setStatus("Bu isimde başka favori var"); favorites[index].name = newName; saveFavorites(favorites); return setStatus("Favori yeniden adlandırıldı"); } const deleteMatch = /^S(\d+)$/i.exec(normalized); if (deleteMatch) { const index = Number(deleteMatch[1]) - 1; if (index < 0 || index >= favorites.length) return setStatus("Geçersiz favori seçimi"); const name = favorites[index].name; if (!confirm("'" + name + "' favorisi silinsin mi?")) return; favorites.splice(index, 1); saveFavorites(favorites); return setStatus("Favori silindi: " + name); } if (!/^\d+$/.test(normalized)) return setStatus("Geçersiz favori seçimi"); const index = Number(normalized) - 1; if (index < 0 || index >= favorites.length) return setStatus("Geçersiz favori seçimi"); codeInput.value = favorites[index].code; setStatus("★ Favoriden editöre yüklendi: " + favorites[index].name); focusEditor(); }
        async function updateRunner() { setStatus("Güncelleme kontrol ediliyor..."); if (updateButton) updateButton.disabled = true; try { const result = await core.checkAndInstallUpdate(); if (result.updated) { setStatus("✓ Güncellendi: " + result.version); if (updateStatus) updateStatus.textContent = "● Güncel"; } else setStatus(result.message || "Zaten güncel"); } catch (error) { setStatus("✕ Güncelleme başarısız: " + (error && error.message ? error.message : String(error))); } finally { if (updateButton) updateButton.disabled = false; } }
        on(runButton, "click", runCode); on(clearButton, "click", clearCode); on(codeInput, "keydown", function (event) { if (event.ctrlKey && event.key === "Enter") { event.preventDefault(); runCode(); } }); on(historyButton, "click", showHistory); on(saveFavoriteButton, "click", saveCurrentFavorite); on(favoritesButton, "click", showFavorites); on(updateButton, "click", updateRunner); setStatus("Hazır");
    }
    function dispose() { for (let i = 0; i < listeners.length; i++) try { listeners[i][0].removeEventListener(listeners[i][1], listeners[i][2]); } catch (e) {} listeners = []; }
    return { initialize: initialize, dispose: dispose };
};
