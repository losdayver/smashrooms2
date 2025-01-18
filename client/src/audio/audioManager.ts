import { soundTrackRoute, soundEventRoute } from "../routes.js";
import { EventEmitter, IEventEmitterPublicInterface } from "../utils.js";

abstract class AudioManager {
  protected abstract storeSound(
    name: keyof typeof soundEventMap | keyof typeof soundTrackMap,
  ): void;

  public abstract playSound(
    name: keyof typeof soundEventMap | keyof typeof soundTrackMap,
  ): void;

  public abstract pauseSound(
    name: keyof typeof soundEventMap | keyof typeof soundTrackMap,
  ): void;
}

export class AudioTrackManager
  extends AudioManager
  implements IEventEmitterPublicInterface<AudioEvents>
{
  private eventEmitter = new EventEmitter<AudioEvents>();
  on = (
    eventName: AudioEvents,
    callbackID: string,
    callback: (data?: any) => void | Promise<void>,
  ) => this.eventEmitter.on(eventName, callbackID, callback);
  off = (eventName: AudioEvents, callbackID: string) =>
    this.eventEmitter.off(eventName, callbackID);

  private soundTrackCache: { [key: string]: SoundTrack } = {};
  private currentSoundtrackName: keyof typeof soundTrackMap = null;

  protected storeSound = (name: keyof typeof soundTrackMap) => {
    if (!this.soundTrackCache[name]) {
      this.soundTrackCache[name] = new SoundTrack(name);
    }
  };

  playSound = (name: keyof typeof soundTrackMap) => {
    this.storeSound(name);
    if (this.currentSoundtrackName) this.stopCurrentSound();
    this.currentSoundtrackName = name;
    this.soundTrackCache[name].audioElement.play();
  };

  pauseSound = (name: keyof typeof soundTrackMap) => {
    this.soundTrackCache[name].audioElement.pause();
  };

  stopCurrentSound = () => {
    this.pauseSound(this.currentSoundtrackName);
    this.soundTrackCache[this.currentSoundtrackName].audioElement.currentTime =
      0;
  };

  constructor() {
    super(); // ваще чётко
  }
}

// TODO: event emmitter here?
export class AudioEventManager extends AudioManager {
  private audioCtx = new AudioContext();
  private soundEventsCache: { [key: string]: StereoSound } = {};

  protected storeSound = (name: keyof typeof soundEventMap) => {
    if (!this.soundEventsCache[name]) {
      this.soundEventsCache[name] = new StereoSound(name, this.audioCtx);
    }
  };

  playSound = (name: keyof typeof soundEventMap) => {
    if (this.audioCtx.state === "suspended") this.audioCtx.resume();
    this.soundEventsCache[name].audioElement.play();
  };

  pauseSound = (name: keyof typeof soundEventMap) => {
    this.soundEventsCache[name].audioElement.pause();
  };

  stopSound = (name: keyof typeof soundTrackMap) => {
    this.soundEventsCache[name].audioElement.pause();
    this.soundEventsCache[name].audioElement.currentTime = 0;
  };

  // TODO: add calculation of channel balance value based on sound event's srcX

  setSoundChannelBalance = (
    name: keyof typeof soundEventMap,
    balanceVal: number,
  ) => {
    this.soundEventsCache[name].setChannelBalance(balanceVal);
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
    this.gainNodeL.gain.value = 2;
    this.gainNodeR = new GainNode(ctx);
    this.gainNodeR.gain.value = 2;

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

// TODO: are onStartEvent, onStopEvent needed?
type AudioEvents = "onStartedSoundtrack" | "onStoppedSoundtrack";

const soundTrackMap = {
  iceworld: "iceworld.mp3",
  mycelium: "mycelium.mp3",
} as const;

const soundEventMap = {
  jump: "jump.mp3",
  punch_air: "punch_air.mp3",
  punch: "punch.mp3",
  item_pickup: "item_pickup.m4a",
  pistol_shot: "pistol_shot.mp3",
  shotgun_shot: "shotgun_shot.mp3",
  bazooka_shot: "bazooka_rocket_launch.mp3",
  bazooka_explosion: "bazooka_rocket_explosion.mp3",
} as const;
