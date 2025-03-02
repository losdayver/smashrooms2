import { soundTrackRoute, soundEventRoute } from "../routes.js";
import { EventEmitter, IEventEmitterPublicInterface } from "../utils.js";

abstract class AudioManager {
  protected abstract storeSound(
    name: keyof typeof soundEventMap | keyof typeof soundTrackMap
  ): void;

  public abstract playSound(
    name: keyof typeof soundEventMap | keyof typeof soundTrackMap
  ): Promise<number> | null;

  public abstract pauseSound(soundID: number | null): void;

  public abstract stopSound(soundID: number | null): void;
}

export class AudioTrackManager
  extends AudioManager
  implements IEventEmitterPublicInterface<SoundTrackEventsType>
{
  private eventEmitter = new EventEmitter<SoundTrackEventsType>();
  on = (
    eventName: SoundTrackEventsType,
    callbackID: string,
    callback: (data?: any) => void | Promise<void>
  ) => this.eventEmitter.on(eventName, callbackID, callback);
  off = (eventName: SoundTrackEventsType, callbackID: string) =>
    this.eventEmitter.off(eventName, callbackID);

  private currentSoundTrack: HTMLAudioElement;
  private currentSoundTrackName: string;

  protected storeSound = (name: keyof typeof soundTrackMap) => {
    this.currentSoundTrack = new Audio(soundTrackRoute + soundTrackMap[name]);
    this.currentSoundTrack.volume = 0.3;
    this.currentSoundTrackName = name;
    return true;
  };

  playSound = (name: keyof typeof soundTrackMap) => {
    if (this.currentSoundTrack) this.stopSound();
    this.storeSound(name);
    this.currentSoundTrack.onended = () =>
      this.eventEmitter.emit("onEndedSoundtrack", this.currentSoundTrackName);
    this.currentSoundTrack.play();
    this.eventEmitter.emit("onStartedSoundtrack", this.currentSoundTrackName);
    return null;
  };

  pauseSound = () => {
    this.currentSoundTrack.pause();
  };

  stopSound = () => {
    this.pauseSound();
    this.currentSoundTrack.currentTime = 0;
    this.eventEmitter.emit("onStoppedSoundtrack", this.currentSoundTrackName);
  };
}

export class AudioEventManager extends AudioManager {
  private audioCtx: AudioContext = new AudioContext();
  private audioBuffersCache = new Map<string, AudioBuffer>();
  private currentAudioEvents = new Map<number, StereoAudioEvent>();

  protected storeSound = async (
    name: keyof typeof soundEventMap
  ): Promise<void> => {
    if (!this.audioBuffersCache.get(name))
      await fetch(soundEventRoute + soundEventMap[name])
        .then((response) => response.arrayBuffer())
        .then((buffer) => this.audioCtx.decodeAudioData(buffer))
        .then((decodedData) => {
          this.audioBuffersCache.set(name, decodedData);
        });
  };

  private createSound = (name: keyof typeof soundEventMap): number => {
    let sndIndex = 1;
    while (this.currentAudioEvents.get(sndIndex)) sndIndex++;
    this.currentAudioEvents.set(
      sndIndex,
      new StereoAudioEvent(this.audioCtx, this.audioBuffersCache.get(name))
    );
    return sndIndex;
  };

  playSound = async (name: keyof typeof soundEventMap): Promise<number> => {
    if (this.audioCtx.state === "suspended") await this.audioCtx.resume();
    await this.storeSound(name);
    const sndIndex = this.createSound(name);
    const currentAudioEvent = this.currentAudioEvents.get(sndIndex);
    currentAudioEvent.audioSrc.start();
    currentAudioEvent.audioSrc.addEventListener("ended", () => {
      this.currentAudioEvents.delete(sndIndex);
    });
    return sndIndex;
  };

  pauseSound = (soundID: number) => {
    this.currentAudioEvents.get(soundID).audioSrc?.stop();
  };

  stopSound = (soundID: number) => {
    this.pauseSound(soundID);
    this.currentAudioEvents.delete(soundID);
  };

  // TODO: add calculation of channel balance value based on sound event's srcX (and srcY), or maybe even more complex logic
  //  and think about where it should be incapsulated

  setSoundChannelBalance = (soundID: number, balanceVal: number) => {
    this.currentAudioEvents.get(soundID).setChannelBalance(balanceVal);
  };
}

abstract class AudioPreamp {
  protected static defaultGain: number = 0.5;
  protected abstract passThroughMixer(ctx: AudioContext): void;
}

class StereoAudioEvent extends AudioPreamp {
  // TODO: get it from audioSrc.channelCount
  //  and then dynamically create various types of sounds, make SoundFactory
  public static channelCount: number = 2;
  public audioSrc: AudioBufferSourceNode;
  private splitterNode: ChannelSplitterNode;
  private mergerNode: ChannelMergerNode;
  private gainNodeL: GainNode;
  private gainNodeR: GainNode;

  setChannelBalance = (balanceVal: number) => {
    this.gainNodeL.gain.value = StereoAudioEvent.defaultGain - balanceVal;
    this.gainNodeR.gain.value = StereoAudioEvent.defaultGain + balanceVal;
  };

  protected passThroughMixer = (ctx: AudioContext): void => {
    this.audioSrc.connect(this.splitterNode);
    this.splitterNode.connect(this.gainNodeL, 0);
    this.splitterNode.connect(this.gainNodeR, 1);
    this.gainNodeL.connect(this.mergerNode, 0, 0);
    this.gainNodeR.connect(this.mergerNode, 0, 1);
    this.mergerNode.connect(ctx.destination);
  };

  constructor(ctx: AudioContext, audioBuf: AudioBuffer) {
    super();
    this.audioSrc = ctx.createBufferSource();
    this.audioSrc.buffer = audioBuf;

    this.gainNodeL = new GainNode(ctx);
    this.gainNodeL.gain.value = StereoAudioEvent.defaultGain;
    this.gainNodeR = new GainNode(ctx);
    this.gainNodeR.gain.value = StereoAudioEvent.defaultGain;

    this.splitterNode = new ChannelSplitterNode(ctx, {
      numberOfOutputs: StereoAudioEvent.channelCount,
    });
    this.mergerNode = new ChannelMergerNode(ctx, {
      numberOfInputs: StereoAudioEvent.channelCount,
    });

    this.passThroughMixer(ctx);
  }
}

// class FivePointOneSound, class SevenPointOneSound, ...

type SoundTrackEventsType =
  | "onStartedSoundtrack"
  | "onStoppedSoundtrack"
  | "onEndedSoundtrack";

export const soundTrackMap = {
  iceworld: "iceworld.mp3",
  mycelium: "mycelium.mp3",
  ascend: "ascend.mp3",
} as const;

export const soundEventMap = {
  jump: "jump.mp3",
  punchAir: "punchAir.mp3",
  punch: "punch.mp3",
  itemPickup: "itemPickup.mp3",
  pistolShot: "pistol_shot.mp3",
  shotgunShot: "shotgun_shot.mp3",
  bazookaShot: "bazooka_rocket_launch.mp3",
  bazookaExplosion: "bazooka_rocket_explosion.mp3",
  hit: "hit.mp3",
  blaster: "blaster.mp3",
  bullet: "bullet.mp3",
  heal: "heal.mp3",
  clientConnect: "clientConnect.mp3",
  revive: "revive.mp3",
  death: "death.mp3",
  sniperBullet: "sniperBullet.mp3",
  teleport: "teleport.mp3",
  siren: "siren.mp3",
} as const;
