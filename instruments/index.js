import AudioBufferInstrument from "./voice/AudioBufferInstrument";
import AudioBufferInstrumentRenderer from "./voice/render/AudioBufferInstrumentRenderer";
import OscillatorNodeInstrument from "./voice/OscillatorNodeInstrument";
import OscillatorNodeInstrumentRenderer from "./voice/render/OscillatorNodeInstrumentRenderer";
import PolyphonyInstrument from "./poly/PolyphonyInstrument";
import PolyphonyInstrumentRenderer from "./poly/render/PolyphonyInstrumentRenderer";
import GMEPlayerSynthesizer from "./gme/GMEPlayerSynthesizer";
import GMEPlayerSynthesizerRenderer from "./gme/GMEPlayerSynthesizerRenderer";
import InstrumentLoader from "../song/instrument/InstrumentLoader";
import TestInstrument from "./test/TestInstrument";

export default {
    AudioBufferInstrument,
    AudioBufferInstrumentRenderer,
    OscillatorNodeInstrument,
    OscillatorNodeInstrumentRenderer,
    PolyphonyInstrument,
    PolyphonyInstrumentRenderer,
    GMEPlayerSynthesizer,
    GMEPlayerSynthesizerRenderer,
    TestInstrument,
    addAllInstruments: function() {
        InstrumentLoader.addInstrumentClass(AudioBufferInstrument, AudioBufferInstrumentRenderer, 'AudioBuffer Instrument');
        InstrumentLoader.addInstrumentClass(OscillatorNodeInstrument, OscillatorNodeInstrumentRenderer, 'OscillatorNode Instrument');
        InstrumentLoader.addInstrumentClass(PolyphonyInstrument, PolyphonyInstrumentRenderer, 'Audio Source Synthesizer');
        InstrumentLoader.addInstrumentClass(GMEPlayerSynthesizer, GMEPlayerSynthesizerRenderer, 'Game Music Player Synthesizer');
        InstrumentLoader.addInstrumentClass(TestInstrument, null, 'Test Instrument');
    }
}


