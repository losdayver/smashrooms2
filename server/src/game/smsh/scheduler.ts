import { LayoutMetaExt, StageExt } from "@stdTypes/stage";
import { getRandomBetween, pickRandom } from "@server/utils";
import { IScene, Scheduler } from "@server/game/scene/sceneTypes";
import { IDisaster, IGamemode, IStageMetaExtra } from "@server/game/smsh/props";

export class SmshScheduler implements Scheduler {
  scene: IScene;
  currentDisaster: IDisaster;
  startedOn: number;
  stage: StageExt;
  gamemode: IGamemode;
  delay = 1500;

  disasters: IDisaster[];
  onTick = (tickNum: number) => {
    if (this.gamemode) {
      if (tickNum == 0) {
        this.gamemode.onBegin?.(this.scene);
        this.gamemode.sound && this.scene.produceSound(this.gamemode.sound);
        this.gamemode.message &&
          this.scene.sendNotification(this.gamemode.message, "danger", "all");
      } else this.gamemode.onTick?.(tickNum, this.scene, this.stage);
    }
    if (!this.disasters || tickNum == 0) return;
    if (this.currentDisaster) {
      this.currentDisaster.onTick(tickNum, this.scene, this.stage);
      if (tickNum - this.startedOn > this.currentDisaster.duration) {
        this.currentDisaster.onEnd(tickNum, this.scene);
        this.currentDisaster = null;
      }
      return;
    }
    if (!this.currentDisaster && tickNum % this.delay == 0) {
      this.currentDisaster = pickRandom(this.disasters);
      this.delay = this.currentDisaster.delayAfter ?? 1500;
      this.startedOn = tickNum;
      this.scene.sendNotification(
        this.currentDisaster.message,
        "danger",
        "all"
      );
      if (this.currentDisaster.sound !== null)
        this.scene.produceSound(this.currentDisaster.sound ?? "siren");
      this.currentDisaster.onBegin(tickNum, this.scene);
    }
  };

  init = (scene: IScene, stage?: StageExt) => {
    this.currentDisaster = undefined;
    this.startedOn = undefined;
    this.scene = scene;
    this.stage = stage;
    this.gamemode = gamemodeMap[(stage.meta.extra as IStageMetaExtra).gamemode];
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
      19;
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

const gamemodeMap: Record<string, IGamemode> = {
  instagib: {
    name: "Immediate death",
    message: "Immediate death!",
    onPlayerSpawn: (player) => {
      player.weaponPocket.pickWeapon("instagib");
    },
  },
} as const;
