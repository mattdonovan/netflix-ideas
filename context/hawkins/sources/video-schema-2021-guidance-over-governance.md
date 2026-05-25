---
title: "Guidance over governance"
author: "Luca Orio, Jen Yee"
author_role: "Luca: Design Systems Manager, Netflix (joined 2016, led design systems from day one). Jen: Designer on Hawkins core team, Netflix (joined 2019)."
url: "https://www.youtube.com/watch?v=nFe6US9aA_U"
source_type: "video"
event: "Schema Conference 2021 (Figma)"
accessed: "2026-05-24"
publication_date: "2021"
duration_minutes: 44
license: "Conference talk, publicly available on YouTube. Quote with attribution; do not redistribute the video file."
covers:
  - hawkins-philosophy
  - hawkins-operations
  - hawkins-consumer-vs-professional
  - figma-migration
  - moria-plugin
  - figmagic-onboarding
  - quarterly-polls
  - team-structure
  - contribution-model
quoted_in:
  - blog/2026-05-24-hawkins-evening.md  # (draft)
---

# Schema 2021 — Guidance over governance

**Speakers:** Luca Orio (Design Systems Manager, Netflix), Jen Yee (Designer, Hawkins core team)
**Event:** Schema Conference 2021 (hosted by Figma)
**Source:** https://www.youtube.com/watch?v=nFe6US9aA_U
**Duration:** ~44 min

## Key claims (jump-to for citation)

- **Two flavors of Hawkins, one foundation** — Consumer (member-facing) and Professional (Studio + internal tools). Same colors, typography, iconography. Different token mappings — e.g. `background color UI` = pure black in Consumer, dark grey in Professional, "to reduce eye fatigue" for all-day Studio users. *(Luca, ~8:00–9:45)*
- **Origin in Studio, contribution-based first release** — Born ~2019 in Studio. First release was 18 components, built by product designers contributing one or two each; design systems team polished for cohesion. Luca's retro: "I wish we started even smaller." Momentum killed by Q2 spent in support mode. *(Luca, ~10:30–12:00)*
- **Figma migration: organic, freedom-and-responsibility** — No top-down tooling decision. Studio designers pioneered, team waited for 51% adoption threshold, then migrated in 28 days (also contribution-based). Consumer took ~6 months. *(Luca, ~13:00–14:30; Jen, ~14:34)*
- **Quarterly Hawkins polls** — Every quarter, every product designer gets a personal card with stickers (blue = 1 vote, green = 3-vote super-vote). Move stickers onto components they want worked on. Roadmap then ranks by vote count. "Puts the road mapping process on autopilot" for foundational components. Bigger horizontal initiatives need cross-functional input instead. *(Luca, ~40:00–42:30)*
- **Library structure** — In Figma org: `XD Design Systems` team (with Core project + Platform project), `XD Templates` team. Core has consumer libraries, Foundations, Studio. Foundations has tokens, colors, icons (light/dark), textures (brand patterns). Platform has TV, web, mobile — each owned by platform designers, not the core team. *(Jen, ~16:00–23:00)*
- **Moria plugin** — Brings title/box-art search into Figma. Can swap a single piece of cover art, an entire row of box art, change synopsis/logo/billboard, switch the entire view to a different audience locale (Korean demo). Used by researchers for a 5,000-piece box-art study. *(Jen, ~29:30–35:30)*
- **Figmagic** — Onboarding/discovery web app. Top-10 Hawkins templates, Moria, etc. Filter by skill (beginner/intermediate/advanced) and by team. Workshops are curated Figma files broken into bite-size lessons. 3,000 user engagements, ~900 page views in first month. *(Jen, ~36:00–39:00)*
- **Nomenclature flexibility** — Tried "primitives" with designers; it didn't gel. Scaled back to "core components." "There is no right way, and there's no wrong way. There's only just a more right way for your team." *(Jen, ~20:25–21:13)*
- **Icon search metadata** — Components carry metadata so designers can search "fave," "heart," "love," "save," "favorite" and find the same icon. Meets designers' mental models instead of forcing them to know internal names. *(Jen, ~21:25–22:25)*
- **Light governance / contribution trust** — Don't police organization of contributed components (auto layout messy? fine, that's where designers are). Don't tidy the library mid-demo. Slack-based communication for contributors. "We trust our designers to make good decisions." *(Jen, ~24:30–29:00)*

