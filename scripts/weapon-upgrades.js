
/**
 * A set of weapon upgrades, all of which are boolean flags.
 * @typedef {Object} WeaponUpgrades
 * @property {Object} upgrades - A hierarchical object of all possible weapon upgrades
 * @property {string} itemId - The weapon who owns this upgrades list.
 */

export class WeaponUpgrades {
    static ID = 'nia-tero-homebrew';
  
    static FLAGS = {
        UPGRADES: 'upgrades'
    }

    static UPGRADE_TIERS = {
      masterwork: "tier0",
      balanced: "tier1",
      critical: "tier1",
      wounding: "tier1"
    }
  
    static get TEMPLATES() {
        return {
            UPGRADESLIST: `modules/${this.ID}/templates/weapon-upgrades.hbs`
        };
    }

    static log(force, ...args) {  
        const shouldLog = force || game.modules.get('_dev-mode')?.api?.getPackageDebugValue(this.ID);

        if (shouldLog) {
        console.log(this.ID, '|', ...args);
    }
  }

}

export class WeaponUpgradesData {
  // all weapon upgrades for all items
  static get allWeaponUpgrades() {}

  // get all upgrades for a given weapon
  // TODO: It might be needed to get the items per actor
  static getUpgradesForWeapon(itemId) {
    return game.items.get(itemId)?.getFlag(WeaponUpgrades.ID, WeaponUpgrades.FLAGS.UPGRADES);
  }

  // create a new upgrades list for a given weapon
  static createUpgrades(itemId) {}

  // toggle a specific upgrade by name
  static toggleUpgrade(itemId, upgradeName) {
    const upgrades = this.getUpgradesForWeapon(itemId)
    if (!(upgradeName in upgrades)) {
        console.warn(`Invalid upgrade flag: ${upgradeName}`);
        return;
    }

    upgrades[upgradeName] = !upgrades[upgradeName]

    // Persist the data here
  }

  // delete a specific upgrades list by weapon id
  static deleteUpgrades(itemId) {}
}


Hooks.once('devModeReady', ({ registerPackageDebugFlag }) => {
  registerPackageDebugFlag(ToDoList.ID);
});


Hooks.once('init', async function() {

});

Hooks.once('ready', async function() {

});
