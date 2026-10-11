# Play Console -> App content -> Data safety (answers matching the app)

Does the app collect or share user data? **Yes, collects. No, does not share with third parties for their own use** (service providers acting on our behalf are not "sharing").
Is all data encrypted in transit? **Yes.**
Can users request deletion? **Yes**, in-app (Settings -> Delete account) and via the privacy policy.

| Data type | Collected | Purpose | Optional | Notes |
| --- | --- | --- | --- | --- |
| Email address | Yes | Account management | No | Supabase Auth |
| Name | Yes | App functionality (display name) | No | |
| Photos | Yes | App functionality (profile picture) | Yes | Supabase Storage |
| Other user-generated content (tasks, notes, journal, goals) | Yes (Pro cloud sync only) | App functionality | Yes | Stored on device for Free users |
| Purchase history | Yes | App functionality (entitlements) | Yes | Google Play / RevenueCat |
| Device or other IDs | Yes | App functionality (push token, anonymous purchase ID) | Yes | |

Not collected: location, contacts, financial info, health info, web browsing, audio, files, calendar, advertising ID.

# Other App content declarations
- **Ads:** none. **News app:** no. **Government app:** no. **Financial features:** no.
- **Target audience:** 13+ (do not select "children"; the app is aimed at 15-30).
- **Content rating (IARC):** no violence, sexual content, gambling, or user-to-user interaction -> expected Everyone / PEGI 3.
- **Permissions:** `INTERNET`, `POST_NOTIFICATIONS` (reminders), `VIBRATE` (haptics). Photo picking uses the system picker; no storage permission is requested.