## Quote bank (verbatim, citable)

> "It's our job to be accelerant, reduce time to impact, increase quality, and accelerate creativity. Today we want to share a little bit about how we do things. How we lean into context, how we let go of some of the control — eliminating unnecessary governance that gets in the way and creates friction." — Jen, ~6:00

> "Don't be scared about embedding, extending, or forking your design system. Go for it! Not everything has to look and function the same just for the sake of consistency." — Luca, ~10:10

> "One trap that we should all avoid, is to come up with a design system that is shaped around a team because a team could very well change. Instead, a design system should be here to stay." — Luca, ~10:25

> "Hawkins is one, and Hawkins is for everybody. But we have two very specific sets of componentry, and that's a very intentional choice, that's here to stay." — Luca, ~9:45

> "Foundations and design systems are the flooring. It's the foundation for, you know, everything you do. It should never be seen as a ceiling." — Jen, ~19:22

> "There is no right way, and there's no wrong way. There's only just a more right way for your team, and what works for your team and your culture." — Jen, ~21:05

> "What can your design system do for you and the org if it allow if it was allowed to evolve naturally and organically? Less rigid, less controlled. How might it propel forward if you don't try to have control over everything." — Jen, ~42:50

## People named

- **Luca Orio** — Design Systems Manager, Netflix (Italian, originally a metal-core drummer; design systems lead from day one of the team)
- **Jen Yee** — Designer, Hawkins core team (joined Netflix 2019, prior background in special education and a startup; from the Bay Area)
- **Albert Tan** — Director of Core, Experience Design (Luca + Jen's manager, narrated the team's intro video)
- **Josh** — Earlier team member (referenced alongside Luca as part of the original three-person core)
- **BK, Matt, India** — Built Figmagic with Jen

## Linked sources (worth capturing separately)

- The book Luca cites as the first true design systems book: *Designing Programmes* by Karl Gerstner (first edition 1964, fourth edition now cheap on the internet). *(~1:14)*

## Full transcript

[Luca] Hello everyone, my name is Luca and I'm a design systems manager at Netflix. I joined the company five years ago, and before transitioning into this role I led the design systems initiative since day one. I am very excited to be here and very happy, and I wanted to personally thank each and every one of you who are attending and also the folks at Figma who invited us.

A few interesting facts about me, I am from Italy and I was born and raised in Brescia which is a city in the north in between Milan and Venice. I first got to the stage not as a designer, but as a musician. In fact, I used to play drums for a metal core band and it was during one of our tours that I decided to move permanently to the United States, but as a designer. And talking about design, I am the proud of owner of the first, second, third, and fourth edition of Designing Programmes by Karl Gerstner. I believe this is the first true book about design systems, first edited in 1964. So how crazy is that the fourth edition is now very cheap and you can find it on the internet so if you are curious about, it just get your copy, and let me know what you think of it. Last but not least, I am married to a very beautiful, smart, and sweet woman. Her name is Ashley and we actually just got we just had a baby. His name's Avers, he's six months old. And as a new dad, I am obviously very tired, incredibly sleep deprived, but also very happy about the journey ahead.

[Jen] Hi everyone my name is Jen Yee, my pronouns are she/her. I've been with Netflix for two years. Prior to Netflix, I was at a startup that eventually turned public, and prior to tech, I was in special education for seven years. I'm from the Bay Area, this is a picture of my grandparents in their market that they opened up. I love horror — I love the horror genre. This is my dog looking at me as a ghost. She is three and a half years old. She's a bernadoodle and she does not mind being picked up even though she's 40 pounds — although I just lied to you. She's 45 pounds. She did not want me to tell you. I'm the shortest of my siblings. I have four other siblings, we talk to each other every day I love them so much. So I just wanted to give a huge shout out to the core team, this is a huge crew now because it was just myself Luca and Josh, so we've grown over the last year, and what I love is that we're interchangeable. Something that I started or Josh started — or Luca started — now anyone can pick up, and folks know that they can go to anyone so that is really impressive and really important because everyone on the team is an incredible contributor and is equally important to XD. And so we are so excited to be part of schema today, to open up the day filled with some amazing talks, so I thought, how could we start off our talk? How can we introduce our team to all of you and what we do for our larger org which is called Experience Design? And in true Netflix fashion, we wanted to show you something cinematic. So let's kick it off!

