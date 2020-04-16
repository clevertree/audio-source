import AudioBufferInstrument from "./instrument/voice/AudioBufferInstrument";
import AudioBufferInstrumentRenderer from "./instrument/voice/render/AudioBufferInstrumentRenderer";
import OscillatorNodeInstrument from "./instrument/voice/OscillatorNodeInstrument";
import OscillatorNodeInstrumentRenderer from "./instrument/voice/render/OscillatorNodeInstrumentRenderer";
import PolyphonyInstrument from "./instrument/poly/PolyphonyInstrument";
import PolyphonyInstrumentRenderer from "./instrument/poly/render/PolyphonyInstrumentRenderer";
import GMEPlayerSynthesizer from "./player/gme/GMEPlayerSynthesizer";
import GMEPlayerSynthesizerRenderer from "./player/gme/GMEPlayerSynthesizerRenderer";
import ProgramLoader from "../song/program/ProgramLoader";
import TestInstrument from "./instrument/test/TestInstrument";

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
    addAllPrograms: function() {
        ProgramLoader.addProgramClass(AudioBufferInstrument, AudioBufferInstrumentRenderer, 'AudioBuffer Instrument');
        ProgramLoader.addProgramClass(OscillatorNodeInstrument, OscillatorNodeInstrumentRenderer, 'OscillatorNode Instrument');
        ProgramLoader.addProgramClass(PolyphonyInstrument, PolyphonyInstrumentRenderer, 'Audio Source Synthesizer');
        ProgramLoader.addProgramClass(GMEPlayerSynthesizer, GMEPlayerSynthesizerRenderer, 'Game Music Player Synthesizer');
        ProgramLoader.addProgramClass(TestInstrument, null, 'Test Instrument');
    }
}


