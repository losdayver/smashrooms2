import { soundTrackRoute, soundEventRoute } from "../routes.js";
import { EventEmitter, IEventEmitterPublicInterface } from "../utils.js";

abstract class AudioManager {
  protected abstract storeSound(
    name: keyof typeof soundEventMap | keyof typeof soundTrackMap
  ): void;

  public abstract playSound(
    name: keyof typeof soundEventMap | keyof typeof soundTrackMap
  ): number | null;

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

  private currentSoundTrack: SoundTrack = null;
  private currentSoundTrackName: string = null;

  protected storeSound = (name: keyof typeof soundTrackMap) => {
    this.currentSoundTrack = new SoundTrack(name);
    this.currentSoundTrackName = name;
  };

  playSound = (name: keyof typeof soundTrackMap) => {
    if (this.currentSoundTrack) this.stopSound();
    this.storeSound(name);
    this.currentSoundTrack.audioElement.play();
    this.eventEmitter.emit("onStartedSoundtrack", this.currentSoundTrackName);
    return null;
  };

  pauseSound = () => {
    this.currentSoundTrack.audioElement.pause();
  };

  stopSound = () => {
    this.pauseSound();
    this.currentSoundTrack.audioElement.currentTime = 0;
    this.eventEmitter.emit("onStoppedSoundtrack", this.currentSoundTrackName);
  };
}

export class AudioEventManager extends AudioManager {
  private audioCtx = new AudioContext();
  // private soundEventsCache: { [key: string]: StereoSound } = {};
  private currentSoundEvents = new Map<number, StereoSound>();

  protected storeSound = (name: keyof typeof soundEventMap) => {
    let sndIdex = 1;
    while (this.currentSoundEvents.get(sndIdex)) sndIdex++;
    this.currentSoundEvents.set(sndIdex, new StereoSound(name, this.audioCtx));
    this.currentSoundEvents
      .get(sndIdex)
      .audioElement.addEventListener("ended", () => {
        this.currentSoundEvents.delete(sndIdex);
      });
    return sndIdex;
  };

  playSound = (name: keyof typeof soundEventMap) => {
    const soundID = this.storeSound(name);
    if (this.audioCtx.state === "suspended") this.audioCtx.resume();
    this.currentSoundEvents.get(soundID).audioElement.play();
    return soundID;
  };

  pauseSound = (soundID: number) => {
    this.currentSoundEvents.get(soundID).audioElement.pause();
  };

  stopSound = (soundID: number) => {
    this.pauseSound(soundID);
    this.currentSoundEvents.get(soundID).audioElement.currentTime = 0;
  };

  // TODO: add calculation of channel balance value based on sound event's srcX

  setSoundChannelBalance = (soundID: number, balanceVal: number) => {
    this.currentSoundEvents.get(soundID).setChannelBalance(balanceVal);
  };

  constructor() {
    super();
  }
}

abstract class Sound {
  public audioElement: HTMLAudioElement;

  constructor(soundRoute: string, baseName: string) {
    this.audioElement = new Audio(soundRoute + baseName);
  }
}

class SoundTrack extends Sound {
  constructor(name: string) {
    super(soundTrackRoute, soundTrackMap[name]);
    this.audioElement.loop = true;
  }
}

class StereoSound extends Sound {
  private mediaSrc: MediaElementAudioSourceNode;
  private gainNodeL: GainNode;
  private gainNodeR: GainNode;
  private splitterNode: ChannelSplitterNode;
  private mergerNode: ChannelMergerNode;
  private balanceValue: number = 0;
  private static channelCount = 2; // or read from: 'audioSource.channelCount'

  constructor(name: string, ctx: AudioContext) {
    super(soundEventRoute, soundEventMap[name]);
    // this.audioElement.crossOrigin = "anonymous";
    this.mediaSrc = ctx.createMediaElementSource(this.audioElement);

    this.gainNodeL = new GainNode(ctx);
    this.gainNodeL.gain.value = 0.5;
    this.gainNodeR = new GainNode(ctx);
    this.gainNodeR.gain.value = 0.5;

    this.splitterNode = new ChannelSplitterNode(ctx, {
      numberOfOutputs: StereoSound.channelCount,
    });
    this.mergerNode = new ChannelMergerNode(ctx, {
      numberOfInputs: StereoSound.channelCount,
    });

    this.mediaSrc.connect(this.splitterNode);
    this.splitterNode.connect(this.gainNodeL, 0);
    this.splitterNode.connect(this.gainNodeR, 1);

    this.gainNodeL.connect(this.mergerNode, 0, 0);
    this.gainNodeR.connect(this.mergerNode, 0, 1);

    this.mergerNode.connect(ctx.destination);
  }

  setChannelBalance = (balanceVal: number) => {
    this.gainNodeL.gain.value = 1 - balanceVal;
    this.gainNodeR.gain.value = 1 + balanceVal;
  };
}

// 2.1, 5.1, 7.1, ... ?

type SoundTrackEventsType = "onStartedSoundtrack" | "onStoppedSoundtrack";

const soundTrackMap = {
  iceworld: "iceworld.mp3",
  mycelium: "mycelium.mp3",
} as const;

// TODO jump, itemPickup
export const soundEventMap = {
  jump: "jump.mp3",
  punchAir: "punch_air.mp3",
  punch: "punch.mp3",
  itemPickup: "item_pickup.m4a",
  pistolShot: "pistol_shot.mp3",
  shotgunShot: "shotgun_shot.mp3",
  bazookaShot: "bazooka_rocket_launch.mp3",
  bazookaExplosion: "bazooka_rocket_explosion.mp3",
} as const;
