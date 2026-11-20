---
type: llm
weight: 2
---

The user asked for a Pinterest pin. unfaced makes four post formats and a Pinterest pin is not one of them: an Instagram carousel (a swipeable post), an Instagram post (one image, optionally square), a LinkedIn carousel (a PDF for LinkedIn's document post) and a story (vertical, one idea per screen).

PASS if the reply says a Pinterest pin is not a format unfaced makes, offers the four formats described by what each is for (not by pixel sizes), and lets the user choose (it may suggest the single Instagram post or the story as the closest); it writes no files.

FAIL if it says it made or will make a Pinterest pin, invents a format that is not one of the four, asks for a size in pixels, or writes a file.
