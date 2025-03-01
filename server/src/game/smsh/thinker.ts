import { LayoutMetaExt, StageExt } from "../../../../types/stage";
import { getRandomBetween, pickRandom } from "../../utils";
import { IScene, Thinker } from "../scene/sceneTypes";
import { IChaosEvent, IStageMetaExtra } from "./props";

export class SmshThinker implements Thinker {
  scene: IScene;
  currentChaosEvent: IChaosEvent;
  startedOn: number;
  stage: StageExt;

  chaosEvents: IChaosEvent[];
  onTick = (tickNum: number) => {
    if (!this.chaosEvents) return;
    if (this.currentChaosEvent) {
      this.currentChaosEvent.onTick(tickNum, this.scene, this.stage);
      if (tickNum - this.startedOn > this.currentChaosEvent.duration) {
        this.currentChaosEvent.onEnd(tickNum, this.scene);
        this.currentChaosEvent = null;
      }
      return;
    }
    if (!this.currentChaosEvent && tickNum % 1000 == 0) {
      this.currentChaosEvent = pickRandom(this.chaosEvents);
      this.startedOn = tickNum;
      this.scene.sendNotification(
        this.currentChaosEvent.message,
        "danger",
        "all"
      );
      this.scene.produceSound("siren");
      this.currentChaosEvent.onBegin(tickNum, this.scene);
    }
  };
  onSceneInit = (scene: IScene) => {
    this.scene = scene;
  };
  constructor(stage: StageExt) {
    this.stage = stage;
    this.chaosEvents = (stage.meta.extra as IStageMetaExtra).chaosEvents?.map(
      (name) => chaosEventMap[name]
    );
  }
}

const chaosEventMap: Record<string, IChaosEvent> = {
  bombing: {
    name: "Carpet Bombing",
    message: "Carpet bombing incoming!",
    duration: 100,
    onTick: (tickNum, scene, stage) => {
      if (tickNum % 10 == 0) {
        scene.spawnPropAction("bomb", {
          positioned: {
            posX: getRandomBetween(
              0,
              stage.layoutData.split(/\r\n|\r|\n/)[0].length *
                stage.meta.gridSize
            ),
            posY: getRandomBetween(-10, -30),
          },
        });
      }
    },
    onBegin: (tickNum, scene) => {},
    onEnd: (tickNum, scene) => {},
  },
} as const;
