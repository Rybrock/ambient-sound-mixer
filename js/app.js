import { soundsData, defaultPresets } from "./soundData.js";
import { SoundManager } from "./soundManager.js";
import { UI } from "./ui.js";

class AmbientMixer {
  constructor() {
    this.soundManager = new SoundManager(soundsData);
    this.ui = new UI();
    this.presetManager = null;
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
      // setup event listeners
      this.setupEventListeners();
      this.loadAllSounds();
      // try to play rain
      //   this.soundManager.setVolume("rain", 50);
      //   await this.soundManager.playSound("rain");
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
    });

    // handle volume slider changes with event delegation
    document.addEventListener("input", (e) => {
      if (e.target.classList.contains("volume-slider")) {
        const soundId = e.target.dataset.sound;
        const volume = parseInt(e.target.value);
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
  }

  // load a sound file
  loadAllSounds(soundId, filePath) {
    // console.log(`Loading sound: ${soundId} from ${filePath}`);
    soundsData.forEach((sound) => {
      const audioUrl = `./audio/${sound.file}`;
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
      console.error(`No audio found for soundId: ${soundId}`);
      return false;
    }
    if (audio.paused) {
      this.soundManager.setVolume(soundId, 50); // Set default volume to 50 when playing
      await this.soundManager.playSound(soundId);
      // update volume display with default volume
      this.ui.updateVolumeDisplay(soundId, 50);
      // update play button icon - sound is now playing
      this.ui.updatePlayPauseButton(soundId, true);
    } else {
      // pause the sound if it's already playing
      this.soundManager.pauseSound(soundId);
      // update play button icon - sound is now paused
      this.ui.updatePlayPauseButton(soundId, false);
    }
    return true;
  }
  // set volume for a specific sound
  setSoundVolume(soundId, volume) {
    // calculate effective volume based on master volume
    const effectiveVolume = (volume * this.masterVolume) / 100;
    // update volume in sound manager
    const audio = this.soundManager.audioElements.get(soundId);
    if (audio) {
      audio.volume = effectiveVolume / 100;
    }
    this.ui.updateVolumeDisplay(soundId, volume);
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
}

// Initialize the app when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
  const app = new AmbientMixer();
  app.init();
  console.log("App initialized:", app.isInitialized);
});
