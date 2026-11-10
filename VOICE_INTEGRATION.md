# Spoken replies and local memory

Every new answer, including typed chat, is sent to /speak and played with voice A. Saved-history restoration is silent. Tests explicitly verify typed replies generate/play WAV without opening the microphone or using Chrome voices. 42 tests and Python checks pass.

Before VoxCPM generation, local_voice.py now unloads only the configured local Ollama understanding model to free unified memory. It does not unload remote/cloud models. The next plan reloads Gemma, adding startup time. Same short text generated in8.72s without Gemma resident; earlier resident-model renders stalled over60s. An owner's in-progress request completed after freeing memory and Chrome resumed the conversation. This does not establish broad latency percentiles or native accent quality. Server PID499,21notes preserved.

# Saved chat history

The owner requested automatic chat saving. Text now persists in this browser only (localStorage melyia-voice-chat-v1), including voice transcripts and assistant replies. Audio remains temporary. Refresh restores messages and up to4context messages without replaying audio/actions or restoring pending confirmations. Clear-history icon asks confirmation and clears only chat/context, preserving cart. Stopping/closing keeps the chat. There is no account/cloud/device sync; clearing browser data or ending private browsing can remove it. Storage failures are shown instead of silently claiming success. Invalid stored history is preserved and not overwritten until the owner clears it.

42 web tests/typecheck/lint/build and widget checks pass. Chrome confirmed the real demo messages remain after refresh without console errors or starting the microphone. This changes the older no-chat-storage statements below; those describe earlier versions. Live deployment remains blocked.

# Compact chat UI

Latest owner request: normal chat, just a microphone, no heading or explanation paragraphs. The widget now shows messages and a composer with send/mic controls. Microphone and typed send connect automatically. A mic launcher opens the panel; close stops it. Existing voice A, raw transcripts, memory limits, confirmation controls and no-storage behavior remain. 37 web tests/typecheck/lint/build and widget checks pass; Chrome verified the compact layout without console errors. Real microphone/voice listening quality still needs owner testing.

# Selected voice A

Owner chose A (the earlier saved greeting). Every generated reply now uses samples/voice-a.wav as the synthesis reference, with the exact original reference transcript. This replaces the previous samples/bahraini.wav reference. The displayed/spoken new greeting remains «هلا والله! شنو تبي؟», regenerated from A and served with a new cache key. Voice quality/identity still needs owner listening review; using a reference does not guarantee identical timbre for every sentence. No browser speech fallback. Existing dynamic rendering limits below still apply.

# Latest voice update: previous Bahraini engine for all replies

Owner explicitly wants the previous Bahraini voice for every answer, accepting the latency implication, and asked to remove «تفضل قول». The greeting text/audio is now «هلا والله! شنو تبي؟»; a real synthetic read-back confirms those words without the removed phrase.

Every new website reply now POSTs text to /api/assistant/speak and plays generated WAV audio. No browser speech fallback remains. Uses existing .tts VoxCPM2-8bit and the previous synthetic samples/bahraini.wav reference (no human cloning). An isolated short-lived process releases model memory after each generation. Reply audio exists only in a private temporary directory, deleted on success/failure; response is no-store. No persistent speech cache or transcripts are created. Shared model semaphore prevents website STT/plan/TTS overlap. Stop aborts the browser request and discards late audio; a running server render may finish before its model slot releases (180s maximum).

The opt-in voice page permits blob audio playback through scoped media-src; ordinary-page policy is unchanged. Microphone stays off during rendering/playback. Generation failures show an error and text, without silently switching voices. All 35 web tests, type checks/lint, production build and offline Python/widget checks pass. Actual /speak HTTP test generated 337,980-byte WAV in 13.17s. It is still a slow local prototype; real listening/accent review and microphone calibration are pending. Live Cloudflare publishing is still blocked.

---

# Latest demo update: BHD and voice conversation (2 November 2026)

The owner authorized arbitrary demo BHD prices: Al Deera 4.500, Al Zain 6.500, Al Ward 4.000, Al Bait 5.000, Honey Box 12.000. Stable product IDs/URLs and original photos/origins remain. Storefront catalog is static for this demo, so a legacy MYR API cannot override its BHD values. Legacy *Sen fields hold integer fils only in the isolated demo. Backoffice server money still uses MYR; no real Firebase records were converted.

New cart, purchase-history and receipt keys isolate BHD demo state from old MYR data. Checkout is explicitly local demo only: no order/payment/provider request, BHD1 delivery/free from BHD12. Original archived files are unchanged.

