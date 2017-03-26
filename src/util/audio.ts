import { Howl, Howler } from "howler";

export enum Sounds {
    PLOP, PLOP_QUIET,
}

export class Audio {
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

    public static play(sound: Sounds) {
        Audio.initialize();
        let howl = Audio.sounds[sound];
        if (howl != null) {
            howl.play();
            return true;
        }
        return false;
    }

    private static sounds: {[key: string]: Howl};
}

Audio.initialize();
