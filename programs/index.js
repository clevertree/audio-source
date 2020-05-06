import AudioBufferInstrument from "./instrument/voice/AudioBufferInstrument";
import AudioBufferInstrumentRenderer from "./instrument/voice/render/AudioBufferInstrumentRenderer";
import OscillatorInstrument from "./instrument/voice/OscillatorInstrument";
import OscillatorInstrumentRenderer from "./instrument/voice/render/OscillatorInstrumentRenderer";
import PolyphonyInstrument from "./instrument/poly/PolyphonyInstrument";
import PolyphonyInstrumentRenderer from "./instrument/poly/render/PolyphonyInstrumentRenderer";
import GMEPlayerSynthesizer from "./player/gme/GMEPlayerSynthesizer";
import GMEPlayerSynthesizerRenderer from "./player/gme/GMEPlayerSynthesizerRenderer";
import ProgramLoader from "../song/program/ProgramLoader";
import TestInstrument from "./instrument/test/TestInstrument";

export default {
    AudioBufferInstrument,
    AudioBufferInstrumentRenderer,
    OscillatorInstrument,
    OscillatorInstrumentRenderer,
    PolyphonyInstrument,
    PolyphonyInstrumentRenderer,
    GMEPlayerSynthesizer,
    GMEPlayerSynthesizerRenderer,
    TestInstrument,
    addAllPrograms: function() {
        ProgramLoader.addProgramClass(AudioBufferInstrument, AudioBufferInstrumentRenderer, 'AudioBuffer Instrument');
        ProgramLoader.addProgramClass(OscillatorInstrument, OscillatorInstrumentRenderer, 'OscillatorNode Instrument');
        ProgramLoader.addProgramClass(PolyphonyInstrument, PolyphonyInstrumentRenderer, 'Audio Source Synthesizer');
        ProgramLoader.addProgramClass(GMEPlayerSynthesizer, GMEPlayerSynthesizerRenderer, 'Game Music ASPlayer Synthesizer');
        ProgramLoader.addProgramClass(TestInstrument, null, 'Test Instrument');
    }
}


