export default class TrackIterator {
    constructor(song, startingTrackName = null) {
        startingTrackName = startingTrackName || song.getStartTrackName();
        if (!song.data.tracks[startingTrackName])
            throw new Error("Invalid instruction track: " + startingTrackName);

    }

    // Keep track of instructions by destination. Allow routing of effects within a channel
}