[Albert, narrator] Netflix's mission is to entertain and delight members all around the world, and we in XD have a lot to consider while trying to accomplish that goal. Such as how do we support the immense scaling efforts of our global studio partners? Grow our membership in regions where Netflix is not yet a household name? Personalize our service for an increasingly diverse global audience? All while empowering our designers to create in a scalable and efficient way. We've learned a lot through our work — what you're about to see is just the tip of the iceberg.

Consider this: we serve 200 million members in nearly 200 countries. So how do we ensure our designers can create the experiences that reflect our global audience's needs, across devices and platforms, in an efficient scalable way that is ultimately coherent? Well, by creating the tools and systems that are focused on accomplishing precisely that.

For example, rather than constructing each new UI from scratch, we've created a system that enables designers to pull in elements from existing UIs as components for new ones — making the building process 10 times faster. And instead of hunting down the latest box art, show logos, and more we've created a plugin that allows designers to easily search for, and pull these assets into their designs. This is especially powerful, as it allows designers to preview the experience for any global member, in any language, and edit accordingly before it goes live.

All right, that was a lot. But like we said earlier, the XD team is working diligently to come up with the best ways to bring the global Netflix experience to life in a meaningful way for people everywhere.

[Jen Yee] Okay! That's a wrap. We're done! I think we can all go home. So that was narrated by mine and Luca's manager, our Director of Core, Albert Tan. As you saw, we have a lot going on at Netflix. So how do we go about it? At the core design systems team, it's our job to be accelerant, reduce time to impact, increase quality, and accelerate creativity. Today we want to share a little bit about how we do things. How we lean into context, how we let go of some of the control — eliminating unnecessary governance that gets in the way and creates friction. We want to spark questions that deserve meaningful conversations. With your team, with all of us, it's not about being right today. It's not about keeping it safe and retelling the same design system story over and over. It's really about, for us, sharing something in hope that we can all have more conversations about the freedoms of design systems in the future. And so today we'll be using Netflix's design system, Hawkins. Luca will start from the beginning — about how we've created a system that's a shared starting point for designers — never discouraging innovation and experimentation, continually evolving with the brand and the business. So Luca take it away.

[Luca] Thank you, Jen. Hawkins is Netflix's design system, and for whoever is not familiar with the world of Stranger Things, Hawkins is the small fictional town where the TV series is set. It made a lot of sense to name our design system by referencing one of our titles, rather than coming up coming up with an abstract name. So I encourage everyone out there who's just starting a new design system, or perhaps someone who has the chance to rename an existing one, to find a name for your system that truly connects and resonates with your company. Something familiar and something that makes you think this is our design system just by hearing its name. Hawkins comes in two flavors, consumer and professional.

Hawkins consumer is used to design and develop the Netflix that everybody knows. So that ecosystem of applications that let our audience enjoy the content we make. So the Netflix we all watch on our couch, at the coffee shop, on our laptops or in our bed.

Hawkins professional, on the other hand, is used to design and develop applications to create those titles. The largest partner utilizing this system is Studio, a flourishing ecosystem of people and tools innovating how the media industry operates, and blending it with Netflix's missions at scale. So design systems but built on the same foundations. In fact, Hawkins consumer and professional share the same colors, the same typography, and the same iconography.

However, the way these styles and elements are used might differ between one system and the other.

For instance, background color UI is a design token that in Hawkins consumer maps to pure black, and in Hawkins professional maps to a dark grey. And this is a very intentional and functional decision, because people working with applications part of Hawkins professional are staring at their monitors for all day long in their work, and so we wanted to reduce high fatigue.

