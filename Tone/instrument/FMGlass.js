define(["Tone/core/Tone", "Tone/instrument/SimpleFM", "Tone/signal/Signal", "Tone/signal/Multiply", "Tone/instrument/Monophonic"], 
function(Tone){

	"use strict";

	Tone.FMGlass = function(options){

		options = this.defaultArg(options, Tone.FMGlass.defaults);
		Tone.Monophonic.call(this, options);

		this.frequency = new Tone.Signal(440, Tone.Type.Frequency);

		this.modulationIndex = new Tone.Multiply(1);
		this.modulationIndex.units = Tone.Type.Positive;

		this.voices = [];

		// this.harmonicityValue = [1.977 / 3, 0.5 / 6, 4.99 / 15.01, 2.01 / 5, 6.99 / 1];

		this.carrierValues = [3, 6, 15.01, 5, 1];

		this.carrierMultiplier = [];

		this.modulatorValues = [1.977, 0.5, 4.99, 2.01, 6.99];

		this.modulationIndexEnvelopes = [];

		this.modulationIndexValue = [1, 4, 1, 2, 1];

		this.envelopeOne = {
			attack : 0.2,
			decay : 0,
			sustain : 1,
			release : 0.2
		};

		this.envelopeTwo = {
			attack : 0.1,
			decay : 0,
			sustain : 1,
			release : 0.5
		};

		this.envelopeThree = {
			attack : 0.4,
			decay : 0,
			sustain : 0.7,
			release : 0.4
		};

		this.modulationEnvelope = {
			attack : 0.5,
			decay : 0.5,
			sustain : 0,
			release : 0
		};

		for(var i = 0; i <5; i ++){
			this.voices[i] = new Tone.SimpleFM();

			this.carrierMultiplier[i] = new Tone.Multiply(this.carrierValues[i]);
			this.frequency.connect(this.carrierMultiplier[i]);
			this.carrierMultiplier[i].connect(this.voices[i].frequency);

			this.voices[i].harmonicity.value = this.modulatorValues[i];

			this.modulationIndexEnvelopes[i] = new Tone.ScaledEnvelope().connect(this.voices[i].modulationIndex);
			this.modulationIndexEnvelopes[i].max = this.modulationIndexValue[i];
			// this.modulationIndexEnvelopes[i].min = 0;

			this.voices[i].volume.value = -30;

		}

		this.voices[0].connect(this.output);
		this.voices[2].connect(this.output);
		this.voices[4].connect(this.output);
	};

	Tone.extend(Tone.FMGlass, Tone.Monophonic);

	/**
	 *  @static
	 *  @type {Object}
	 */
	Tone.FMGlass.defaults = {
	};

	Tone.FMGlass.prototype.triggerAttackRelease = function(note, duration, time, velocity){
		time = this.toSeconds(time);
		duration = this.toSeconds(duration);
		this.setEnvelopes(duration, this.envelopeOne, this.voices[0]);
		this.setEnvelopes(duration, this.envelopeTwo, this.voices[1]);
		this.setEnvelopes(duration, this.envelopeTwo, this.voices[2]);
		this.setEnvelopes(duration, this.envelopeTwo, this.voices[3]);
		this.setEnvelopes(duration, this.envelopeThree, this.voices[4]);

		for(var i = 0; i < this.voices.length; i ++) {
			for(var property in this.modulationEnvelope){
				this.modulationIndexEnvelopes[i][property] = this.modulationEnvelope[property] * duration; 
			}
		}

		// this.setEnvelopes(duration, this.modulationEnvelope, this.)

		this.triggerAttack(note, time, velocity);
		this.triggerRelease(time + duration);

		return this;
	};

	Tone.FMGlass.prototype.setEnvelopes = function(duration, envelope, voice){
		for(var property in envelope){
			voice.carrier.envelope[property] = envelope[property] * duration; 
			voice.modulator.envelope[property] = envelope[property] * duration; 
		}
		voice.carrier.envelope.sustain = envelope.sustain;
		voice.modulator.envelope.sustain = envelope.sustain; 

		return this;
	};
	/**
	 * 	trigger the attack portion of the note
	 *  
	 *  @param  {Time} [time=now] the time the note will occur
	 *  @param {number} [velocity=1] the velocity of the note
	 *  @returns {Tone.FMGlass} this
	 *  @private
	 */
	Tone.FMGlass.prototype._triggerEnvelopeAttack = function(time, velocity){
		for(var i = 0; i < 5; i ++){
			this.voices[i].carrier.triggerAttack(time, velocity);
			this.voices[i].modulator.triggerAttack(time);
			this.modulationIndexEnvelopes[i].triggerAttack(time);
		}
		// //the port glide
		// time = this.toSeconds(time);
		// //the envelopes
		// this.carrier.envelope.triggerAttack(time, velocity);
		// this.modulator.envelope.triggerAttack(time);
		// this.carrier.filterEnvelope.triggerAttack(time);
		// this.modulator.filterEnvelope.triggerAttack(time);
		return this;
	};

	/**
	 *  trigger the release portion of the note
	 *  
	 *  @param  {Time} [time=now] the time the note will release
	 *  @returns {Tone.FMGlass} this
	 *  @private
	 */
	Tone.FMGlass.prototype._triggerEnvelopeRelease = function(time){
		for(var i = 0; i < 5; i ++){
			this.voices[i].carrier.triggerRelease(time);
			this.voices[i].modulator.triggerRelease(time);
			this.modulationIndexEnvelopes[i].triggerRelease(time);
		}
		// this.carrier.triggerRelease(time);
		// this.modulator.triggerRelease(time);
		return this;
	};

	/**
	 *  clean up
	 *  @returns {Tone.FMGlass} this
	 */
	Tone.FMGlass.prototype.dispose = function(){
		return this;
	};

	return Tone.FMGlass;
});