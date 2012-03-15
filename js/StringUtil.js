jDataView.prototype.getBlizzardString = function(byteOffset)
{
  var value = '';
  
  // Handle the lack of byteOffset
	if (byteOffset === undefined) {
		byteOffset = this._offset;
	}

	// Error Checking
	if (typeof byteOffset !== 'number') {
		throw new TypeError('Type error');
	}
	
	var done = false;
	while(!done) {
	  var c = this.getChar();
	  if(c == "\0") return value;
	  value += c;
	};
	return value;
};