So again, same styles just with different usage and a precise function in mind.

Hawkins is one, and Hawkins is for everybody. But we have two very specific specific sets of componentry, and that's a very intentional choice, that's here to stay. As long as there's a good reason for it, don't be scared about embedding, extending, or forking your design system.

Go for it! Not everything has to look and function the same just for the sake of consistency.

And one trap that we should all avoid, is to come up with a design system that is shaped around a team because a team could very well change. Instead, a design system should be here to stay.

Hawkins was born in studio two years ago. Its first release was entirely contribution based, and each product designer helped us with a component or two, and we as a design systems team just had to restyle and slightly polish the componentry to make sure that everything looked cohesive. Back then we started small. To be exact, we started with 18 components.

Fast forward two years, our sticker sheet now got so big that we don't even know where to put those components anymore. But looking back, I think 18 components were too many, and I wish we started even smaller. That's because our small team of two builds so much momentum before the release, but what you build you also gotta support and maintain.

In fact, the next quarter we got stuck in support mode. You know? Helping designers ingesting our work, bug fixing, a few issues here and there, and restructuring our libraries. This abrupt change in the distribution of our effort is ultimately what killed our momentum.

Ideally you want to keep the functional areas your team covers as balanced as possible.

And there are two good reasons for it. First, it lets our partners understand how complex and time-consuming our job and design systems is. It also helps in establishing sustainable expectations around the output and the pace of the team. Secondly, it also helps in keeping the team composition balanced because we don't want to find ourselves hiring for a role that leads in a specific domain area just to find out one year later that that functional area is not that time consuming or important anymore.

As for many other companies, at some point at Netflix we went through a transition between design tools. Freedom and responsibility is a core value in Netflix and applied to tooling what that means is that every designer is free and encouraged to choose the tools that let them accomplish their objectives more effectively.

So there are no top-down decisions around which tool should be used and what not.

In fact, the transition to Figma has been very organic and very natural at our company.

Studio designers were the first who started to explore Figma as their design tool. And we, as a design systems team, just had to keep a close eye on the rate of that option.

Once that reached the 51 percent threshold, we simply migrated the componentry Figma and never looked back. By the way this was yet another contribution-based project. It's thanks to the help of every product designer who helped us migrating that design system.

This effort took for us just 28 days.

[Jen Yee] Thanks for sharing all that Luca. So studio designers pioneered the way for Hawkins and Figma. On the consumer side we were slower to adopt. We took twice as long — six months instead of three — and some say they were still adopting today...

But this was because none of our designers on the consumer side really used Figma before. As Luca just mentioned we have freedom and responsibility that means you can use whatever tooling you want that makes you most effective for your team and the business.

So our designers, they thought they had everything they needed well enough — for themselves and for the team. So how did we do it? How did we make it so they wouldn't want to use any other tool? I'm going to take you through, and show you some of the strategies that we built. When we are making the libraries, how we've let go of a lot of control when it comes to usage and contribution. I'm going to show you some tooling that we created to accelerate a designer's workflow, how we're going about extending and scaling what we've created for continued adoption and onboarding — and not just for designers or our immediate partners. We've built education and onboarding in a way that scales for the entire Netflix org.

So let's start with this demo! As you can see here, this is our Netflix org. Anyone at Netflix can go ahead and access the Netflix org through a quick link called "go/figma". And here you can see we have XD design systems and XD templates. And so everything our team does revolves around these two teams. We'll take a look at XD templates in a little bit, but we'll go into the Hawkins design system team. So as you can see there's a core project, and there's a platform project. Inside are different libraries and it's clear I've mirrored what we have live for this demo — so you can see it's a secret team — but it's open to everyone, our actual team. Although I was thinking about not actually making a duplicate mirror of our design system because when I'm giving demos to designers and engineers for Figma for Hawkins, I will straight up delete huge parts of the entire design page just for that undo, so it doesn't seem very scary, and you know, so they just seem like it's like a safe place.

