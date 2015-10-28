define(["Tone/core/Tone", "Tone/signal/Signal"], function(Tone){

	"use strict";

	/**
	 *  @class Line Envelope
	 *
	 *  @constructor
	 *  @extends {Tone}
	 *  @param {Array} [attack] Point array of line envelope  
	 *  @example
	 * //order is [[value at time, time], [value at time, time]];
	 * line = [[0,0], [1, 3], [0, 5]]; 
	 */
	Tone.LineEnvelope = function(line){
		this.line = line;

		/**
		 *  the signal
		 *  @type {Tone.Signal}
		 *  @private
		 */
		this._sig = this.output = new Tone.Signal(0);

	};

	Tone.extend(Tone.LineEnvelope);

	/**
	 *  the default parameters
	 *  @static
	 *  @const
	 */
	Tone.LineEnvelope.defaults = {
		
	};

	/**
	 * Read the current value of the LineEnvelope. Useful for 
	 * syncronizing visual output to the LineEnvelope. 
	 * @memberOf Tone.LineEnvelope#
	 * @type {Number}
	 * @name value
	 * @readOnly
	 */
	Object.defineProperty(Tone.LineEnvelope.prototype, "value", {
		get : function(){
			return this._sig.value;
		}
	});

	/**
	 *  Trigger the LineEnvelope. 
	 *  @param  {Time} [time=now] When the attack should start.
	 *  @returns {Tone.LineEnvelope} this
	 *  @example
	 */
	Tone.LineEnvelope.prototype.triggerAttack = function(time){
		//to seconds
		time = this.toSeconds(time);

		this._sig.cancelScheduledValues(time);
		this._sig.setValueAtTime(this.line[0][0], time + this.line[0][1]);

		for(var i = 1; i < this.line.length; i++){
			this._sig.exponentialRampToValueAtTime(this.line[i][0], time + this.line[i][1]);
		}
		return this;
	};
	
	/**
	 *  Triggers the release of the LineEnvelope.
	 *  @param  {Time} [time=now] When the release portion of the LineEnvelope should start. 
	 *  @returns {Tone.LineEnvelope} this
	 *  @example
	 *  //trigger release immediately
	 *  env.triggerRelease();
	 */
	Tone.LineEnvelope.prototype.triggerRelease = function(time){
		this._sig.cancelScheduledValues(time);
		return this;
	};

	/**
	 *  triggerAttackRelease is shorthand for triggerAttack, then waiting
	 *  some duration, then triggerRelease. 
	 *  @param {Time} duration The duration of the sustain.
	 *  @param {Time} [time=now] When the attack should be triggered.
	 *  @param {number} [velocity=1] The velocity of the LineEnvelope. 
	 *  @returns {Tone.LineEnvelope} this
	 *  @example
	 * //trigger the attack and then the release after 0.6 seconds.
	 * env.triggerAttackRelease(0.6);
	 */
	Tone.LineEnvelope.prototype.triggerAttackRelease = function(duration, time, velocity) {
		time = this.toSeconds(time);

		this._sig.cancelScheduledValues(time);

		this._sig.setValueAtTime(this.line[0][0], time + this.line[0][1]);

		for(var i = 1; i < this.line.length; i++){
			this._sig.linearRampToValueAtTime(this.line[i][0], time + duration*this.line[i][1]);
		}
		return this;
	};

	/**
	 *  Borrows the connect method from Tone.Signal. 
	 *  @function
	 *  @private
	 */
	Tone.LineEnvelope.prototype.connect = Tone.Signal.prototype.connect;

	/**
	 *  Disconnect and dispose.
	 *  @returns {Tone.LineEnvelope} this
	 */
	Tone.LineEnvelope.prototype.dispose = function(){
		Tone.prototype.dispose.call(this);
		this._sig.dispose();
		this._sig = null;
		return this;
	};

	return Tone.LineEnvelope;
});
