import LibraryData from "./mohayonao.library.json";

const Mohayonao = {
  title: 'Mohayonao Wave Library',

  presets: function* () {
    const samples = LibraryData.samples;
    for(let i=0; i<samples.length; i++) {
      let sample = samples[i];
      if(typeof sample !== "object")
        sample = {url: sample, type:'custom'};
      if(!sample.title)
        sample.title = sample.url.split('/').pop().replace('.json', '');
      if(LibraryData.baseURL)
        sample.url = LibraryData.baseURL + sample.url;
      yield ['oscillator', sample];
    }
  },



  samples: function* () {
    const samples = LibraryData.samples;
    for(let i=0; i<samples.length; i++) {
      let sample = samples[i];
      yield LibraryData.baseURL + sample;
    }
  }

  /** Async loading **/
  // async waitForAssetLoad() {}

}


export default Mohayonao;
