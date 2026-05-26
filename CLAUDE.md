# Sentimental Logic — Claude Code Kontext

> Für Claude Code: Diese Datei enthält erweiterte Anweisungen speziell für Code-Review,
> Architektur-Entscheidungen und technische Dokumentation.

---

## Meine Rolle in diesem Projekt

Ich (Claude Code) bin verantwortlich für:
- **Code Review** nach Codex-Implementierungen
- **Architektur-Entscheidungen** bei komplexen Problemen
- **Automatische Dokumentation** nach jedem Merge
- **Testprotokoll-Erstellung** nach jedem Feature

Für Projektmanagement, Strategie und Kundenkommunikation → Claude (claude.ai Chat)

---

## Vollständiger Kontext → siehe AGENTS.md

Alle Projekt-Grundlagen (Stack, Struktur, Standards, aktueller Stand) sind in `AGENTS.md` dokumentiert. Diese Datei immer zuerst lesen.

---

## Dokumentations-Vorlage (nach jedem Feature)

Wenn die Pipeline läuft, erstelle ich automatisch eine Doku nach diesem Format:

```markdown
# Feature: [Name]
Datum: [Datum]
Branch: [Branch-Name]
Phase: [1-4]

## Was wurde gebaut
[Kurze Beschreibung]

## Technische Umsetzung
[Wie wurde es gebaut — Dateien, Funktionen, Besonderheiten]

## Integrationen
[Welche externen Systeme sind betroffen]

## Testprotokoll
- [ ] Funktioniert lokal
- [ ] Funktioniert auf dev
- [ ] Vom Kunden getestet
- [ ] Edge Cases geprüft

## Bekannte Einschränkungen
[Was noch nicht perfekt ist]

## Nächste Schritte
[Was folgt als nächstes]
```

---

## Statusbericht-Vorlage (jeden Mittwoch)

```markdown
# Statusbericht — KW [X] — [Datum]
Projekt: Sentimental Logic | Kunde: Melih Gül

## Diese Woche abgeschlossen
[Liste der erledigten Tasks aus ClickUp]

## In Arbeit
[Laufende Tasks]

## Nächste Woche geplant
[Geplante Tasks]

## Offene Punkte / Blocker
[Was blockiert den Fortschritt]

## Zahlungsstatus
Rate [X] — [Status]

## Gesamtfortschritt
Phase 1: [X]% | Phase 2: 0% | Phase 3: 0% | Phase 4: 0%
```

---

## Architektur-Prinzipien

**API Routes:**
```typescript
// Immer so strukturieren:
export async function POST(request: Request) {
  try {
    const body = await request.json()
    // Validierung
    // Logik
    // Response
    return Response.json({ success: true, data: result })
  } catch (error) {
    console.error('[Route-Name] Fehler:', error)
    return Response.json({ success: false, error: 'Interner Fehler' }, { status: 500 })
  }
}
```

**Supabase Queries:**
```typescript
// Immer mit Error-Handling:
const { data, error } = await supabase.from('leads').select('*')
if (error) throw new Error(`Supabase Fehler: ${error.message}`)
```

**Claude API Calls:**
```typescript
// Immer mit Timeout + Retry:
const response = await anthropic.messages.create({
  model: 'claude-opus-4-5',
  max_tokens: 1024,
  messages: [{ role: 'user', content: prompt }]
})
```
