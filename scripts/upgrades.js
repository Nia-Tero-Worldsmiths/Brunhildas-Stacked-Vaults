import CONSTANTS from "./constants/constants.js";

/**
 * A set of weapon upgrades, all of which are boolean flags.
 * @typedef {Object} Upgrades
 * @property {Object} upgrades - A hierarchical object of all possible weapon upgrades
 * @property {string} itemId - The weapon who owns this upgrades list.
 */

export class Upgrades {
  static FLAGS = {
      UPGRADES: "upgrades"
  }

  static TEMPLATE = `${CONSTANTS.MODULE_PATH}/templates/upgrades.hbs`;

  static UPGRADE_DATA = {
    fine_craft: { tier: "tier0", allowedTypes: ["weapon", "equipment"] },
    masterwork: { tier: "tier3", allowedTypes: ["weapon", "medium", "heavy"] },
    // WEAPON UPGRADES
    balanced: { tier: "tier1", allowedTypes: ["weapon"] },
    critical: { tier: "tier1", allowedTypes: ["weapon"] },
    silvered: { tier: "tier1", allowedTypes: ["weapon"] },
    wounding: { tier: "tier1", allowedTypes: ["weapon"] },
    brutal: { tier: "tier2", allowedTypes: ["weapon"] },
    enchanted: { tier: "tier2", allowedTypes: ["quarterstaff"] },
    flanged: { tier: "tier2", allowedTypes: ["mace, maul"] },
    magical: { tier: "tier2", allowedTypes: ["weapon"] },
    saw_toothed: { tier: "tier2", allowedTypes: ["dagger"] },
    superior: { tier: "tier2", allowedTypes: ["weapon"] },
    arcane: { tier: "tier3", allowedTypes: ["quarterstaff"] },
    // ARMOR UPGRADES
    burnished: { tier: "tier0", allowedTypes: ["heavy"] },
    holy_symbol: { tier: "tier0", allowedTypes: ["medium", "heavy", "shield"] },
    breathable: { tier: "tier1", allowedTypes: ["light", "medium"] },
    climbing_harness: { tier: "tier1", allowedTypes: ["light", "medium", "heavy"] },
    insulated: { tier: "tier1", allowedTypes: ["clothing", "light", "medium", "heavy"] },
    muffled: { tier: "tier1", allowedTypes: ["halfplate"] },
    dragon_scales: { tier: "tier2", allowedTypes: ["medium", "heavy"] },
    locking_joints: { tier: "tier2", allowedTypes: ["splint", "plate"] },
    perfected: { tier: "tier2", allowedTypes: ["light", "medium", "heavy"] },
    quick_release_clasps: { tier: "tier2", allowedTypes: ["light", "medium", "heavy"] },
    reinforced: { tier: "tier2", allowedTypes: ["heavy"] },
    spiked: { tier: "tier2", allowedTypes: ["medium", "heavy"] },
  }

  static TIER_DATA = {
    tier0: { base_cost: 5, craft_time: 10, craft_time_unit: "minutes", craft_checks: 1 },
    tier1: { base_cost: 100, craft_time: 2, craft_time_unit: "hours", craft_checks: 1 },
    tier2: { base_cost: 500, craft_time: 4, craft_time_unit: "hours", craft_checks: 2 },
    tier3: { base_cost: 10000, craft_time: 6, craft_time_unit: "hours", craft_checks: 3 },
    perfected: { base_cost: 3000, craft_time: 4, craft_time_unit: "hours", craft_checks: 2 }
  }

  constructor(item) {
    this.upgradeList = {
      tier0: {},
      tier1: {},
      tier2: {},
      tier3: {}
    };
    for (const [upgradeName, upgradeData] of Object.entries(Upgrades.UPGRADE_DATA)) {
      if (upgradeData.allowedTypes.includes(item.type)
          || upgradeData.allowedTypes.includes(item.system.type.value)
          || upgradeData.allowedTypes.includes(item.system.type.baseItem)) {
        this.upgradeList[upgradeData.tier][upgradeName] = false;
      }
    }
  }

  static serializeForHandlebars(upgradeList) {
    try {
      return Object.entries(upgradeList).map(([tierName, tierObject]) => {
        return {
          name: game.i18n.localize(`${CONSTANTS.MODULE_ID_UPPERCASE}.UPGRADES.tiers.${tierName}`),
          key: tierName,
          entries: Object.entries(tierObject).map(([upgradeKey, value]) => {
            return { 
              name: game.i18n.localize(`${CONSTANTS.MODULE_ID_UPPERCASE}.UPGRADES.upgrade-names.${upgradeKey}`), 
              key: upgradeKey,
              checked: value 
            };
          })
        };
      });
    } catch (err) {
      Upgrades.log("Error converting upgrades:", err);
      return [];
    }
  }

  static log(...args) {  
      console.log(CONSTANTS.MODULE_ID, '|', ...args);
  }

}

