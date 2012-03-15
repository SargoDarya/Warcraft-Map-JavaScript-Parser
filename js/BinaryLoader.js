importScripts('WorkerConsole.js');

function BinaryLoader(file, callback) {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', file, true);

  // Hack to pass bytes through unprocessed.
  xhr.overrideMimeType('text/plain; charset=x-user-defined');

  xhr.onreadystatechange = function(e) {
    if (this.readyState == 4 && this.status == 200) {
      var binStr = this.responseText;
      callback(binStr);
    }
  };

  xhr.send();
}