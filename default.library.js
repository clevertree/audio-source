import {Library} from "./song";

export default class extends Library {
  getTitle() { return "Audio Source Index"; }
  getLibraries() {
    return [
      require("./sample/sample.library.js"),
      require("./sample/wave.library.js"),
      require("./sample/wave/mohayonao.library.js"),
    ].map(library => {
      library = library.default || library;
      return new library();
    });
  }

  getPlaylists() {
    return [
      "assets/files/test.pl.json;Test Playlist"
    ]
  }
}

