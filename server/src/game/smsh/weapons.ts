import { getRandomBetween } from "@server/utils";
import { Player } from "@server/game/smsh/player";

export class WeaponPocket {
  private player: Player;
  private maxWeaponCount = 2;

  private fireBullet = () => {
    if (!this._currentWeapon) return;
    weaponMap[this._currentWeapon].onFire(this.player);
  };

  private pocket: Map<WeaponType, IWeaponInPocket> = new Map();

  _currentWeapon: WeaponType;
  setCurrentWeapon = (weapon: WeaponType) => {
    this._currentWeapon = weapon;
    const overlay1 = weapon == "fist" ? null : { sprite: weapon, x: 0, y: 30 };
    this.player.scene.mutatePropBehaviourAction(this.player, {
      name: "drawable",
      newValue: { overlay1 },
    });
  };

  pickWeapon = (weapon: keyof typeof weaponMap) => {
    if (this.pocket.has(weapon)) return;
    if (this.pocket.has("fist") && this.pocket.size >= this.maxWeaponCount)
      this.pocket.delete("fist");
    if (this.pocket.size >= this.maxWeaponCount)
      this.pocket.delete(this._currentWeapon);
    this.setCurrentWeapon(weapon);
    this.pocket.set(weapon, {
      lastShotOnTick: 0,
    });
  };

  fireWeapon = (isFiring: boolean, tick: number) => {
    const weapon = this.pocket.get(this._currentWeapon);
    if (!weapon) return;
    if (
      isFiring &&
      tick - weapon.lastShotOnTick > weaponMap[this._currentWeapon].delay
    ) {
      weapon.lastShotOnTick = tick;
      this.fireBullet();
    }
  };

  changeWeapon = () => {
    const weapArr = Array.from(this.pocket, ([key, _]) => key).filter(
      (weapon) => weapon != this._currentWeapon
    );
    if (weapArr.length) this.setCurrentWeapon(weapArr[0]);
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
    delay: 15,
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
            speedV: i * 4 + getRandomBetween(-4, 4),
          },
        });
    },
  },
  pistol: {
    delay: 10,
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
          speedV: getRandomBetween(-0.5, 0.5),
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
  sniper: {
    delay: 40,
    onFire: (player: Player) => {
      player.scene.spawnPropAction("sniperBullet", {
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
} as const;
