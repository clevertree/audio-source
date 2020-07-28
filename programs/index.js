/** Instruments **/
import AudioBufferInstrument from "./voice/audiobuffer/AudioBufferInstrument";
import AudioBufferInstrumentRenderer from "./voice/audiobuffer/render/AudioBufferInstrumentRenderer";

import OscillatorInstrument from "./voice/oscillator/OscillatorInstrument";
import OscillatorInstrumentRenderer from "./voice/oscillator/render/OscillatorInstrumentRenderer";

import PolyphonyInstrument from "./polyphony/PolyphonyInstrument";
import PolyphonyInstrumentRenderer from "./polyphony/render/PolyphonyInstrumentRenderer";

/** Effects **/
import EnvelopeEffect from "./effect/envelope/EnvelopeEffect";
import EnvelopeEffectRenderer from "./effect/envelope/render/EnvelopeEffectRenderer";

/** Test **/
import TestInstrument from "./test/TestInstrument";

import ProgramLoader from "../common/program/ProgramLoader";

export default {
    AudioBufferInstrument,
    AudioBufferInstrumentRenderer,
    OscillatorInstrument,
    OscillatorInstrumentRenderer,
    PolyphonyInstrument,
    PolyphonyInstrumentRenderer,
    EnvelopeEffect,
    EnvelopeEffectRenderer,
    TestInstrument,
    addAllPrograms: function() {
        /** Instruments **/
        ProgramLoader.addProgramClass('Polyphony',      PolyphonyInstrument, PolyphonyInstrumentRenderer, 'Polyphony Host');
        ProgramLoader.addProgramClass('Oscillator',     OscillatorInstrument, OscillatorInstrumentRenderer, 'OscillatorNode Instrument');
        ProgramLoader.addProgramClass('AudioBuffer',         AudioBufferInstrument, AudioBufferInstrumentRenderer, 'AudioBuffer Instrument');

        /** Effects **/
        ProgramLoader.addProgramClass('Envelope',         EnvelopeEffect, EnvelopeEffectRenderer, 'Envelope Effect');

        // ProgramLoader.addProgramClass('GMEPlayerSynthesizer', GMEPlayerSynthesizer, GMEPlayerSynthesizerRenderer, 'Game Music ASPlayer Synthesizer');
        ProgramLoader.addProgramClass('Test',           TestInstrument, null, 'Test Instrument');
    }
}


