# Admin scope and Travel Information

## Current responsibility boundary

All seven admin workflows remain: provider verification, listing approval, 90-day re-verification, events, managed locations, review moderation and Association enquiries. Staff permissions, reporting, decision history and shared storage are retained.

The combined /community page and its navigation have been removed. The tourist event/attraction browsing, event-saving, review-authoring and enquiry-conversation screens, and the extra vendor conversations panel added in this chat have been removed. The extra vendor attraction editor has also been removed, returning vendor listing forms to the original three categories. No records or underlying domain operations were erased. Attraction and other module records remain available to the admin and to teammates integrating their own interfaces.

Existing login, accommodation/transport/restaurant searching, booking forms, vendor business verification, listing management, and the vendor-route fix remain. Domain tests for review, enquiry, event and attraction integration are intentionally retained for the shared admin functionality.

## Travel Information

The existing home page now includes a Travel Information card leading to /travel-information. It uses ServiceShared's Hero and shared service-page styles: the same header, typography, filters, white cards, navigation controls and responsive layout. It has no event/review/enquiry or attraction interface.

Administrators create guides, travel essentials and alerts in Visitor information and set them to Published. The user page reads those same records, showing published content only. Search, information-type filters and language selection are available; missing Malay/Chinese translations fall back to English. Draft and archived records stay hidden. Empty states explain when no articles have been published.

## Admin visual consistency

Admin background: #f3f6fc. Main text: #14213d. Muted text: #5b6784. Primary blue: #2a6df4. Borders: #c3cce0. Light surfaces: #eef2fb. The sidebar and overview banner use the same landing/vendor gradient: linear-gradient(135deg,#0f1b38,#1c3a8c 55%,#0e7c86). Heading typography now follows the existing Segoe UI family. Success/warning/error colours remain semantic and align with the existing vendor statuses.

Keyboard focus, visible form labels, named dialogs, validation messages, skip links and responsive layouts are retained. Browser-local persistence and demo authentication are unchanged.

## Verification

20 shared workflow tests pass. Production build and change-format checks pass. Rendering checks cover the home card, Travel Information route/publication filtering, vendor/admin screens and each admin section. There are no remaining imports or links to the removed combined page. No interactive browser/visual check was performed during this cleanup.

## Run and handover

Run npm run dev from the project directory. System admin: admin@stayfinder.com / admin123; content admin: content@stayfinder.com / content123; management: management@stayfinder.com / manage123; vendor: vendor@example.com / vendor123. Choose the matching role at login.

For teammate integration, use the existing TourismRepository/GovernanceOperations boundary and shared records. The removed visitor and provider screens should be supplied by their assigned owners. Do not clear browser storage when integrating their modules. No GitHub commit, push or deployment was performed.


## Travel Information enhancement

Article cards now have optional images, summaries and a Read more action. Full reading pages support paragraph breaks and ## headings, practical tips, culture, transport and accessibility sections, source links and last-checked dates. Admins can preview before saving. Filters include topic, division and town; content applying to all Sarawak remains available in area searches. Optional translations still fall back to English.

Published alerts require a start/end window and recommended action, with severity labelled in words. Active alerts are prominent; scheduled alerts are labelled; expired alerts are automatically excluded from visitor pages. Legacy articles remain readable without the new optional fields. Content review-due dates produce an admin overdue indicator. No factual tourism content, sources or photos were fabricated.

System administrators and Management also have read-only booking oversight. The existing booking form remains untouched and still needs to save shared records. See booking-integration.md for the data contract. There are no admin acceptance, cancellation or refund controls.

Verification for this enhancement: 23 workflow tests and the production build pass, alongside full-article/admin-booking rendering checks. No interactive visual browser check was performed.
