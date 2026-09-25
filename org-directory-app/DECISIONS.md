# Decisions

- **All organisations on one screen vs. paged/rate-limited API**
  - Chose: the screen reads a prebuilt local directory snapshot and renders all 140 records at once.
  - Rejected: making six page requests in the browser; 137 records at 25 per request requires six calls, which exceeds the five-per-minute source limit.
  - Why: it preserves the ops workflow while modelling the upstream contract separately in `OrganisationService.getPage`. The trade-off is snapshot freshness: a real system needs a server-side cache/export job and a freshness indicator.

- **URL state**
  - Chose: debounced name search and status filter are stored as query parameters; URL navigation restores them.
  - Rejected: local-only filter state.
  - Why: a filtered operational view can be copied and shared. Sorting remains a local presentation preference because sharing it was not required.

- **Form validation**
  - Chose: typed, non-nullable reactive form controls, with field errors shown after blur (and after submit attempts). Name uniqueness is case-insensitive against the loaded directory.
  - Rejected: validation on each keystroke and server-only uniqueness feedback.
  - Why: this makes errors discoverable before submission without noisy early feedback. A production app must re-check uniqueness server-side to avoid races.

- **AI-tool declaration**
  - Used: Kiro (GPT-5.6 Terra) to scaffold the Angular project, draft and implement the data layer