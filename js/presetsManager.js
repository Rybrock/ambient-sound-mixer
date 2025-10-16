export class PresetsManager {
  constructor() {
    this.customPresets = this.loadCustomPresets();
  }

  // load presets from storage
  loadCustomPresets() {
    const stored = localStorage.getItem("ambientMixerPresets");
    return stored ? JSON.parse(stored) : {};
  }
  // save presets to storage
  saveCustomPresets() {
    localStorage.setItem(
      "ambientMixerPresets",
      JSON.stringify(this.customPresets)
    );
  }

  // save current mix as preset
  savePreset(name, soundStates) {
    const presetId = `custom-${Date.now()}`;

    // create preset object withactive sounds only
    const preset = {
      name,
      sounds: {},
    };

    for (const [soundId, volume] of Object.entries(soundStates)) {
      if (volume > 0) {
        preset.sounds[soundId] = volume;
      }
    }
    this.customPresets[presetId] = preset;
    this.saveCustomPresets();
    return presetId;
  }

  // checkif preset name already exists
  presetNameExists(name) {
    return Object.values(this.customPresets).some(
      (preset) => preset.name === name
    );
  }
}
