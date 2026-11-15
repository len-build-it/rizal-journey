/**
 * One palette for the whole toy world, so every area reads as part of the same set.
 * Colors are chosen per material, not per object, to keep the scene cohesive.
 */
export const palette = {
  // Brand tokens shared with the UI.
  night: 0x1c2340,
  iron: 0x9c3b2a, // Venetian red, the Eiffel Tower's 1889 color.
  gaslight: 0xe2b04a,

  // Provencal town.
  limestone: 0xe6dccb,
  ochre: 0xd9a066,
  apricot: 0xe8b98f,
  roofTile: 0xb5543a,
  roofTileDark: 0x96432f,
  shutterGreen: 0x5e7a63,
  shutterBlue: 0x58708a,
  doorBrown: 0x5b3a29,
  quayStone: 0xc9b694,
  quayStoneDark: 0xa08f73,
  cobble: 0xb59a76,
  dirt: 0xc9a77c,
  grass: 0x9bb06a,
  grassDark: 0x7f9653,
  pine: 0x4f6b45,
  rock: 0xb8ad9c,
  rockDark: 0x8f8574,

  // Sea.
  seaDeep: 0x2f6f86,
  seaShallow: 0x5ea6b0,
  foam: 0xf3efe6,

  // Ships and rail.
  hull: 0x24252b,
  deckWood: 0xb08a5f,
  funnel: 0xd9a441,
  sail: 0xefe9dc,
  railSteel: 0x5a5d66,

  // Horse and rider.
  bay: 0x8a5233,
  bayDark: 0x2e1f17,
  hoof: 0x2a2420,
  saddle: 0x6b2e22,
  coat: 0x262a35,
  shirt: 0xf1eee7,
  skin: 0xc68a5e,
  hair: 0x1d1a19,
  hat: 0x1f1d22,

  // Props.
  crate: 0xb88a57,
  crateDark: 0x8d653c,
  barrel: 0x8e5a36,
  barrelHoop: 0x4a4a4f,
  cafeTable: 0x2f3b33,
  awningRed: 0xb24a3a,
  awningCream: 0xf0e6d2,
  lampIron: 0x2b2f36,

  // Paris and Biarritz additions.
  parisLimestone: 0xebe3d3,
  zincRoof: 0x6f7f8c,
  zincRoofDark: 0x5d6b77,
  parisCobble: 0x827b71,
  parisSidewalk: 0xd0c7b8,
  parisCurb: 0xb0a798,
  parisWindow: 0x2c3138,
  parisGlass: 0x7ca2b8,
  awningBlue: 0x3b5875,
  awningGreen: 0x3a6149,
  awningOchre: 0xc48b45,
  treeTrunk: 0xb3a58e,
  treeLeaf: 0x8aa35c,
  parisFog1883: 0xb8d6e2,
  parisFog1885: 0xc4ced4,
  parisFog1889: 0xe3c7a6,
  morrisGreen: 0x32523d,
  streetSignBlue: 0x223e6b,
  seineWater: 0x4b747a,
  basqueWhite: 0xf2ede2,
  basqueRed: 0x8c3328,
  sand: 0xe3cfa6,
  sandWet: 0xc9b082,
  brass: 0xcfa44e,
} as const;
