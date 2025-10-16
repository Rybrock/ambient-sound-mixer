import { soundsData, defaultPresets } from "./soundData.js";
import { SoundManager } from "./soundManager.js";
import { PresetsManager } from "./presetsManager.js";
import { UI } from "./ui.js";

class AmbientMixer {
  constructor() {
    this.soundManager = new SoundManager(soundsData);
    this.ui = new UI();
    this.presetManager = new PresetsManager();
    this.timer = null;
    this.currentSoundState = {};
    this.masterVolume = 100; // default master volume
    this.isInitialized = false;
  }

  init() {
    try {
      // init UI
      this.ui.init();
      // render sound cards
      this.ui.renderSoundCards(soundsData);
      // render any saved custom presets from storage
      if (this.presetManager && this.presetManager.customPresets) {
        this.ui.renderCustomPresets(this.presetManager.customPresets);
      }
      // setup event listeners
      this.setupEventListeners();
      this.loadAllSounds();
      // Initialize sound states after loading sounds
      soundsData.forEach((sound) => {
        this.currentSoundState[sound.id] = 0; // default volume 0
      });

      this.isInitialized = true;
    } catch (error) {
      console.error("Error during initialization:", error);
    }
  }

  // setup all event listeners
  setupEventListeners() {
    // handle all clicks with event delegation
    document.body.addEventListener("click", async (e) => {
      // check if a play button was clicked
      if (e.target.closest(".play-btn")) {
        // what sound was clicked
        const soundId = e.target.closest(".play-btn").dataset.sound;
        await this.toggleSound(soundId);
      }

      // check if a preset button was clicked
      if (e.target.closest(".preset-btn")) {
        // what preset was clicked
        const presetKey = e.target.closest(".preset-btn").dataset.preset;
        await this.loadPreset(presetKey);
      }

      // check if a custom preset button was clicked
      if (e.target.closest(".custom-preset-btn")) {
        const presetId =
          e.target.closest(".custom-preset-btn").dataset.presetId;
        this.loadCustomPreset(presetId);
      }
    });

    // handle volume slider changes with event delegation
    document.addEventListener("input", (e) => {
      if (e.target.classList.contains("volume-slider")) {
        // which sound
        const soundId = e.target.dataset.sound;
        // get new volume
        const volume = parseInt(e.target.value);
        // set volume for that sound
        this.setSoundVolume(soundId, volume);
      }
    });

    // handle master volume slider
    const masterVolumeSlider = document.getElementById("masterVolume");
    if (masterVolumeSlider) {
      masterVolumeSlider.addEventListener("input", (e) => {
        const volume = parseInt(e.target.value);
        // set volume for all sounds
        this.setMasterVolume(volume);
      });
    }
    // handle main play/pause button
    if (this.ui.playPauseButton) {
      this.ui.playPauseButton.addEventListener("click", () => {
        this.toggleAllSounds();
      });
    }

    // handle reset button
    if (this.ui.resetButton) {
      this.ui.resetButton.addEventListener("click", () => {
        this.resetAll();
      });
    }

    // save preset button
    const saveButton = document.getElementById("savePreset");
    if (saveButton) {
      saveButton.addEventListener("click", () => {
        this.showSavePresetModal();
      });
    }

    // modal confirm/cancel buttons
    const confirmBtn = document.getElementById("confirmSave");
    const cancelBtn = document.getElementById("cancelSave");
    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => this.ui.hideModal());
    }
    if (confirmBtn) {
      confirmBtn.addEventListener("click", () => {
        const input = document.getElementById("presetName");
        const name = input ? input.value.trim() : "";

        // must have active sounds to save
        const hasActiveSounds = Object.values(this.currentSoundState).some(
          (v) => v > 0
        );
        if (!hasActiveSounds) {
          alert("No active sounds to save in preset.");
          return;
        }

        if (!name) {
          alert("Please enter a preset name.");
          return;
        }
        if (this.presetManager && this.presetManager.presetNameExists(name)) {
          alert("A preset with that name already exists.");
          return;
        }

        // save via presets manager
        const id = this.presetManager.savePreset(name, this.currentSoundState);

        // update UI with new custom preset button
        this.ui.addCustomPresetButton(id, this.presetManager.customPresets[id]);

        // close modal and clear input
        this.ui.hideModal();
      });
    }
    // allow pressing Enter in the input to confirm save
    const presetNameInput = document.getElementById("presetName");
    if (presetNameInput) {
      presetNameInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          confirmBtn?.click();
        }
      });
    }
  }

  // load a sound file
  loadAllSounds(soundId, filePath) {
    // console.log(`Loading sound: ${soundId} from ${filePath}`);
    soundsData.forEach((sound) => {
      // construct file path
      const audioUrl = `./audio/${sound.file}`;
      // load sound into sound manager
      const success = this.soundManager.loadSound(sound.id, audioUrl);
      if (!success) {
        console.error(`Failed to load sound: ${sound.id}`);
      }
    });
  }
  // toggle play/pause for a sound
  async toggleSound(soundId) {
    const audio = this.soundManager.audioElements.get(soundId);

    if (!audio) {
      console.error(`Sound ${soundId} not found`);
      return false;
    }

    if (audio.paused) {
      // Get current slider value
      const card = document.querySelector(`[data-sound-id="${soundId}"]`);
      const slider = card ? card.querySelector(".volume-slider") : null;
      let volume = slider ? parseInt(slider.value) : 0;

      // If slider is at 0, default to 50%
      if (volume === 0) {
        volume = 50;
        this.ui.updateVolumeDisplay(soundId, volume);
      }

      // Set current sound state
      this.currentSoundState[soundId] = volume;

      // Sound is off, turn it on
      this.soundManager.setVolume(soundId, volume);
      await this.soundManager.playSound(soundId);
      this.ui.updateSoundPlayButton(soundId, true);
    } else {
      // Sound is on, shut it off
      this.soundManager.pauseSound(soundId);
      this.currentSoundState[soundId] = 0;
      this.ui.updateSoundPlayButton(soundId, false);

      // Set current sound state to 0 when paused
      this.currentSoundState[soundId] = 0;
    }

    // Update main play button state
    this.updateMainPlayButtonState();
  }

  // toggle all sounds
  toggleAllSounds() {
    if (this.soundManager.isPlaying) {
      // pause all sounds
      this.soundManager.pauseAllSounds();
      // update ui
      this.ui.updateMainPlayButton(false);
      // update all play buttons to paused state
      soundsData.forEach((sound) => {
        this.ui.updatePlayPauseButton(sound.id, false);
      });
    } else {
      // toggle play all sounds
      for (const [soundId, audio] of this.soundManager.audioElements) {
        const card = document.querySelector(`[data-sound-id="${soundId}"]`);
        const slider = card ? card.querySelector(".volume-slider") : null;
        if (slider) {
          let volume = parseInt(slider.value);
          if (volume === 0) {
            volume = 50; // default to 50 if volume is 0
            slider.value = volume;
            this.ui.updateVolumeDisplay(soundId, volume);
          }
          // Set current sound state
          this.currentSoundState[soundId] = volume;

          // save current sound state
          this.currentSoundState[soundId] = volume;
          // calculate effective volume based on master volume
          const effectiveVolume = (volume * this.masterVolume) / 100;
          // set volume in sound manager
          audio.volume = effectiveVolume / 100;
          // update volume display
          this.ui.updatePlayPauseButton(soundId, true);
        }
      }
      this.soundManager.playAllSounds();
      this.ui.updateMainPlayButton(true);
    }
  }
  // set volume for a specific sound
  setSoundVolume(soundId, volume) {
    // set sounds volume in state
    this.currentSoundState[soundId] = volume;
    // console.log("currentSoundState:", this.currentSoundState);

    // calculate effective volume based on master volume
    const effectiveVolume = (volume * this.masterVolume) / 100;
    // update volume in sound manager
    const audio = this.soundManager.audioElements.get(soundId);
    if (audio) {
      audio.volume = effectiveVolume / 100;
    }
    this.ui.updateVolumeDisplay(soundId, volume);
    // sync master volume to all playing sounds
    this.updateMainPlayButtonState();
  }

  setMasterVolume(volume) {
    this.masterVolume = volume;
    // update master volume label
    const masterVolumeValue = document.getElementById("masterVolumeValue");
    if (masterVolumeValue) {
      masterVolumeValue.textContent = `${volume}`;
    }
    // update volume for all currently playing sounds
    this.applyMasterVolumeToAllSounds();
  }

  // apply master volume to all currently playing sounds
  applyMasterVolumeToAllSounds() {
    for (const [soundId, audio] of this.soundManager.audioElements) {
      if (!audio.paused) {
        const card = document.querySelector(`[data-sound-id="${soundId}"]`);
        const slider = card ? card.querySelector(".volume-slider") : null;
        if (slider) {
          const individualVolume = parseInt(slider.value);
          // calculate effective volume based on master volume
          const effectiveVolume = (individualVolume * this.masterVolume) / 100;
          // set volume in sound manager
          audio.volume = effectiveVolume / 100;
        }
      }
    }
  }

  // update main play/pause button
  updateMainPlayButtonState(isAnyPlaying) {
    // check if any sound is playing
    let anySoundsPlaying = false;
    for (const [soundId, audio] of this.soundManager.audioElements) {
      if (!audio.paused) {
        anySoundsPlaying = true;
        break;
      }
    }
    // update main play button icon
    this.soundManager.isPlaying = anySoundsPlaying;
    this.ui.updateMainPlayButton(anySoundsPlaying);
  }

  // reset all ui elements
  resetAll() {
    this.soundManager.stopAllSounds();
    this.masterVolume = 100;
    // reset the sound states
    soundsData.forEach((sound) => {
      this.currentSoundState[sound.id] = 0;
    });
    this.ui.resetUI();
    // console.log("Reset all UI elements and stopped all sounds.");
  }

  // load a preset configuration
  loadPreset(presetKey) {
    const preset = defaultPresets[presetKey];
    if (!preset) {
      console.error(`Preset not found: ${presetKey}`);
      return;
    }
    // first stop all sounds
    this.soundManager.stopAllSounds();
    // reset all volumes to 0
    soundsData.forEach((sound) => {
      this.currentSoundState[sound.id] = 0;
      this.ui.updateVolumeDisplay(sound.id, 0);
      this.ui.updatePlayPauseButton(sound.id, false);
    });

    // apply the preset volumes
    for (const [soundId, volume] of Object.entries(preset.sounds)) {
      // set volume state
      this.currentSoundState[soundId] = volume;
      // update the UI
      this.ui.updateVolumeDisplay(soundId, volume);
      // calculate effective volume based on master volume
      const effectiveVolume = (volume * this.masterVolume) / 100;
      // get the audio element
      const audio = this.soundManager.audioElements.get(soundId);
      if (audio) {
        audio.volume = effectiveVolume / 100;
        // play the sound
        audio.play();
        this.ui.updatePlayPauseButton(soundId, true);
      }
    }

    // update mainplay button state
    this.soundManager.isPlaying = true;
    this.ui.updateMainPlayButton(true);
  }

  // load a saved custom preset by id
  loadCustomPreset(presetId) {
    if (!this.presetManager) return;
    const preset = this.presetManager.customPresets[presetId];
    if (!preset) {
      console.error(`Custom preset not found: ${presetId}`);
      return;
    }
    // stop and reset
    this.soundManager.stopAllSounds();
    soundsData.forEach((sound) => {
      this.currentSoundState[sound.id] = 0;
      this.ui.updateVolumeDisplay(sound.id, 0);
      this.ui.updatePlayPauseButton(sound.id, false);
    });

    for (const [soundId, volume] of Object.entries(preset.sounds)) {
      this.currentSoundState[soundId] = volume;
      this.ui.updateVolumeDisplay(soundId, volume);
      const effectiveVolume = (volume * this.masterVolume) / 100;
      const audio = this.soundManager.audioElements.get(soundId);
      if (audio) {
        audio.volume = effectiveVolume / 100;
        audio.play();
        this.ui.updatePlayPauseButton(soundId, true);
      }
    }
    this.soundManager.isPlaying = true;
    this.ui.updateMainPlayButton(true);
  }

  // show save preset modal
  showSavePresetModal() {
    const hasActiveSounds = Object.values(this.currentSoundState).some(
      (volume) => volume > 0
    );
    if (!hasActiveSounds) {
      alert("No active sounds to save in preset.");
      return;
    }
    this.ui.showModal();
  }
}

// Initialize the app when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
  const app = new AmbientMixer();
  app.init();
  console.log("App initialized:", app.isInitialized);
});
