define(["Tone/core/Tone", "Tone/signal/Signal", "Tone/signal/Multiply", "Tone/instrument/Monophonic", 
	"Tone/component/LineAmplitudeEnvelope", "Tone/component/Split", "Tone/component/Merge", 
	"Tone/source/FMOscillator"], 
function(Tone){

	"use strict";

	Tone.FMGlass = function(options){

		options = this.defaultArg(options, Tone.FMGlass.defaults);
		Tone.Monophonic.call(this, options);

		this.frequency = new Tone.Signal(440, Tone.Type.Frequency);

		this.modulationIndex = new Tone.Multiply(1);
		this.modulationIndex.units = Tone.Type.Positive;

		this.voices = [];

		this.harmonicityValue = [1.977 / 3, 0.5 / 6, 4.99 / 15.01, 2.01 / 5, 6.99 / 1];

		this.carrierValues = [3, 6, 15.01, 5, 1];

		this.carrierMultiplier = [];

		this.modulatorValues = [1.977, 0.5, 4.99, 2.01, 6.99];

		this.modulationIndexValue = [1, 4, 1, 2, 1];

		this.modulationMultiplier = [];

		this.envOne = [[0, 0],[1, 0.2], [1, 0.6], [0, 1]];
		this.envTwo = [[0, 0], [1, 0.1], [1, 0.5], [0, 1]];
		this.envThree = [[0, 0], [0.5, 0.4], [0.8, 0.6], [0, 1]];

		this.splitLeft = new Tone.Split();
		this.splitRight = new Tone.Split();

		this.envelopes = [];
		this.envelopes[0] = new Tone.LineAmplitudeEnvelope(this.envOne).connect(this.splitLeft);
		this.envelopes[1] = new Tone.LineAmplitudeEnvelope(this.envTwo).connect(this.splitRight);
		this.envelopes[2] = new Tone.LineAmplitudeEnvelope(this.envTwo).connect(this.splitLeft);
		this.envelopes[3] = new Tone.LineAmplitudeEnvelope(this.envTwo).connect(this.splitRight);
		this.envelopes[4] = new Tone.LineAmplitudeEnvelope(this.envThree).connect(this.splitLeft).connect(this.splitRight);

		this.modulationEnvelope = new Tone.LineEnvelope([[0, 0], [1, 0.5], [0, 1]]);

		this.volumes = [0.4, 0.2, 0.133, 0.1, 0.066];

		for(var i = 0; i <5; i ++){
			this.voices[i] = new Tone.FMOscillator().start();

			this.voices[i].modulator.volume.value = -20;

			this.carrierMultiplier[i] = new Tone.Multiply(this.carrierValues[i]);
			this.frequency.connect(this.carrierMultiplier[i]);
			this.carrierMultiplier[i].connect(this.voices[i].frequency);

			this.voices[i].harmonicity.value = this.harmonicityValue[i];

			this.modulationMultiplier[i] = new Tone.Multiply(this.modulationIndexValue[i]);

			this.modulationMultiplier[i].connect(this.voices[i].modulationIndex);

			this.modulationEnvelope.connect(this.modulationMultiplier[i]);

			this.voices[i].volume.value = Tone.prototype.gainToDb(this.volumes[i]);
			this.voices[i].connect(this.envelopes[i]);
		}

		this.merge = new Tone.Merge().connect(this.output);

		this.splitLeft.connect(this.merge.left);
		this.splitRight.connect(this.merge.right);
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

		this.setNote(note, time);
		for(var i = 0; i < this.envelopes.length; i ++){
			this.envelopes[i].triggerAttackRelease(duration, time, velocity);
		}
		this.modulationEnvelope.triggerAttackRelease(duration, time);
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
		time = this.toSeconds(time);
		this.envelopeOne.triggerAttack(time, velocity);
		this.envelopeTwo.triggerAttack(time, velocity);
		this.envelopeThree.triggerAttack(time, velocity);

		// }
		// //the port glide
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