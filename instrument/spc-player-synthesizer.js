{
    class SPCPlayerSynthesizer {


        constructor(config, song=null, instrumentID=null) {
            this.song = song;
            this.id = instrumentID;
            this.form = null;

            this.samples = [];
            this.sampleDataByURL = {};
            this.activeSources = [];

            this.audioContext = null;
            if(typeof config.name === "undefined")
                config.name = 'SPC Player ' + (instrumentID < 10 ? "0" : "") + (instrumentID);
            this.config = config || {};
        }

        /** Initializing Audio **/

        async init(audioContext) {
            this.audioContext = audioContext;
        }

        /** Playback **/


        // Instruments return promises
        async play(destination, namedFrequency, startTime, duration, velocity) {

            const commandFrequency = this.getFrequencyFromAlias(namedFrequency) || namedFrequency;

            // Loop through sample
            const samplePromises = [];
            for (let i = 0; i < this.config.samples.length; i++) {
                const sampleConfig = this.config.samples[i];
                let frequencyValue = 440;

                // Filter sample playback
                if (sampleConfig.keyAlias) {
                    if(sampleConfig.keyAlias !== commandFrequency)
                    // if(sampleConfig.name !== namedFrequency)
                        continue;
                } else {
                    frequencyValue = this.getCommandFrequency(commandFrequency);
                }

                if (sampleConfig.keyLow && this.getCommandFrequency(sampleConfig.keyLow) > frequencyValue)
                    continue;
                if (sampleConfig.keyHigh && this.getCommandFrequency(sampleConfig.keyHigh) < frequencyValue)
                    continue;

                // TODO: polyphony

                const samplePromise = this.playSample(destination, i, frequencyValue, startTime, duration, velocity, sampleConfig.adsr || null);
                samplePromises.push(samplePromise);
            }

            if(samplePromises.length > 0) {
                for (let i = 0; i < samplePromises.length; i++) {
                    await samplePromises[i];
                }
            } else {
                console.warn("No samples were played: " + commandFrequency);
            }
        }

        stopPlayback() {
            // Stop all active sources
//             console.log("activeSources!", this.activeSources);
            for (let i = 0; i < this.activeSources.length; i++) {
                try {
                    this.activeSources[i].stop();
                } catch (e) {
                    console.warn(e);
                }
            }
            this.activeSources = [];

        }



        // get instrumentID() {
        //     return this.getAttribute('data-id');
        // }

        render(renderObject=null) {
            if(renderObject instanceof HTMLElement && renderObject.matches('asui-div')) {
                this.form = new SPCPlayerSynthesizerFormRenderer(renderObject, this);
            } else {
                throw new Error("Unknown renderer");
            }
        }


    }





    /**
     * Used for all Instrument UI. Instance not necessary for song playback
     */
    class SPCPlayerSynthesizerFormRenderer {

        /**
         *
         * @param {AudioSourceComposerForm} instrumentForm
         * @param instrument
         */
        constructor(instrumentForm, instrument) {
            this.form = instrumentForm;
            this.instrument = instrument;
            const root = instrumentForm.getRootNode() || document;
            this.appendCSS(root);
            this.render();
        }

        get DEFAULT_SAMPLE_LIBRARY_URL() {
            return getScriptDirectory('default.library.json');
        }



        appendCSS(rootElm) {

            // Append Instrument CSS
            const PATH = 'instrument/spc-player-synthesizer.css';
            const linkHRef = getScriptDirectory(PATH);
//             console.log(rootElm);
            let linkElms = rootElm.querySelectorAll('link');
            for(let i=0; i<linkElms.length; i++) {
                if(linkElms[i].href.endsWith(PATH))
                    return;
            }
            const linkElm = document.createElement('link');
            linkElm.setAttribute('href', linkHRef);
            linkElm.setAttribute('rel', 'stylesheet');
            rootElm.insertBefore(linkElm, rootElm.firstChild);
        }

        /** Modify Instrument **/

        remove() {
            this.instrument.song.removeInstrument(this.instrument.id);
            document.dispatchEvent(new CustomEvent('instrument:remove', this));
        }

        setInstrumentName(newInstrumentName) {
            return this.instrument.song.setInstrumentName(this.instrument.id, newInstrumentName);
        }

        async render() {
            // const instrument = this.instrument;
            const instrumentID = typeof this.instrument.id !== "undefined" ? this.instrument.id : -1;
            const instrumentIDHTML = (instrumentID < 10 ? "0" : "") + (instrumentID);
            this.form.innerHTML = '';
            this.form.classList.add('spc-player-synthesizer-container');

            // this.form.removeEventListener('focus', this.focusHandler);
            // this.form.addEventListener('focus', this.focusHandler, true);

            const instrumentToggleButton = this.form.addButtonInput('instrument-id',
                e => this.form.classList.toggle('selected'),
                instrumentIDHTML + ':'
            );
            instrumentToggleButton.classList.add('show-on-focus');

            const instrumentNameInput = this.form.addTextInput('instrument-name',
                (e, newInstrumentName) => this.setInstrumentName(newInstrumentName),
                'Instrument Name',
                this.instrument.config.name || '',
                'Unnamed'
            );
            instrumentNameInput.classList.add('show-on-focus');


            this.form.addButtonInput('instrument-remove',
                (e) => this.remove(e, instrumentID),
                this.form.createIcon('delete'),
                'Remove Instrument');

            let defaultPresetURL = '';
            if (this.instrument.config.libraryURL && this.instrument.config.preset)
                defaultPresetURL = new URL(this.instrument.config.libraryURL + '#' + this.instrument.config.preset, document.location) + '';

            this.fieldChangePreset = this.form.addSelectInput('instrument-preset',
                (e, presetURL) => this.setPreset(presetURL),
                (addOption, setOptgroup) => {
                    addOption('', 'Change Preset');
                    // setOptgroup(this.sampleLibrary.name || 'Unnamed Library');
                    // this.sampleLibrary.eachPreset(presetConfig => addOption(presetConfig.url, presetConfig.name));
                    // setOptgroup('Libraries');
                    // this.sampleLibrary.eachLibrary(libraryConfig => addOption(libraryConfig.url, libraryConfig.name));
                    // setOptgroup('Other Libraries');
                    // const AudioSourceLibrary = customElements.get('audio-source-library');
                    // AudioSourceLibrary.eachHistoricLibrary(addOption);
                },
                'Change Instrument',
                defaultPresetURL);


            this.form.addBreak();
        }
    }

    // window.addEventListener('DOMContentLoaded', e => {
    //     document.dispatchEvent(new CustomEvent('instrument:loaded', eventData));
    // });



    /** 3rd party library **/


    const SPCLibrary = {};
    const SPC_CPU = (function(exports) {
        "use strict"; var CYCLE_TABLE=[2,8,4,7,3,4,3,6,2,6,5,4,5,4,6,8,4,8,4,7,4,5,5,6,5,5,6,5,2,2,4,6,2,8,4,7,3,4,3,6,2,6,5,4,5,4,7,4,4,8,4,7,4,5,5,6,5,5,6,5,2,2,3,8,2,8,4,7,3,4,3,6,2,6,4,4,5,4,6,6,4,8,4,7,4,5,5,6,5,5,4,5,2,2,4,3,2,8,4,7,3,4,3,6,2,6,4,4,5,4,7,5,4,8,4,7,4,5,5,6,5,5,5,5,2,2,3,6,2,8,4,7,3,4,3,6,2,6,5,4,5,2,4,5,4,8,4,7,4,5,5,6,5,5,5,5,2,2,12,5,3,8,4,7,3,4,3,6,2,6,4,4,5,2,4,4,4,8,4,7,4,5,5,6,5,5,5,5,2,2,3,4,3,8,4,7,4,5,4,7,2,5,6,4,5,2,4,9,4,8,4,7,5,6,6,7,4,5,5,5,2,2,8,3,2,8,4,7,3,4,3,6,2,4,5,3,4,3,4,0,4,8,4,7,4,5,5,6,3,4,5,4,2,2,6,0],BYTE_COUNTS=[1,1,2,3,2,3,1,2,2,3,3,2,3,1,3,1,2,1,2,3,2,3,3,2,3,1,2,2,1,1,3,3,1,1,2,3,2,3,1,2,2,3,3,2,3,1,3,2,2,1,2,3,2,3,3,2,3,1,2,2,3,1,3,2],FLAG_N=128,FLAG_V=64,FLAG_P=32,FLAG_B=16,FLAG_H=8,FLAG_I=4,FLAG_Z=2,FLAG_C=1,NZ_NEG_MASK=128,STACK_OFFSET=257,FUNC_REGISTER_CONTROL=241,FUNC_REGISTER_RADDR=242,FUNC_REGISTER_RDATA=243,FUNC_REGISTER_PORT0=244,FUNC_REGISTER_PORT1=245,FUNC_REGISTER_PORT2=246,FUNC_REGISTER_PORT3=247,FUNC_REGISTER_TIMER0=250,FUNC_REGISTER_TIMER1=251,FUNC_REGISTER_TIMER2=252,FUNC_REGISTER_COUNTER0=253,FUNC_REGISTER_COUNTER1=254,FUNC_REGISTER_COUNTER2=255;function Timer(e,a){this._idx=e,this._rate=a,this._enabled=!1,this._time=1}function CPU(e,a){this._state=e,this._dsp=a,this._time=0,this._instCounter=0,this._timer0=new Timer(0,128),this._timer1=new Timer(1,128),this._timer2=new Timer(2,16);var r=this._state.ram,s=r[FUNC_REGISTER_CONTROL];this._timer0.loadFromRegs(1&s,r[FUNC_REGISTER_TIMER0],r[FUNC_REGISTER_COUNTER0]),this._timer1.loadFromRegs(2&s,r[FUNC_REGISTER_TIMER1],r[FUNC_REGISTER_COUNTER1]),this._timer2.loadFromRegs(4&s,r[FUNC_REGISTER_TIMER2],r[FUNC_REGISTER_COUNTER2])}Timer.prototype.loadFromRegs=function(e,a,r){this._enabled=!!e,this._divisor=a,this._counter=r},Timer.prototype.setEnabled=function(e,a){a=!!a,this._enabled!=a&&(this._runUntil(e),this._enabled=a,this._enabled&&(this._counter=0))},Timer.prototype.setDivisor=function(e,a){this._divisor!=a&&(this._runUntil(e),this._divisor=a)},Timer.prototype.readCounter=function(e){this._runUntil(e);var a=this._counter;return this._counter=0,a},Timer.prototype._runUntil=function(e){var a=this._time;if(this._time=e,this._enabled){var r=0==this._divisor?256:this._divisor,s=(a/this._rate|0)/r|0,t=((e/this._rate|0)/r|0)-s;this._counter+=t,this._counter&=15}},CPU.prototype.runUntil=function(e){var a=this._dsp,r=this._state,s=this._time,t=!(r.psw&FLAG_Z)*(r.psw&FLAG_N?NZ_NEG_MASK:1),_=r.psw&FLAG_P?256:0,i=r.psw&FLAG_C,c=r.ram,R=new Int8Array(c.buffer,c.byteOffset,c.byteLength),E=r.pc,n=r.sp,b=r.a,T=r.x,k=r.y;function o(){a.runUntil(s)}var C,F=function(e){switch(e){case FUNC_REGISTER_RADDR:break;case FUNC_REGISTER_RDATA:var t=r.ram[FUNC_REGISTER_RADDR],_=r.ram[FUNC_REGISTER_RDATA];o(),a.setRegister(t,_);break;case FUNC_REGISTER_PORT0:case FUNC_REGISTER_PORT1:case FUNC_REGISTER_PORT2:case FUNC_REGISTER_PORT3:break;case FUNC_REGISTER_TIMER0:return this._timer0.setDivisor(s,r.ram[e]);case FUNC_REGISTER_TIMER1:return this._timer1.setDivisor(s,r.ram[e]);case FUNC_REGISTER_TIMER2:return this._timer2.setDivisor(s,r.ram[e]);case FUNC_REGISTER_CONTROL:this._timer0.setEnabled(s,1&r.ram[e]),this._timer1.setEnabled(s,2&r.ram[e]),this._timer2.setEnabled(s,4&r.ram[e]);break;default:console.error("Write to unimplemented register: ",e.toString(16))}}.bind(this),N=function(e){if(e==FUNC_REGISTER_RDATA){o();var r=c[FUNC_REGISTER_RADDR];c[e]=a.getRegister(r)}else e==FUNC_REGISTER_COUNTER0?c[e]=this._timer0.readCounter(s):e==FUNC_REGISTER_COUNTER1?c[e]=this._timer1.readCounter(s):e==FUNC_REGISTER_COUNTER2&&(c[e]=this._timer2.readCounter(s));return c[e]}.bind(this);function G(e,a){return c[e]=a,e>=240&&e<=255&&F(e),a}function h(e){return N(e+1)<<8|N(e)}function U(e){!function(e,a){G(e+1,a>>8),G(e,255&a)}(STACK_OFFSET+(n-=2),e)}function S(){return c[STACK_OFFSET+n++]}function u(e){c[STACK_OFFSET+--n]=e}function m(e){return c[E++]<<8|e}function I(e){e?E+=R[E-1]:s-=2}function A(e,a){var r=e+a+i;return i=!!(r>>8),t=255&r}function d(e,a){return A(e,255&~a)}for(;s<e;){var p=c[E],f=CYCLE_TABLE[p];if(s+f>e)break;s+=f,E++;var O,v=c[E++];switch(p){case 232:b=t=v;break;case 230:b=t=N(O=_+T),E--;break;case 228:b=t=N(O=_+v);break;case 244:b=t=N(O=_+v+T);break;case 229:O=m(v),b=t=N(O);break;case 245:O=m(v)+T,b=t=N(O);break;case 246:O=m(v)+k,b=t=N(O);break;case 231:O=h(_+v+T),b=t=N(O);break;case 247:O=h(_+v)+k,b=t=N(O);break;case 205:T=t=v;break;case 248:T=t=N(O=_+v);break;case 141:k=t=v;break;case 251:k=t=N(O=_+v+T);break;case 236:O=m(v),k=t=N(O);break;case 212:G(O=_+v+T,b);break;case 196:G(O=_+v,b);break;case 213:G(O=_+m(v)+T,b);break;case 214:G(O=_+m(v)+k,b);break;case 201:G(O=_+m(v),T);break;case 203:G(O=_+v,k);break;case 219:G(O=_+v+T,k);break;case 125:b=t=T,--E;break;case 221:b=t=k,--E;break;case 93:T=t=b,--E;break;case 253:k=t=b,--E;break;case 250:var L=_+v;G(l=_+c[E++],N(L));break;case 143:G(O=_+c[E++],v);break;case 104:i=(t=b-v)>=0,t&=255;break;case 100:t=b-N(_+v),i=t>=0,t&=255;break;case 200:i=(t=T-v)>=0,t&=255;break;case 136:b=A(b,v);break;case 149:O=_+m(v)+T,b=A(b,N(O));break;case 137:var l;L=_+v;G(l=_+c[E++],A(N(l),N(L)));break;case 4:b=t=b|N(_+v);break;case 8:b=t=b|v;break;case 36:b=t=b&N(_+v);break;case 40:b=t=b&v;break;case 72:b=t=b^v;break;case 188:++b,t=b&=255,--E;break;case 61:++T,t=T&=255,--E;break;case 252:++k,t=k&=255,--E;break;case 156:--b,t=b&=255,--E;break;case 29:--T,t=T&=255,--E;break;case 220:--k,t=k&=255,--E;break;case 155:t=G(O=_+v+T,N(O)-1);break;case 171:t=G(O=_+v,N(O)+1);break;case 187:t=G(O=_+v+T,N(O)+1);break;case 28:i=(b<<=1)>>8,t=b&=255,--E;break;case 92:i=1&b,b>>=1,t=b&=255,--E;break;case 75:t=G(O=_+v,N(O)>>1),i=0;break;case 124:i=1&(P=(1&i)<<8|b),b=t=P>>1,--E;break;case 107:var P=(1&i)<<8|N(O=_+v);i=1&P,t=G(O,P>>1);break;case 159:b=t=b>>4|b<<4,--E;break;case 218:G(_+v,b),G(_+v+1,k);break;case 186:b=255&(w=h(_+v)),i=w>>16,t=k=w>>8;break;case 122:var w=k<<8|b;v=h(_+v),i=0,k=(D=A(255&w,255&v)|A(w>>8,v>>8)<<8)>>8,b=255&D,t=D>>16|0!=D;break;case 154:var D;w=k<<8|b;v=h(_+v),i=1,k=(D=d(255&w,255&v)|d(w>>8,v>>8)<<8)>>8,b=255&D,t=D>>16|0!=D;break;case 207:t=k=(w=k*b&65535)>>8,b=255&w,k&=255,--E;break;case 158:k=(w=k<<8|b)%T&255,t=b=w/T&255,--E;break;case 47:I(!0);break;case 240:I(!t);break;case 208:I(t);break;case 176:I(i);break;case 48:I(t&NZ_NEG_MASK);break;case 16:I(!(t&NZ_NEG_MASK));break;case 95:E=m(v);break;case 31:O=h(m(v)+T),E=O;break;case 63:U(E+1),E=m(v);break;case 111:C=void 0,C=h(STACK_OFFSET+n),n+=2,E=C;break;case 45:u(b),--E;break;case 77:u(T),--E;break;case 109:u(k),--E;break;case 174:b=S(),--E;break;case 206:T=S(),--E;break;case 238:k=S(),--E;break;case 2:case 34:case 66:case 98:case 130:case 162:case 194:case 226:var M=1<<(p>>5);G(O=_+v,N(O)|M);break;case 18:case 50:case 82:case 114:case 146:case 178:case 210:case 242:var y=~(1<<(p>>5));G(O=_+v,N(O)&y);break;case 32:_=0,--E;break;case 96:i=0,--E;break;case 64:_=256,--E;break;default:console.error("unknown opcode",p.toString(16))}}return o(),r.pc=E,r.sp=n,r.a=b,r.x=T,r.y=k,r.psw&=~(FLAG_N|FLAG_Z|FLAG_C|FLAG_P),r.psw|=i?FLAG_C:0,r.psw|=t?0:FLAG_Z,r.psw|=t&NZ_NEG_MASK?FLAG_N:0,r.psw|=_?FLAG_P:0,this._time=s,this._time},CPU.prototype.runUntilSamples=function(e){var a=e*this._dsp.CLOCKS_PER_SAMPLE,r=this._time+a;this.runUntil(r)},exports.SPC_CPU=CPU;
        return CPU;
    })(SPCLibrary);

    const SPC_DSP = (function(exports) {
        "use strict"; var GLOBAL_REG_MASTER_VOL_L=12,GLOBAL_REG_MASTER_VOL_R=28,GLOBAL_REG_ECHO_VOL_L=44,GLOBAL_REG_ECHO_VOL_R=60,GLOBAL_REG_KEY_ON=76,GLOBAL_REG_KEY_OFF=92,GLOBAL_REG_FLAG=108,GLOBAL_REG_ENDX=124,GLOBAL_REG_PITCH_MOD=45,GLOBAL_REG_NOISE_ON=61,GLOBAL_REG_DIR=93,VOICE_REG_VOL_L=0,VOICE_REG_VOL_R=1,VOICE_REG_PITCH_L=2,VOICE_REG_PITCH_H=3,VOICE_REG_SOURCE=4,VOICE_REG_ADSR0=5,VOICE_REG_ADSR1=6,CLOCKS_PER_SAMPLE=32;function clamp16(e){return e<-32768&&(e=-32768),e>32767&&(e=32767),e}var EnvelopeState={RELEASE:0,ATTACK:1,DECAY:2,SUSTAIN:3};function newVoice(e){var t={sourceIndex:null,sampleAddr:null,sampleOffs:null};return t.brrBuffer=new Int16Array(24),t.brrPos=0,t.volumeL=1,t.volumeR=1,t.envelopeState=EnvelopeState.RELEASE,t.envx=0,t.newEnvx=0,t.interpPos=0,t}function RATE(e,t){return e>=t?8*(e/t|0)-1:e-1}var COUNTER_MASK=[RATE(2,2),RATE(2048,4),RATE(1536,3),RATE(1280,5),RATE(1024,4),RATE(768,3),RATE(640,5),RATE(512,4),RATE(384,3),RATE(320,5),RATE(256,4),RATE(192,3),RATE(160,5),RATE(128,4),RATE(96,3),RATE(80,5),RATE(64,4),RATE(48,3),RATE(40,5),RATE(32,4),RATE(24,3),RATE(20,5),RATE(16,4),RATE(12,3),RATE(10,5),RATE(8,4),RATE(6,3),RATE(5,5),RATE(4,4),RATE(3,3),RATE(2,4),RATE(1,4)],COUNTER_SELECT=[0,2,1,3,2,1,3,2,1,3,2,1,3,2,1,3,2,1,3,2,1,3,2,1,3,2,1,3,2,1,2,2];function DSP(e){this._time=CLOCKS_PER_SAMPLE+1,this._counters=[1,0,-32,11],this._everyOtherSample=!0,this._regs=e.regs,this._sregs=new Int8Array(this._regs.buffer,this._regs.byteOffset,this._regs.byteLength),this._ram=e.ram,this._voices=[];for(var t=0;t<8;t++)this._voices.push(newVoice())}DSP.prototype._runCounter=function(e){var t=this._counters[e];7&t--||(t-=6-e),this._counters[e]=65535&t},DSP.prototype.getRegister=function(e){return this._regs[e]},DSP.prototype.setRegister=function(e,t){this._regs[e]=t},DSP.prototype.runUntil=function(e){e--;var t=Math.floor(this._time/CLOCKS_PER_SAMPLE),r=Math.floor(e/CLOCKS_PER_SAMPLE);this._time=e;var n=r-t;if(n){for(var E=this._ram,_=256*this._regs[GLOBAL_REG_DIR],s={START:0,LOOP:2},R=this._counters,A=function(e){var t=1<<e,r=this._voices[e],n=(63&this._regs[h(e,VOICE_REG_PITCH_H)])<<8|this._regs[h(e,VOICE_REG_PITCH_L)];r.keyOnDelay>0&&(--r.keyOnDelay,4==r.keyOnDelay&&(r.sourceIndex=this._regs[h(e,VOICE_REG_SOURCE)],r.sampleAddr=T(r.sourceIndex,s.START),r.brrPos=0),r.envx=0,r.interpPos=r.keyOnDelay<3?16384:0,n=0),this._everyOtherSample&&(this._keyOff&t&&(r.envelopeState=EnvelopeState.RELEASE),this._keyOn&t&&(r.envelopeState=EnvelopeState.ATTACK,r.keyOnDelay=5));var _=this._regs[h(e,VOICE_REG_ADSR0)],A=this._regs[h(e,VOICE_REG_ADSR1)];function i(e,t){r.newEnvx=r.envx+t,(r.newEnvx>2047||r.newEnvx<0)&&(r.newEnvx=r.newEnvx<0?0:2047,r.envelopeState==EnvelopeState.ATTACK&&(r.envelopeState=EnvelopeState.DECAY)),function(e){return 0!==e&&R[COUNTER_SELECT[e]]&COUNTER_MASK[e]}(e)||(r.envx=r.newEnvx)}if(0==r.keyOnDelay){if(r.envelopeState==EnvelopeState.RELEASE){var o=-8;if(r.newEnvx=r.envx+=o,r.envx<=0)return r.envx=r.newEnvx=0,0}if(128&_){if(r.envelopeState==EnvelopeState.ATTACK)i(O=1+((15&_)<<1),o=49==O?1024:32);else if(r.envelopeState==EnvelopeState.DECAY){i(O=16+(_>>3&14),o=1-(r.envx- -1>>8));var a=256*(1+(A>>5));r.newEnvx<=a&&(r.envelopeState=EnvelopeState.SUSTAIN)}else if(r.envelopeState==EnvelopeState.SUSTAIN){var O;i(O=31&A,o=1-(r.envx- -1>>8))}}else console.error("Unsupported: GAIN",e,_,r.envelopeState)}var v=r.interpPos;return r.interpPos=(16383&v)+n,v>=16384&&function(e){function t(t,r,n){var E=t<<28>>28<<r>>1;r>12&&XXX;var _=e.brrBuffer,s=e.brrPos,R=_[s+12-1],A=_[s+12-2]>>1;1==n?(E+=R>>1,E+=-R>>5):2==n?(E+=R,E-=A,E+=A>>4,E+=-3*R>>6):3==n&&(E+=R,E-=A,E+=-13*R>>7,E+=3*A>>4),E=(E=clamp16(E))<<1&65535,_[s]=E,_[s+12]=_[s],++s>=12&&(s=0),e.brrPos=s}var r=E[e.sampleAddr],n=E[e.sampleAddr+ ++e.sampleOffs],_=E[e.sampleAddr+ ++e.sampleOffs],R=r>>4,A=r>>2&3;t(n>>4,R,A),t(15&n,R,A),t(_>>4,R,A),t(15&_,R,A),8==e.sampleOffs&&(2&r?(e.sampleAddr=T(e.sourceIndex,s.LOOP),e.sampleOffs=0):1&r?(e.envelopeState=EnvelopeState.RELEASE,e.newEnvx=e.envx=0,e.sampleAddr=null,e.sampleOffs=null):(e.sampleAddr+=9,e.sampleOffs=0))}(r),r.newEnvx>0?function(e){var t=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,3,3,3,3,3,4,4,4,4,4,5,5,5,5,6,6,6,6,7,7,7,8,8,8,9,9,9,10,10,10,11,11,11,12,12,13,13,14,14,15,15,15,16,16,17,17,18,19,19,20,20,21,21,22,23,23,24,24,25,26,27,27,28,29,29,30,31,32,32,33,34,35,36,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,58,59,60,61,62,64,65,66,67,69,70,71,73,74,76,77,78,80,81,83,84,86,87,89,90,92,94,95,97,99,100,102,104,106,107,109,111,113,115,117,118,120,122,124,126,128,130,132,134,137,139,141,143,145,147,150,152,154,156,159,161,163,166,168,171,173,175,178,180,183,186,188,191,193,196,199,201,204,207,210,212,215,218,221,224,227,230,233,236,239,242,245,248,251,254,257,260,263,267,270,273,276,280,283,286,290,293,297,300,304,307,311,314,318,321,325,328,332,336,339,343,347,351,354,358,362,366,370,374,378,381,385,389,393,397,401,405,410,414,418,422,426,430,434,439,443,447,451,456,460,464,469,473,477,482,486,491,495,499,504,508,513,517,522,527,531,536,540,545,550,554,559,563,568,573,577,582,587,592,596,601,606,611,615,620,625,630,635,640,644,649,654,659,664,669,674,678,683,688,693,698,703,708,713,718,723,728,732,737,742,747,752,757,762,767,772,777,782,787,792,797,802,806,811,816,821,826,831,836,841,846,851,855,860,865,870,875,880,884,889,894,899,904,908,913,918,923,927,932,937,941,946,951,955,960,965,969,974,978,983,988,992,997,1001,1005,1010,1014,1019,1023,1027,1032,1036,1040,1045,1049,1053,1057,1061,1066,1070,1074,1078,1082,1086,1090,1094,1098,1102,1106,1109,1113,1117,1121,1125,1128,1132,1136,1139,1143,1146,1150,1153,1157,1160,1164,1167,1170,1174,1177,1180,1183,1186,1190,1193,1196,1199,1202,1205,1207,1210,1213,1216,1219,1221,1224,1227,1229,1232,1234,1237,1239,1241,1244,1246,1248,1251,1253,1255,1257,1259,1261,1263,1265,1267,1269,1270,1272,1274,1275,1277,1279,1280,1282,1283,1284,1286,1287,1288,1290,1291,1292,1293,1294,1295,1296,1297,1297,1298,1299,1300,1300,1301,1302,1302,1303,1303,1303,1304,1304,1304,1304,1304,1305,1305],r=e.interpPos>>4&255,n=255-r,E=r,_=e.brrPos+(e.interpPos>>12&32767);return t[n+0]*e.brrBuffer[_+0]+t[n+256]*e.brrBuffer[_+1]+t[E+256]*e.brrBuffer[_+2]+t[E+0]*e.brrBuffer[_+3]>>11}(r)*r.newEnvx>>11:0}.bind(this),i=this.wp,o=this._buffer.getChannelData(0),a=this._buffer.getChannelData(1);n--;){var O=0,v=0;this._everyOtherSample=!this._everyOtherSample,this._everyOtherSample&&(this._keyOn=this._regs[GLOBAL_REG_KEY_ON],this._regs[GLOBAL_REG_KEY_ON]=0,this._keyOff=this._regs[GLOBAL_REG_KEY_OFF]),this._runCounter(1),this._runCounter(2),this._runCounter(3);for(var S=0;S<8;S++){this._voices[S];var l=A(S);O+=l*this._sregs[h(S,VOICE_REG_VOL_L)],v+=l*this._sregs[h(S,VOICE_REG_VOL_R)]}var L=this._sregs[GLOBAL_REG_MASTER_VOL_L],f=this._sregs[GLOBAL_REG_MASTER_VOL_R],p=clamp16(O*L>>14),u=clamp16(v*f>>14);o[i]=p/65535,a[i]=u/65535,++i}this.wp=i}function h(e,t){return 16*e|t}function T(e,t){return function(e){return E[e]|E[e+1]<<8}(_+4*e+t)}},DSP.prototype.resetBuffer=function(e){this._buffer=e,this.wp=0},DSP.prototype.CLOCKS_PER_SAMPLE=CLOCKS_PER_SAMPLE,exports.SPC_DSP=DSP;
        return DSP;
    })(SPCLibrary);

    // (function(exports) {
    //     "use strict";

    function makeStream(buffer) {
        var stream = new DataView(buffer);
        stream.length = buffer.byteLength;
        stream.pos = 0;
        return stream;
    }

    function readByte(stream) {
        return stream.getUint8(stream.pos++);
    }

    function readWord(stream) {
        return stream.getUint16((stream.pos += 2) - 2, true);
    }

    function readLong(stream) {
        return stream.getUint32((stream.pos += 4) - 4, true);
    }

    function collect(stream, f, length) {
        var B = [];
        for (var i = 0; i < length; i++)
            B.push(f(stream));
        return B;
    }

    function readString(stream, length) {
        var B = collect(stream, readByte, length);
        return B.map(function(c) {
            return String.fromCharCode(c);
        }).join('');
    }

    function mmap(stream, length) {
        var buf = new Uint8Array(stream.buffer, stream.pos, length);
        stream.pos += length;
        return buf;
    }

    function invalid() {
        throw new Error("invalid");
    }

    function parseID666(stream) {
        function chop0(S) {
            var x = S.indexOf("\0");
            if (x == -1)
                return S;
            else
                return S.slice(0, x);
        }

        var id666 = {};
        id666.song = chop0(readString(stream, 32));
        id666.game = chop0(readString(stream, 32));
        id666.dumper = chop0(readString(stream, 16));
        id666.comments = chop0(readString(stream, 32));
        stream.pos += 11; // date
        stream.pos += 3; // len_secs
        stream.pos += 5; // fade_msecs
        id666.author = chop0(readString(stream, 32));
        id666.mute_mask = readByte(stream);
        id666.emulator = readByte(stream);
        stream.pos += 45; // unused
        return id666;
    }

    function loadSPC(stream) {
        var signature = readString(stream, 37);

        if (signature != "SNES-SPC700 Sound File Data v0.30\x1A\x1A\x1A\x1E")
            invalid();

        var spc = {};

        var state = {};
        var pcl = readByte(stream);
        var pch = readByte(stream);
        state.pc = (pch * 0x100) + pcl;
        state.a = readByte(stream);
        state.x = readByte(stream);
        state.y = readByte(stream);
        state.psw = readByte(stream);
        state.sp = readByte(stream);

        stream.pos += 2; // unused

        spc.id666 = parseID666(stream);
        state.ram = mmap(stream, 0x10000);
        state.regs = mmap(stream, 128);

        var d = new Driver(state);
    }

    function Driver(state) {
        this._bufferSize = 8192;
        this._freeBuffers = [];

        this._ctx = new AudioContext();
        this._dsp = new SPC_DSP(state, this._buffer);
        this._cpu = new SPC_CPU(state, this._dsp);

        this._playTime = this._ctx.currentTime;
        this._pumpAudio();
    }
    Driver.prototype._runCPU = function() {
        var buffer;
        if (this._freeBuffers.length) {
            buffer = this._freeBuffers.pop();
        } else {
            buffer = this._ctx.createBuffer(2, this._bufferSize, 32000);
        }
        this._dsp.resetBuffer(buffer);
        this._cpu.runUntilSamples(this._bufferSize);

        var bs = this._ctx.createBufferSource();
        bs.buffer = buffer;
        bs.connect(this._ctx.destination);
        bs.start(this._playTime);
        bs.onended = function() {
            this._freeBuffers.push(buffer);
            this._pumpAudio();
        }.bind(this);
        this._playTime += (this._bufferSize / 32000);
    };
    Driver.prototype._pumpAudio = function() {
        // Schedule 300ms or so in advance.
        while (this._playTime - this._ctx.currentTime < (300 / 1000))
            this._runCPU();
    };

    function fetch(path) {
        var request = new XMLHttpRequest();
        request.open("GET", path, true);
        request.responseType = "arraybuffer";
        request.send();
        return request;
    }

        // window.onclick =
        //     window.onload = function() {
        //         var req = fetch("brambles.spc");
        //         req.onload = function() {
        //             var stream = makeStream(req.response);
        //             loadSPC(stream);
        //         };
        //     };

    // })(exports);



    /** Utilities **/


    function getScriptDirectory(appendPath = '') {
        const scriptElm = findThisScript();
        const basePath = scriptElm.src.split('/').slice(0, -2).join('/') + '/';
        return basePath + appendPath;
    }




    /** Register This Module **/
    const exports = typeof module !== "undefined" ? module.exports : findThisScript();
    exports.instrument =
        exports.SPCPlayerSynthesizer = SPCPlayerSynthesizer;


    /** Module Loader Methods **/
    function findThisScript() {
        const SCRIPT_PATH = 'instrument/spc-player-synthesizer.js';
        const thisScript = document.head.querySelector(`script[src$="${SCRIPT_PATH}"]`);
        if (!thisScript)
            throw new Error("Base script not found: " + SCRIPT_PATH);
        thisScript.relativePath = SCRIPT_PATH;
        thisScript.basePath = thisScript.src.replace(document.location.origin, '').replace(SCRIPT_PATH, '');
        return thisScript;
    }

    function requireSync(relativeScriptPath, throwException = true) {
        const scriptElm = document.head.querySelector(`script[src$="${relativeScriptPath}"]`)
        if (scriptElm)
            return scriptElm;
        if (throwException)
            throw new Error("Base script not found: " + relativeScriptPath);
        return null;
    }

    async function requireAsync(relativeScriptPath) {
        if (typeof require === "undefined") {
            let scriptElm = document.head.querySelector(`script[src$="${relativeScriptPath}"]`);
            if (!scriptElm) {
                const scriptURL = findThisScript().basePath + relativeScriptPath;
                await new Promise((resolve, reject) => {
                    scriptElm = document.createElement('script');
                    scriptElm.src = scriptURL;
                    scriptElm.onload = e => resolve();
                    document.head.appendChild(scriptElm);
                });
            }
            return scriptElm;
        } else {
            return require('../' + relativeScriptPath);
        }
    }
}



















