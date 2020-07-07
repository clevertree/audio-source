import WaveLibraryIndex from "./samples/wave.library.js";
import SampleLibraryIndex from "./samples/sample.library";

import MohayonaoWaveLibrary from "./samples/wave/mohayonao.library.js";
import FWSLibrary from "./samples/gm/fws/fws.library.js";


export default {
  title: 'Audio Source Index',
  libraries: [
    MohayonaoWaveLibrary,
    FWSLibrary,

    SampleLibraryIndex,
    WaveLibraryIndex,
  ],
  playlist: [
    "assets/files/test.pl.json;Test ASPPlaylist"
  ]
}
