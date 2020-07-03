import AudioBufferInstrument from "./voice/audiobuffer/AudioBufferInstrument";
import AudioBufferInstrumentRenderer from "./voice/audiobuffer/render/AudioBufferInstrumentRenderer";
import OscillatorInstrument from "./voice/oscillator/OscillatorInstrument";
import OscillatorInstrumentRenderer from "./voice/oscillator/render/OscillatorInstrumentRenderer";

import PolyphonyInstrument from "./polyphony/PolyphonyInstrument";
import PolyphonyInstrumentRenderer from "./polyphony/render/PolyphonyInstrumentRenderer";

import GMEPlayerSynthesizer from "./player/gme/GMEPlayerSynthesizer";
import GMEPlayerSynthesizerRenderer from "./player/gme/GMEPlayerSynthesizerRenderer";

import ProgramLoader from "../common/program/ProgramLoader";
import TestInstrument from "./test/TestInstrument";

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
        ProgramLoader.addProgramClass('PolyphonyInstrument', PolyphonyInstrument, PolyphonyInstrumentRenderer, 'Polyphony Host');
        ProgramLoader.addProgramClass('OscillatorInstrument', OscillatorInstrument, OscillatorInstrumentRenderer, 'OscillatorNode Instrument');
        ProgramLoader.addProgramClass('AudioBufferInstrument', AudioBufferInstrument, AudioBufferInstrumentRenderer, 'AudioBuffer Instrument');
        // ProgramLoader.addProgramClass('GMEPlayerSynthesizer', GMEPlayerSynthesizer, GMEPlayerSynthesizerRenderer, 'Game Music ASPlayer Synthesizer');
        ProgramLoader.addProgramClass('TestInstrument', TestInstrument, null, 'Test Instrument');
    }
}


