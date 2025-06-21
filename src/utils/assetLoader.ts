export type AssetCategory = 'characters' | 'eyes' | 'clothes' | 'hair' | 'acc'

export type AssetInfo = {
  name: string
  filename: string
  category: AssetCategory
  displayName: string
}

export const ASSET_CATEGORIES: Record<AssetCategory, string> = {
  characters: 'Characters',
  eyes: 'Eyes & Makeup',
  clothes: 'Clothes',
  hair: 'Hair',
  acc: 'Accessories'
}

export const PREDEFINED_ASSETS: Record<AssetCategory, string[]> = {
  characters: [
    'char1.png', 'char2.png', 'char3.png', 'char4.png', 
    'char5.png', 'char6.png', 'char7.png', 'char8.png'
  ],
  eyes: [
    'eyes.png', 'blush_all.png', 'lipstick .png'
  ],
  clothes: [
    'basic.png', 'clown.png', 'dress .png', 'floral.png', 
    'overalls.png', 'pants.png', 'pants_suit.png', 'pumpkin.png',
    'sailor.png', 'sailor_bow.png', 'shoes.png', 'skirt.png',
    'skull.png', 'spaghetti.png', 'spooky .png', 'sporty.png',
    'stripe.png', 'suit.png', 'witch.png'
  ],
  hair: [
    'bob .png', 'braids.png', 'buzzcut.png', 'curly.png',
    'emo.png', 'extra_long.png', 'extra_long_skirt.png',
    'french_curl.png', 'gentleman.png', 'long_straight .png',
    'long_straight_skirt.png', 'midiwave.png', 'ponytail .png',
    'spacebuns.png', 'wavy.png'
  ],
  acc: [
    'beard.png', 'earring_emerald.png', 'earring_emerald_silver.png',
    'earring_red.png', 'earring_red_silver.png', 'glasses.png',
    'glasses_sun.png', 'hat_cowboy.png', 'hat_lucky.png',
    'hat_pumpkin.png', 'hat_pumpkin_purple.png', 'hat_witch.png',
    'mask_clown_blue.png', 'mask_clown_red.png', 'mask_spooky.png'
  ]
}

export const formatAssetName = (filename: string): string => {
  return filename
    .replace(/\.(png|jpg|jpeg)$/i, '')
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
    .trim()
}

export const getAssetPath = (category: AssetCategory, filename: string): string => {
  return `/assets/${category}/${filename}`
}

export const loadAssets = (): Record<AssetCategory, AssetInfo[]> => {
  const assets: Record<AssetCategory, AssetInfo[]> = {
    characters: [],
    eyes: [],
    clothes: [],
    hair: [],
    acc: []
  }

  Object.entries(PREDEFINED_ASSETS).forEach(([category, filenames]) => {
    const categoryKey = category as AssetCategory
    assets[categoryKey] = filenames.map(filename => ({
      name: filename,
      filename,
      category: categoryKey,
      displayName: formatAssetName(filename)
    }))
  })

  return assets
} 