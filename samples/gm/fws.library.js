// import FileService from "../../song/file/FileService";

const FWSLibrary = {
	magnet: "magnet:?xt=urn:btih:76cae1312f250071f644631b6cffd3fb1645e50b&dn=fws&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.empire-js.us%3A1337&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.fastcast.nz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com",
	baseURL: "torrent://76cae1312f250071f644631b6cffd3fb1645e50b/",
	// libraryFile: "library.json",
	title: 'FreeWaveSamples.com',
	presets: (programClassFilter) => {
		const libraryData = require('./fws/library.json'); // await fetchLibraryData();

		// console.log('programClassFilter', programClassFilter);
		switch(programClassFilter) {
			default:
			case 'PolyphonyInstrument':
				return libraryData.presets.map(presetData => {
					const presetConfig = {
						title: presetData.title,
						voices: []
					}
					if(presetData.tags)
						presetConfig.tags = presetData.tags;
					presetConfig.voices = presetData.voices.map(sampleData => ['AudioBufferInstrument', Object.assign({}, sampleData, {
						url: FWSLibrary.baseURL + libraryData.sampleFolder + sampleData.url,
					})])
					// if(LibraryData.baseURL)
					// 	presetData.url = LibraryData.baseURL + presetData.url;
					return ['polyphony', presetConfig];
				});

			case 'audiobuffer':
				const voices = [];
				libraryData.presets.forEach(presetData => {
					presetData.voices.forEach(sampleData => {
						voices.push(['audiobuffer', Object.assign({}, sampleData, {
							url: FWSLibrary.baseURL + libraryData.sampleFolder + sampleData.url,
						})]);
					})
				});
				return voices;
		}
	}
}

export default FWSLibrary;

// let libraryDataCache = null, libraryDataCacheTimeout = null;
// async function fetchLibraryData() {
// 	clearTimeout(libraryDataCacheTimeout);
// 	libraryDataCacheTimeout = setTimeout(() => {
// 		// console.log('uncaching libraryData', libraryDataCache);
// 		libraryDataCache = null
// 	}, 10000);
// 	if(libraryDataCache)
// 		return libraryDataCache;
// 	const service = new FileService()
// 	let libraryData = await service.loadBufferFromURL(FWSLibrary.baseURL + FWSLibrary.libraryFile);
// 	libraryDataCache = JSON.parse(libraryData);
// 	// libraryDataCache = require('./fws/library.json');
// 	// console.log('caching libraryData', libraryDataCache);
//
// 	return libraryDataCache;
// }


// Test

// FWSLibrary.presets();
