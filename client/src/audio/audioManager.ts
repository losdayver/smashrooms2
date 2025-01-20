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

  private currentSoundTrack: HTMLAudioElement;
  private currentSoundTrackName: string;

  protected storeSound = (name: keyof typeof soundTrackMap) => {
    this.currentSoundTrack = new Audio(soundTrackRoute + soundTrackMap[name]);
    this.currentSoundTrack.loop = true;
    this.currentSoundTrackName = name;
  };

  playSound = (name: keyof typeof soundTrackMap) => {
    if (this.currentSoundTrack) this.stopSound();
    this.storeSound(name);
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

class SoundTrack {
  public audioElement: HTMLAudioElement;

  constructor(baseName: string) {
    this.audioElement = new Audio(soundTrackRoute + baseName);
    this.audioElement.loop = true;
  }
}

export class AudioEventManager extends AudioManager {
  private audioCtx = new AudioContext();
  // TODO: should we cache ArrayBuffers or AudioBuffers ?
  //  AudioBuffers are basically decoded ArrayBuffers
  private audioBuffersCache = new Map<string, AudioBuffer>();
  private currentAudioEvents = new Map<number, StereoSound>();

  protected storeSound = (name: keyof typeof soundEventMap) => {
    if (!this.audioBuffersCache.get(name))
      fetch(soundEventRoute + soundEventMap[name])
        .then((response) => response.arrayBuffer())
        .then((buffer) => this.audioCtx.decodeAudioData(buffer))
        .then((decodedData) => {
          this.audioBuffersCache.set(name, decodedData);
        });
  };

  playSound = (name: keyof typeof soundEventMap) => {
    this.storeSound(name);
    if (this.audioCtx.state === "suspended") this.audioCtx.resume();
    let sndIndex = 1;
    while (this.currentAudioEvents.get(sndIndex)) sndIndex++;
    this.currentAudioEvents.set(
      sndIndex,
      new StereoSound(this.audioCtx, this.audioBuffersCache.get(name))
    );
    this.currentAudioEvents.get(sndIndex).audioSrc.start(0);
    this.currentAudioEvents
      .get(sndIndex)
      .audioSrc.addEventListener("ended", () => {
        this.currentAudioEvents.delete(sndIndex);
      });
    return sndIndex;
  };

  pauseSound = (soundID: number) => {
    this.currentAudioEvents.get(soundID).audioSrc.stop();
  };

  stopSound = (soundID: number) => {
    this.pauseSound(soundID);
    this.currentAudioEvents.delete(soundID);
  };

  // TODO: add calculation of channel balance value based on sound event's srcX

  setSoundChannelBalance = (soundID: number, balanceVal: number) => {
    this.currentAudioEvents.get(soundID).setChannelBalance(balanceVal);
  };

  constructor() {
    super();
  }
}

class StereoSound {
  public audioSrc: AudioBufferSourceNode;
  private gainNodeL: GainNode;
  private gainNodeR: GainNode;
  private splitterNode: ChannelSplitterNode;
  private mergerNode: ChannelMergerNode;
  private dest: MediaStreamAudioDestinationNode;
  private static channelCount: number = 2; // or read from: 'audioSource.channelCount

  constructor(ctx: AudioContext, audioBuf: AudioBuffer) {
    this.audioSrc = ctx.createBufferSource();
    this.audioSrc.buffer = audioBuf;
    this.audioSrc.connect(ctx.destination);

    this.gainNodeL = new GainNode(ctx);
    this.gainNodeL.gain.value = 1;
    this.gainNodeR = new GainNode(ctx);
    this.gainNodeR.gain.value = 1;

    this.splitterNode = new ChannelSplitterNode(ctx, {
      numberOfOutputs: StereoSound.channelCount,
    });
    this.mergerNode = new ChannelMergerNode(ctx, {
      numberOfInputs: StereoSound.channelCount,
    });

    this.splitterNode.connect(this.gainNodeL, 0);
    this.splitterNode.connect(this.gainNodeR, 1);

    this.gainNodeL.connect(this.mergerNode, 0, 0);
    this.gainNodeR.connect(this.mergerNode, 0, 1);

    this.dest = ctx.createMediaStreamDestination();
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
