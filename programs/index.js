/** Instruments **/
import AudioBufferInstrument from "./voice/audiobuffer/AudioBufferInstrument";
import AudioBufferInstrumentRenderer from "./voice/audiobuffer/render/AudioBufferInstrumentRenderer";

import OscillatorInstrument from "./voice/oscillator/OscillatorInstrument";
import OscillatorInstrumentRenderer from "./voice/oscillator/render/OscillatorInstrumentRenderer";

import PolyphonyInstrument from "./polyphony/PolyphonyInstrument";
import PolyphonyInstrumentRenderer from "./polyphony/render/PolyphonyInstrumentRenderer";

import EmptyInstrument from "./voice/empty/EmptyInstrument";
import EmptyInstrumentRenderer from "./voice/empty/render/EmptyInstrumentRenderer";

/** Effects **/
import EnvelopeEffect from "./effect/envelope/EnvelopeEffect";
import EnvelopeEffectRenderer from "./effect/envelope/render/EnvelopeEffectRenderer";

/** LFO **/
import LFOParameter from "./parameter/lfo/LFOParameter";
import LFOParameterRenderer from "./parameter/lfo/render/LFOParameterRenderer";

import ProgramLoader from "../song/program/ProgramLoader";

export default {
    AudioBufferInstrument,
    AudioBufferInstrumentRenderer,
    OscillatorInstrument,
    OscillatorInstrumentRenderer,
    PolyphonyInstrument,
    PolyphonyInstrumentRenderer,
    EnvelopeEffect,
    EnvelopeEffectRenderer,
    LFOParameter,
    LFOParameterRenderer,
    addAllPrograms: function() {
        /** Instruments **/
        ProgramLoader.addProgramClass('Polyphony',      PolyphonyInstrument, PolyphonyInstrumentRenderer, 'Polyphony Host');
        ProgramLoader.addProgramClass('Oscillator',     OscillatorInstrument, OscillatorInstrumentRenderer, 'OscillatorNode Instrument');
        ProgramLoader.addProgramClass('AudioBuffer',    AudioBufferInstrument, AudioBufferInstrumentRenderer, 'AudioBuffer Instrument');

        /** Effects **/
        ProgramLoader.addProgramClass('Envelope',       EnvelopeEffect, EnvelopeEffectRenderer, 'Envelope Effect');

        /** Parameters **/
        ProgramLoader.addProgramClass('LFO',            LFOParameter, LFOParameterRenderer, 'LFO Parameter');


        // ProgramLoader.addProgramClass('GMEPlayerSynthesizer', GMEPlayerSynthesizer, GMEPlayerSynthesizerRenderer, 'Game Music ASPlayer Synthesizer');
        ProgramLoader.addProgramClass('Empty',          EmptyInstrument, EmptyInstrumentRenderer, 'Empty Instrument');
    }
}


