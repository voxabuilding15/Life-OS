# Play Console -> App content -> Data safety

Verified against the code: the only network destinations are Supabase (auth, REST, storage), RevenueCat (via Google Play Billing) and Firebase Cloud Messaging. There is no analytics, ads or crash-reporting SDK. Re-check this file whenever a dependency that touches the network is added.

**Does your app collect or share any of the required user data types?** Yes (collects). Sharing: **No**. Service providers that process data on our behalf (Supabase, Firebase, RevenueCat) are not "sharing" under Google's definition.
**Is all of the user data collected by your app encrypted in transit?** Yes (TLS).
**Do you provide a way for users to request that their data is deleted?** Yes: in-app (Settings -> Delete account) and a web URL (`account-deletion.md`, publish it and paste the URL in Play Console).

| Data type (Play category) | Collected | Shared | Purpose | Optional? |
| --- | --- | --- | --- | --- |
| Personal info -> Email address | Yes | No | Account management | No (needed for an account) |
| Personal info -> Name | Yes | No | App functionality (display name) | No |
| Photos and videos -> Photos | Yes | No | App functionality (profile photo) | Yes |
| App activity -> Other user-generated content (tasks, notes, journal, goals) | Yes, **Pro cloud sync only** | No | App functionality | Yes |
| Financial info -> Purchase history | Yes | No | App functionality (entitlement) | Yes |
| Device or other IDs | Yes (push token, anonymous purchase ID) | No | App functionality | Yes |

Not collected: location, contacts, health and fitness, messages, audio, files, calendar, web history, advertising ID, crash logs, diagnostics.
Data is not used for advertising, analytics or personalisation by third parties, and is not sold.

## Other declarations
- **Ads:** none. **Target audience:** 13+ (do not opt in to Families / children).
- **Content rating (IARC):** no violence, sexual content, gambling, drugs, or user-to-user interaction; expect Everyone / PEGI 3.
- **Permissions in the release manifest** (verified by `npm run verify:release -- --build`): `INTERNET`, `POST_NOTIFICATIONS` (reminders), `VIBRATE` (haptics). Photos use the system picker; no storage/camera/microphone/location permissions.
- **Subscriptions:** declare in-app purchases; base plans `monthly` and `yearly` with a 7-day free-trial offer on yearly. Show price and trial terms before purchase (the paywall does).
- **App access:** reviewers need a test account. Provide an email + password in Play Console -> App access.
