import { Howl, Howler } from "howler";

/**
 * An enumeration of identifiers for sounds used by this app.
 */
export enum Sounds {
    PLOP,
}

/**
 * A class containing methods used to play sounds.
 */
export class Audio {
    /** Initializes the sounds repository. */
    public static initialize() {
        if (Audio.sounds == null) {
            Audio.sounds = {};
            Audio.sounds[Sounds.PLOP] = new Howl({
                // mp3 is public domain, downloaded from
                // http://soundbible.com/2067-Blop.html
                src: ["sounds/Blop-Mark_DiAngelo-79054334.mp3"],
                volume: 0.1,
            });
        }
    }

    /** Plays the sound with the given identifier. */
    public static play(sound: Sounds) {
        Audio.initialize();
        let howl = Audio.sounds[sound];
        if (howl != null) {
            howl.play();
            return true;
        }
        return false;
    }

    // Contains the sounds as Howls.
    private static sounds: {[key: string]: Howl};
}

// Initialize the audio so that the resources are preloaded before we attempt to
// play anything.
Audio.initialize();
