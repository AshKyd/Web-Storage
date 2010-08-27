
/**
 * webStorage - A failsafe web storage frontend.
 */
(function ($){
	"use strict";
	var webStorage = {};
	/**
	 * A local reference to the storage object for easy access.
	 */
	if(typeof localStorage == 'object')
		var storage = localStorage;
		
	var temporal = {};
	var hasJson = false;
	var hasStorage = false;
	
	/*
	 * Feature detection. If features are critically missing, functions
	 * should return false.
	 */	
	if(typeof JSON == 'object')
		hasJson = true;
	
	if(typeof storage == 'object')
		hasStorage = true;
	
	/**
	 * Check to make sure our key meets the minimum key requirements.
	 */
	var checkKeyIsValid = function(key){
		if(typeof key != 'string'){
			throw 'Key must be of valid type "String".';
		}
		
		// Arbitrary requirement I know, but makes for less chance
		// of dumb name collisions.
		if(key.length < 4){
			throw 'Key length must be greater than 3 characters.';
		}
		
		return key;
		
	}
	
	/**
	 * Function to log to the console object, if present.
	 */
	var notice = function(_logItem){
		if(typeof console != 'undefined' && typeof console.log != 'undefined'){
			console.log(_logItem);
		}
	}
	
	/**
	 * Return a UNIX timestamp.
	 */
	var getTimestamp = function(){
		var _date = new Date();
		return (_date.getTime()/1000);
	}
	
	/**
	 * Set a value in DOM storage.
	 * 
	 * @param key The 4+ character key to store the data under. Should be unique in the localStorage namespace.
	 * @param data An object, string, number, or boolean value for storage.
	 * @return this. Chained.
	 */
	webStorage.set = function(key,data){
		key = checkKeyIsValid(key);
		
		// Create our storage object, with timestamp.
		var _storedItem = {t:getTimestamp()};
		
		// Check whether we should JSONify this item before storage.
		var _dataType = typeof data;
		if((_dataType == 'object' || _dataType == 'xml') && hasStorage ){
			if(!hasJson) return false;
			data = JSON.stringify(data);
			_storedItem.json = true;
		} else if (_dataType == 'function'){
			throw 'Web storage can not store functions.';
		}
		
		// Encapsulate our data+metadata and store it.
		_storedItem.d = data;
		if(hasStorage){
			_storedItem = JSON.stringify(_storedItem);
			storage.setItem(key,_storedItem);
		} else {
			temporal[key] = _storedItem;
		}
		
		return this;
	}
	
	/**
	 * Get a value from DOM storage.
	 * @param key The key used to store the value in the first place.
	 * @param expiration A maximum age (in minutes) that data may be. Optional.
	 */
	webStorage.get = function(key,expiration){
		
		key = checkKeyIsValid(key);
		
		// Let's work in seconds (Unix epoch time), even though we
		// specified the parameter in minutes.
		expiration = expiration * 60;
		
		if(hasStorage && hasJson) {
			// Retrieve our item from DOM storage
			var _storedItem = storage.getItem(key);
			if(_storedItem === null)
				return false;
			
			// Parse our encapsulated data+metadata object.
			try{
				var _storedItem = JSON.parse(_storedItem);
			} catch(e) {
				notice(_storedItem);
				throw 'Stored object could not be parsed. Was this saved with webStorage?';
			}
		} else {
			// Retrieve our item from our temporal cache.
			if(typeof temporal[key] != 'undefined'){
				_storedItem = temporal[key];
			} else {
				return false;
			}
			
		}
		
		// Check expiry time. Return false if no timestamp in the metadata.
		if(typeof _storedItem.t == 'undefined'){
			notice(_storedItem);
			throw 'Stored object did not have a timestamp.';
		}
		if(typeof expiration == 'number'){
			if(_storedItem.t < getTimestamp() - expiration)
				return false;
		}
		
		// Parse the data if required.
		if(_storedItem.json === true && hasJson)
			_storedItem.d = JSON.parse(_storedItem.d)
		
		return _storedItem.d;
	}
	
	/**
	 * Remove a piece of data from DOM storage.
	 * @param key The key to remove.
	 * @return this. Chained.
	 */
	webStorage.remove = function(key){
		
		key = checkKeyIsValid(key);
		
		if(hasStorage) {
			storage.removeItem(key);
		} else if(typeof temporal[key] != 'undefined') {
			delete(temporal[key]);
		}
		
		return this;
	}
	
	/**
	 * Clear the entire localStorage scope.
	 * @return this. Chained.
	 */
	webStorage.clear = function() {
		if(hasStorage) {
			storage.clear();
		} else {
			temporal = {};
		}
		return this;
	}
	$.webStorage = webStorage;
	return $;
	
})(jQuery);
