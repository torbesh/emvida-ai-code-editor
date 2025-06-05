# EMVIDA AI Code Editor

## Übersicht

Der EMVIDA AI Code Editor ist ein leistungsstarker Editor mit integrierten KI-Funktionen, der Entwicklern hilft, effizienter zu programmieren. Diese Version enthält Integrationen für mehrere KI-Modelle, darunter Ollama, Mistral, Grok und Qwen.

## Neue KI-Integrationen

Der Editor wurde mit folgenden KI-Modell-Integrationen erweitert:

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
