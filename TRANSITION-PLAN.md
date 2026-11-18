# Portfolio transition plan

Saved on 18 November 2026.

[Certain] The author approved the following seven transitions. These transitions are implemented.

1. **Navigation-line handover.** The selected navigation link's underline extends across the header, then sweeps down to reveal the destination. The movement should feel quick and deliberate.
2. **Book-cover entrance to Writing.** The novel's cover travels from its position on Home into the Writing page as the library appears around it.
3. **Contact button becomes the form.** The clicked Get in touch button's outline moves into the contact form's outer panel. Its surface expands into the contact gradient before the fields become available.
4. **The name connects Home and About.** Muhammad Subhan remains visible during the handover and settles into its position on About as the surrounding layout changes.
5. **Event identity carries into its story.** The clicked event's logo stays visible and moves into the detail page's heading area. The full article appears around it.
6. **Immediate navigation response.** The clicked link's underline starts moving immediately. The handover completes when the destination is ready.
7. **Matching return from Writing.** Leaving Writing brings the cover forward as the library recedes. Returning Home settles the cover into the novel section.

[Certain] The requested character is quick, intentional, distinctive and continuous between pages. The author rejected the other proposed slide, split, turn and typography-reveal alternatives.

[Certain] The author also approved distinctive responses for the following actions, with shared timing and rhythm. These transitions are implemented.

- Copy address. Two overlapping outlines align, then resolve into a drawn checkmark.
- Send message. The button's surface becomes the confirmation area, where the large checkmark appears.
- Download contact card. A small contact-card outline moves into the download symbol.
- Open the reader. The cover opens into the reading view.
- Next and previous page. The page turns in the corresponding direction.


## Verification and recovery

[Certain] Verification covered 19 automated tests, 16 native page transitions at 390 and 1440 pixels, Back navigation, rapid clicks, reduced motion, the ordinary-navigation fallback, contact confirmation, note downloads and reader opening/turning/interruption. The accessibility scan found zero violations in 28 page scans. The native-transition browser tests run in the repository workflow.

[Certain] The recovery branch is `codex/backup-before-transitions-2026-11-18`, based on commit `3c0f23ccdf6eeb323435c3d3b636dbf440316f88`. Local copies are in `artifacts/pre-transitions-2026-11-18.zip` and `artifacts/pre-transitions-2026-11-18.bundle`. The previous Cloudflare deployment is `c308a917-1c71-4f7a-bfdd-e3992defbaa1`. These provide source recovery and a production rollback target.

[Certain] Shared-element transitions use native browser support. Other browsers receive ordinary page navigation with the navigation-line response. Reduced-motion settings suppress the movement. Testing used desktop Chrome with phone-sized viewports. Physical-device Safari testing remains outstanding.

[Certain] On narrow screens, a travelling book keeps its destination cover visible. The Get in touch button brings the form into view. The main Contact navigation link opens the page from the top, where the contact card is available.
