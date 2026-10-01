const { entrypoints } = require("uxp");
const { app, ScriptLanguage, UndoModes } = require("indesign");

const MAX_HISTORY = 20;

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
    const favoritesButton = document.getElementById("favoritesButton");
    const updateButton = document.getElementById("updateButton");

    if (!codeInput || !runButton) {
        return;
    }

    if (runButton.dataset.runnerReady === "true") {
        return;
    }

    runButton.dataset.runnerReady = "true";


    function setStatus(message) {
        if (statusText) {
            statusText.textContent = message;
        }
    }


    function addToHistory(code) {
        if (!code) {
            return;
        }

        if (history.length > 0 && history[0] === code) {
            return;
        }

        history.unshift(code);

        if (history.length > MAX_HISTORY) {
            history.pop();
        }
    }


    function restoreInDesignFocus() {
        try {
            if (app.activeWindow && app.activeWindow.activate) {
                app.activeWindow.activate();
            }
        } catch (e) {
        }
    }


    function runCode() {
        const code = codeInput.value;

        if (!code || !code.replace(/\s/g, "")) {
            setStatus("Kod alanı boş");
            return;
        }

        setStatus("Çalıştırılıyor...");

        try {
            app.doScript(
                code,
                ScriptLanguage.JAVASCRIPT,
                undefined,
                UndoModes.ENTIRE_SCRIPT,
                "Talha Runner V2"
            );

            addToHistory(code);

            setStatus("✓ Tamamlandı");

            if (clearAfterRun && clearAfterRun.checked) {
                codeInput.value = "";
            }

        } catch (error) {

            let message = "Bilinmeyen hata";

            try {
                if (error && error.message) {
                    message = error.message;
                } else {
                    message = String(error);
                }
            } catch (e) {
            }

            setStatus("✕ " + message);
        } finally {
            restoreInDesignFocus();
        }
    }


    function clearCode() {
        codeInput.value = "";
        setStatus("Hazır");

        try {
            codeInput.focus();
        } catch (e) {
        }
    }


    function showHistory() {
        if (history.length === 0) {
            setStatus("Geçmiş boş");
            return;
        }

        let message = "SON ÇALIŞTIRILAN KODLAR\n\n";

        for (let i = 0; i < history.length; i++) {
            let preview = history[i]
                .replace(/\r/g, " ")
                .replace(/\n/g, " ");

            if (preview.length > 60) {
                preview = preview.substring(0, 60) + "...";
            }

            message += (i + 1) + ". " + preview + "\n";
        }

        const selection = prompt(
            message + "\nYüklemek istediğiniz kodun numarasını girin:",
            "1"
        );

        if (selection === null) {
            return;
        }

        const normalizedSelection = String(selection).trim();

        if (!/^\d+$/.test(normalizedSelection)) {
            setStatus("Geçersiz geçmiş seçimi");
            return;
        }

        const selectedIndex = Number(normalizedSelection) - 1;

        if (selectedIndex < 0 || selectedIndex >= history.length) {
            setStatus("Geçersiz geçmiş seçimi");
            return;
        }

        codeInput.value = history[selectedIndex];
        setStatus("Geçmişten editöre yüklendi");

        try {
            codeInput.focus();
        } catch (e) {
        }
    }


    runButton.addEventListener("click", function () {
        runCode();
    });


    clearButton.addEventListener("click", function () {
        clearCode();
    });


    codeInput.addEventListener("keydown", function (event) {
        if (event.ctrlKey && event.key === "Enter") {
            event.preventDefault();
            runCode();
        }
    });


    if (historyButton) {
        historyButton.addEventListener("click", function () {
            showHistory();
        });
    }


    if (favoritesButton) {
        favoritesButton.addEventListener("click", function () {
            setStatus("Favoriler yakında");
        });
    }


    if (updateButton) {
        updateButton.addEventListener("click", function () {
            setStatus("Güncelleme sistemi hazırlanıyor");
        });
    }


    setStatus("Hazır");
}