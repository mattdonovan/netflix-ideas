---
title: "Pragmatic Engineer — Netflix engineering with CTO Elizabeth Stone"
author: "Elizabeth Stone (interviewee), Gergely Orosz (host)"
author_role: "Elizabeth Stone: CTO, Netflix. Gergely Orosz: Pragmatic Engineer podcast host."
url: "https://www.youtube.com/watch?v=sAp9RjO79cU"
source_type: "video"
source_tier: "context"
relevance: "netflix-context"
accessed: "2026-05-24"
publication_date: "~2025-11"  # user noted "6 mos old" as of 2026-05-24
duration_minutes: 60
license: "Publicly available on YouTube. Quote with attribution."
covers:
  - netflix-engineering-culture
  - live-streaming-architecture
  - performance-reviews
  - keeper-test
  - levels-history
  - ai-tools-engineering
  - open-source
  - open-connect
quoted_in: []
---

# Pragmatic Engineer — Netflix engineering with CTO Elizabeth Stone (~2025)

**Source:** https://www.youtube.com/watch?v=sAp9RjO79cU
**Type:** Long-form podcast / video interview (~60 min)
**Era marker (per user):** 6 months old at fetch — places it around late 2025

> ⚠️ **Context source, not Hawkins-specific.** Hawkins is not named. This is engineering culture writ large from the CTO seat. Loaded with cultural cross-references that ECHO Hawkins's design-system philosophy from the engineering side — "innovation is really driven from within the teams rather than top down" rhymes with "guidance over governance."

## Topics covered (jump-to for citation)

- **Scale** — 1 trillion+ events/day; tech team spans member product, Studio tooling, ads, games, payments, partnerships
- **Open Connect (CDN)** — 6,000 locations, 175+ countries; built >10 years ago; strategic advantage for live and games
- **"Pitch-to-play" pipeline** — entire content lifecycle is engineered end-to-end (greenlight → production → promo → recommendations → encoding → delivery). Most companies don't own that whole stack.
- **Live streaming evolution** — Chris Rock (March 2023) → Love is Blind (failed) → Paul vs. Tyson (Nov 2024, 65M concurrent streams, "world's largest stream ever") → NFL Christmas Day games (5 weeks later, "flawless") → weekly WWE
- **The Paul vs. Tyson control room** — ~30–40 engineers + data scientists in a room with laptops + makeshift screens. New dashboards built specifically for the event. 40–50 page if-then runbook. "I feel like I lost 10 years of my life in that one night." Hand-built triage via makeshift Google Meets. Real-time levers pulled mid-event.
- **Post-mortems are organic, not gated** — "It happens very organically and it's led by the people who are close to the work itself." Lots of accountability ("unusually responsible" is in the culture memo), little formal process.
- **No formal performance reviews** — continuous candid feedback + annual 360 + compensation review + 2x/year promotion eval. Comp philosophy is "personal top of market."
- **Keeper test goes both ways** — manager asks "would I fight to keep this person?" and team members ask "am I excited about this work, is my manager helping me grow?"
- **Levels were introduced recently** — for most of Netflix's history, the only engineering level was "senior software engineer." Levels added as the company scaled; now hires early-career talent + interns + invests in staff/principal/distinguished tier
- **Why people stay** — "people leave when they're not getting the challenges and the fulfillment... or don't feel adequately recognized." Talent density builds on itself.
- **AI tools adoption** — "with a lot of intention and pragmatism." Coding assistants offered as a portfolio, not a mandate. Genai champions per team. Highest-impact use cases: prototyping, documentation, migrations, anomaly detection.
- **Open source** — about 1 in 5 Netflix engineers contributes to open source (per Signal Fire data Gergely cites). 9 Emmys for video encoding work. Founding member of Open Media Alliance. Catalog now requires 60% less bandwidth for same/better quality vs. start of originals era.

## Quote bank

> "Innovation is really driven from within the teams rather than top down. There's a lot of autonomy and local judgment in how we build things." — Elizabeth Stone

> "We don't have a top-down command and control culture that really narrows people's contributions and we expect a lot of that responsibility for both the successes and the failures." — Stone

> "We have language in our culture memo about being unusually responsible. That's really the talent on the team. It comes with high talent density, it comes with treating people like adults where they get a lot of autonomy in making decisions and then they own the outcomes." — Stone