So taking a look into the core project, there are consumer libraries, and these are maintained by the core XD team. We also have the Foundations and we also have Studio. So these are the core components that you know are the small bits and pieces and closer to what all the larger more comprised patterns and components are. So I'm going to take us into Foundations as Luca just told us about. You know inside we have our tokens, we have our colors we have our icons, light and dark. We have textures, which are our brand patterns. And then, I wanted to take a moment and show you this little fun page. So when we were building out the libraries we had some workshops we had some jamming sessions, as we were building out Figma, building our libraries. So we could get some peer leaders on those design teams to get, you know, acquainted with Figma And we actually sometimes just kind of got a little delirious and thought we need an outlet, and so what we did is we just created some spots so we can take swords and just duel each other. And it was actually pretty awesome. And so there's a bunch of swords, a bunch of backdrops, and when we officially rolled out Figma, we kept these in the library. So this is in the actual like foundational library, and when we were doing rollout sessions and workshops, all of a sudden you would just see like a sword coming out from the left. I see a sword coming to meet it in the right, but all the while I'm still like giving this lesson to folks. But what it did, was it really just had, you know, made it a lot more fun. Something as serious as a launch, something as serious as, you know, releasing our design system for the first time in a new tool for designers. It could be really scary, and so I think this actually helped, because you know they were a lot less stressed, we were a lot less stressed. We were more relaxed and so, in turn, you know they were less anxious about this new tool. So I highly recommend you know, something as serious as like a foundational design system library, something as serious as a launch, just have fun with it. I think it just really benefits everyone overall.

So let's take a step and, you know, go up one because foundations and design systems are the flooring. It's the foundation for you know, everything you do. It should never be seen as a ceiling — as i'm sure you hear people talk about today. And so in the consumer libraries we have all the bits and pieces that are the smallest components, that our larger components are comprised of. And I'm actually going to take you into TVs. So what we have are banners, buttons, check boxes, all the usual stuff. Some great little context cards, focus ring.

And so what I wanted to show you today was — well a few things. One was, you know, these are core components. Yes they're actually maintained by our team, our core team. It just so happens though, that it's a coincidence. And so we actually tried to roll out the use of primitives and that nomenclature with the designers, but it wasn't really gelling.

And so then we just kind of realized that we were forcing this design system-y nomenclature, you know, for the wrong reasons. Like if it wasn't if it wasn't connecting, we decided to you know, scale it back a little more simply. And so these are core components — they are the smallest bits and pieces that the larger device platform teams have their patterns made up of.

And so, I would just recommend that, you know, when you are communicating with your designers, onboarding them to new design systems, that you choose things that work for you. Because there is no right way, and there's no wrong way. There's only just a more right way for your team, and what works for your team and your culture. And so speaking of nomenclature, wanted to to share something with you that's really fun — really actually small — but I love it. So speaking of taxonomy, we baked in metadata into our components. So say I was making a "super love button" and I wanted a heart.

So I would search for maybe like "fave", maybe "heart". And it's here. And so as you can see here we have: heart, like, love, save, and favorite. And this is something very small that you can do that let's any designer where they're at — wherever the mental model is — to find what they're looking for quickly. You know we don't have to hear "oh, what is this icon name?" you know, we've baked that in. We've anticipated it. And you know, do I want all the designers — do I wish they knew what this icon was? No. Because I don't even know half the time. Like this was called "heart fill".

