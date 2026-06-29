import type { FrontendCharacterDefinition, FrontendCharacterEvolution } from '../types/gamification.types'

export interface CharacterEvolutionDisplay {
  name: string
  title: string
  visualCue: string
  imageUrl: string
}

export function getCharacterEvolutionDisplay(character: FrontendCharacterDefinition, level: number): CharacterEvolutionDisplay {
  let activeEvolution: FrontendCharacterEvolution | null = null

  if (character.evolutions && character.evolutions.length > 0) {
    // Sort descending by levelRequired to find the highest evolution the user has reached
    const sortedEvolutions = [...character.evolutions].sort((a, b) => b.levelRequired - a.levelRequired)
    
    for (const evolution of sortedEvolutions) {
      if (level >= evolution.levelRequired) {
        activeEvolution = evolution
        break
      }
    }
  }

  // Determine image filename based on level
  let imageLevel = 1
  if (level >= 30) {
    imageLevel = 30
  } else if (level >= 10) {
    imageLevel = 10
  }
  
  // Convert code to lowercase for filename (e.g., ASTRA -> astra)
  const charCodeLower = character.code.toLowerCase()
  
  // Note: the newly generated lumi images have _female in the name based on the previous generation,
  // but to keep it simple, let's copy those new generated images to the public assets folder later
  // For now, the standard URL is `/assets/gamification/${charCodeLower}_level_${imageLevel}.png`
  let imageUrl = `/assets/gamification/${charCodeLower}_level_${imageLevel}.png`
  
  // We'll update the physical files in a minute.
  
  if (activeEvolution) {
    return {
      name: character.name,
      title: activeEvolution.titleSuffix,
      visualCue: activeEvolution.visualCue,
      imageUrl
    }
  }

  // Default / Base Form
  return {
    name: character.name,
    title: character.theme,
    visualCue: character.visualCue,
    imageUrl
  }
}
