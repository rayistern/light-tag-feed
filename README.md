# light-tag-feed

**Hold: `parties.json` stays empty until Rayi approves the party list.** Once chabadlabs.ai serves `chanukah/config.json` with this file as `partiesUrl`, whatever is in it shows on every installed Light Tag phone, with no app or website change. Nothing goes in it before his approval.

`parties.json` is the party list the Chanukah Hunt apps read, served at
<https://rayistern.github.io/light-tag-feed/parties.json>.

A change to `parties.json` on `main` is live a minute or two after the push.
The apps show nothing when the file is missing or not a version-1 feed, so a
broken edit hides every party: check the file before pushing.

```json
{"version":1,"parties":[{"id":"midtown-1206","name":"Chabad of Midtown Menorah Lighting","lat":40.7549,"lng":-73.984,"starts_at":"2026-12-06T22:30:00Z","ends_at":"2026-12-07T00:30:00Z","details":"Latkes, donuts and a fire show. All welcome.","link":"https://example.org/chanukah","kind":"menorah","scale":1}]}
```

- Required: `id` (unique, a-z 0-9 and -, up to 40), `name` (up to 80), `lat`, `lng`, `starts_at` (UTC to the second, ending `Z`, no fraction).
- Optional: `ends_at` (after the start; left out means three hours), `details` (plain text, up to 500), `link` (https only), `kind` (`menorah`, `dreidel`, `gelt` or `donut`; left out means menorah), `scale` (1 to 3).
- At most 200 parties. Take a party out once it has ended.

`node check.mjs parties.json` says whether the list is good; it also runs on every push (see the Actions tab).

## config.json

`config.json` holds settings the apps read, served at
<https://rayistern.github.io/light-tag-feed/config.json>. Today it is `{"version":1}`: nothing is set, so nothing happens.

- minBuild (integer: phones on a lower build see 'please update'), storeUrl (optional, https apps.apple.com or play.google.com)
