# BLOCKY STORY ENGINE — Hook Bank & Rotation Matrix

## 1. The Rules of the First 1.5 Seconds
YouTube Shorts and Instagram Reels retention is decided in the first 1,500 milliseconds (45 frames at 30 fps). To maximize hook hold-rate:
1. **Never greet**: No "Hey guys", "Welcome back", "Today we're gonna...", or "Watch until the end".
2. **Immediate visual punch**: Frame 0 must show an expressive character face in medium closeup OR a dramatic prop centered at eye level with strong lighting contrast.
3. **Dialogue starts at $t \le 0.2\text{s}$**: Voice audio kicks in right away.
4. **Line word limit**: The hook line must be $\le 8$ words (maximum 9 words under any circumstance).
5. **Clear tension or paradox**: Present an incomplete equation that demands resolution (e.g. "Two items $\to$ now zero", "A locked door $\to$ a glowing key").

---

## 2. Hook Formulas & Patterns

| Formula Code | Pattern Name | Structural Skeleton | Target Emotion | Example Line |
|---|---|---|---|---|
| **H1** | **The Disappearance** | "There were [count] [items]. Now? None." | Confusion / Curiosity | *"Two cookies. One plate. Now? Nothing."* |
| **H2** | **The Crisis Event** | "The [familiar place] just turned into [hazard]!" | High Energy / Urgency | *"The floor just turned into molten lava!"* |
| **H3** | **The Forbidden Mystery** | "Midnight. Strange [sounds/lights] above our [room]." | Intrigue / Suspense | *"Midnight. Strange scraping sounds above our ceiling."* |
| **H4** | **The Wrongful Blame** | "Someone [did ridiculous thing] and blamed [person]." | Injustice / Outrage | *"Someone took the pizza and framed Mox."* |
| **H5** | **The Impossible Obby** | "Nobody has ever beaten Stage [N] without falling." | Challenge / Defiance | *"Stage nine is totally impossible to cross!"* |
| **H6** | **The Confession Slip** | "I'm not supposed to show you what's in here." | Secret / Taboo | *"We were never supposed to open this trunk."* |

---

## 3. Anti-Repetitiveness Rotation Matrix

To prevent triggering YouTube's *Inauthentic & Repetitive Content* detection algorithm, consecutive shorts MUST NOT share:
- The same hook formula code ($H_i \neq H_{i+1}$)
- The same opening word or sentence stem
- The same primary environment/set
- A vocabulary Jaccard similarity $> 0.25$

### Recommended Episode Rotation Schedule:

| Episode | Title | Format | Hook Code | Opening Hook Line | Set | Mood |
|---|---|---|---|---|---|---|
| **EP 01** | The Crumb Trail | Mystery-Comedy | **H1** | *"Two cookies. One plate. Now? Nothing."* | `kitchen` | `day` |
| **EP 02** | The Floor is Lava | Challenge/Obby | **H2** | *"The floor just turned into molten lava!"* | `obby` | `obby` |
| **EP 03** | The Secret Attic | Suspense-Comedy | **H3** | *"Midnight. Strange scraping sounds above our ceiling."* | `spookyHouse` | `night` |
| **EP 04** | The Hallway Heist | Misunderstanding | **H4** | *"Someone took the pizza and framed Mox."* | `hallway` | `day` |
| **EP 05** | The Tower Jump | Challenge/Obby | **H5** | *"Stage nine is totally impossible to cross!"* | `obby` | `sunset` |
| **EP 06** | The Hidden Vault | Suspense-Comedy | **H6** | *"We were never supposed to open this trunk."* | `bedroom` | `sunset` |

---

## 4. Forbidden Brand & Trademark Blacklist
The following words must be strictly excluded from all titles, dialogue, tags, and metadata to protect channel monetization and IP independence:
- `roblox`, `blox`, `bloxy`, `robux`
- `minecraft`, `mine craft`, `creeper`, `steve`
- `fortnite`, `v-bucks`
- `lego`, `minifigure`
- `noob skin`, `bacon hair`
- Any imitation of proprietary platform audio or sfx assets.
