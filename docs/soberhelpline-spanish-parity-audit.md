# SoberHelpline → AyudaSobria Spanish parity audit

Audit date: 2026-07-19 PDT

## Baselines

- SoberHelpline source: `2374c3eafe7333d7a469013a796a56569cbfdbc1`
- AyudaSobria source originally pulled for this audit: `9ece5cf42f85c80f34a5ad772699c98a5db7530d`
- Final comparison base after reconciling newer Lovable work: `e7d8de7832d9f6cb34607db55a6ecd0ff320995f`
- SoberHelpline live sitemap: 416 URLs
- AyudaSobria pre-audit live sitemap: 166 URLs

## Product rule

AyudaSobria is a Spanish adaptation of SoberHelpline, not a blind clone. The SoberHelpline provider directory, provider application, provider partnership pages, and individual provider listings must not be copied because inclusion on SoberHelpline does not prove that a provider can serve a family in Spanish.

General education about levels and types of treatment may remain. It must be labeled as education rather than a directory, and families must be told to verify Spanish-language clinical and family services directly with each program.

## Parity matrix

| Area                            | SoberHelpline                                                     | AyudaSobria                                             | Status                                                                                                                                        |
| ------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Homepage family funnel          | `/`                                                               | `/`                                                     | Strong equivalent; adapted phone and Spanish language                                                                                         |
| Free Monday meeting             | `/family-squares`, `/monday-zoom-registration`                    | `/circulo-familiar`, `/registro`                        | Partial; public experience and schedule match, but Spanish registration is still a manual email handoff without Zoom/reminder automation      |
| Single private coaching session | `/family-coaching`, `/book-consultation`, `/coaching-checkout`    | `/coaching-familiar`, `/coaching-pago`                  | Functional equivalent after audit repair                                                                                                      |
| Intervention readiness          | `/intervention-help`, `/family-readiness-intensive`               | `/intervencion`                                         | Partial; Spanish page explains intervention but has no full readiness intensive                                                               |
| Blog                            | 137 `/blog/:slug` articles                                        | Same 137 slugs in Spanish                               | Strong coverage; 91,367 Spanish words versus 144,216 English words (63.4%), requiring ongoing editorial/claim review                          |
| Family answers                  | 29 structured answers                                             | Same 29 questions                                       | Partial; this audit added a unique Spanish direct answer and next step to every question, but deeper English guidance is not fully translated |
| Membership checkout             | `/family-membership`                                              | `/membresia`                                            | Payment/auth parity exists                                                                                                                    |
| Member experience               | member home, education tracks, forum, webinars, recordings, Q&A   | No equivalent member routes                             | Missing; this audit narrowed the Spanish offer so those undelivered features are no longer advertised as included                             |
| Assessments                     | interactive addiction and family-situation assessments            | `/evaluaciones` is informational                        | Partial/missing interactive behavior                                                                                                          |
| Recovery roadmap                | landing, assessment and eight substantive stages                  | `/mapa` plus eight short generated stage pages          | Partial; Spanish stages remain thin and noindexed                                                                                             |
| Educational tools               | dozens of worksheets, trackers and interactive exercises          | generic `/recursos/:slug` pages                         | Partial; most Spanish resource leaves are placeholders and remain noindexed                                                                   |
| AI tools                        | six interactive tools                                             | six short static guide pages                            | Not functionally equivalent                                                                                                                   |
| Treatment education             | detailed level-of-care and modality pages                         | short generic resource pages plus Spanish blog coverage | Partial                                                                                                                                       |
| State/city pages                | detailed English location pages                                   | selected state pages; city pages noindexed              | Intentional adaptation; no false local-office claims                                                                                          |
| Provider directory              | provider landing/application/partnership and treatment navigation | Excluded                                                | Intentional exclusion required by owner                                                                                                       |
| Authentication                  | `/auth`                                                           | `/auth`                                                 | Equivalent basic email/password and Google access                                                                                             |
| Administration                  | English admin tools                                               | Spanish `/admin`                                        | Basic operational parity; latest Lovable files required lint cleanup                                                                          |
| Legal/privacy                   | privacy, terms, SMS terms                                         | Spanish privacy, terms and SMS terms                    | Basic parity; legal review remains advisable                                                                                                  |

