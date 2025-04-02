import { LayoutMetaExt, StageExt } from "../../../../types/stage";
import { getRandomBetween, pickRandom } from "../../utils";
import { IScene, Scheduler } from "../scene/sceneTypes";
import { IChaosEvent, IStageMetaExtra } from "./props";

export class BombardmentScheduler implements Scheduler {
  scene: IScene;
  currentChaosEvent: IChaosEvent;
  startedOn: number;
  stage: StageExt;

  chaosEvents: IChaosEvent[];
  onTick = (tickNum: number) => {
    if (!this.chaosEvents || tickNum == 0) return;
    if (this.currentChaosEvent) {
      this.currentChaosEvent.onTick(tickNum, this.scene, this.stage);
      if (tickNum - this.startedOn > this.currentChaosEvent.duration) {
        this.currentChaosEvent.onEnd(tickNum, this.scene);
        this.currentChaosEvent = null;
      }
      return;
    }
    if (!this.currentChaosEvent && tickNum % 1500 == 0) {
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
  init = (scene: IScene, stage?: StageExt) => {
    this.currentChaosEvent = undefined;
    this.startedOn = undefined;
    this.scene = scene;
    this.stage = stage;
    this.chaosEvents = (stage.meta.extra as IStageMetaExtra).chaosEvents?.map(
      (name) => chaosEventMap[name]
    );
  };
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
