# Audio Source Composer

The Audio Source Composer is an open-source Digital Audio Workstation (DAW) 
built on the [WebAudioAPI](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
to work on all platforms from web browsers to desktops applications to mobile devices.

* [Composer Features](#features)
* Local Repository Installation
  + [Website Repository](#install-web)
  + [App Repository](#install-app)
* [Player](#player)
* [Communities](#community)

---

## Features: <a name="features"></a>
* Works on any modern browser on any phone, tablet or pc.
* Instruments and effects can be wrapped in each other to build complex presets.
* Note tracks can be called recursively for a highly structured song.

### What's Currently Working
* Add, edit, and delete notes and note tracks.
* Edit note velocity and duration.
* Quarter tone compatibility (missing in MIDI)
* Recursively play back tracks by adding a 'Track Note'.
* Track note transposing (play back tracks at different frequencies)

### Under the Hood
* Audio Source brings the WebAudio API to mobile by using a WebView as a proxy.
* Songs, instruments, and samples written for Audio Source will work on any platform. 
* Instruments render using React VirtualDOM on the UI thread while rendering audio in the WebView proxy. 

### Planned Features
* Sample libraries
* Audio recording and editing
* Track XY Grid for easy mouse-click composition
* Real-time editing between multiple users (like Google Docs)
* Server-side song rendering
* Import/Export MIDI files
* Variable BPM and other globals


# Web Browser Demo (Alpha)
Click the image below to try Audio Source Composer (Alpha) on your browser.

[![Browser Portrait](https://files.audiosource.io/releases/browser/screenshots/browser-portrait1.png)](https://audiosource.io/demo "Demo")



## Android Downloads

The Audio Source Composer Alpha Demo is available for download on Android Devices:

[Audio Source Composer(v0.5.4).apk](https://files.audiosource.io/releases/android/Audio%20Source%20Composer(v0.5.4).apk)

[Audio Source Composer(v0.5.3).apk](https://files.audiosource.io/releases/android/Audio%20Source%20Composer(v0.5.3).apk)

[Audio Source Composer(v0.5.1).apk](https://files.audiosource.io/releases/android/Audio%20Source%20Composer(v0.5.1).apk)

Check back often for updates as we get closer to Beta!


---


## Website Installation <a name="install-web"></a>

~~~~
$ git clone ssh://git@github.com/clevertree/audio-source-web --recursive
$ cd [audio-source-web]
$ npm install
~~~~

### Run Server
Note: This command should also open the website in your local browser.
~~~~
$ npm start
~~~~

### Browse to Local Server
[http://localhost:3000](http://localhost:3000)


---



## App Installation <a name="install-app"></a>

~~~~
$ git clone ssh://git@github.com/clevertree/audio-source-app --recursive
$ cd [audio-source-app]
$ npm install
~~~~

### Run in Android device
~~~~
$ react-native run-android
~~~~

### Run in iOS device (MacOSX)
~~~~
$ react-native run-ios
~~~~


---



# Coming soon: Audio Source Music Communities <a name="community"></a>
### [SNESology Music Community](https://snesology.net)
Listen to and publish remixes and arrangements (of copyrighted music)

### [AudioSource Music Community](https://audiosource.io)
Listen to, publish, and sell original music



## How can I help? What should I help with? Are there instructions? 
### Most of the work will be done on our github repo. Check out the README for installation instructions. 
We want help with everything from images, css, UI, testing, programming, and feedback. (And PR obviously!)

Git Repo: https://github.com/clevertree/audio-source-composer





# Contact

Open-Source means the AudioSource project is free forever, and anyone can join in the development,
so we're always looking for testers, artists, and all kinds of musician to 
[contribute](https://github.com/clevertree/audio-source-composer/issues/4).

Currently the composer is in
[active development](https://github.com/clevertree/audio-source-composer)
and has not yet been released.
Check back often for updates as we get closer to Beta!{
If you want to join up, please contact us on the 
[GitHub page](https://github.com/clevertree).

Check back often for updates as we get closer to Beta!

### How to report a bug
*   Go to [Github.com](https://github.com/clevertree/audio-source-composer/) and grab an account
*   Check for [existing bugs](https://github.com/clevertree/audio-source-composer/issues/) with the same description
*   Create a new [bug report](https://github.com/clevertree/audio-source-composer/issues/new) describing the problem
*   List your operating-system and browser versions
*   If possible, include the [developer's console](https://kb.mailster.co/how-can-i-open-the-browsers-console/) in the screen-shot
*   Try to include a [screen-shot](https://northatlanticlcc.org/help/how-to-save-a-screenshot-of-a-webpage) of the issue
*   Optionally describe your issue in the #bugs channel on [Discord](https://discord.gg/6NDH7sU)


###### [Created by Ari Asulin](https://github.com/clevertree/)
