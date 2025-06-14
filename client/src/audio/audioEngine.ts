import {
  AudioConfig,
  AudioSettingObjType,
  AudioSetting,
} from "@client/config/config";
import { soundTrackRoute, soundEventRoute } from "@client/routes";
import { SignalEmitter, ISignalEmitterPublicInterface } from "@client/utils";

export abstract class AudioEngine {
  protected audioCfg: AudioConfig = new AudioConfig();
  protected audioCfgKey: keyof AudioSettingObjType;
  public lastPositiveContextualVolume: number;
  public static maxContextualVolume: number = 0.4;
  public isMuted: boolean = false;

  constructor(audioCfgKey: keyof AudioSettingObjType) {
    this.audioCfgKey = audioCfgKey;
    this.lastPositiveContextualVolume ??=
      this.audioCfg.getValue(this.audioCfgKey)?.currentVolume ?? 0.3;
    if (this.audioCfg.getValue(this.audioCfgKey)?.muted) {
      this.toggleMute();
    }
  }

  protected abstract storeSound(
    name: keyof typeof soundEventMap | keyof typeof soundTrackMap
  ): void;

  public abstract playSound(
    name: keyof typeof soundEventMap | keyof typeof soundTrackMap
  ): Promise<number> | null;

  public abstract pauseSound(soundID: number | null): void;

  public toggleMute = (): boolean => {
    if (this.isMuted) {
      this.setContextualVolume(this.lastPositiveContextualVolume);
    } else {
      this.setContextualVolume(0);
    }
    this.isMuted = !this.isMuted;
    this.audioCfg.setValue(this.audioCfgKey, {
      muted: this.isMuted,
      currentVolume: this.audioCfg.getValue(this.audioCfgKey).currentVolume,
    });
    return this.isMuted;
  };

  public setContextualVolume = (volume: number): void => {};

  public abstract stopSound(soundID: number | null): void;
}

export class AudioTrackEngine
  extends AudioEngine
  implements ISignalEmitterPublicInterface<SoundTrackEventsType>
{
  private signalEmitter = new SignalEmitter<SoundTrackEventsType>();
  on = (
    eventName: SoundTrackEventsType,
    callbackID: string,
    callback: (data?: any) => void | Promise<void>
  ) => this.signalEmitter.on(eventName, callbackID, callback);
  off = (eventName: SoundTrackEventsType, callbackID: string) =>
    this.signalEmitter.off(eventName, callbackID);

  constructor() {
    super("music");
  }

  private currentSoundTrack: HTMLAudioElement;
  private currentSoundTrackName: string;

  protected storeSound = (name: keyof typeof soundTrackMap) => {
    this.currentSoundTrack = new Audio(soundTrackRoute + soundTrackMap[name]);
    this.currentSoundTrack.volume = this.isMuted
      ? 0
      : this.lastPositiveContextualVolume;
    this.currentSoundTrackName = name;
    return true;
  };

  playSound = (name: keyof typeof soundTrackMap): null => {
    if (this.currentSoundTrack) this.stopSound();
    this.storeSound(name);
    this.currentSoundTrack.onended = () =>
      this.signalEmitter.emit("onEndedSoundtrack", this.currentSoundTrackName);
    this.currentSoundTrack.play();
    this.signalEmitter.emit("onStartedSoundtrack", this.currentSoundTrackName);
    return null;
  };

  getCurrentSoundTrackInfo = (): string => {
    return `smsh2 OST - ${this.currentSoundTrackName}`;
  };

  getCurrentSoundTrackProgress = (): number => {
    if (!this.currentSoundTrack) return 0;
    return Math.round(
      (this.currentSoundTrack.currentTime / this.currentSoundTrack.duration) *
        100
    );
  };

  setContextualVolume = (volume: number): void => {
    const newConfigValue: AudioSetting = {
      muted: this.isMuted,
      currentVolume: this.lastPositiveContextualVolume,
    };
    newConfigValue.muted = this.isMuted;
    if (volume !== 0) {
      this.lastPositiveContextualVolume = volume;
      newConfigValue.currentVolume = volume;
    }
    this.currentSoundTrack.volume = volume;
    this.audioCfg.setValue(this.audioCfgKey, newConfigValue);
  };

  pauseSound = () => {
    this.currentSoundTrack.pause();
  };

  stopSound = () => {
    this.pauseSound();
    this.currentSoundTrack.currentTime = 0;
    this.signalEmitter.emit("onStoppedSoundtrack", this.currentSoundTrackName);
  };
}

