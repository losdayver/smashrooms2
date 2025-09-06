import { LSConfig } from "@client/config/base";

export class AudioConfig extends LSConfig<AudioSettingObjType> {
  static instance: AudioConfig;
  protected getDefaultObj = () => defaultAudioSettingsObj;

  constructor() {
    super("audioVolume");
    if (!AudioConfig.instance) AudioConfig.instance = this;
    return AudioConfig.instance;
  }
}

const defaultAudioSetting: AudioSetting = {
  muted: false,
  currentVolume: 0.3,
};

const defaultAudioSettingsObj: AudioSettingObjType = {
  music: defaultAudioSetting,
  sfx: defaultAudioSetting,
};

export type AudioSettingObjType = Record<
  (typeof audioSettingsKeyList)[number],
  AudioSetting
>;

const audioSettingsKeyList = ["music", "sfx"] as const;

export type AudioSetting = {
  muted: boolean;
  currentVolume: number;
};
