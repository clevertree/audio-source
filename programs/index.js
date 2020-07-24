import AudioBufferInstrument from "./voice/audiobuffer/AudioBufferInstrument";
import AudioBufferInstrumentRenderer from "./voice/audiobuffer/render/AudioBufferInstrumentRenderer";

import OscillatorInstrument from "./voice/oscillator/OscillatorInstrument";
import OscillatorInstrumentRenderer from "./voice/oscillator/render/OscillatorInstrumentRenderer";

import PolyphonyInstrument from "./polyphony/PolyphonyInstrument";
import PolyphonyInstrumentRenderer from "./polyphony/render/PolyphonyInstrumentRenderer";

import ProgramLoader from "../common/program/ProgramLoader";
import TestInstrument from "./test/TestInstrument";

export default {
    AudioBufferInstrument,
    AudioBufferInstrumentRenderer,
    OscillatorInstrument,
    OscillatorInstrumentRenderer,
    PolyphonyInstrument,
    PolyphonyInstrumentRenderer,
    TestInstrument,
    addAllPrograms: function() {
        ProgramLoader.addProgramClass('polyphony',      PolyphonyInstrument, PolyphonyInstrumentRenderer, 'Polyphony Host');
        ProgramLoader.addProgramClass('oscillator',     OscillatorInstrument, OscillatorInstrumentRenderer, 'OscillatorNode Instrument');
        ProgramLoader.addProgramClass('buffer',         AudioBufferInstrument, AudioBufferInstrumentRenderer, 'AudioBuffer Instrument');
        // ProgramLoader.addProgramClass('GMEPlayerSynthesizer', GMEPlayerSynthesizer, GMEPlayerSynthesizerRenderer, 'Game Music ASPlayer Synthesizer');
        ProgramLoader.addProgramClass('test',           TestInstrument, null, 'Test Instrument');
    }
}