## Repairs completed during this audit

1. Removed the global “Para proveedores” footer link.
2. Removed `/proveedores` from the sitemap and marked the legacy URL `noindex, follow`.
3. Replaced the old provider-partnership/directory claim with a family-facing checklist for verifying real Spanish-language services.
4. Removed the copied `for-providers` generated resource.
5. Clarified on the homepage that treatment cards explain provider types and are not a copied directory.
6. Removed state-page claims that a treatment directory is available.
7. Added a regression check that rejects a provider-directory link or sitemap entry.
8. Added unique Spanish short answers, categories and appropriate next steps for all 29 family-answer routes.
9. Expanded Spanish coaching content and connected it to the existing PayPal checkout.
10. Replaced “emergency coaching” wording with truthful “private sessions” wording.
11. Expanded intervention triage and emergency boundaries.
12. Cleaned up the newly pulled admin source so repository lint passes without `any` errors.
13. Reconciled newer Lovable work and preserved the Monday meeting rename to **La Sobremesa**.
14. Changed homepage CTAs to open registration, coaching and intervention journeys directly instead of scrolling to generic sections.
15. Added an always-visible mobile phone action and routed Spanish sign-in links to AyudaSobria’s local authentication.
16. Restored client and server Cloudflare Turnstile verification while retaining the honeypot, time trap, rate limit and 16 KB body cap.
17. Rewrote registration success copy to describe the actual manual email handoff rather than promising automated Zoom delivery, reminders and a preparation guide.
18. Removed unsupported forum, private library, webinar, recording, premium-tool and free-trial claims; the current membership offer now describes only the implemented coaching discount and plan management.
19. Corrected the mistranslated blog title “Cigarrillos y Deseos” to “Disparadores y deseos de consumo” and localized all 137 meeting-time references.

## Remaining priorities

### High: build the Spanish member experience

The current AyudaSobria route tree does not contain a private forum, complete education library, webinars, recordings, Q&A or premium tools. Those benefits were removed from sales copy. Build and test them before adding them back.

### Operational blocker: registration configuration and fulfillment

Production previously lacked the Turnstile site key and therefore could not accept registrations. Configure both Turnstile keys after publication. The current endpoint emails the submission internally; it does not register the attendee with Zoom, send a Zoom link automatically, schedule reminders, persist the lead or handle repeat attendance.

### High: interactive assessment parity

Build a genuine Spanish family-situation assessment and addiction-signs assessment using non-diagnostic language, safety branching and clear next steps.

### High: member education parity

Create Spanish member home, education tracks, forum/community, recordings/webinars and Q&A before promoting full membership parity.

### Medium: content-tool parity

Translate/adapt the most-used English worksheets and roadmap stages first. Do not index the current generic resource leaves merely to match the English URL count.

### Medium: deeper family-answer parity

The 29 Spanish pages now answer their actual questions, but the English pages contain additional situation-specific paragraphs and related-answer navigation. Add that depth through editorial translation before indexing the Spanish answer details.

## Verification expectations

- Provider directory stays out of the Spanish sitemap, navigation and global footer.
- A treatment-type page must never imply that a listed English provider serves Spanish-speaking families.
- All meeting references remain Monday at 7 PM Pacific.
- Spanish copy uses AyudaSobria’s `(458) 298-8011` number.
- Transactional and thin pages remain noindexed.
- New Spanish member benefits must be exercised end to end before being advertised.

## Local verification result

- TypeScript passed.
- All 17 route/content regression checks passed, including provider-directory exclusion, registration security and truthful fulfillment copy.
- ESLint passed with zero errors (six existing Fast Refresh warnings).
- Production build passed.
- The built sitemap contains 165 intentional indexable URLs; all 165 returned HTTP 200.
- No `noindex` page appears in the sitemap.
- `/proveedores` returns `noindex, follow` and is absent from the sitemap and global navigation.
- All 29 family-answer slugs have a matching Spanish direct-answer record.
- Homepage registration, coaching and intervention CTAs resolve directly to the intended journeys.
- Unknown routes return HTTP 404 and an oversized registration request returns HTTP 413.
- Production Turnstile configuration and the complete Zoom/reminder workflow remain external operational work; this source audit does not claim they are live.
