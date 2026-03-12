/**
 * Spanish Language Pack — Example Language Plugin
 * @param {Object} api - Sandboxed GameAPI proxy
 */
export function initSpanishPlugin(api) {
  api.registerLanguage({
    id: "lang_es",
    locale: "es",
    displayName: "Español",
    flag: "🇪🇸",
    strings: {
      // Resources
      "wood":   "Madera",
      "stone":  "Piedra",
      "iron":   "Hierro",
      "gold":   "Oro",
      "oil":    "Petróleo",
      "food":   "Comida",
      "energy": "Energía",
      // UI
      "treasury":      "Tesoro",
      "population":    "Población",
      "stability":     "Estabilidad",
      "epoch":         "Época",
      "allies":        "Aliados",
      "cities":        "Ciudades",
      "research":      "Investigación",
      "military":      "Militar",
      "education":     "Educación",
      "construction":  "Construcción",
      "marketplace":   "Mercado",
      "diplomacy":     "Diplomacia",
      "government":    "Gobierno",
      "stock_market":  "Bolsa de Valores",
      "tech_tree":     "Árbol Tecnológico",
      "national_advisor": "Asesor Nacional",
      "workforce":     "Fuerza Laboral",
      // Epochs
      "Stone Age":       "Edad de Piedra",
      "Bronze Age":      "Edad de Bronce",
      "Iron Age":        "Edad de Hierro",
      "Classical Age":   "Edad Clásica",
      "Medieval Age":    "Edad Medieval",
      "Renaissance Age": "Renacimiento",
      "Industrial Age":  "Era Industrial",
      "Modern Age":      "Era Moderna",
      "Digital Age":     "Era Digital",
      "Information Age": "Era de la Información",
      "Space Age":       "Era Espacial",
      "Galactic Age":    "Era Galáctica",
      // Actions
      "build":    "Construir",
      "research": "Investigar",
      "trade":    "Comerciar",
      "attack":   "Atacar",
      "defend":   "Defender",
      "upgrade":  "Mejorar",
    },
  });
}