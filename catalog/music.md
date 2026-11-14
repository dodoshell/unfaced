# Music

Background music moods. Every track is made by code when the video is made (`engine/src/music/moods.ts`): a tempo, a chord progression and a few synthesized instruments, so it fits any length, sounds the same every time and needs no licence beyond unfaced's own MIT. Music always sits under the voice, never over it.

How `unfaced make` uses it:

- The track is made at the video's exact length, fades in over 0.8 s and out over 0.9 s. With the seamless loop ending (01) it doesn't fade: its end runs into its start, so the replay has no seam.
- Under a voice-over, the music ducks to −34 dB below the voice's level while someone speaks and comes back up to −26 dB in the pauses, so the words stay clear.
- Without a voice-over (voice `08 None`), the music is the whole soundtrack and is brought to −14 LUFS, the level the platforms play at.
- The mixed soundtrack is `soundtrack.wav` in the video folder; the voice-over stays in `voice.wav`.

To use a trending sound instead, pick `08 None` and add the sound in the app when posting.

## 01 Suspense

**Status:** ready

Slow tension that builds under the voice: a low drone, a slow heartbeat that gets louder, and a high tremolo note that creeps in. 70 bpm.

- Good for: mystery, cliffhangers, "nobody talks about this".
- Pairs well with: voice 04 whisper or 01 calm documentary, ending 02 cliffhanger.

## 02 Epic

**Status:** ready

Big drums, string chords and brass stabs in a minor key, for dramatic moments. 90 bpm.

- Good for: history, space, sport, countdowns.
- Pairs well with: voice 07 news anchor or 03 storyteller, script 02 top N countdown.

## 03 Lo-fi

**Status:** ready

Dusty electric piano chords over a lazy, swung beat, for calm and cosy content. 80 bpm.

- Good for: study, how it works, relaxing facts.
- Pairs well with: voice 06 warm friendly or 01 calm documentary, captions 03 typewriter.

## 04 Upbeat

**Status:** ready

A bright plucked arpeggio over a four-on-the-floor kick and claps; keeps the pace high. 120 bpm.

- Good for: lists, life hacks, tech.
- Pairs well with: voice 02 energetic, captions 02 bold centre or 05 outline pop.

## 05 Playful

**Status:** ready

A bouncy marimba tune with pizzicato bass and a woodblock tick, light and silly. 110 bpm.

- Good for: animals, kids, humour, the mascot's mini stories.
- Pairs well with: style 03 flat cartoon, voice 05 deadpan or 02 energetic.

## 06 Emotional

**Status:** ready

Soft piano arpeggios with strings that swell in, for moving stories. 66 bpm.

- Good for: stories, nature, history with a human moment.
- Pairs well with: voice 03 storyteller, script 05 story in 60 seconds.

## 07 Mystery

**Status:** ready

A tritone drone and sparse bells from a whole-tone scale: strange, unresolved sounds for unexplained things. 60 bpm.

- Good for: mystery, space, deep sea.
- Pairs well with: voice 04 whisper, music under hook 01 shocking question.

## 08 None

**Status:** ready

No music track. Use it for voice-led videos, or when you will add a trending sound in the app when posting (trending sounds often reach more people than a fixed track).
