define(["Tone/core/Tone", "Tone/component/LineEnvelope"], function(Tone){

	"use strict";

	/**
	 *  @class  Tone.AmplitudeEnvelope is a Tone.LineEnvelope connected to a gain node. 
	 *  
	 *  @constructor
	 *  @extends {Tone.Envelope}
	 *  @param {Array} [Line] Line values in the form of [[value at time, time], [value at time, time]]
	 *  @example
	 * var ampEnv = new Tone.AmplitudeEnvelope({
	 * 	"attack": 0.1,
	 * 	"decay": 0.2,
	 * 	"sustain": 1.0,
	 * 	"release": 0.8
	 * }).toMaster();
	 * //create an oscillator and connect it
	 * var osc = new Tone.Oscillator().connect(ampEnv).start();
	 * //trigger the envelopes attack and release "8t" apart
	 * ampEnv.triggerAttackRelease("8t");
	 */
	Tone.LineAmplitudeEnvelope = function(){

		Tone.LineEnvelope.apply(this, arguments);

		/**
		 *  the input node
		 *  @type {GainNode}
		 *  @private
		 */
		this.input = this.output = this.context.createGain();

		this._sig.connect(this.output.gain);
	};

	Tone.extend(Tone.LineAmplitudeEnvelope, Tone.LineEnvelope);

	return Tone.LineAmplitudeEnvelope;
});