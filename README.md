# Audio Source Composer

Created by Ari Asulin

This is an early peak at the Audio Source Composer. Try it out at https://audiosource.io

## Currently Working:
* Add, edit, and delete notes and note groups (delete has a bug)
* Recursively play back note groups
* Note velocity, ADSR (still early), sample key ranges
* Sample Synthesizer Instrument with GM librarys
* Oscillator Synthesizer (No libraries yet)
* Tracker-View which works with midi note deltas
* Works on any modern browser on any phone, tablet or pc
* Embeddable on any website with 2 lines of code
* Import MIDI files (buggy)

## Planned Features:
* Audio editing
* XY Grid for easy mouse-click composition
* Real-time editing between multiple users (like Google Docs)
* Server-side song rendering
* Export MIDI files

## How to put the composer element on your website
```
<script src="https://audiosource.io/composer/audio-source-composer.min.js"></script>
<audio-source-composer></audio-source-composer>
```


# Audio Source Player (ASP)
Coming Soon!

## Planned Features:

* Works on any modern browser on any phone, tablet or pc
* Render song play-back in real-time for highest playback quality
* Embeddable on any website with 2 lines of code
* Plays MIDI files
* How to put the player on your website
```
<script src="https://audiosource.io/player/audio-source-player.min.js"></script>
<audio-source-player></audio-source-player>
```


# Audio Source Synthesizer

## Planned Features:
* Works on any modern browser on any phone, tablet or pc
* Stand-alone Synthesizer can be embeddable on any website
* Supports MIDI input events
* Embeddable within other DAWs

## How to put the synthesizer on your website
```
<script src="https://audiosource.io/instrument/audio-source-synthesizer.js"></script>
<audio-source-synthesizer></audio-source-synthesizer>
```


## Coming soon: Audio Source Music Communities
### SNESology Music Community
Listen to and Publish Remixes (of copyrighted music)

### AudioSource Music Community
Listen to, Publish, and Sell Original Music


# FAQ

##### Q: What is the Audio Source Composer vision?
######  The vision is essentially that everyone in the future makes music where the 'source' can be viewed easily by anyone. Some kid can get inspired to make music and hit 'source' on his/her favorite composer's song, and go 'wait I can do that'

##### Q: Why will artists (his favourite composer) give away the source?
###### What artist, if he/her is willing to call themselves that, doesn't want their fans to see their source? I've always shared my song source. I've always answered questions from fans and other artists about how I pulled this or that off, or borrow a sample, or a vsti. Anyway, this concept only applies to an artist who actually builds their songs with this software in the first place, so the for-profit industry-suckers can stay in their closed-source shrinking bubble, at least while it hasn't popped yet

##### Q: How can I help? What should I help with? Are there instructions? 
###### Most of the work will be done on our github repo. Check out the README for installation instructions. 
We want help with everything from images, css, UI, testing, programming, and feedback. (And PR obviously!)
https://github.com/clevertree/audio-source-composer