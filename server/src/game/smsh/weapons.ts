import { getRandomBetween } from "../../utils";
import { Player } from "./player";

export class WeaponPocket {
  private player: Player;
  private maxWeaponCount = 2;

  private fireBullet = () => {
    if (!this.currentWeapon) return;
    weaponMap[this.currentWeapon].onFire(this.player);
  };

  private pocket: Map<WeaponType, IWeaponInPocket> = new Map();

  currentWeapon: WeaponType;

  pickWeapon = (weapon: keyof typeof weaponMap) => {
    if (this.pocket.has(weapon)) return;
    if (this.pocket.size >= this.maxWeaponCount)
      this.pocket.delete(this.currentWeapon);
    this.currentWeapon = weapon;
    this.pocket.set(weapon, {
      lastShotOnTick: 0,
    });
  };

  fireWeapon = (isFiring: boolean, tick: number) => {
    const weapon = this.pocket.get(this.currentWeapon);

    if (!weapon) return;

    if (
      isFiring &&
      tick - weapon.lastShotOnTick > weaponMap[this.currentWeapon].delay
    ) {
      weapon.lastShotOnTick = tick;
      this.fireBullet();
    }
  };

  changeWeapon = () => {
    const weapArr = Array.from(this.pocket, ([key, _]) => key).filter(
      (weapon) => weapon != this.currentWeapon
    );
    if (weapArr.length) this.currentWeapon = weapArr[0];
  };

  constructor(player: Player, weapon: WeaponType) {
    this.player = player;
    this.pickWeapon(weapon);
  }
}

export interface IWeaponInPocket {
  lastShotOnTick: number;
}

export type WeaponType = keyof typeof weaponMap;

export const weaponMap: Record<
  string,
  {
    delay?: number;
    onFire?: (player: Player) => void;
  }
> = {
  fist: {
    delay: 10,
    onFire: (player: Player) => {
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
    onFire: (player: Player) => {
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
    delay: 6,
    onFire: (player: Player) => {
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
    delay: 30,
    onFire: (player: Player) => {
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
  blaster: {
    delay: 4,
    onFire: (player: Player) => {
      player.scene.spawnPropAction("plasma", {
        positioned: {
          posX: player.positioned.posX,
          posY: player.positioned.posY + 40 + getRandomBetween(-6, 6),
        },
        drawable: {
          facing: player.drawable.facing,
        },
        collidable: {
          colGroup: player.ID,
        },
        moving: {
          speedV: getRandomBetween(-6, 6),
        },
      });
    },
  },
} as const;
