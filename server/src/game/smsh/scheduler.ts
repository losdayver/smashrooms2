import { LayoutMetaExt, StageExt } from "@stdTypes/stage";
import { getRandomBetween, pickRandom } from "@server/utils";
import { IScene, Scheduler } from "@server/game/scene/sceneTypes";
import { IDisaster, IStageMetaExtra } from "@server/game/smsh/props";

export class SmshScheduler implements Scheduler {
  scene: IScene;
  currentDisaster: IDisaster;
  startedOn: number;
  stage: StageExt;

  disasters: IDisaster[];
  onTick = (tickNum: number) => {
    if (!this.disasters || tickNum == 0) return;
    if (this.currentDisaster) {
      this.currentDisaster.onTick(tickNum, this.scene, this.stage);
      if (tickNum - this.startedOn > this.currentDisaster.duration) {
        this.currentDisaster.onEnd(tickNum, this.scene);
        this.currentDisaster = null;
      }
      return;
    }
    if (!this.currentDisaster && tickNum % 1500 == 0) {
      this.currentDisaster = pickRandom(this.disasters);
      this.startedOn = tickNum;
      this.scene.sendNotification(
        this.currentDisaster.message,
        "danger",
        "all"
      );
      this.scene.produceSound("siren");
      this.currentDisaster.onBegin(tickNum, this.scene);
    }
  };

  init = (scene: IScene, stage?: StageExt) => {
    this.currentDisaster = undefined;
    this.startedOn = undefined;
    this.scene = scene;
    this.stage = stage;
    this.disasters = (stage.meta.extra as IStageMetaExtra).disasters?.map(
      (name) => disasterMap[name]
    );
  };
}

const disasterMap: Record<string, IDisaster> = {
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
