# EMVIDA AI Code Editor

## Übersicht

Der EMVIDA AI Code Editor ist ein leistungsstarker Editor mit integrierten KI-Funktionen, der Entwicklern hilft, effizienter zu programmieren. Diese Version enthält Integrationen für mehrere KI-Modelle, darunter Ollama, Mistral, Grok und Qwen.

## Neue KI-Integrationen

Der Editor wurde mit folgenden KI-Modell-Integrationen erweitert:

Hier ist die aktualisierte Anleitung für dein GitHub-Projekt [emvida-ai-code-editor](https://github.com/torbesh/emvida-ai-code-editor), angepasst an die neuesten Informationen zu LM Studio:


## 🧠 Einrichtung mit LM Studio

### 1. LM Studio herunterladen und installieren

* Besuche die offizielle Website: [lmstudio.ai](https://lmstudio.ai/downloads)
* Lade die passende Version für dein Betriebssystem herunter (Windows, macOS oder Linux).
* Führe die Installation gemäß den Anweisungen durch.

### 2. Sprachmodell herunterladen

* Starte LM Studio.
* Navigiere zum Tab **Discover** (Lupensymbol).
* Suche nach einem geeigneten Modell (z. B. *Meta-Llama-3.1-8B-Instruct* oder *Phi-3*).
* Wähle ein Modell mit passender Quantisierung (z. B. Q4\_0 für 4-Bit) entsprechend deiner Hardware aus und lade es herunter.

### 3. Modell laden

* Wechsle zum **Chat**-Tab (Sprechblasensymbol).
* Wähle im Dropdown-Menü oben das heruntergeladene Modell aus.
* Das Modell wird nun geladen und ist einsatzbereit.

### 4. Lokalen Server aktivieren

* Gehe zum Tab **Developer**.
* Aktiviere den Schalter **Server aktivieren**.
* Der Server ist nun unter `http://localhost:1234/v1` erreichbar.

> **Hinweis:** Standardmäßig erfordert der lokale Server von LM Studio keine Authentifizierung oder Passwort. Die Verbindung erfolgt in der Regel über die OpenAI-kompatible API unter `http://localhost:1234/v1`.&#x20;

---

## 💻 Projekt verwenden

1. Lade die Datei [`EMVIDA_AI_CODE_EDITOR_OFFLINE.zip`](https://github.com/torbesh/emvida-ai-code-editor/blob/main/EMVIDA_AI_CODE_EDITOR_OFFLINE.zip) herunter.
2. Entpacke die ZIP-Datei in ein Verzeichnis deiner Wahl.
3. Öffne die Datei `index.html` in deinem bevorzugten Webbrowser.

Stelle sicher, dass der lokale Server von LM Studio aktiv ist, bevor du `index.html` öffnest, damit der Code-Editor korrekt mit dem Sprachmodell kommunizieren kann.


### Ollama Integration
- Lokale Ausführung von KI-Modellen über Ollama
- Standard-Endpunkt: http://localhost:11434/api
- Unterstützt CodeLlama, Llama 3, Mistral und andere Modelle
- Keine API-Schlüssel erforderlich

### Mistral Integration
- Verbindung zur Mistral AI API
- Unterstützt Mistral Large, Medium und Small Modelle
- Erfordert einen API-Schlüssel

### Grok Integration
- Verbindung zur Grok AI API
- Unterstützt das Grok-1 Modell
- Erfordert einen API-Schlüssel

### Qwen Integration
- Verbindung zur Qwen AI API (Alibaba Cloud)
- Unterstützt Qwen Max, Plus und Turbo Modelle
- Erfordert einen API-Schlüssel

## Verwendung

1. Wählen Sie ein KI-Modell aus dem Dropdown-Menü
2. Geben Sie bei Bedarf Ihren API-Schlüssel ein
3. Stellen Sie die Temperatur und maximale Token-Anzahl ein
4. Geben Sie Ihre Anweisungen für die KI ein
5. Klicken Sie auf "Generate", um Code zu erzeugen oder zu bearbeiten

## Konfiguration

Für lokale Modelle (Ollama):
- Stellen Sie sicher, dass Ollama auf Ihrem System installiert und ausgeführt wird
- Die Standard-Einstellung verwendet http://localhost:11434/api
- Sie können den Endpunkt und das Modell in den Einstellungen ändern

Für Cloud-basierte Modelle (Mistral, Grok, Qwen):
- Ein gültiger API-Schlüssel ist erforderlich
- Geben Sie den API-Schlüssel im entsprechenden Feld ein
- Sie können das zu verwendende Modell in den Einstellungen auswählen

## Funktionen

Alle KI-Integrationen unterstützen folgende Funktionen:
- Code-Vervollständigung
- Code-Chat (Fragen zum Code stellen)
- Code-Bearbeitung basierend auf Anweisungen
- Code-Refaktorierung
- Code-Erklärung
- Code-Optimierung
- Test-Generierung
- Fehlerkorrektur
- Code-Dokumentation
- Vorschläge für Design-Patterns

## Offline-Modus

Wenn keine Verbindung zu einem KI-Modell hergestellt werden kann, wechselt der Editor automatisch in den Offline-Modus mit vordefinierten Antworten.
