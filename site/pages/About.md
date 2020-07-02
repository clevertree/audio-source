# Audio Source Composer

The Audio Source Composer is an Open-Source Digital Audio Workstation (DAW)
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

### What's Currently Working:
* Add, edit, and delete notes and note tracks.
* Edit note velocity and duration.
* Quarter tone compatibility (missing in MIDI)
* Recursively play back tracks by adding a 'track note'.
* Track note transposing (play back tracks at different frequencies)

### Under the Hood:
* Audio Source brings the WebAudio API to mobile by using a WebView as a proxy.
* Songs, instruments, and samples written for Audio Source will work on any platform. 
* Instruments render using React VirtualDOM on the UI thread while rendering audio in the WebView proxy. 

### Planned Features:
* Sample libraries
* Audio recording and editing
* Track XY Grid for easy mouse-click composition
* Real-time editing between multiple users (like Google Docs)
* Server-side song rendering
* Import/Export MIDI files


---


## Website Installation <a name="install-web"></a>

~~~~
$ git clone ssh://git@github.com/clevertree/audio-source-app --recursive
$ cd [audio-source-app]
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



# Audio Source Player (ASP) <a name="player"></a>
Coming Soon!

## Planned Features:

* Works on any modern browser on any phone, tablet or pc
* Render songs in real-time for highest playback quality
* Embeddable on any website with 2 lines of code
* Plays MIDI files


---

# Coming soon: Audio Source Music Communities <a name="community"></a>
### [SNESology Music Community](https://snesology.net)
Listen to and publish remixes and arrangements (of copyrighted music).

### [AudioSource Music Community](https://audiosource.io)
Listen to, publish, and sell original music.



## How can I help? What should I help with? Are there instructions? 
### Most of the work will be done on our github repo. Check out the README for installation instructions. 
We're looking for help with everything from images, css, UI, testing, programming, and feedback!

Git: https://github.com/clevertree/audio-source-composer





###### [Created by Ari Asulin](https://github.com/clevertree/)

