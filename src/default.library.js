// import WaveLibraryIndex from "./samples/wave.library.js";
// import SampleLibraryIndex from "./samples/sample.library";

import MohayonaoWaveLibrary from "./samples/wave/mohayonao.library.js";
// import FWSLibrary from "./samples/gm/fws.library.js";


export default {
  title: 'Audio Source Index',
  libraries: function* () {
    yield MohayonaoWaveLibrary;
    // yield FWSLibrary;
  },

  playlist: [
    "assets/files/test.pl.json;Test ASPPlaylist"
  ]
}
