
define(["Tone/core/Tone", "Tone/source/Oscillator", "Tone/instrument/Instrument", 
	"Tone/component/AmplitudeEnvelope", "Tone/component/Filter", "Tone/source/OmniOscillator",
	"Tone/signal/Signal", "Tone/signal/Multiply", "Tone/signal/Scale", "Tone/instrument/SimpleFM"],
function(Tone){

	"use strict";

	/**
	 *  Inharmonic ratio of frequencies based on the Roland TR-808
	 *  Taken from https://ccrma.stanford.edu/papers/tr-808-cymbal-physically-informed-circuit-bendable-digital-model
	 *  @private
	 *  @static
	 *  @type {Array}
	 */
	var inharmRatios = [1.0, 1.483, 1.932, 2.546, 2.630, 3.897];

	/**
	 *  Harmonic ratio that produces a more pitched cymbal
	 *  @private
	 *  @static
	 *  @type {Array}
	 */
	var harmRatios = [1.0, 1.5, 2.025, 2.975, 4.0, 6.0];

	/**
	 *  @class  CymbalSynth is composed of 6 Tone.FMSynths, with their 
	 *  carrier set to a square wave, and the modulator set to a pulse 
	 *  wave. 
	 *  Inspiration from [Sound on Sound](http://www.soundonsound.com/sos/jul02/articles/synthsecrets0702.asp).
	 *
	 *  @constructor
	 *  @extends {Tone.Instrument}
	 *  @param {options} [options] the options availble for the synth
	 *                             see defaults below
	 *  @example
	 * var cymbal = new Tone.CymbalSynth().toMaster();
	 * cymbal.inharmonicity.value = 10;
	 * cymbal.triggerAttack();
	 */
	Tone.CymbalSynth = function(options){

		options = this.defaultArg(options, Tone.CymbalSynth.defaults);
		Tone.Instrument.call(this, options);

		/**
		 * The initial strike component of the cymbal hit.
		 * @type {CymbalComponent}
		 */
		this.strike = new CymbalComponent(options.strike, 1.886, 0.533).connect(this.output);

		/**
		 * The body portion of the cymbal hit.
		 * @type {CymbalComponent}
		 */
		this.body = new CymbalComponent(options.body, 1.643, 0.333).connect(this.output);

		/**
		 *  The level of inharmonicity between the frequencies of the oscillators. 
		 *  Interesting sounds can be had between 0 and 20.
		 *  @type {Positive}
		 *  @signal
		 */
		this.inharmonicity = new Tone.Signal(options.inharmonicity, Tone.Type.Positive);

		/**
		 *  The base frequency for the series of oscillators. 
		 *  All oscillators scale in a harmonic or inharmonic pattern
		 *  depending on the value of the inharmonicity.
		 *  @type {Frequency}
		 *  @signal
		 */
		this.frequency = new Tone.Signal(options.frequency, Tone.Type.Frequency);

		/**
		 *  A series of FMSynths
		 *  @private
		 *  @type {Array}
		 */
		this._carriers = [];

		this._modulators = [];

		/**
		 *  Tone.ScaledSignals used for interpolating between harmonic
		 *  and inharmonic ratios
		 *  @private
		 *  @type {Array}
		 */
		this._scaledSignals = [];

		/**
		 *  Tone.Multipliers for frequency multiplication of scaled signals
		 *  @private
		 *  @type {Array}
		 */
		this._freqMult  = [];

		this.harmonicity = [];

		this._modulationNodes = [];

		this._modulationIndex = [];

		//make all the FMSynths, connect the frequency signals
		for(var i = 0; i < 6; i++){
			this._scaledSignals[i] = new Tone.Scale(inharmRatios[i], harmRatios[i]);
			this._freqMult[i] = new Tone.Multiply();
			this._carriers[i] = new Tone.Oscillator();
			this._carriers[i].type = "square";
			this._carriers[i].volume.value = -10;
			
			this._modulators[i] = new Tone.OmniOscillator();
			this._modulators[i].type = "pulse";
			this._modulators[i].width.value = 0.75;
			this._modulators[i].volume.value = -10;

			this.harmonicity[i] = new Tone.Multiply(1.5);

			this._modulationIndex[i] = new Tone.Multiply(10);


			this.inharmonicity.connect(this._scaledSignals[i]);
			this._scaledSignals[i].connect(this._freqMult[i], 0, 0);
			this.frequency.connect(this._freqMult[i], 0, 1);

			this._modulationNodes[i] = this.context.createGain();
			this._modulators[i].connect(this._modulationNodes[i].gain);

			this._freqMult[i].chain(this.harmonicity[i], this._modulationNodes[i]);
			this._freqMult[i].chain(this._modulationIndex[i], this._modulationNodes[i]);
			this._modulationNodes[i].gain.value = 0;

			this._modulationNodes[i].connect(this._carriers[i].frequency);
			this._freqMult[i].connect(this._carriers[i].frequency);
			this._carriers[i].connect(this.strike);
			this._carriers[i].connect(this.body);

			this._carriers[i].start();
			this._modulators[i].start();


			// this._oscillators[i] = new Tone.SimpleFM({
			// 	"harmonicity" : 1.5,
			// 	"modulationIndex" : 10,
			// 	"carrier" : {
			// 		"oscillator" : {
			// 			"type" : "square"
			// 		}
			// 	},
			// 	"modulator" : {
			// 		"oscillator" : {
			// 			"type" : "pulse",
			// 			"width" : 0.75
			// 		}
			// 	},
			// });
		}
	};

	Tone.extend(Tone.CymbalSynth, Tone.Instrument);

	/**
	 *  the default values
	 *  @static
	 *  @const
	 *  @type {Object}
	 */
	Tone.CymbalSynth.defaults = {
		"inharmonicity" : 0,
		"frequency" : 200,
		"strike" : {
			"volume" : 0,
			"cutoff" : 3500, 
			"resonance" : 6,
			"envelope": { 
				"attack" : 0.01, 
				"decay" : 0.25,
				"release" : 0
			}
		},
		"body" : {
			"volume" : 0,
			"cutoff" : 7000,
			"resonance" : 6,
			"envelope" : {
				"attack" : 0.01,
				"decay" : 1.5,
				"release": 0.3
			}


		},
	};

	/**
	 *  Trigger the cymbal at a given time
	 *  @param  {Time} [time=now]     the time, if not given is now
	 *  @param  {Number} [velocity = 1] velocity defaults to 1
	 *  @returns {Tone.Drumsynth} this
	 *  @example
	 *  cymbal.triggerAttack("0:1:1". 0.75);
	 */
	Tone.CymbalSynth.prototype.triggerAttack = function(time, velocity){
		time = this.toSeconds(time);
		this.body.envelope.triggerAttack(time, velocity);
		this.strike.envelope.triggerAttack(time, velocity);
		return this;
	};

	/**
	 *  Trigger the release of the cymbal.
	 *  Can be used to [choke](https://en.wikipedia.org/wiki/Cymbal_choke) 
	 *  the cymbal
	 *  @param  {Time} [time=now] the time the cymbal will release
	 *  @returns {Tone.CymbalSynth} this
	 *  @example
	 *  //set the release to a small amount for a realistic choke
	 *  cymbal.body.envelope.release = 0.2;
	 *  cymbal.triggerAttack("0:0:0");
	 *  cymbal.triggerRelease("0:0:0" + 0.4);
	 */
	Tone.CymbalSynth.prototype.triggerRelease = function(time){
		this.strike.envelope.triggerRelease(time);
		this.body.envelope.triggerRelease(time);
		return this;
	};

	/**
	 * Clean up.
	 * @return {Tone.CymbalSynth} this
	 */
	Tone.CymbalSynth.prototype.dispose = function(){
		Tone.Instrument.prototype.dispose.call(this);
		this.inharmonicity.dispose();
		this.inharmonicity = null;
		this.frequency.dispose();
		this.frequency = null;
		//this.inharmRatios = null;
		//this.harmRatios = null;

		for(var i = 0; i <this._oscillators.length; i++){
			this._oscillators[i].dispose();
			this._scaledSignals[i].dispose();
			this._freqMult[i].dispose();
		}
		this._oscillators = null;
		this._scaledSignals = null;
		this._freqMult = null;

		this.body.dispose();
		this.strike.dispose();
		this.strike = null;
		this.body = null;
		return this;
	};

	/**
	 *  CymbalComponent helper class
	 *  @param {Object} options         the options for the cymbal component
	 *  @param {number} frequencyScalar the ratio between the bandpass filter (input)
	 *                                  and the highpass filter (output)
	 *  @param {number} resonanceScalar the ratio between bandpass and higpass resonance
	 */
	var CymbalComponent = function(options, frequencyScalar, resonanceScalar){
		this.output = this.context.createGain();
		this.volume = new Tone.Signal({
			"param" : this.output.gain, 
			"units" : Tone.Type.Decibels,
			"value" : options.volume
		});
		this._filter = new Tone.Filter({
			"type" : "highpass"
		}).connect(this.output);
		this.envelope = new Tone.AmplitudeEnvelope({
			"attack" : options.envelope.attack,
			"decay" : options.envelope.decay,
			"sustain" : 0,
			"release": options.envelope.release,
			"attackCurve" : "exponential"

		}).connect(this._filter);
		this.input = new Tone.Filter({
			"type" : "bandpass",
		}).connect(this.envelope);
		this.cutoff = this.input.frequency;
		this.cutoff.value = options.cutoff;
		this._scaledFrequency = new Tone.Multiply(frequencyScalar).connect(this._filter.frequency);
		this.cutoff.connect(this._scaledFrequency);
		this.resonance = this.input.Q;
		this.resonance.value = options.resonance;
		this._scaledResonance = new Tone.Multiply(resonanceScalar).connect(this._filter.Q);
		this.resonance.connect(this._scaledResonance);
	};

	Tone.extend(CymbalComponent);

	CymbalComponent.prototype.dispose = function(){
		Tone.prototype.dispose.call(this);
		this.volume.dispose();
		this.volume = null;
		this._filter.dispose();
		this._filter = null;
		this.envelope.dispose();
		this.envelope = null;
		this.cutoff.dispose();
		this.cutoff = null;
		this._scaledFrequency.dispose();
		this._scaledFrequency = null;
		this.resonance.dispose();
		this.resonance = null;
		this._scaledResonance.dispose();
		this._scaledResonance = null;
		return this;
	};

	return Tone.CymbalSynth;
});