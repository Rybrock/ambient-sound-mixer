export class UI {
  // set to null until DOM is loaded
  constructor() {
    this.soundCardsContainer = null;
    this.masterVolumeSlider = null;
    this.masterVolumeValue = null;
    this.playPauseButton = null;
    this.resetButton = null;
    this.modal = null;
    this.customPresetsContainer = null;
    this.timerDisplay = null;
    this.timerSelector = null;
    this.themeToggle = null;
  }

  init() {
    this.soundCardsContainer = document.querySelector("section.grid");
    this.masterVolumeSlider = document.getElementById("masterVolume");
    this.masterVolumeValue = document.getElementById("masterVolumeValue");
    this.playPauseButton = document.getElementById("playPauseButton");
    this.resetButton = document.getElementById("resetButton");
    this.modal = document.getElementById("savePresetModal");
    this.customPresetsContainer = document.getElementById("customPresets");
    this.timerDisplay = document.getElementById("timerDisplay");
    this.timerSelector = document.getElementById("timerSelector");
    this.themeToggle = document.getElementById("themeToggle");
  }

  // create sound card html
  createSoundCards(sound) {
    const card = document.createElement("div");
    card.className =
      "sound-card bg-white/10 backdrop-blur-md rounded-2xl p-6 relative overflow-hidden transition-all duration-300";
    card.dataset.soundId = sound.id;

    card.innerHTML = ` <div class="flex flex-col h-full">
      <!-- Sound Icon and Name -->
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center space-x-3">
          <div class="sound-icon-wrapper w-12 h-12 rounded-full bg-gradient-to-br ${sound.color} flex items-center justify-center">
            <i class="fas ${sound.icon} text-white text-xl"></i>
          </div>
          <div>
            <h3 class="font-semibold text-lg">${sound.name}</h3>
            <p class="text-xs opacity-70">${sound.description}</p>
          </div>
        </div>
        <button type="button" class="play-btn w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-300 flex items-center justify-center" data-sound="${sound.id}">
          <i class="fas fa-play text-sm"></i>
        </button>
      </div>

      <!-- Volume Control -->
      <div class="flex-1 flex flex-col justify-center">
        <div class="flex items-center space-x-3">
          <i class="fas fa-volume-low opacity-50"></i>
          <input type="range" class="volume-slider flex-1" min="0" max="100" value="0" data-sound="${sound.id}">
          <span class="volume-value text-sm w-8 text-right">0</span>
        </div>

        <!-- Volume Bar Visualization -->
        <div class="volume-bar mt-3">
          <div class="volume-bar-fill" style="width: 0%"></div>
        </div>
      </div>
    </div>`;
    return card;
  }

  // render all sound cards
  renderSoundCards(soundsData) {
    this.soundCardsContainer.innerHTML = "";
    soundsData.forEach((sound) => {
      const card = this.createSoundCards(sound);
      this.soundCardsContainer.appendChild(card);
    });
  }

  // update play/pause button icon
  updatePlayPauseButton(soundId, isPlaying) {
    const card = document.querySelector(`[data-sound-id="${soundId}"]`);
    if (!card) {
      console.error(`Could not find card for soundId: ${soundId}`);
      return;
    }
    const playBtn = card.querySelector(".play-btn");
    if (!playBtn) {
      console.error(`Could not find play button for soundId: ${soundId}`);
      return;
    }
    const icon = playBtn.querySelector("i");
    if (!icon) {
      console.error(`Could not find icon for soundId: ${soundId}`);
      return;
    }
    if (isPlaying) {
      icon.classList.remove("fa-play");
      icon.classList.add("fa-pause");
      card.classList.add("playing");
    } else {
      icon.classList.remove("fa-pause");
      icon.classList.add("fa-play");
      card.classList.remove("playing");
    }
  }
  // update volume display
  updateVolumeDisplay(soundId, volume) {
    const card = document.querySelector(`[data-sound-id="${soundId}"]`);
    if (card) {
      const volumeValue = card.querySelector(".volume-value");
      if (volumeValue) {
        volumeValue.textContent = volume;
      }

      // update volume bar visualization
      const volumeBarFill = card.querySelector(".volume-bar-fill");
      if (volumeBarFill) {
        volumeBarFill.style.width = `${volume}%`;
      }

      // update slider position
      const slider = card.querySelector(".volume-slider");
      if (slider) {
        slider.value = volume;
      }
    }
  }
}
