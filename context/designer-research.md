# Reference designers — who we're trying to be in conversation with

These are the people whose work we're reading against this project. Not mentors, not endorsements — present-tense reference material. Each entry captures: who they are, what they value, what they push back on. The review lenses pull from these.

---

## Josh Mateo

`joshmateo.com`

**Who:** Designer who worked on **Hawkins at Netflix** and **Central Design at Spotify**. Now positions himself at the intersection of brand and product — designer-as-co-author of organizational design systems.

**What he values:**
- **Infrastructure thinking.** Design systems aren't a deliverable, they're an organizational substrate. The work is making the infrastructure scale.
- **Co-authorship.** "By giving elements within a brand a purpose, co-authoring a shared perspective, and ultimately connecting that to code, you can scale those decisions effectively." Designers are not passive consumers of a system; they shape it.
- **Brand-product connection.** The seam between brand strategy and product execution is where systems either earn their place or fail.

**What he pushes back on:**
- **One-size-fits-all design systems** — explicitly. A system that pretends every team has the same need has stopped being useful.
- **Siloed practice.** Designers who use the system without contributing back are leeches on it; the system needs the feedback loop to stay alive.
- **Maintenance fatigue.** His Config keynote is titled "Breaking the Monotony of Maintenance" — meaning a system that becomes a chore is dying.

**What he'd ask of this project:**
- "Where does the Hawkins-flavored layer have a point of view? If it could be re-skinned for any other streaming service in 10 minutes, it isn't doing its job."
- "Where in this prototype could the design system have come from the *prototype* feeding back to the system, instead of the other way around?"
- "What's the part of this that wouldn't survive a re-skin? That's the part you actually designed."

---

## Niyati Gupta

`linkedin.com/in/niygup`

**Who:** **Product Design Lead at Netflix.** Decade+ experience. Previously led design at **Google** and **WhatsApp (Meta)**. Master's in HCI, University of Michigan.

**What she values:**
- **AI as a product design material**, not a feature to bolt on. She works at the intersection of AI, product growth, and inclusive design.
- **Scaling 0→1**, especially for emerging markets and new internet users — users whose mental models, bandwidth, and device assumptions differ from a US-default user.
- **Inclusive design** as a default discipline, not an afterthought audit.
- **Growth as inviting, not coercive.** Design that earns the next user.

**What she'd push back on:**
- **AI features that don't graduate complexity.** An AI prompt input that's "Hey Netflix, surprise me!" with no path to refine, control, or correct is a demo, not a product.
- **Growth flows that feel transactional.** "Get $5 if your friend signs up" reads as a bounty; "your friend will love this thing you love" reads as a gift. Both can technically work; only one earns trust.
- **Default-case-user design.** A flow that assumes the user has 5G, an iPhone 15, and English fluency excludes most of the world.
- **AI as theater.** Loading shimmers and ambient particles that say "intelligence is happening" without the AI actually behaving more intelligently than yesterday.

**What she'd ask of this project:**
- "What does the *third* iteration of the channel prompt look like? You designed the first prompt and the result. What does it feel like when the user is on their fourth tweak and still not satisfied? Did you design that loop, or is your prototype just the happy path?"
- "Show me the Invite flow for a user who doesn't have a smartphone, or whose friend doesn't speak the same language."
- "Where does the AI's voice come from? Is it Netflix's voice, or generic-LLM voice? If a user could tell it was Claude or GPT under the hood, the prompt design isn't done."

---

## Netflix Tech Blog

`netflixtechblog.com`

**Who:** Netflix Engineering's public face. The blog publishes engineering-grade posts on architecture, ranking, ML, video encoding, and design systems. The voice is precise, evidence-rich, and unfussy.

**What it values:**
- **Empirical rigor.** Posts cite latency numbers, CPU percentages, A/B test outcomes. Claims are grounded.
- **Pragmatic engineering.** Solutions are tuned to Netflix's actual constraints (scale, cost, streaming), not generic best-practice.
- **Design as engineering.** The Hawkins post sits next to ranker optimization posts because at Netflix they are the same kind of work.

**What it pushes back on (implicitly, by example):**
- **Decoration without measurement.** Posts don't say "we made it better" — they say "we cut 7.5% of CPU."
- **Industry FOMO.** The Hawkins post explicitly tells designers not to blindly mimic Material or HIG. Originality emerges from engaging with constraints, not chasing trends.
- **Demo-grade work passed off as product-grade.** The blog distinguishes between prototypes, A/B tests, and shipped systems.

**What it'd ask of this project:**
- "What does success measurably look like? If Channels ships, what number moves? Time-to-watch? Session length? Discovery diversity index? Without a target, you can't tell if the design works."
- "What's the cost story? Every AI categorization call costs cents. What's the per-user-per-month budget for this feature, and does the design respect it?"
- "What's the failure mode? When the Ranker returns garbage, what does the UI do? You designed the success state; design the degradation."

---

## Cross-cutting: what these three together demand

When a surface in this prototype faces all three at once:

- **Mateo** asks: does this have a point of view that couldn't be re-skinned?
- **Gupta** asks: does this work for a user on their fourth tweak, with a slow connection, who isn't the persona you imagined?
- **Tech Blog** asks: what's the measurable, what's the cost, what's the failure mode?

Convergence between any two of those is signal. Convergence between all three is a critique that must be addressed before the work continues.

## Sources

- [Josh Mateo's portfolio](https://joshmateo.com/)
- [Niyati Gupta — LinkedIn](https://www.linkedin.com/in/niygup/)
- [Fireside Career Chat with Niyati Gupta, UMSI](https://www.si.umich.edu/about-umsi/events/fireside-career-chat-niyati-gupta-product-design-lead-netflix)
- [Netflix Tech Blog](https://netflixtechblog.com/)
