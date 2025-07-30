// utils/skillDecay.js
const calculateSkillDecay = (skill) => {
    const now = new Date();
    const lastUsed = new Date(skill.lastUsed);
    const daysSinceLastUsed = Math.floor((now - lastUsed) / (1000 * 60 * 60 * 24));
    
    // Skill decay rates based on research
    const decayRates = {
        'Beginner': 0.45,     // Decays faster - less embedded
        'Intermediate': 0.20, // Moderate decay
        'Advanced': 0.10,     // Slower decay - more embedded
        'Expert': 0.08        // Slowest decay - deeply embedded
    };
    
    // Category-based decay modifiers
    const categoryModifiers = {
        'Programming': 1.2,   // Cognitive skills decay faster
        'Design': 1.1,
        'Language': 1.3,      // Languages decay quickly without practice
        'Music': 0.8,         // Motor skills decay slower
        'Fitness': 0.7,       // Physical skills retain better
        'Cooking': 0.9,
        'Other': 1.0
    };
    
    const baseDecayRate = decayRates[skill.level] || 0.10;
    const categoryModifier = categoryModifiers[skill.category] || 1.0;
    const adjustedDecayRate = baseDecayRate * categoryModifier;
    
    // Calculate decay percentage (exponential decay model)
    const decayPercentage = 1 - Math.exp(-adjustedDecayRate * daysSinceLastUsed / 30);
    
    // Determine decay status
    let decayStatus;
    if (daysSinceLastUsed <= 7) {
        decayStatus = 'Fresh';
    } else if (daysSinceLastUsed <= 20) {
        decayStatus = 'Good';
    } else if (daysSinceLastUsed <= 40) {
        decayStatus = 'Needs Practice';
    } else if (daysSinceLastUsed <= 70) {
        decayStatus = 'Rusty';
    } else {
        decayStatus = 'Decaying';
    }
    
    return {
        daysSinceLastUsed,
        decayPercentage: Math.min(decayPercentage, 0.8), // Cap at 80% decay
        decayStatus,
        adjustedDecayRate
    };
};

module.exports = { calculateSkillDecay };