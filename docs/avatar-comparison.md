# Avatar comparison

A side by side test of the two avatar providers on the same round, covering lip sync quality, response delay and cost per round.

## Decision

After this comparison, the client found AI Twin's expressions unnatural, so two more lifelike providers were tested the same way: Anam and LiveAvatar (by HeyGen). On 5 October 2026 the client chose **Anam**, and the app now runs on Gemini and Anam only.

|                              | AI Twin               | Tavus                       | Anam                                 | LiveAvatar                         |
| ---------------------------- | --------------------- | --------------------------- | ------------------------------------ | ---------------------------------- |
| Look                         | Animated photo        | Lifelike video              | Lifelike video                       | Lifelike video                     |
| Response delay (first tests) | About 2.7 s           | About 1.2 s                 | About 1.2 to 1.5 s                   | About 1.0 s                        |
| Billed by                    | Characters spoken     | Minutes the session is open | Minutes the session is open          | Minutes the session is open        |
| Cost per round               | About $0.39 (Starter) | About $5.90 (Starter)       | About $1.96 (Explorer)               | About $1.80 (Essential)            |
| Custom avatar                | From one photo        | From a 2-minute video       | From one photo, adults only          | From one photo, Essential or above |
| Sessions at once             | Not stated            | 3 on Starter, 10 on Growth  | 1 on Free and Starter, 3 on Explorer | No limit on paid plans             |

Prices from each provider's pricing page: AI Twin and Tavus on 30 September 2026, Anam and LiveAvatar on 2 October 2026, session limits on 5 October 2026. Recheck them before quoting. The AI Twin and Tavus integrations are still in the code and come back when their keys are set. The rest of this document is the original AI Twin and Tavus test.

## Setup

- Switch provider with the AI Twin | Tavus toggle in the header, or with `AVATAR_PROVIDER` in the environment. Nothing else changes between the two runs.
- Use the same settings for both: motion _Under-16 Social Media Ban_, side **Proposition**, level **JC**, model **Gemini**.
- Open the practice page with `?timing` at the end of the address, for example `/practice?timing`, and keep the browser console open.
- Keep the AI voice on. The timing is only printed once the avatar starts speaking.
- Record the screen with sound for the whole round.

## Test round

Speak these three speeches in order, each after the avatar finishes its reply.

1. Social media should be banned for children under sixteen. These apps are designed to be addictive, with infinite scroll and autoplay. A thirteen year old cannot fight systems built by thousands of engineers.
2. My opponent says children will get around the ban, but that is not a reason to do nothing. We have age limits for alcohol and driving, and some teenagers break those rules too, yet the rules still reduce harm. The US Surgeon General found that teens who use social media for more than three hours a day face double the risk of depression and anxiety.
3. A ban also helps parents, because it turns "you are the only one who can't" into "no one your age can". And if enforcement is weak at first, the answer is to make age checks stronger, not to give up on protecting children.

## How each measure is taken

**Response delay.** After every reply the console prints `[timing] reply text after Xs, speech after Ys`, both counted from the moment the student ends the turn. _Speech after_ is what the student feels. The gap between the two numbers is the avatar's own delay. Report the average of the three replies.

**Cost per round.** The two providers bill differently. AI Twin bills the characters the avatar speaks; premium voices count 5×. Tavus bills every minute the call is open, including listening and thinking, with a 30-second minimum per call. Apply the provider's own pricing page, with the plan and the date it was checked.

**Lip sync.** Score each reply from 1 to 5 from the recording, then average:

| Score | Meaning                                          |
| ----- | ------------------------------------------------ |
| 5     | Mouth matches every word, looks natural          |
| 4     | Small slips a viewer would rarely notice         |
| 3     | Noticeable drift on some words, still followable |
| 2     | Often out of sync or robotic                     |
| 1     | Mouth and voice clearly do not match             |

## Results

Measured on 30 September 2026 with Luke's keys, two replies per provider, the sample AI Twin avatar "Zoe" and the Tavus stock face "Anna".

|                                | AI Twin                                                        | Tavus                                                                       |
| ------------------------------ | -------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Reply text after (average, s)  | 4.2                                                            | 4.4                                                                         |
| Speech after (average, s)      | 6.9                                                            | 5.6                                                                         |
| Avatar delay (average, s)      | 2.7                                                            | 1.2                                                                         |
| Start-up                       | Loads with the page, about 5 s                                 | Joins 6 to 11 s after the student starts speaking, hidden behind the speech |
| Lip sync (1 to 5, provisional) | 3                                                              | 4                                                                           |
| Billed by                      | Characters spoken                                              | Minutes the call is open                                                    |
| Cost per round, Starter plan   | $0.39 standard voice, $1.96 premium                            | $5.90 within the plan, $3.70 at the overage rate                            |
| Free tier                      | 10k characters a month: about 2.5 rounds standard, 0.5 premium | 25 minutes a month: about 2.5 rounds                                        |

Cost assumptions: a 10-minute JC round with five AI replies of about 120 words (about 800 characters each), so about 4,000 characters spoken and 10 minutes of call. Prices from the providers' pages on 30 September 2026:

- AI Twin (aitwin.me/pricing): Starter $49 a month for 500k characters, Growth $99 for 1M, Scale $299 for 3M. Standard voices count 1×, premium and custom voices 5×.
- Tavus (tavus.io/pricing): Starter $59 a month for 100 conversation minutes, then $0.37 a minute; Growth $397 for 1,250 minutes, then $0.32. The same page also shows a second, different table (for example Starter $59 for 175 minutes), so confirm with Tavus before quoting.

Lip sync is provisional, scored from still frames. Confirm it from the screen recording before sharing.

## Notes

- Both free tiers add a watermark.
- The sample avatar "Zoe" uses a premium voice, so each spoken character counts five times. The custom student avatar, built from a fictional photo, uses the standard voice `visemetts:rex` by default.
- A custom AI Twin face changes only the look. Lip sync, expressions and idle movement come from AI Twin's own pipeline. The app softens the frowning that its mood tagging adds to argumentative lines.
- AI Twin speaks each reply once the full text is ready. Tavus does the same, so both are compared on equal terms.
- AI Twin renders in the page as an animated photo with expressions. Tavus streams a video of a real-looking person.
- The AI Twin npm package (`@streamoji/aitwin`) does not state a licence. Worth confirming with AI Twin before production.

## Recommendation

On cost, AI Twin with a standard voice is about ten times cheaper per round than Tavus, and it does not charge while the student speaks, which matters for long rounds and school-wide use. On realism and speed, Tavus looks more lifelike and starts speaking about 1.5 seconds sooner. If price at scale matters most, AI Twin with a standard voice. If the avatar's realism is the selling point, Tavus. Luke can try both from the header toggle before deciding.
