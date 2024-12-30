import { soundtrackRoute } from "../routes.js";
import { EventEmitter, IEventEmitterPublicInterface } from "../utils.js";

export class AudioManager implements IEventEmitterPublicInterface<AudioEvents> {
  private eventEmitter = new EventEmitter<AudioEvents>();
  on = (
    eventName: AudioEvents,
    callbackID: string,
    callback: (data?: any) => void | Promise<void>
  ) => this.eventEmitter.on(eventName, callbackID, callback);
  off = (eventName: AudioEvents, callbackID: string) =>
    this.eventEmitter.off(eventName, callbackID);

  startSoundtrack = (name: keyof typeof soundtrackMap) => {
    if (!this.cache.soundtracks[name]) {
      this.cache.soundtracks[name] = new Audio(
        soundtrackRoute + soundtrackMap[name]
      );
      this.cache.soundtracks[name].autoplay = true;
    }
    if (this.currentSoundtrackName) this.stopCurrentSoundtrack();
    this.currentSoundtrackName = name;
    this.cache.soundtracks[name].loop = true;
    this.cache.soundtracks[name].play();
    this.eventEmitter.emit("onStartedSoundtrack", { name });
  };
  private stopCurrentSoundtrack = () => {
    if (!this.currentSoundtrackName) return;
    this.cache.soundtracks[this.currentSoundtrackName].pause();
    this.cache.soundtracks[this.currentSoundtrackName].currentTime = 0;
  };
  private currentSoundtrackName: keyof typeof soundtrackMap = null;
  private cache: {
    soundtracks: Partial<Record<keyof typeof soundtrackMap, HTMLAudioElement>>;
    sounds: Partial<Record<keyof typeof soundMap, HTMLAudioElement>>;
  } = {
    soundtracks: {},
    sounds: {},
  };

  constructor() {
    new Audio();
  }
}

type AudioEvents = "onStartedSoundtrack" | "onStoppedSoundtrack";

const soundtrackMap = {
  iceworld: "iceworld.mp3",
} as const;

const soundMap = {} as const;
