import WaveLibrary from "./samples/wave.library.js";
import SampleLibrary from "./samples/sample.library";
import MohayonaoWaveLibrary from "./samples/wave/mohayonao.library.js";

import {Library} from "./song";

export default class extends Library {
  getTitle() { return "Audio Source Index"; }
  getLibraries() {
    return [
      new SampleLibrary(),
      new WaveLibrary(),
      new MohayonaoWaveLibrary(),
    ];
  }

  getPlaylists() {
    return [
      "assets/files/test.pl.json;Test ASPPlaylist"
    ]
  }
}

