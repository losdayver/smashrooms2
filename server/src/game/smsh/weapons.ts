import { getRandomBetween } from "../../utils";

export const weaponMap: Record<
  string,
  {
    delay?: number;
    onFire?: (player: any) => void;
  }
> = {
  fist: {
    delay: 10,
    onFire: (player: any) => {
      player.scene.spawnPropAction("fist", {
        positioned: {
          posX: player.positioned.posX,
          posY: player.positioned.posY + 40,
        },
        drawable: {
          facing: player.drawable.facing,
        },
        collidable: {
          colGroup: player.ID,
        },
      });
    },
  },
  shotgun: {
    delay: 10,
    onFire: (player: any) => {
      for (let i = -1; i < 2; i++)
        player.scene.spawnPropAction("bullet", {
          positioned: {
            posX: player.positioned.posX,
            posY: player.positioned.posY + 40,
          },
          drawable: {
            facing: player.drawable.facing,
          },
          collidable: {
            colGroup: player.ID,
          },
          moving: {
            speedV: i * 4,
          },
        });
    },
  },
  pistol: {
    delay: 5,
    onFire: (player: any) => {
      player.scene.spawnPropAction("bullet", {
        positioned: {
          posX: player.positioned.posX,
          posY: player.positioned.posY + 40,
        },
        drawable: {
          facing: player.drawable.facing,
        },
        collidable: {
          colGroup: player.ID,
        },
        moving: {
          speedV: getRandomBetween(-3, 3),
        },
      });
    },
  },
  bazooka: {
    delay: 40,
    onFire: (player: any) => {
      player.scene.spawnPropAction("rocket", {
        positioned: {
          posX: player.positioned.posX,
          posY: player.positioned.posY + 40,
        },
        drawable: {
          facing: player.drawable.facing,
        },
        collidable: {
          colGroup: player.ID,
        },
        moving: {
          speedV: getRandomBetween(-1, 1),
        },
      });
    },
  },
} as const;