export class UpgradesManager {
  static async getOrCreateUpgrades(item) {
    let upgrades = await item.getFlag(CONSTANTS.MODULE_ID, Upgrades.FLAGS.UPGRADES);
    if (!upgrades) {
      upgrades = new Upgrades(item);
      await item.setFlag(CONSTANTS.MODULE_ID, Upgrades.FLAGS.UPGRADES, upgrades);
    }
    return upgrades;
  }

  static async toggleUpgrade(item, upgradeName) {
    const tier = Upgrades.UPGRADE_DATA[upgradeName]?.tier;
    if (!tier) {
      console.error(`Unknown upgrade flag: ${upgradeName}`);
      return;
    }

    const upgrades = duplicate(await this.getOrCreateUpgrades(item));
    if (!(upgradeName in upgrades.upgradeList[tier])) {
      console.warn(`Upgrade '${upgradeName}' not found in tier '${tier}'`);
      return;
    }

    upgrades.upgradeList[tier][upgradeName] = !upgrades.upgradeList[tier][upgradeName];
    await item.setFlag(CONSTANTS.MODULE_ID, Upgrades.FLAGS.UPGRADES, upgrades);
    return upgrades;
  }

  static async deleteUpgrades(item) {
    await item.unsetFlag(CONSTANTS.MODULE_ID, Upgrades.FLAGS.UPGRADES);
  }

  static async deleteUpgradesFromAllItems() {
    for (const item of game.items.values()) {
      await item.unsetFlag(CONSTANTS.MODULE_ID, Upgrades.FLAGS.UPGRADES);
    }
    for (const actor of game.actors.values()) {
      for (const item of actor.items.values()) {
        await item.unsetFlag(CONSTANTS.MODULE_ID, Upgrades.FLAGS.UPGRADES);
      }
    }
  }
}

export class UpgradesTab {
  static tabs = [];

  static bind(item, html) {
    if (UpgradesTab.isAcceptedItemType(item)) {
      let tab = UpgradesTab.tabs[item.id];
      if (!tab) {
        tab = new UpgradesTab();
        UpgradesTab.tabs[item.id] = tab;
      }
      tab.init(item, html);
    }
  }

  static get acceptedItemTypes() {
    return ["weapon", "equipment"];
  }

  static isAcceptedItemType(item) {
    return UpgradesTab.acceptedItemTypes.includes(item.type);
  }

  async init(item, html) {
    if (html[0].localName !== "div") {
      html = $(html[0].parentElement.parentElement);
    }
    let tabs = html.find(`nav.sheet-tabs.tabs`);
    if (tabs.find(`a[data-tab=${CONSTANTS.MODULE_ID}]`).length === 0) {
      tabs.append($(`
        <a data-action="tab" data-group="primary" data-tab="${CONSTANTS.MODULE_ID}">
      
            <span>Upgrades</span>
        </a>`
      ));

      $(html.find(`.window-content`)).append(
        $(`<section class="upgrades tab" data-tab="${CONSTANTS.MODULE_ID}" data-group="primary" data-application.part="upgrades"></section>`),
      );
    }

    this.upgrades = await UpgradesManager.getOrCreateUpgrades(item);

    this.render(item, html);

    const noneActive = tabs.find("a.active").length === 0;
    if (noneActive) {
      tabs.find(`a[data-tab="${CONSTANTS.MODULE_ID}"]`).addClass("active");
      html.find(`.tab[data-tab="${CONSTANTS.MODULE_ID}"]`).addClass("active");
    }
  }

  async render(item, html) {
    const serializedUpgrades = {
      upgrades: Upgrades.serializeForHandlebars(this.upgrades.upgradeList)
    };
    let template = await renderTemplate(Upgrades.TEMPLATE, serializedUpgrades);

    let el = html.find(`.upgrades-content`);
    if (el.length) {
      el.replaceWith(template);
    } else {
      html.find(".upgrades.tab").append(template);
    }

    html.find(`.upgrades.tab input[type="checkbox"]`).on("change", async (event) => {
      const upgradeName = event.currentTarget.name;
      const newUpgrades = await UpgradesManager.toggleUpgrade(item, upgradeName);
      Upgrades.log("New upgrades list object: ", newUpgrades.upgradeList);
    });
  }
}

Hooks.once('init', async function() {
  // CONFIG.debug.hooks = true;
  Upgrades.log("Module loaded");
});

Hooks.once('ready', async function() {
  if (game.user.isGM) {
    window.Upgrades = Upgrades;
    window.UpgradesManager = UpgradesManager;
    window.UpgradesTab = UpgradesTab;
  }
});

Hooks.on("renderItemSheet5e", (app, html) => {
  UpgradesTab.bind(app.item, html);
  Upgrades.log("ITEM:", app.item.system.type);
  // Upgrades.log("HTML:", html);
});