And so I think it's realistic just to do what's, you know, normal. Just, you know, bake in that thought process that your designers might have when they're looking for their icons because what's the most important thing? It's that they're using the icons to start with, and they're building up from their designs. So going back up a level will go into the platform libraries, and these are maintained by the individual device platform designers. And so, we have TV, web, and mobile, and these are those more specific patterns that are more specific to that device. So you see we have app menu, banner, modal, player, popover. These are all specific to the TV experience. And so we actually, at one point, updated these components as well. We updated the screens that I'll be showing you later on. But it was not a valuable use of everyone's time, because basically those designers would have to guide my hand by giving me so much context because they're the folks that are running the tests. They know all of the little incremental experiments that they're running, that have succeeded, and so they would give us so much context it was just kind of a waste for for us to do it ourselves. And so why not power, you know empower, designers to have a space of their own? As you can see, you know, there's not that many components in this library. We have one, two, three, four, five, six, seven, eight. So why not just merge them into one? Well, the way that designers are interacting with components are through the assets panel, really. And so one or ten libraries it's kind of negligible at this point, because the way that they're just bringing them in. And so why not give them a space to have, to own, and to invest in? You know, they'll feel more committed to the to the experience to the system. And so as you can see here, like I was looking at this library earlier before the demo, and I thought, "okay, well, this is fun. It looks like someone contributed some new characters". And someone contributed over here, and I can tell because when we rolled out the libraries we had this very tidy, you know, we're the design systems team. Everything we do is super tidy, super aligned. But we have here, like some fun little ones on the side, and I thought to myself, "should I delete this for the demo?" But then I thought, "Why would I delete it for the demo, if I'm not even gonna delete it for the real actual library?" Like, it's not a valuable use of my time to go in tidy up a library when it's a place for them to contribute back into. And if anything, I would kind of take a look and see that maybe auto layout isn't a great idea for components, because maybe the designers aren't as familiar with auto layout and they're not as advanced as we might be with auto layout. And so if I had to think of anything, I would think maybe I'll just make little component sections so they can kind of group them all together. But if I were to change that, I would definitely go into the Hawkins Slack channel, and say "I'm loving what I'm seeing, everyone is contributing, there's so much stuff that I want to kind of organize it a little better so they feel more comfortable, just kind of putting their contributions in."

And so that's kind of meeting designers where they're at, right? If they're not super familiar with auto layout, is it fine if they come and put the contributions on here? Yes, it's great, it's wonderful, it's exactly what we want.

Thinking about that in a way — meeting designers where they're at — you know we have patterns here and now with Figma there's variants. And so do we need 400 variants of a modal? I'm not really sure. You know the design systems team definitely would love all the variants. But does a designer need to see all 400? I'm not totally sure, and variants in itself are somewhat restrictive by nature, because the way that the designers interact with are through some knobs and toggles that are pretty small here on the right side. So what we've kind of been finding out — and I'll share this with you now because it's something that we're you know working on together currently — is that we're kind of realizing that designers different moments — they expect different expectations. There's different expectations for different moments in a designer's work, you know, design cycle in their workflow. So they might want to see one single component. But then we're finding that they might want to see it, you know, with use cases. Or they might want to see all the variants laid out at once so they can kind of get that idea, and it's actually, you know, helped accelerate their creativity. They don't need to worry about, you know, what the use case is where the context is. They can actually see what they, you know, have to offer and then also build upon that. You know, we definitely encourage everything here is a starting point. It's a starting point and it's a way to start their design by using foundations. They can detach, they can build they can evolve. There's no wrong way.

And so let us go into the XD templates and what these are are screens that are filled with all of our connected components, but they're comprised to make a screen that designers would actually either, break apart to start a huge layout change, or to make incremental changes. They're coupled with Hawkins and often resemble the path forward. So let's take a look at the TV.

So as you can see, we have all of these screens and the platform designers actually maintain and update these as well. And as you can see here, you know, there's a bunch of updates here again with like the auto layout. Maybe this is not a great way to have this organized, because I'm loving what I'm seeing here, all of this contribution, that means folks have contributed back. They've, you know, communicated with their team and also, you know, we don't have very hard guidelines in our contribution they send us a Slack update, they communicate with our team, we trust our designers to make good decisions — to use Hawkins as that starting point — and I think that the little things we do to show that trust, that we're not on them about how they contribute and put things in a file, that's not a good use of anyone's time to just worry about how things are organized. And so you know, they can they contribute, and they maintain. They communicate with their partners — the teams are really tight. They know they let each other know what's available. And then also anyone can pop into any file, any library, is accessible to anyone else and so how do we continue this innovation? And how do we guide them to, you know, like build upon, and detach, and and try out new things? And so as you can see, a lot of our screens are pretty much box art. So that's where we decided to start with. I'm going to give you an example of what we call Moria. It's our plugin, and I'm going to show it to you. So Moria used to be a stand-alone web page. So I would go in if i'm looking for a title, and I would you know say i'm looking for Stranger Things. I would then find what I'm looking for, download it to my desktop, I would have 500 box art on my desktop, shove it in a folder later, and forget about it. It was not a very efficient thing at all, because once I download it to my computer, I have to upload it to my design.

