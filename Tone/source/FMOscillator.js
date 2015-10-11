define(["Tone/core/Tone", "Tone/signal/Signal", "Tone/source/Source", "Tone/core/Transport", "Tone/source/OmniOscillator"], 
function(Tone){

	"use strict";

	/**
	 *  @class Tone.FMOscillator is a pair of Tone.OmniOscillators connected
	 *         to create a simple FM oscillator.
	 *  @constructor
	 *  @extends {Tone.Source}
	 *  @param {Frequency} [frequency] Starting frequency
	 *  @example
	 * var osc = new Tone.FMOscillator(440);
	 * osc.harmonicity.value = 1.5;
	 */
	Tone.FMOscillator = function(){
		
		var options = this.optionsObject(arguments, ["frequency"], Tone.FMOscillator.defaults);
		Tone.Source.call(this, options);

		/**
		 *  The carrier voice. 
		 *  @type {Tone.OmniOscillator}
		 */
		this.carrier = new Tone.OmniOscillator(options.carrier);
		this.carrier.volume.value = -10;

		/**
		 *  The modulator voice. 
		 *  @type {Tone.OmniOscillator}
		 */
		this.modulator = new Tone.OmniOscillator(options.modulator);
		this.modulator.volume.value = -10;

		/**
		 *  The frequency control.
		 *  @type {Frequency}
		 *  @signal
		 */
		this.frequency = new Tone.Signal(440, Tone.Type.Frequency);

		/**
		 *  Harmonicity is the ratio between the two oscillators. A harmonicity of
		 *  1 is no change. Harmonicity = 2 means a change of an octave. 
		 *  @type {Positive}
		 *  @signal
		 */
		this.harmonicity = new Tone.Multiply(options.harmonicity);
		this.harmonicity.units = Tone.Type.Positive;

		/**
		 *  The modulation index is the depth or amount of modulation. 
		 *  In other terms it is the ratio of the frequency of the 
		 *  modulating signal (mf) to the amplitude of the 
		 *  modulating signal (ma) -- as in ma/mf. 
		 *	@type {Positive}
		 *	@signal
		 */
		this.modulationIndex = new Tone.Multiply(options.modulationIndex);
		this.modulationIndex.units = Tone.Type.Positive;

		/**
		 *  the node where the modulation happens
		 *  @type {GainNode}
		 *  @private
		 */
		this._modulationNode = this.context.createGain();

		/**
		 *  the phase of the oscillator
		 *  between 0 - 360
		 *  @type {number}
		 *  @private
		 */
		this.carrier.phase = options.phase;
		this.modulator.phase = options.phase;

		this.frequency.connect(this.carrier.frequency);
		this.frequency.chain(this.harmonicity, this.modulator.frequency);
		this.frequency.chain(this.modulationIndex, this._modulationNode);
		this.modulator.connect(this._modulationNode.gain);
		this._modulationNode.gain.value = 0;
		this._modulationNode.connect(this.carrier.frequency);
		this.carrier.connect(this.output);
		this._readOnly(["carrier", "modulator", "frequency", "harmonicity", "modulationIndex"]);
	};

	Tone.extend(Tone.FMOscillator, Tone.Source);

	/**
	 *  the default parameters
	 *  @type {Object}
	 */
	Tone.FMOscillator.defaults = {
		"carrier" : {
			"volume" : -10,
			"type" : "sine"
		},
		"modulator" : {
			"volume" : -10,
			"type" : "sine"
		},
		"harmonicity" : 2,
		"modulationIndex" : 10,
		"phase" : 0
	};

	/**
	 *  start the oscillator
	 *  @param  {Time} [time=now] 
	 *  @private
	 */
	Tone.FMOscillator.prototype._start = function(time){
		this.carrier.start(time);
		this.modulator.start(time);
		return this;
	};

	/**
	 *  stop the oscillator
	 *  @private
	 *  @param  {Time} [time=now] (optional) timing parameter
	 *  @returns {Tone.Oscillator} this
	 */
	Tone.FMOscillator.prototype._stop = function(time){
		this.carrier.stop(time);
		this.modulator.stop(time);
		return this;
	};

	/**
	 *  Sync the signal to the Transport's bpm. Any changes to the transports bpm,
	 *  will also affect the oscillators frequency. 
	 *  @returns {Tone.Oscillator} this
	 *  @example
	 * Tone.Transport.bpm.value = 120;
	 * osc.frequency.value = 440;
	 * //the ration between the bpm and the frequency will be maintained
	 * osc.syncFrequency();
	 * Tone.Transport.bpm.value = 240; 
	 * // the frequency of the oscillator is doubled to 880
	 */
	Tone.FMOscillator.prototype.syncFrequency = function(){
		Tone.Transport.syncSignal(this.frequency);
		return this;
	};

	/**
	 *  Unsync the oscillator's frequency from the Transport. 
	 *  See Tone.Oscillator.syncFrequency
	 *  @returns {Tone.Oscillator} this
	 */
	Tone.FMOscillator.prototype.unsyncFrequency = function(){
		Tone.Transport.unsyncSignal(this.frequency);
		return this;
	};

	/**
	 *  Dispose and disconnect.
	 *  @return {Tone.Oscillator} this
	 */
	Tone.FMOscillator.prototype.dispose = function(){
		Tone.Source.prototype.dispose.call(this);
		this.carrier.dispose();
		this.carrier = null;
		this.modulator.dispose();
		this.modulator = null;
		this.frequency.dispose();
		this.frequency = null;
		this.harmonicity.dispose();
		this.harmonicity = null;
		this.modulationIndex.dispose();
		this.modulationIndex = null;
		this.harmonicity.dispose();
		this.harmonicity = null;
		this._modulationNode.disconnect();
		this._modulationNode = null;
		return this;
	};

	return Tone.FMOscillator;
});