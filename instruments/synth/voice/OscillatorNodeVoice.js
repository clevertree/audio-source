class OscillatorNodeVoice {
    constructor(config) {
        this.config = config;
    }



    async loadAudioVoiceData(voiceURL, cache=false) {
        let voiceData;
        if(typeof this.voiceDataByURL[voiceURL] === "undefined") {
            voiceURL = new URL(voiceURL, document.location) + '';

            this.voiceDataByURL[voiceURL] = new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();

                xhr.open('GET', voiceURL, true);
                const ext = voiceURL.split('.').pop().toLowerCase();
                switch (ext) {
                    // default:
                    case '':
                    case 'wav':
                        xhr.responseType = 'arraybuffer';
                        break;
                    case 'json':
                        xhr.responseType = 'json';
                        break;
                    default:
                        reject("Unknown extension: " + ext);
                }
                xhr.onload = () => {
                    if (xhr.status !== 200)
                        return reject("Voice file not found: " + voiceURL);
                    resolve(xhr.response);
                };
                xhr.onerror = reject;
                xhr.send();
            });

            // console.info("Voice Data Loaded: ", voiceURL);
            // this.voiceDataByURL[voiceURL] = voiceData;
        }
        voiceData = this.voiceDataByURL[voiceURL];
        if(!cache)
            delete this.voiceDataByURL[voiceURL];
        if(voiceData instanceof Promise)
            voiceData = await voiceData;

        return voiceData;
    }

    static isValidConfig(config) {
        const ext = voiceURL.split('.').pop().toLowerCase();

    }
}

export default OscillatorNodeVoice;
