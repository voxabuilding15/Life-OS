# Life OS Privacy Policy (DRAFT: have it legally reviewed, then host it at a public URL)

Last updated: <date>

**Who we are.** Life OS is operated by <legal entity>, <address>. Contact: <email>.

## Summary
Life OS works offline and stores your data on your device. If you create an account, we store your account details. If you subscribe to **Life OS Pro**, your content is also backed up to your account in the cloud. We do not show ads, do not sell your data, and do not use third-party analytics or advertising SDKs.

## What we collect and why
| Data | When | Why |
| --- | --- | --- |
| Email address, display name, password (hashed) | You create an account | Sign-in and account management (Supabase Auth) |
| Profile: focus areas you pick, XP and level, optional profile photo | Onboarding / profile | Personalise the app; the photo is only uploaded if you choose one |
| Your content: tasks, habits and check-ins, goals, notes, journal entries, focus sessions, achievements | You use the app | Stored on your device. **With Pro**, also synced to your account so you can use multiple devices and restore data |
| Subscription status, purchase identifiers | You subscribe | Unlock Pro (Google Play Billing via RevenueCat). We never see your payment details |
| Push notification token | You allow notifications | Deliver notifications (Firebase Cloud Messaging) |

Reminders you schedule (task, habit, daily and weekly) are created on your device and do not require our servers.

## Who processes your data
Service providers acting on our behalf: **Supabase** (database, authentication, file storage), **Google Firebase** (push delivery), **RevenueCat** and **Google Play** (subscriptions). Data is encrypted in transit (TLS). Row Level Security restricts each account to its own rows.

## Retention and deletion
You can delete your account and all synced data at any time: **Settings -> Delete account** in the app, or follow the steps at <account deletion URL> (see `account-deletion.md`). Deletion is permanent and removes your profile, content, photo and push token from our systems. Data that exists only on your device is removed when you uninstall the app or sign out.

## Your rights
Depending on where you live you may have the right to access, correct, export or delete your data, and to object to processing. Contact us at <email>.

## Children
Life OS is not directed to children under 13 and we do not knowingly collect their data.

## International transfers
Our providers may process data in countries other than yours, under appropriate safeguards.

## Changes
We will post updates here and change the date above.

Contact: <email>