So what we did was we created a plugin that's Moria inside Figma. So for example, if I wanted to change a piece of box art — as you saw on the web page — I can select and look what's on there, but now they're inside Figma already. So say I wanted a specific title cover, specific cover art for The Witcher.

I can change, and I can look at all the box art that's available, and change it to any one I want. But then, I can also change an entire row, which was never available you know to do and Fig- in the Moria webpage before. And what I can do is I can grab random titles.

I just chose random, and then it updates automatically with one click. You can change it again, and it's updating. And so that is pretty incredible because I used to go I don't know I used to just Google Netflix top lists and I would have to just search for titles, because there's just so many out there, how do we even know? So let's change an entire row, but then let's make it for the Korean audience. One click, and it changes the entire row.

And I change the language, and then it automatically updates any box art that's available with that title that's available in Korean. So The Influence might not be [in Korean] but as you can see others are.

So, here's a piece of box art. Let's change the entire thing to Squid Game.

And as you can see the logo changed, the synopsis changed, the billboard changed.

Well let's go down, and let's change everything for the Korean audience.

So everything updated with one click. And Moria itself, you know, it is incredible. It allows any box art, any merch still, any synopsis anything that's really dealing with the title, to be accessible to a designer right in Figma.

But we wanted to take a step further because we're never discouraging innovation, we are always trying to, you know, move things faster. Quality at scale, and faster over time. And so I can change a complete empty box to Squid Game. Say I'm going to make a cover for some unique experience I have a text here. Hi Schema.

Then I'm going to assign it to synopsis, and it changes that text and brings the synopsis right inside. So now let's make this really big.

If I didn't want this vertical box art, I can look and see what else there is to offer, maybe like a vertical billboard. Oh, it's the same picture.

a merch still. That is intense though, but I will go back to vertical billboard.

And then I'll take another rectangle, assign it to be a logo, and then we have this unique, custom box art that maybe I'm working on for some new idea.

So really it's about meeting designers where they're at and the tools that they're using, giving them the tools that really expedite their workflow. And you know this tool has not just helped designers, but I recently helped the researchers do a study with over 5,000 pieces of box art. And that would never have been done but been able to be done before. But using Moria and the tools that we're building is not just for XD. Sure it starts that way but we at the design systems team, as a core team, you know we want to scale what we do and leverage it for the entire org. So we just start with our you know XD, and ideally it's for the entire business.

And so how, you know, we'll end this demo soon — see if Luca's is still alive — but how do we, you know, extend these things? Like I just showed you XD templates. I just showed you, you know, Moria. How do we extend, how do we tell every designer "okay, this is how you're going to use this." You know, "here's the best practices." So I'm going to end this demo with something that we just recently launched, and it's called Figmagic. It's a Figma and Hawkins discovery program, and it's something that started out with myself just running countless, you know, onboarding sessions and workshops onboarding folks to the design system using Figma a Figma is just brand new in the org. And so, you know, there's only one of me. How do we scale this so I can spend my time doing other things, as well for the business and moving on to some other initiatives? And so we got BK, Matt, and India — huge shout out for making this happen — because we just launched this a month ago tomorrow. And since we've launched we've had almost 3,000 let's see user engagements, and almost 800 page views — or 900 actually. And there was another step that I totally forgot, but it is awesome. It is a lot, and we are leveraging this and it's really getting a lot of traction, because we're hearing good feedback. And so what it is, is how to learn Hawkins through Figma. Or sometimes, if you're just new to Figma, how to learn Figma. But what makes it so effective is that it's through Hawkins or through Netflix specific workflows. And so as you can see here it's a landing page, you know, get started top 10 Hawkins templates, Moria, the top things people want to learn. We have by skill, we have beginner, intermediate, advanced. And then we have by team.

