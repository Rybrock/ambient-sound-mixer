export class SoundManager {
  constructor(soundData) {
    this.audioElements = new Map();
    this.isPlaying = false;
    console.log("sound manager created with sound data:", soundData);
  }

  // load a sound file
  loadSound(soundId, filePath) {
    // console.log(`Loading sound: ${soundId} from ${filePath}`);

    try {
      const audio = new Audio(filePath);
      audio.src = filePath;
      audio.loop = true;
      audio.preload = "metadata";
      // add sound to audio elements map
      this.audioElements.set(soundId, audio);
      return true; // Return true on successful load
    } catch (error) {
      console.error(`Error loading sound ${soundId}:`, error);
      return false;
    }
  }

  // play a sound by id
  async playSound(soundId) {
    const audio = this.audioElements.get(soundId);
    if (audio) {
      try {
        await audio.play();
        return true;
      } catch (error) {
        console.error(`Error playing sound ${soundId}:`, error);
        return false;
      }
    }
  }
  // pause a sound by id
  pauseSound(soundId) {
    const audio = this.audioElements.get(soundId);
    if (audio && audio.paused === false) {
      audio.pause();
    }
  }

  // stop all sounds and reset to start
  stopAllSounds() {
    for (const [soundId, audio] of this.audioElements) {
      if (audio && audio.paused === false) {
        audio.pause();
      }
      audio.currentTime = 0; // reset to start
    }
    this.isPlaying = false;
  }

  // set the audio volume for a sound by id
  setVolume(soundId, volume) {
    const audio = this.audioElements.get(soundId);
    if (!audio) {
      console.log(`Set volume for sound: ${soundId} to ${volume}`);
      return false;
    }
    // convert volume from 0-100 to 0.0-1.0
    audio.volume = volume / 100;
    console.log(`Set volume for sound: ${soundId} to ${volume}`);
    return true;
  }

  // play all sounds
  playAllSounds() {
    for (const [soundId, audio] of this.audioElements) {
      if (audio.paused) {
        audio.play();
      }
    }
    this.isPlaying = true;
  }

  // pause all sounds
  pauseAllSounds() {
    for (const [soundId, audio] of this.audioElements) {
      if (!audio.paused) {
        audio.pause();
      }
    }
    this.isPlaying = false;
  }
}
