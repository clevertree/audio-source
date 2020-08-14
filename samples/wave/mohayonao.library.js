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
        sample.title = getNameFromURL(sample.url);
      if(LibraryData.baseURL)
        sample.url = LibraryData.baseURL + sample.url;
      yield ['oscillator', sample];
    }
  },

  /** Async loading **/
  async waitForAssetLoad() {}

}


export default Mohayonao;

function getNameFromURL(url) { return url.split('/').pop().replace('.json', ''); }

const wut = Mohayonao.presets(2);
console.log(wut);
