# Post format

`post.md` holds what the user pastes when posting: a caption and hashtags for each platform. A video's `post.md` sits in the video folder next to `video.mp4` and `cover.png`; a still post's sits in the post folder next to its slides (see "For a still post" below). unfaced never posts; the user (or a tool such as Regia) does.

```markdown
# Why do cats purr?

Video: video.mp4 · Cover: cover.png (frame at 00:01.0) · Length: 00:34

## TikTok

Cats purr when they're hurt too, and it might be healing them. 🐱
Would you have guessed? 👇

#catfacts #cats #animalfacts #learnontiktok

## Instagram Reels

Cats don't only purr when they're happy. They purr when they're hurt, too, and the frequency might help bones heal.

Save this for the next time your cat purrs on you.

#catfacts #catsofinstagram #animalfacts

## YouTube Shorts

Title: Why do cats purr when they're hurt? #shorts
Description: Purring isn't just happiness. Sources: Muggenthaler 2001, Journal of the Acoustical Society of America. #catfacts #cats #animalfacts

## Notes

- Post with the cover above; on Instagram choose it in "Edit cover".
- Music 08 (none): add a trending sound in the app, quietly under the voice.
```

Rules:

- Write in the page's language. Keep the headings (the platform names and `Notes`) and the labels (`Video:`, `Cover:`, `Length:`, `Title:`, `Description:`) in English.
- The first line of each caption is a hook of its own: the platforms cut captions after about one line.
- 3 to 5 hashtags per platform: one or two broad, the rest about the niche. No banned or unrelated tags.
- Don't promise what the video doesn't show, and don't repeat the whole script.
- A YouTube Shorts title stays under 100 characters.
- Mention the sources when the video makes a factual claim (in the YouTube description, or a short "Source:" line).
- `Notes` is for the user: which cover to choose, a trending sound to add, the best time to post if `results.md` shows one.

## For a still post

A post made with `unfaced post` has its own `post.md` in the post folder, next to `slide-01.png` and `grid.png`. It has a section per platform the post is for, from `Instagram`, `LinkedIn` and `Facebook`. Each has a caption, hashtags and an alt text for every slide. The video sections above (`TikTok`, `Instagram Reels`, `YouTube Shorts`) are not used.

```markdown
# Who we are

Format: instagram-carousel, linkedin-carousel · Slides: 4 · File: post.pdf (LinkedIn)

## Instagram

We make your posts without a camera. Here is how a post is born, in four steps.

Save this for your next content plan.

#smallbusiness #socialmedia #contentplanning

Alt text:
1. Cover: "This page is made by our software", white text on a dark blue ground.
2. Two columns: cameras and filming crossed out, graphics and voice ticked.
3. Four steps from topic to check; two are done by us, two by the software.
4. A button: "Join the waiting list", link in bio.

## LinkedIn

Not everyone wants to be on camera, and few small teams have time to film. We built a way to publish without either.

Four slides, four steps. Which one do you still do by hand?

#contentmarketing #smallbusiness #automation

Alt text:
1. ...

## Facebook

Caption: ...

Alt text:
1. ...

## Notes

- Upload post.pdf as a LinkedIn document; the slide PNGs go to Instagram.
```

Extra rules for a still post:

- Alt text: one line per slide, numbered, describing what the slide shows and says, in the page's language. Plain description, not a repeat of the hashtags; leave out decoration. Keep the label `Alt text:` in English.
- `Instagram`: first line is the hook; 3 to 5 hashtags. `LinkedIn`: a short opening line, no more than 3 hashtags, a question at the end invites comments. `Facebook`: conversational, hashtags optional and few.
- Don't repeat the slides in the caption; add the reason to swipe or to act.
- Use the handle and tone from the page's `brand`, and never a word from `brand.words.avoid`. The slides don't show `brand.site`: put it in the caption where a link helps (on LinkedIn, or as the last line on Facebook).
