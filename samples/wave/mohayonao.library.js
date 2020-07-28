import LibraryData from "./mohayonao.library.json";

export default {
  title: 'Mohayonao Wave Library',
  presets: () => {
    return LibraryData.samples.map(sample => {
      if(typeof sample !== "object")
        sample = {url: sample, type:'custom'};
      if(!sample.title)
        sample.title = sample.url.split('/').pop();
      if(LibraryData.baseURL)
        sample.url = LibraryData.baseURL + sample.url;
      return ['oscillator', sample];
    });
  }
}