> "If someone said to me, you're going to have 65 million concurrent streams, I would have said, 'This is not going to go well.'" — Stone (on Paul vs. Tyson)

> "We don't have formal performance reviews, which is probably the first unusual thing." — Stone

> "Pre-live, there were a lot of ways to take smart risks with video on demand because we had many years under our belt of understanding when something breaks, how are we going to fix that... When we introduced live, there's a different threshold because you have to watch it live." — Stone

> Stone's three engineering principles:
> - **Build for the future teams who are going to thank you for the work that you did today** (don't take shortcuts; build durable products)
> - **Think globally, act locally** (think about ramifications across the org as you make local decisions)
> - **Yearn to learn** (her personal favorite — be curious, question whether you're thinking about the right problem)

> "Curiosity. Curiosity. Curiosity." — Stone's advice to new engineers at Netflix

## Cross-references to Hawkins corpus

- "Innovation driven from within teams" (Stone, 2025) ≈ "Guidance over governance" (Orio + Yee, 2021) ≈ "designers shape their own roadmap" (Chaves)
- "No formal performance reviews / continuous feedback" parallels the Hawkins team's "we don't get hung up on how they're contributing" (Yee)
- "Open Connect built >10 years ago" provides a useful timeline anchor for when Netflix's engineering-as-infrastructure-builder identity solidified
- The bottom-up vs. top-down framing is identical in shape to the design-systems debate

## Transcript

(Saved verbatim below — long, ~60 min. Key sections marked.)

### Cold open

> [Elizabeth] What is the scale of the company from an engineer? When you add that up, we have more than a trillion events that we're capturing every day between consumer interactions, things that are happening across products and services that support decision making.
>
> [Elizabeth] Live was a big launch last year. We had a lot of learnings from Paul Tyson because it was such a large event. I've often mentioned it was the world's largest, right? 65 million concurrent streams. Watching that tick up, I think one of our biggest ever days of signups. There were probably a hundred people on site. I was sitting in a room with maybe 30 or 40 both engineers and data scientists. We had our laptops and makeshift screens sitting there. When I think about where we were for Paul Tyson, I joke with people, I feel like I lost 10 years of my life in that one night.
>
> [Elizabeth] We don't have formal performance reviews, which is probably the first unusual thing. So, the way we approach it at Netflix is — [cuts to intro]

### Intro

> [Gergely] Netflix needs no introduction, but its scale can still surprise many people. But what is it like to work at a streaming company as a software engineer? I sat down with Netflix CTO Elizabeth Stone to get more details. In today's conversation, we cover the unique engineering challenges at Netflix, including the learnings from 3 years of Netflix live. Netflix's engineering principles and why Elizabeth's favorite is yearn to learn. How Netflix has no performance reviews and what they do instead. How the company uses AI tools and why anime detection and analysis is a great use case that they found for them.

### The scale of Netflix

> [Gergely] Behind the scenes, what is the scale of the company from an engineer? How can I make sense of how large this operation is?
>
> [Elizabeth] It's probably larger than people realize. Very often I'll get questions from people in my personal life saying well how many engineers can it really take to build the Netflix product? So first of all it takes quite a few when you think about how do you make the tech work so well that it's basically seamless in some ways ideally invisible because members just get to enjoy their experience. But then we also as a tech team build tools and products for studio productions, our advertising tech stack. We build a lot of the developer platform capabilities and launch capabilities for games. Think about anything related to commerce — plans, pricing, payments, partnerships. Those are all things that are supported by the tech team. So when you add that up, we have more than a trillion events that we're capturing every day between consumer interactions, things that are happening across products and services that support decision making. So it's quite a global enterprise at this point.

### Production software stack (unique-to-Netflix systems)

> [Elizabeth] It's actually very much part of our superpower that we've been able to bring technology to entertainment. Or one of the biggest studios in the world and we have an advantage in thinking about what are some of the problems we could uniquely solve for those productions. So, good examples would be things like our media production suite, which took something that was a fairly antiquated, slow, and expensive way for media files to travel across creative teams around the world and really modernized what that looks like... We also have a big presence through Scanline and Eyline, which is a visual effects studio that was an acquisition a few years ago that does really cutting edge research and technology for things that affect how we do data capture, visual effects, different ways to think about strategies that bring life to productions that wouldn't be easy just based on standard camera technology.

### Engineering challenges in production

> [Elizabeth] It's unbelievable scale when you think about hundreds or thousands of productions that are in progress at any given moment of time. So across all those productions you have media files which are also especially large complex and difficult to move. So think about scale, think about cost of both storage, compute and travel of that data. Latency in some cases, you know, it depends on the use case. For some cases, it's capturing media that is going to be reviewed in a way that can be the next day, but for other things, we've got media traveling for things like live productions that has to be essentially instantaneous.

### How Open Connect (CDN) works

> [Elizabeth] It was a big bet that we made more than 10 years ago to build our own content delivery network and the scale of that often surprises people. So 6,000 locations around the world, more than 175 countries and that actually allows us to place local files for film, TV, games that you're going to play so that there can be very low latency and very high quality for members no matter where they click play.
>
> [Gergely] Basically these are server locations at 6,000 different locations inside cities... it's like your edge network, right?
>
> [Elizabeth] That's right. And we integrate with internet service providers to actually get the content to when someone clicks play on their phone, on their TV, on their laptop, that actually gets the content through that last mile to the member or the consumer.

### From pitch to play

> [Elizabeth] Sometimes we lightly call it pitch-to-play. There's an element of engineering all the way along that life cycle, which is unusual because at many other companies, they haven't built that end-to-end pipeline themselves as Netflix has over time.
>
> [Elizabeth] So think about from the moment a title is pitched that someone in the content team greenlights — yes we're going to develop and produce this title. There's data science teams, there's engineering teams that helps to support those decisions on programming. Then there's tech teams that help support the creation of that content, the promotion of that content, the recommendations and ultimately the delivery of that. So tech basically underlies that whole life cycle.

### How Netflix enables engineers to make decisions

> [Elizabeth] A lot of the way that our engineering systems, products and tools were built was highly driven by individual contributors thinking about how to build those systems. So innovation is really driven from within the teams rather than top down. There's a lot of autonomy and local judgment in how we build things that has allowed us to build this end-to-end view of how to deliver content in a way that we think delivers the best quality most efficiently and allows us to play with the puzzle pieces of that as we have new needs that come up.
>
> [Elizabeth] So over time the way Netflix has been built has been very driven by engineers within the teams rather than some you know top down overarching let me draw the architecture for you and now let's build it in that direction which has both advantages but also things that we've had to evolve towards over time because as the company becomes much bigger scale becomes more of a challenge we want to make sure that we're building things in a way that support that. So it's not like it's static and that elasticity to use your word is something that has allowed us to actually engineer for what Netflix requires today versus what it required 10 years ago.

### Building Netflix Live for global sports

> [Elizabeth] Our first live title was a Chris Rock special. I believe in March 2023. That was our first time bringing live to Netflix members and started what was a very intense period of if I take through to that Paul Tyson match that was November 2024. So you think about that as basically 18 months from our first ever outing on live to the largest streamed event ever which is what Paul Tyson ended up being. The way that came to life was with urgency, a lot of scrappiness, and like I mentioned, engineers making it happen.
>
> [Elizabeth] Picture teams from Open Connect, encoding, our content production and promotion teams, our discovery teams thinking who are the right people to lean in here and help bring this to life. But they self-organize. They develop their own road maps. They think about who needs to be on point for what things. What are some of the systems that we need to make sure are actually resilient enough for live. It was an incredibly tight timeline end to end.

### Learnings from Paul vs. Tyson for NFL Live

> [Elizabeth] With those learnings in November 2024, we had about five weeks to be ready for two American NFL football games on Christmas Day where the bar is very high to deliver well for members and for fans. And so the team immediately took the learnings from Paul Tyson to say, how do we build greater resilience? How do we think about how we're going to direct content if we end up bandwidth constrained in some markets? How can we really optimize by using some of our quality levers for what that experience is going to be? And those NFL games ended up being flawless.

### Inside the control room

> [Elizabeth] So, even our dashboards were brand new. The engineering team put it together. The data science and engineering team collectively put together a set of dashboards that would give us visibility into some core quality of experience metrics. So things like time to render, app start timing, rebuffer rates. It was the rebuffers that we started to see amp up during Paul Tyson. There were probably a hundred people on site. I was sitting in a room with maybe 30 or 40 both engineers and data scientists. We had our laptops and makeshift screens sitting there. Everyone was hardlined into internet so that we weren't risking anything with the Wi-Fi. We had VPN backups if anything was to go wrong. We had a launch commander with a headset dialed in talking to people in the production truck, but it was new. So, it wasn't streamlined. It wasn't perfect.

### What being unusually responsible looks like

> [Elizabeth] It's not a rigid process. It happens very organically and it's led by the people who are close to the work itself and feel tons of accountability for doing reflections on both what went well and what can we do better.
>
> [Elizabeth] I would like to say I woke up the next morning. I was awake the whole night thinking about what do we do next... I woke up to a set of memos where the team had already written down. Here's what we observed. Here's what we think we can improve. Here's some of the things we should immediately prioritize.
>
> [Elizabeth] We have language in our culture memo about being unusually responsible. That's really the talent on the team. It comes with high talent density, it comes with treating people like adults where they get a lot of autonomy in making decisions and then they own the outcomes.

### Balancing team autonomy with guardrails for Live

> [Elizabeth] Even for new or early career talent, one of the things we've evolved towards — even if I think going back however many years when Netflix introduced Chaos Monkey as a concept, the idea of an individual engineer having responsibility to understand how and when their system will break and how they're going to be resilient, detect that and recover quickly was just a core part of the culture and something that we continued to maintain.
>
> [Elizabeth] When we introduced live, there's a different threshold because you have to watch it live. There's no such thing as Netflix is going to be down temporarily while we address something where we were taking a smart risk. That was scary at first, but as we started to introduce what are the guardrails we need to have to do this safely, it was things like introducing especially for tier zero or tier one applications that were in the critical path for live a higher threshold for what's the testing that you're doing.

### The high talent bar and introduction of levels at Netflix

> [Elizabeth] I continue to be amazed by the talent density at Netflix. I almost didn't believe it before I joined a little over five years ago of yeah, I'll believe it when I see it. I think the way to think about talent density at Netflix is a lot of the aspects of our culture including talent density are a means to excellence in our work. So none of them are the endgame.
>
> [Elizabeth] We don't still just have a single level. So as we think about growing as an engineering or as a tech organization more broadly, not every role requires somebody who has 10, 15, 20 years of experience. Some roles are a great match for someone who's newly out of college or has a couple years of work experience, but you would want to think about the expectations for that person, the compensation for that person being different. So we did start to build some scaffolding around levels, not to say now we want to have so much structure that that's sort of suffocating.
>
> [Elizabeth] Some of our engineering principles are things like building for the future teams who are going to thank you for the work that you did today, which means don't take shortcuts. Build high-quality, durable products. Things like think globally, act locally, meaning think about the broader ramifications across the tech organization or Netflix even as you make your local decision. And maybe my personal favorite, which is yearn to learn.

### The Keeper Test (and no performance reviews)

> [Elizabeth] We don't have formal performance reviews, which is probably the first unusual thing. So, when you think about other companies spending that time to talk through each person or assign a rating for whether they meet exceed, you know, I've seen that at other companies, too. We don't do it that way, but we do carefully think about feedback, performance, expectations, all the things that would feed into keeper test.
>
> [Elizabeth] The way we approach it at Netflix is first trying to get to something that looks like continuous, timely, candid feedback. Easier said than done. It requires trust. It requires deep relationships to be able to give someone in the moment very candid feedback... If we're living the Netflix culture well, that's something that would be familiar and comfortable every day of the year.
>
> [Elizabeth] We do as kind of a safety net have an annual 360 process where I would request feedback from a bunch of people I work with... Once a year we go through both compensation review which is a reflection in ways of what's my level of impact what skills have I gained what are my contributions to the company. So you naturally talk about performance as part of thinking about someone's personal top of market which is our compensation philosophy.
>
> [Elizabeth] A couple times a year we evaluate promotions.
>
> [Elizabeth] The keeper test... is asking the question of you know is this person really meeting expectations for the role and what the business requires. There's a keeper test that a manager might ask themselves and have that conversation with members of their team. But honestly, there's a keeper test that goes from members of their team to their managers. Do I want to stay? Am I excited about the work that I'm doing? Is my manager giving me growth and development, helping to guide my work in good ways?

### Why engineers leave or stay

> [Elizabeth] I personally find that people leave when they're not getting the challenges and the fulfillment that they would like to get from their work or they don't feel like they're adequately recognized for the contributions that they're making.
>
> [Elizabeth] We fight really hard to maintain that type of environment so that people are excited to stay. It doesn't mean that our retention is 100%. People get great opportunities other places and I actually think it's good for them to take it because we're not saying like we expect you to be at Netflix forever.
>
> [Elizabeth] People stay when they're impressed by the talent around them. This is where talent density builds on itself.

### How AI tools are used at Netflix

> [Elizabeth] It's a huge area of focus for us right now, but with a lot of intention and pragmatism of where these tools are actually helpful versus I love that they're not.
>
> [Elizabeth] For engineers we are experimenting with a set of coding assistants. The way we approach it is to provide a lot of different tools to the teams so they are able to explore experiment decide which tools meet their needs start to learn what works better for some use cases or some applications than others.
>
> [Elizabeth] We have what we call Genai champions throughout the business. They're able to kind of help teams troubleshoot, understand what's available, but also feedback to central teams what's working and what's not.

### AI's highest-impact use cases

> [Elizabeth] Prototyping is a lot faster and actually that's a place where when you think about the cross functional teams across engineers, data scientists, product managers, designers, we're hoping that we can actually bootstrap things very quickly. I have an idea. Let's visualize that idea. Let's quickly throw together a set of code that would help to bring this to life. That's not necessarily something we would productize or consider production ready code, but that's okay because it helps teams advance and innovate and kind of workshop ideas very quickly.
>
> [Elizabeth] As you probably know and your listeners know, there's a lot of what can be tedious work. And it's not always the actual coding work where it feels like it's the biggest time commitment. It can be accessing knowledge about how systems work. It can be documenting code. It can be thinking about big migrations that we've had on our plate that we can actually automate much of that work. And there's also things around detecting issues. So anomaly detection, response, being able to do deep dives of issues.

### What new grads add and why senior talent still matters

> [Elizabeth] We've had a great experience with new grads and early career talent and also our internship program... We were starting from a very different place than a lot of other tech companies. So when you look at the distribution of levels or talent at some of the other larger tech companies, they had in some cases 30, 40, 50% what I'll call level three level four engineers... We were starting at 0% in most cases.
>
> [Elizabeth] We had a huge opportunity to complement the team we had with earlier career talent who brings new skills new perspectives great energy to the teams and with a technology shift right now with Genai a lot of native AI familiarity.

### Open source at Netflix

> [Elizabeth] The people at Netflix care deeply about the quality of their work and advancing innovation more generally. For some things it's Netflix specific innovation and it's important we keep that IP as a competitive advantage but for many it's something that helps to actually drive broader industry innovation which also benefits Netflix over time.
>
> [Elizabeth] We've now won, I believe, nine Emmys for these contributions. I always used to associate Emmys, you know, just with the TV and the red carpet, but we've won a lot of technical and engineering Emmys at this point, specifically on video encoding work.
>
> [Elizabeth] We are also a founding member of the Open Media Alliance which is an industry community that pushes for open advancement of encoding technology... When you look at the catalog now of Netflix content, think about how much bigger the catalog is than when we were first starting with originals. I believe we now require 60% less bandwidth, 60% fewer bit rates for same or better quality with a much bigger catalog.

### Closing advice

> [Elizabeth] Curiosity. Curiosity. Curiosity. When people ask me like what's the Netflix value that most resonates with me and I most love to see across the team it's curiosity. Asking questions, questioning whether we're solving the right problems in the right way. Just because you're new to Netflix or earlier in the career doesn't mean you're not going to be the source of innovation. If anything, great ideas come from everywhere and that starts with just being curious open-minded experiment explore take smart risks.
>
> [Elizabeth] I would also say lean on other people. So, we have great talent at Netflix and they are all more than happy to help other people be successful. So don't shy away from finding a mentor, asking somebody, why does this work this way? Can you give me more of the history of this? Can you help me understand which business problem we're solving and why? It's another flavor of curiosity, but it's also about the broader community and really leveraging that at Netflix.