So say I'm an engineer and I've been hearing about Figma. I click on Figmagic because I've never — I don't know what Figma is — and look "What is Figma". And it's a lovely article that's Netflix-focused letting, you know, the engineer know what they can use Figma for. Say I am a product designer and I want to learn more how to you know use XD templates. I saw Moria in a demo and I was like "Yes, that! I want to see it" So I click on XD templates.

I'm out, I might click on 102 episode, and it opens up a Figma file. And so what we've created are these curated workshops, I mean like directly into Figma files, broken down into bite-size lessons. And so as you can see here we take them through, give them examples, they duplicate this page, and then they follow along.

But what if I want to learn about Moria? So I might click on Moria 201, and it's a video. So we've created content. We used variety, we you know researched, we did a lot of talking to the designers and our partners before seeing what they needed. What is it that would be most helpful to help, you know, design efficacy and really scale their workflows. And so, you know, it's about talking, and including, and meeting designers where they're at. And so as they evolve, we will also evolve. We'll evolve our education, we will evolve our tooling — things like onboarding that can evolve. Even something as much as road maps can evolve.

And so roadmaps can evolve, and Luca is going to tell you about that, right now.

[Luca] Thank you, Jen. And talking about including and meeting people where they are, every designer has a chance to vote the components they need, or the features they are most excited about, through our quarterly Hawkins polls. We believe this is an excellent way for everyone to help us defining and shaping the trajectory of our design system. So every quarter we package all the requests, all the ideas, and all the feedback we received over the three previous months, and then upload everything to Figma.

Every designer has a personal card with some stickers and voting is as easy as moving those stickers on the components you'd like to see us working on during the upcoming quarter. Blue is one vote green is three, so a super vote. And the initiative is one years old, and it has been so successful that our designers actually are looking forward to these polls.

This quarter, a few of our of our product designers were out of office, or on parental leave, and we got some of them of their engineering partners getting into Figma and voting for them.

Not to go those stickers go to waste. How cool is that? The more votes, the higher the priority. And these essentially let us put the road mapping process on autopilot. So we just gotta grab everything that has been voted, and then sequence the tickets in our backlog based on the amount of those votes. This is an approach that has been working very well for foundational components that are useful for the daily job of our designers.

But, when it comes to more horizontal initiatives and bigger patterns — perhaps attached to specific data sources — this road mapping and the prioritization effort requires a different kind of approach. And one that is informed by our cross-functional partners, so that we can all align around the patterns that are useful to accomplish the company's objectives.

[Jen] So design system teams are accelerant to the initiatives that the product teams are doing. We have the purview to see horizontally, and think about the org that other teams don't have time or visibility to think about. So we want to leave you with a few questions and hope that you might go back to your team and have conversations about it. What can your design system do for you and the org if it allow if it was allowed to evolve naturally and organically? Less rigid, less controlled. How might it propel forward if you don't try to have control over everything. What can your team do that can be that can benefit the greatest number of people?

And so, you know, talk with your designers, talk with your partners, talk with your teams. Try to answer those questions from a place of trust. How can you leverage trust with your designers so your design system team can truly accelerate the needs of the business? Creating tools, creating you know, amazing things that really just expedite their workflow. And so by removing some of the control, choosing to guide where it makes sense — you saw how we didn't really get hung up on nomenclature. You know we try to build things in a way that the designers are thinking about as well we don't get hung up on how they're contributing as much. Because you know, right now where we are, that's what they're doing, and that's the place that we're at, and we are really grateful for it.

When they evolve and become more you know efficient and effective with the system, then we will involve a contribution model. Maybe we'll come up with a release cadence, but right now it just, it's working and I think meeting designers where they are is really important. And losing some of that control really, establishes a trust between you and the designers. And so what can you do to lose a little bit of that that stuff makes you go you know slowly. It's incremental. And so you're getting too hung up on the small little nuances, making sure every type of thing has every type of governance. You can encourage innovation, and a design system that evolves with the brand and the business.

So thank you so much for spending some of your morning with us.

[Luca] Thanks everyone.
