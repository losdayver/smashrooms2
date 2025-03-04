import {
  AudioEventManager,
  AudioManager,
  AudioTrackManager,
} from "../audio/audioManager.js";

// TODO: icons, decorative buttons
export class AudioWidget {
  public audioWidget: HTMLDivElement;
  private audioTrackMgr: AudioTrackManager;
  private audioEventMgr: AudioEventManager;
  private static widgetCaseColor: string = "#764E3F";
  private static widgetBorderColor: string = "#75634C";

  constructor(
    audioTrackMgr: AudioTrackManager,
    audioEventMgr: AudioEventManager
  ) {
    this.audioTrackMgr = audioTrackMgr;
    this.audioEventMgr = audioEventMgr;
    this.audioWidget = this.composeWidget();
  }

  private composeWidget = (): HTMLDivElement => {
    const audioSettings = document.createElement("div");
    audioSettings.classList.add("music-widget");

    const musicWidget = document.createElement("div");
    musicWidget.classList.add("smsh-widget");
    musicWidget.style.borderRadius = "5px 5px 0 0";
    musicWidget.style.borderTop = `0.7em solid ${AudioWidget.widgetBorderColor}`;
    musicWidget.style.borderLeft = `0.7em solid ${AudioWidget.widgetBorderColor}`;
    musicWidget.style.borderRight = `0.7em solid ${AudioWidget.widgetBorderColor}`;
    musicWidget.style.backgroundColor = "#333333";

    const trackInfo = document.createElement("div");
    trackInfo.classList.add("track-info");
    trackInfo.innerText = this.getFormattedMusicInfo(
      this.audioTrackMgr.getCurrentSoundTrackInfo()
    );
    this.audioTrackMgr.on(
      "onStartedSoundtrack",
      "musicWidget",
      (name: string) => {
        trackInfo.innerText = this.getFormattedMusicInfo(
          this.audioTrackMgr.getCurrentSoundTrackInfo()
        );
      }
    );

    const musicProgress = document.createElement("progress");
    musicProgress.value = 0;
    setInterval(() => {
      musicProgress.value = this.audioTrackMgr.getCurrentSoundTrackProgress();
    }, 1000);
    musicProgress.max = 100;

    const musicCtrls = this.makeAudioCtrlsContainer();
    const toggleMuteMusicBtn = this.makeToggleMuteBtn(
      this.audioTrackMgr,
      "music"
    );
    const musicVolumeCtrl = this.makeVolumeControl(this.audioTrackMgr, "music");
    musicCtrls.append(toggleMuteMusicBtn, musicVolumeCtrl);
    musicWidget.append(trackInfo, musicProgress, musicCtrls);

    const soundsWidget = document.createElement("div");
    soundsWidget.classList.add("smsh-widget");
    soundsWidget.style.borderRadius = "0 0 5px 5px";
    soundsWidget.style.backgroundColor = AudioWidget.widgetCaseColor;
    soundsWidget.style.borderBottom = `0.7em solid ${AudioWidget.widgetBorderColor}`;
    soundsWidget.style.borderLeft = `0.7em solid ${AudioWidget.widgetBorderColor}`;
    soundsWidget.style.borderRight = `0.7em solid ${AudioWidget.widgetBorderColor}`;
    soundsWidget.style.display = "flex";
    soundsWidget.style.justifyContent = "center";

    const soundsWidgetInfo = document.createElement("h4");
    soundsWidgetInfo.innerText = "SFX";

    const soundsCtrls = this.makeAudioCtrlsContainer();
    const toggleMuteSoundsBtn = this.makeToggleMuteBtn(
      this.audioEventMgr,
      "sounds"
    );
    const soundEventsVolumeCtrl = this.makeVolumeControl(
      this.audioEventMgr,
      "sounds"
    );
    soundsCtrls.append(toggleMuteSoundsBtn, soundEventsVolumeCtrl);
    soundsWidget.append(soundsWidgetInfo, soundsCtrls);

    audioSettings.append(musicWidget, soundsWidget);

    return audioSettings;
  };

  private getFormattedMusicInfo = (track: string): string => {
    return `🎵 Now playing: ${this.audioTrackMgr.getCurrentSoundTrackInfo()}`;
  };

  private makeAudioCtrlsContainer = (): HTMLDivElement => {
    const audioCtrls = document.createElement("div");
    audioCtrls.style.display = "flex";
    audioCtrls.style.gap = "2.5em";
    return audioCtrls;
  };

  // TODO: make constant button width, so that container wouldn't be resized
  private makeToggleMuteBtn = (
    audioMgr: AudioManager,
    rangeID: string
  ): HTMLButtonElement => {
    const toggleMuteBtn = document.createElement("button");
    toggleMuteBtn.classList.add("smsh-button");
    toggleMuteBtn.innerText = "Mute";
    toggleMuteBtn.setAttribute("range", rangeID);
    toggleMuteBtn.addEventListener("click", () => {
      const targetInputRange = document.querySelector(
        `#${toggleMuteBtn.getAttribute("range")}`
      ) as HTMLInputElement;
      if (audioMgr.toggleMute()) {
        toggleMuteBtn.innerText = "Unmute";
        targetInputRange.disabled = true;
        targetInputRange.style.opacity = "0.25";
      } else {
        toggleMuteBtn.innerText = "Mute";
        targetInputRange.disabled = false;
        targetInputRange.style.opacity = null;
      }
    });
    return toggleMuteBtn;
  };

  private makeVolumeControl = (
    audioMgr: AudioManager,
    id: string,
    defaultVolume: number = 66
  ): HTMLInputElement => {
    const musicVolumeControl = document.createElement("input");
    musicVolumeControl.type = "range";
    musicVolumeControl.id = id;
    musicVolumeControl.value = defaultVolume.toString();
    musicVolumeControl.max = "100";
    // TODO: type of event
    musicVolumeControl.addEventListener("input", (event) => {
      audioMgr.setContextualVolume(
        (parseFloat((event.target as HTMLInputElement).value) *
          AudioTrackManager.maxContextualVolume) /
          100
      );
    });
    // TODO: add tick marks for range inputs
    return musicVolumeControl;
  };
}
