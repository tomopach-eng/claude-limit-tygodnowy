# limit-tygodniowy

Mod do Claude Code, który pilnuje tygodniowego limitu użycia Claude.

- Gdy do resetu limitu tygodniowego zostaje 48 godzin lub mniej, pokazuje komunikat i wysyła powiadomienie z informacją, ile procent limitu zostało i kiedy nastąpi reset (raz na cykl).
- Poniżej 20% pozostałego limitu dodaje ostrzeżenie.
- Komenda `/limit` pokazuje aktualny stan w dowolnej chwili.

Dane pochodzą bezpośrednio z silnika Claude Code (okno `seven_day`). Stan jest sprawdzany przy kolejnych odpowiedziach Claude w sesji. Godziny są pokazywane w strefie Europe/Warsaw.

## Instalacja

W sesji Claude Code w terminalu:

```
/plugin install limit-tygodniowy --marketplace tomopach-eng/claude-limit-tygodniowy
```

Następnie `y`, aby dodać marketplace, i wybór zakresu (user).

Z powłoki:

```
claude plugin install limit-tygodniowy --marketplace tomopach-eng/claude-limit-tygodniowy
```

W aplikacji desktopowej (gdzie `/plugin` nie działa): kliknij + obok pola wiadomości, potem Plugins, Add marketplace z `tomopach-eng/claude-limit-tygodniowy`, a następnie Add plugin.

Repozytorium jest prywatne: instalacja działa tylko dla osób z dostępem do niego na GitHubie, których komputer ma zapisane dane logowania git do github.com (klucz SSH albo `gh auth login`, a potem `gh auth setup-git`).