Optional Start voice conversation plays the exact earlier cached VoxCPM greeting (public/static/voice/greeting.wav), listens until two seconds of quiet, transcribes automatically, sends the request, speaks the reply and listens again. No language selector. Exact spoken confirmation approves only a displayed action; cancellation and Stop release the microphone. No microphone during speech playback. Stop pauses and discards cached playback; playback failure ends the conversation rather than silently using a different greeting voice. New free-form replies still use the browser voice; the previous generated voice is not yet used for arbitrary answers. Eight seconds of no speech ends the session. A maximum of four recent messages stays in RAM and is cleared on Stop/close; none is saved to notes or contributions. Manual record/edit/send remains available.

Test script and demo prices: VOICE_SCRIPT.md. Production build, lint and type checks pass. All 33 web tests pass, including a late-transcription-after-Stop regression. Voice checks use synthetic microphone/playback events; real microphone calibration and listening remain pending. Chrome confirmed BHD4.500 for Al Deera and a follow-up weight answer of 500g, with no console errors. Live publication remains blocked as below.

---

# Melyia original-site voice pilot and Arabic

Restored from `/Users/samyaegrowth-inc.com/Downloads/Melyiahoney.zip` (15 July 2026), which names Worker `melyia-honey` and the exact `melyia-honey.byduty.workers.dev` URL. A second archive is in `/Users/samyaegrowth-inc.com/project/Melyiahoney.zip`. Original archives remain untouched. Dependencies/build output, nested worktrees, Git internals and local environment secrets were excluded from restoration; dependencies were installed from the frozen lockfile.

Original-site preview: http://localhost:3000/?voice-test=1
Voice model service: http://127.0.0.1:8000/api/assistant

This uses the actual Next.js source and public assets, not the simplified voice demo on port 8000. Keep both processes running. Web log: `/tmp/melyia-original-3000.log`; voice log: `/tmp/voice-server-8000.log`.

## Owner-approved changes

- Arabic is the default language, with `ar-BH` and RTL direction. English remains available with LTR direction. Malay was removed. Old saved Malay preferences fall back to Arabic; saved English preferences still work.
- Existing translated storefront, checkout, account, admin and reseller strings now have Arabic translations. Product names and origins are translated in the UI; source product facts and original photography/packaging remain intact.
- Logical spacing/alignment and directional icons adapt to RTL; email, phone and numeric inputs remain LTR. Price text uses bidirectional isolation in product cards/details.
- The website assistant's labels adapt to the page language, and its speech language remains automatically detected, independent of the site-language choice. Bahraini Arabic remains the primary speech/understanding focus.
- The assistant appears only with `?voice-test=1`. The root layout loads `public/voice-assistant.js` after hydration, with a loopback endpoint on the owner's Mac. No account, checkout, admin or reseller data is exposed to the voice model; only advertised public product facts and the current command are sent.
- Product actions use owner-supplied IDs and English metadata so an Arabic site interface does not break product identification. Add-to-cart and fill actions still require explicit confirmation.
- The opt-in page alone permits same-origin microphone access and connection to the exact loopback assistant origin. Ordinary page visits keep the original microphone restriction and do not show the voice panel. Other existing security headers remain.

## Verified

- Type checks, lint, 23 web tests, and the regular Next.js production build pass.
- Tests cover Arabic/English directions, removed Malay option, stale Malay preference fallback, interpolation, live voice-panel label switching and the scoped pilot policy.
- Voice project validation/confirmation/pilot tests pass. Exact port-3000 origins can reach the assistant API; the note count remains 21.
- Chrome verified the original home page, assistant connection, and a confirmed Kelulut cart addition with the interface still in Malay before translation. After translation, Chrome verified Arabic -> English LTR -> Arabic RTL and the Arabic voice panel. The raw original product images and layout are retained. A Bahraini price question initially returned the wrong currency (dinars); source-currency instructions were corrected, and the repeat correctly returned 42 Malaysian ringgit. This single check is not a general model-accuracy guarantee.

## Still pending

No live deployment has been made. The archive may predate changes on the public site: compare the authenticated current Worker/source before deploying, preserve current bindings/assets and a rollback, and apply this feature without overwriting newer work. Cloudflare deployment login was expired, and its dashboard previously reported unavailable. Signing in to the status-notification service does not restore deployment access.

The regular Next.js build was checked; the OpenNext Worker deployment and the live HTTPS-to-loopback Chrome permission flow have not been run. Real microphone capture, mobile/Safari, native Bahraini language review and authenticated account/admin/reseller flows remain untested. This restored copy does not load private Firebase configuration. Public deployment needs a reachable protected model backend; localhost powers only the owner testing on this Mac.

Canonical reusable widget: `/Users/samyaegrowth-inc.com/chatbot/voice/static/assistant/widget.js`. After changing it, copy it to `apps/web/public/voice-assistant.js` and rerun the widget/web checks. No new Git commits were made.
