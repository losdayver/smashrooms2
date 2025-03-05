import {
  AudioEngine,
  AudioTrackEngine,
  AudioEventEngine,
} from "../audio/audioEngine.js";

// TODO: icons, decorative buttons
export class AudioWidget {
  public audioWidget: HTMLDivElement;
  private audioTrackMgr: AudioTrackEngine;
  private audioEventMgr: AudioEventEngine;
  private static widgetCaseColor: string = "#764E3F";
  private static widgetBorderColor: string = "#75634C";

  constructor(
    audioTrackMgr: AudioTrackEngine,
    audioEventMgr: AudioEventEngine
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
    const musicCtrls = new AudioControlGroup(this.audioTrackMgr).container;
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
    const soundsCtrls = new AudioControlGroup(this.audioEventMgr).container;
    soundsWidget.append(soundsWidgetInfo, soundsCtrls);

    audioSettings.append(musicWidget, soundsWidget);

    return audioSettings;
  };

  private getFormattedMusicInfo = (track: string): string => {
    return `🎵 Now playing: ${this.audioTrackMgr.getCurrentSoundTrackInfo()}`;
  };
}

class AudioControlGroup {
  private audioEng: AudioEngine;
  public container: HTMLDivElement;
  private toggleMuteBtn: HTMLButtonElement;
  private volumeControl: HTMLInputElement;

  constructor(audioEng: AudioEngine) {
    this.audioEng = audioEng;
    this.container = this.makeAudioCtrlsContainer();
    this.container.append();
  }

  private makeAudioCtrlsContainer = (): HTMLDivElement => {
    const audioCtrls = document.createElement("div");
    audioCtrls.style.display = "flex";
    audioCtrls.style.gap = "2.5em";
    this.toggleMuteBtn = this.makeToggleMuteBtn();
    this.volumeControl = this.makeVolumeControl();
    this.toggleMuteBtn.addEventListener("click", (event) => {
      this.changeControlsState(this.audioEng.toggleMute());
    });
    this.changeControlsState(this.audioEng.isMuted);
    audioCtrls.append(this.toggleMuteBtn, this.volumeControl);
    return audioCtrls;
  };

  // TODO: make constant button width, so that container wouldn't be resized
  private makeToggleMuteBtn = (): HTMLButtonElement => {
    const toggleMuteBtn = document.createElement("button");
    toggleMuteBtn.classList.add("smsh-button");
    toggleMuteBtn.innerText = this.audioEng.isMuted ? "Unmute" : "Mute";
    return toggleMuteBtn;
  };

  private makeVolumeControl = (): HTMLInputElement => {
    const musicVolumeControl = document.createElement("input");
    musicVolumeControl.type = "range";
    musicVolumeControl.value = Math.floor(
      (this.audioEng.lastPositiveContextualVolume /
        AudioEngine.maxContextualVolume) *
        100
    ).toString();
    musicVolumeControl.max = "100";
    // TODO: type of event
    musicVolumeControl.addEventListener("input", (event) => {
      this.audioEng.setContextualVolume(
        (parseFloat((event.target as HTMLInputElement).value) *
          AudioEngine.maxContextualVolume) /
          100
      );
    });
    // TODO: add tick marks for range inputs
    return musicVolumeControl;
  };

  changeControlsState = (isMuted: boolean): void => {
    if (isMuted) {
      this.toggleMuteBtn.innerText = "Unmute";
      this.volumeControl.disabled = true;
      this.volumeControl.style.opacity = "0.25";
    } else {
      this.toggleMuteBtn.innerText = "Mute";
      this.volumeControl.disabled = false;
      this.volumeControl.style.opacity = null;
    }
  };
}