export class AudioEventEngine extends AudioEngine {
  private audioCtx: AudioContext = new AudioContext();
  private audioBuffersCache = new Map<string, AudioBuffer>();
  private currentAudioEvents = new Map<number, StereoAudioEvent>();

  constructor() {
    super("sfx");
  }

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
      new StereoAudioEvent(
        this.audioCtx,
        this.audioBuffersCache.get(name),
        this.isMuted ? 0 : this.lastPositiveContextualVolume
      )
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

  setContextualVolume = (volume: number): void => {
    const newConfigValue: AudioSetting = {
      muted: this.isMuted,
      currentVolume: this.lastPositiveContextualVolume,
    };
    if (volume !== 0) {
      this.lastPositiveContextualVolume = volume;
      newConfigValue.currentVolume = volume;
    }
    const channelBalance: ChannelBalance = {
      X: volume,
      Y: volume,
    };
    for (let [number, _] of this.currentAudioEvents)
      this.currentAudioEvents.get(number).setChannelBalance(channelBalance);
    this.audioCfg.setValue(this.audioCfgKey, newConfigValue);
  };

  stopSound = (soundID: number) => {
    this.pauseSound(soundID);
    this.currentAudioEvents.delete(soundID);
  };

  // TODO: add calculation of channel balance value based on sound event's srcX (and srcY), or maybe even more complex logic
  //  and think about where it should be incapsulated

  setChannelBalanceForSound = (soundID: number, balanceVal: ChannelBalance) => {
    this.currentAudioEvents.get(soundID).setChannelBalance(balanceVal);
  };
}

abstract class AudioPreamp {
  // NOTE: 0 <= balanceVal.{X,Y} <= 1
  public abstract setChannelBalance(balanceVal: ChannelBalance): void;

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

  setChannelBalance = (balanceVal: ChannelBalance): void => {
    this.gainNodeL.gain.value = balanceVal.X;
    this.gainNodeR.gain.value = balanceVal.X;
  };

  protected passThroughMixer = (ctx: AudioContext): void => {
    this.audioSrc.connect(this.splitterNode);
    this.splitterNode.connect(this.gainNodeL, 0);
    this.splitterNode.connect(this.gainNodeR, 1);
    this.gainNodeL.connect(this.mergerNode, 0, 0);
    this.gainNodeR.connect(this.mergerNode, 0, 1);
    this.mergerNode.connect(ctx.destination);
  };

  constructor(ctx: AudioContext, audioBuf: AudioBuffer, gain: number) {
    super();
    this.audioSrc = ctx.createBufferSource();
    this.audioSrc.buffer = audioBuf;

    this.gainNodeL = new GainNode(ctx);
    this.gainNodeL.gain.value = gain;
    this.gainNodeR = new GainNode(ctx);
    this.gainNodeR.gain.value = gain;

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

type ChannelBalance = {
  X: number;
  Y: number;
};

type SoundTrackEventsType =
  | "onStartedSoundtrack"
  | "onStoppedSoundtrack"
  | "onEndedSoundtrack";

export const soundTrackMap = {
  iceworld: "iceworld.mp3",
  mycelium: "mycelium.mp3",
  ascend: "ascend.mp3",
  bioluminescence: "bioluminescence.mp3",
  "yeast soup": "yeast soup.mp3",
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
